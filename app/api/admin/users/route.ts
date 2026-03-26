import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET: Obtener lista de usuarios con paginación
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const isActiveParam = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Validar parámetros de paginación
    const pageNumber = Math.max(1, page);
    const pageSize = Math.min(Math.max(1, limit), 100); // Máximo 100 items por página
    const skip = (pageNumber - 1) * pageSize;

    const whereClause: Prisma.UserWhereInput = {};

    if (role && role !== 'all' && Object.values(Role).includes(role as Role)) {
      whereClause.role = role as Role;
    }

    if (isActiveParam !== null && isActiveParam !== '' && isActiveParam !== 'all') {
      whereClause.isActive = isActiveParam === 'true';
    }

    // Agregar búsqueda si existe
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { personalEmail: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { institutionalEmail: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { document: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    // Obtener usuarios con paginación
    const [users, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          personalEmail: true,
          institutionalEmail: true,
          role: true,
          isActive: true,
          createdAt: true,
          document: true,
          phone: true,
          studentCode: true,
          teacherCode: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      db.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: users,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Crear un nuevo usuario
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const name: unknown = body?.name;
    const password: unknown = body?.password;
    const role: unknown = body?.role;
    // Compatibilidad con payload legado/espanol
    const document: unknown = body?.document ?? body?.documento;
    const phone: unknown = body?.phone ?? body?.telefono;
    const personalEmail: unknown = body?.personalEmail ?? body?.correoPersonal;
    const institutionalEmail: unknown =
      body?.institutionalEmail ?? body?.correoInstitucional;
    const studentCode: unknown = body?.studentCode ?? body?.codigoEstudiante;
    const teacherCode: unknown = body?.teacherCode ?? body?.codigoDocente;

    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Falta el campo requerido: nombre.' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { message: 'Falta el campo requerido: contraseña.' },
        { status: 400 }
      );
    }

    if (typeof role !== 'string' || !Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        { message: 'Rol inválido. Debe ser ADMIN, DOCENTE o ESTUDIANTE.' },
        { status: 400 }
      );
    }

    if (
      (typeof personalEmail !== 'string' || personalEmail.trim() === '') &&
      (typeof institutionalEmail !== 'string' || institutionalEmail.trim() === '')
    ) {
      return NextResponse.json(
        {
          message:
            'Se debe proporcionar al menos un correo electrónico (personal o institucional).',
        },
        { status: 400 }
      );
    }

    // Verificar unicidad de los correos
    const orConditions: Prisma.UserWhereInput[] = [];
    if (typeof personalEmail === 'string' && personalEmail.trim() !== '') {
      orConditions.push({ personalEmail: personalEmail.trim() });
    }
    if (typeof institutionalEmail === 'string' && institutionalEmail.trim() !== '') {
      orConditions.push({ institutionalEmail: institutionalEmail.trim() });
    }

    if (orConditions.length > 0) {
      const existingUser = await db.user.findFirst({
        where: { OR: orConditions },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: 'Uno de los correos electrónicos ya está en uso.' },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const sanitize = (val: string | undefined | null): string | undefined =>
      val && val.trim() !== '' ? val.trim() : undefined;

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        password: hashedPassword,
        role: role as Role,
        document: typeof document === 'string' ? sanitize(document) : undefined,
        phone: typeof phone === 'string' ? sanitize(phone) : undefined,
        personalEmail: typeof personalEmail === 'string' ? sanitize(personalEmail) : undefined,
        institutionalEmail:
          typeof institutionalEmail === 'string' ? sanitize(institutionalEmail) : undefined,
        studentCode: typeof studentCode === 'string' ? sanitize(studentCode) : undefined,
        teacherCode: typeof teacherCode === 'string' ? sanitize(teacherCode) : undefined,
        isActive: true,
      },
    });

    // No devolver la contraseña hasheada
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/users] Error al crear usuario:', error);

    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: unknown }).code === 'P2002'
    ) {
      const meta = (error as { meta?: { target?: unknown } }).meta;
      const target = meta?.target;
      const field = Array.isArray(target)
        ? target.join(', ')
        : typeof target === 'string'
          ? target
          : 'campo';
      return NextResponse.json(
        { message: `El valor del campo '${field}' ya está en uso.` },
        { status: 409 }
      );
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { message: 'Datos inválidos para crear el usuario.' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          message: 'Error interno del servidor',
          debug:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : { value: String(error) },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

function isPlaceholderEmail(email?: string | null) {
  return typeof email === 'string' && email.endsWith('@placeholder.local');
}

function formatUserForResponse<
  T extends { personalEmail?: string | null; institutionalEmail?: string | null },
>(user: T) {
  return {
    ...user,
    personalEmail: isPlaceholderEmail(user.personalEmail)
      ? user.institutionalEmail || ''
      : user.personalEmail,
  };
}

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

    const pageNumber = Math.max(1, page);
    const pageSize = Math.min(Math.max(1, limit), 100);
    const skip = (pageNumber - 1) * pageSize;

    const whereClause: Prisma.UserWhereInput = {};

    if (role && role !== 'all' && Object.values(Role).includes(role as Role)) {
      whereClause.role = role as Role;
    }

    if (isActiveParam !== null && isActiveParam !== '' && isActiveParam !== 'all') {
      whereClause.isActive = isActiveParam === 'true';
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { personalEmail: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { institutionalEmail: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { document: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

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

    const formattedUsers = users.map(user => formatUserForResponse(user));
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: formattedUsers,
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
    console.error('[GET /api/admin/users] Error:', error);
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

    const document: unknown = body?.document ?? body?.documento;
    const phone: unknown = body?.phone ?? body?.telefono;
    const personalEmailRaw: unknown = body?.personalEmail ?? body?.correoPersonal;
    const institutionalEmailRaw: unknown = body?.institutionalEmail ?? body?.correoInstitucional;
    const studentCode: unknown = body?.studentCode ?? body?.codigoEstudiante;
    const teacherCode: unknown = body?.teacherCode ?? body?.codigoDocente;

    const normalizeEmail = (val: unknown): string | undefined => {
      if (typeof val !== 'string') return undefined;
      const clean = val.trim().toLowerCase();
      return clean === '' ? undefined : clean;
    };

    const sanitize = (val: unknown): string | undefined => {
      if (typeof val !== 'string') return undefined;
      const clean = val.trim();
      return clean === '' ? undefined : clean;
    };

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

    let personalEmail = normalizeEmail(personalEmailRaw);
    const institutionalEmail = normalizeEmail(institutionalEmailRaw);

    if (!personalEmail && !institutionalEmail) {
      return NextResponse.json(
        {
          message:
            'Se debe proporcionar al menos un correo electrónico (personal o institucional).',
        },
        { status: 400 }
      );
    }

    // Si no envían correo personal, generar uno placeholder único
    if (!personalEmail) {
      const baseSource = institutionalEmail ?? String(name).trim().toLowerCase();
      const localPart = baseSource
        .split('@')[0]
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9._-]/g, '');

      const uniqueSuffix = (
        typeof document === 'string' && document.trim() !== ''
          ? document.trim()
          : Date.now().toString()
      ).replace(/[^a-zA-Z0-9._-]/g, '');

      personalEmail = `${localPart || 'usuario'}+${uniqueSuffix}@placeholder.local`.toLowerCase();
    }

    console.log('[POST /api/admin/users] personalEmail final:', personalEmail);
    console.log('[POST /api/admin/users] institutionalEmail final:', institutionalEmail);

    // Verificar duplicados en ambos campos
    const emailsToCheck = [personalEmail, institutionalEmail].filter(Boolean) as string[];

    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { personalEmail: { in: emailsToCheck } },
          { institutionalEmail: { in: emailsToCheck } },
        ],
      },
      select: {
        id: true,
        name: true,
        personalEmail: true,
        institutionalEmail: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: `Uno de los correos ya está en uso por '${existingUser.name ?? 'usuario'}'.`,
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        password: hashedPassword,
        role: role as Role,
        document: sanitize(document),
        phone: sanitize(phone),
        personalEmail,
        institutionalEmail: institutionalEmail ?? undefined,
        studentCode: sanitize(studentCode),
        teacherCode: sanitize(teacherCode),
        isActive: true,
        mustChangePassword: true,
      },
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
    });

    return NextResponse.json(formatUserForResponse(newUser), { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/users] Error al crear usuario:', error);

    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    ) {
      return NextResponse.json({ message: 'Uno de los correos ya está en uso.' }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { message: 'Datos inválidos para crear el usuario.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

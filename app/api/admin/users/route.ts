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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Validar parámetros de paginación
    const pageNumber = Math.max(1, page);
    const pageSize = Math.min(Math.max(1, limit), 100); // Máximo 100 items por página
    const skip = (pageNumber - 1) * pageSize;

    const whereClause: Prisma.UserWhereInput = {};

    if (role && Object.values(Role).includes(role as Role)) {
      whereClause.role = role as Role;
    }

    // Agregar búsqueda si existe
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { correoPersonal: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { correoInstitucional: { contains: search, mode: Prisma.QueryMode.insensitive } },
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
          correoPersonal: true,
          correoInstitucional: true,
          role: true,
          isActive: true,
          createdAt: true,
          document: true,
          telefono: true,
          codigoEstudiantil: true,
          codigoDocente: true,
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
    const {
      name,
      password,
      role,
      document,
      telefono,
      correoPersonal,
      correoInstitucional,
      codigoEstudiantil,
      codigoDocente,
    } = body;

    if (!name || !password || !role) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos: nombre, contraseña y rol.' },
        { status: 400 }
      );
    }

    if (!correoPersonal && !correoInstitucional) {
      return NextResponse.json(
        {
          message:
            'Se debe proporcionar al menos un correo electrónico (personal o institucional).',
        },
        { status: 400 }
      );
    }

    // Verificar unicidad de los correos
    const orConditions = [];
    if (correoPersonal) orConditions.push({ correoPersonal });
    if (correoInstitucional) orConditions.push({ correoInstitucional });

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

    const newUser = await db.user.create({
      data: {
        name,
        password: hashedPassword,
        role,
        document,
        telefono,
        correoPersonal,
        correoInstitucional,
        codigoEstudiantil,
        codigoDocente,
        isActive: true,
      },
    });

    // No devolver la contraseña hasheada
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

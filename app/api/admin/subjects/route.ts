import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET: Obtener lista de asignaturas con paginación
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Validar parámetros de paginación
    const pageNumber = Math.max(1, page);
    const pageSize = Math.min(Math.max(1, limit), 100); // Máximo 100 items por página
    const skip = (pageNumber - 1) * pageSize;

    const whereClause: Prisma.SubjectWhereInput = {};

    // Agregar búsqueda si existe
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { program: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }
    
    // Filtros específicos
    const program = searchParams.get('program');
    if (program && program !== 'all') {
      whereClause.program = program;
    }

    const semester = searchParams.get('semester');
    if (semester && semester !== 'all') {
      whereClause.semester = parseInt(semester);
    }

    // Obtener asignaturas con paginación
    const [subjects, total] = await Promise.all([
      db.subject.findMany({
        where: Object.keys(whereClause).length > 0 ? whereClause : {},
        include: {
          teachers: {
            select: {
              id: true,
              name: true,
              correoInstitucional: true,
              codigoDocente: true,
            },
          },
          _count: {
            select: {
              classes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      db.subject.count({
        where: whereClause,
      }),
    ]);

    // Transform the data to include student count
    const subjectsWithCounts = subjects.map(subject => ({
      ...subject,
      studentCount: subject.studentIds.length,
      classCount: subject._count.classes,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: subjectsWithCounts,
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

// POST: Crear una nueva asignatura
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, program, semester, credits, teacherId, group } = body;

    if (!name || !code || !teacherId) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos: nombre, código y docente.' },
        { status: 400 }
      );
    }

    // Verificar que el código no exista
    // Verificar que el código + grupo no exista
    // Note: Assuming 'group' defaults to null if undefined.
    // Use findFirst because findUnique requires exact composite match which might be tricky with nulls in some prisma versions?
    // Actually findUnique with composite unique works fine.
    const existingSubject = await db.subject.findUnique({
      where: {
        code_group: {
          code,
          group: group || null, // Ensure explicit null if falsy/undefined
        },
      },
    });

    if (existingSubject) {
      return NextResponse.json(
        { message: 'Ya existe una asignatura con este código y grupo.' },
        { status: 409 }
      );
    }

    // Verificar que el docente exista y tenga el rol correcto
    const teacher = await db.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'El docente no existe.' }, { status: 404 });
    }

    if (teacher.role !== Role.DOCENTE && teacher.role !== Role.ADMIN) {
      return NextResponse.json(
        { message: 'El usuario seleccionado no es un docente.' },
        { status: 400 }
      );
    }

    const newSubject = await db.subject.create({
      data: {
        name,
        code,
        program,
        semester: semester ? parseInt(semester) : null,
        credits: credits ? parseInt(credits) : null,
        credits: credits ? parseInt(credits) : null,
        teacherIds: [teacherId],
        studentIds: [],
        group: group || null,
      },
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            correoInstitucional: true,
            codigoDocente: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...newSubject,
        studentCount: 0,
        classCount: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

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
    const includeGroups = searchParams.get('includeGroups') === 'true';

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
    const includeObj: Record<string, unknown> = {
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
    };

    if (includeGroups) {
      includeObj.groups = {
        select: {
          id: true,
          groupNumber: true,
          jornada: true,
          maxCapacity: true,
          studentIds: true,
        },
      };
    }

    const [subjects, total] = await Promise.all([
      db.subject.findMany({
        where: Object.keys(whereClause).length > 0 ? whereClause : {},
        include: includeObj,
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

    // Transform the data to include student count from groups
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subjectsWithCounts = subjects.map((subject: any) => ({
      ...subject,
      studentCount:
        subject.groups?.reduce((sum: number, g: any) => sum + (g.studentIds?.length || 0), 0) || 0,
      classCount:
        subject.groups?.reduce((sum: number, g: any) => sum + (g._count?.classes || 0), 0) || 0,
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
    const { name, code, program, semester, credits, teacherId } = body;

    if (!name || !code) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos: nombre y código.' },
        { status: 400 }
      );
    }

    // Verificar que el código no exista (ahora solo código es único)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingSubject = await (db as any).subject.findUnique({
      where: {
        code,
      },
    });

    if (existingSubject) {
      return NextResponse.json(
        { message: 'Ya existe una asignatura con este código.' },
        { status: 409 }
      );
    }

    // Verificar que el docente exista y tenga el rol correcto (si se proporciona)
    if (teacherId) {
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
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newSubject = await (db as any).subject.create({
      data: {
        name,
        code,
        program,
        semester: semester ? parseInt(semester) : null,
        credits: credits ? parseInt(credits) : null,
        teacherIds: teacherId ? [teacherId] : [],
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

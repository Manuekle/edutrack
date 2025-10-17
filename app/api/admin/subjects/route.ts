import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET: Obtener lista de asignaturas
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const subjects = await db.subject.findMany({
      include: {
        teacher: {
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
    });

    // Transform the data to include student count
    const subjectsWithCounts = subjects.map(subject => ({
      ...subject,
      studentCount: subject.studentIds.length,
      classCount: subject._count.classes,
    }));

    return NextResponse.json(subjectsWithCounts);
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

    if (!name || !code || !teacherId) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos: nombre, código y docente.' },
        { status: 400 }
      );
    }

    // Verificar que el código no exista
    const existingSubject = await db.subject.findUnique({
      where: { code },
    });

    if (existingSubject) {
      return NextResponse.json(
        { message: 'El código de asignatura ya está en uso.' },
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
        teacherId,
        studentIds: [],
      },
      include: {
        teacher: {
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

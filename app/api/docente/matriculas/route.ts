import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { DocenteMatriculaEstudianteArraySchema } from './schema';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado', data: [] }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  if (!subjectId) {
    return NextResponse.json(
      { message: 'El ID de la asignatura es requerido', data: [] },
      { status: 400 }
    );
  }
  // Verificar si el ID es de una Asignatura o un Grupo
  let studentIds: string[] = [];
  let subject = await db.subject.findFirst({
    where: { id: subjectId, teacherIds: { has: session.user.id } },
    select: { studentIds: true },
  });

  if (subject) {
    studentIds = subject.studentIds;
  } else {
    // Si no es asignatura, probar con Grupo
    const group = await db.group.findFirst({
      where: { id: subjectId, teacherIds: { has: session.user.id } },
      select: { studentIds: true },
    });

    if (group) {
      studentIds = group.studentIds;
    } else {
      return NextResponse.json(
        {
          message: 'Asignatura o Grupo no encontrado o no pertenece al docente',
          data: [],
        },
        { status: 404 }
      );
    }
  }

  // Obtener los datos completos de los estudiantes matriculados
  const students = await db.user.findMany({
    where: {
      id: {
        in: studentIds,
      },
    },
    select: {
      id: true,
      name: true,
      institutionalEmail: true,
      personalEmail: true,
      document: true,
      phone: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  const validated = DocenteMatriculaEstudianteArraySchema.safeParse(students);
  if (!validated.success) {
    return NextResponse.json(
      {
        message: 'Error de validación en la respuesta',
        errors: validated.error.issues,
        data: [],
      },
      { status: 500 }
    );
  }
  return NextResponse.json({
    data: validated.data,
    message: 'Estudiantes matriculados obtenidos correctamente',
  });
}

// POST: Matricular un estudiante en una asignatura
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { subjectId, studentId } = await request.json();

  if (!subjectId || !studentId) {
    return NextResponse.json(
      { message: 'El ID de la asignatura y del estudiante son requeridos' },
      { status: 400 }
    );
  }

  // Verificar que el docente es el propietario de la asignatura
  const subject = await db.subject.findFirst({
    where: { id: subjectId, teacherIds: { has: session.user.id } },
    select: { studentIds: true },
  });

  if (!subject) {
    return NextResponse.json(
      { message: 'Asignatura no encontrada o no pertenece al docente' },
      { status: 404 }
    );
  }

  // Verificar que el estudiante existe y tiene el rol correcto
  const student = await db.user.findFirst({
    where: { id: studentId, role: Role.ESTUDIANTE },
  });

  if (!student) {
    return NextResponse.json({ message: 'Estudiante no encontrado' }, { status: 404 });
  }

  // Verificar si el estudiante ya está matriculado
  if (subject.studentIds.includes(studentId)) {
    return NextResponse.json(
      { message: 'El estudiante ya está matriculado en esta asignatura' },
      { status: 409 }
    );
  }

  // Matricular al estudiante actualizando ambos modelos en una transacción
  try {
    await db.$transaction([
      db.subject.update({
        where: { id: subjectId },
        data: { studentIds: { push: studentId } },
      }),
      // Also update groups if necessary - for now we just update top-level subject
    ]);
    return NextResponse.json({ message: 'Estudiante matriculado con éxito' }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ message: 'Error al matricular al estudiante' }, { status: 500 });
  }
}

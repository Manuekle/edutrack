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
  // Verificar que el usuario autenticado es el propietario de la asignatura
  const subject = await db.subject.findFirst({
    where: { id: subjectId, teacherId: session.user.id },
    select: { studentIds: true },
  });
  if (!subject) {
    return NextResponse.json(
      {
        message: 'Asignatura no encontrada o no pertenece al docente',
        data: [],
      },
      { status: 404 }
    );
  }
  // Obtener los datos completos de los estudiantes matriculados
  const students = await db.user.findMany({
    where: {
      id: {
        in: subject.studentIds,
      },
    },
    select: {
      id: true,
      name: true,
      correoInstitucional: true,
      correoPersonal: true,
      document: true,
      telefono: true,
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
    where: { id: subjectId, teacherId: session.user.id },
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
      db.user.update({
        where: { id: studentId },
        data: { enrolledSubjectIds: { push: subjectId } },
      }),
    ]);
    return NextResponse.json({ message: 'Estudiante matriculado con éxito' }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ message: 'Error al matricular al estudiante' }, { status: 500 });
  }
}

// DELETE: Desmatricular un estudiante de una asignatura
export async function DELETE(request: Request) {
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
    where: { id: subjectId, teacherId: session.user.id },
    select: { studentIds: true },
  });

  if (!subject) {
    return NextResponse.json(
      { message: 'Asignatura no encontrada o no pertenece al docente' },
      { status: 404 }
    );
  }

  // Verificar que el estudiante existe
  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { enrolledSubjectIds: true },
  });

  if (!student) {
    return NextResponse.json({ message: 'Estudiante no encontrado' }, { status: 404 });
  }

  // Verificar si el estudiante está realmente matriculado
  if (!subject.studentIds.includes(studentId)) {
    return NextResponse.json({ message: 'Matrícula no encontrada' }, { status: 404 });
  }

  // Desmatricular al estudiante actualizando ambos modelos en una transacción
  try {
    await db.$transaction([
      db.subject.update({
        where: { id: subjectId },
        data: {
          studentIds: {
            set: subject.studentIds.filter((id: string) => id !== studentId),
          },
        },
      }),
      db.user.update({
        where: { id: studentId },
        data: {
          enrolledSubjectIds: {
            set: student.enrolledSubjectIds.filter((id: string) => id !== subjectId),
          },
        },
      }),
    ]);

    return NextResponse.json({ message: 'Estudiante desmatriculado con éxito' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error al desmatricular al estudiante' }, { status: 500 });
  }
}

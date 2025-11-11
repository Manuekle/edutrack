import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface RequestBody {
  codigoAsignatura: string;
  documentoEstudiante: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Validate session and role
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'No autorizado. Solo ADMIN puede realizar esta acción.' },
      { status: 401 }
    );
  }

  try {
    const { codigoAsignatura, documentoEstudiante }: RequestBody = await request.json();

    // Validate input
    if (!codigoAsignatura || !documentoEstudiante) {
      return NextResponse.json(
        { success: false, error: 'Se requieren código de asignatura y documento de estudiante' },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async tx => {
      // Find the subject
      const subject = await tx.subject.findUnique({
        where: { code: codigoAsignatura },
      });

      if (!subject) {
        return { success: false, error: 'Asignatura no encontrada', status: 404 };
      }

      // Find the student
      const student = await tx.user.findFirst({
        where: {
          document: documentoEstudiante,
          role: 'ESTUDIANTE',
        },
        select: { id: true, name: true, document: true },
      });

      if (!student) {
        return {
          success: false,
          error: 'Estudiante no encontrado o no es un estudiante',
          status: 404,
        };
      }

      // Check if student is already enrolled
      if (subject.studentIds.includes(student.id)) {
        return {
          success: true,
          message: 'El estudiante ya está inscrito en esta asignatura',
          enrolled: true,
          student,
          subject: { code: subject.code, name: subject.name },
        };
      }

      // Add student to subject
      await tx.subject.update({
        where: { id: subject.id },
        data: {
          studentIds: { push: student.id },
        },
      });

      return {
        success: true,
        message: 'Estudiante inscrito exitosamente',
        enrolled: false,
        student,
        subject: { code: subject.code, name: subject.name },
      };
    });

    return NextResponse.json(result, { status: result.status || 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  // Validate session and role
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'No autorizado. Solo ADMIN puede realizar esta acción.' },
      { status: 401 }
    );
  }

  try {
    const { codigoAsignatura, documentoEstudiante }: RequestBody = await request.json();

    // Validate input
    if (!codigoAsignatura || !documentoEstudiante) {
      return NextResponse.json(
        { success: false, error: 'Se requieren código de asignatura y documento de estudiante' },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async tx => {
      // Find the subject
      const subject = await tx.subject.findUnique({
        where: { code: codigoAsignatura },
      });

      if (!subject) {
        return { success: false, error: 'Asignatura no encontrada', status: 404 };
      }

      // Find the student
      const student = await tx.user.findFirst({
        where: {
          document: documentoEstudiante,
          role: 'ESTUDIANTE',
        },
        select: { id: true, name: true, document: true },
      });

      if (!student) {
        return {
          success: false,
          error: 'Estudiante no encontrado o no es un estudiante',
          status: 404,
        };
      }

      // Check if student is enrolled
      if (!subject.studentIds.includes(student.id)) {
        return {
          success: true,
          message: 'El estudiante no está inscrito en esta asignatura',
          enrolled: false,
          student,
          subject: { code: subject.code, name: subject.name },
        };
      }

      // Remove student from subject
      await tx.subject.update({
        where: { id: subject.id },
        data: {
          studentIds: {
            set: subject.studentIds.filter(id => id !== student.id),
          },
        },
      });

      return {
        success: true,
        message: 'Estudiante retirado exitosamente',
        removed: true,
        student,
        subject: { code: subject.code, name: subject.name },
      };
    });

    return NextResponse.json(result, { status: result.status || 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

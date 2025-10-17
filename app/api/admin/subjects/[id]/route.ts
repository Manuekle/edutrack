import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// PATCH: Actualizar una asignatura
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, code, program, semester, credits, teacherId } = body;

    // Verificar que la asignatura existe
    const existingSubject = await db.subject.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      return NextResponse.json({ message: 'Asignatura no encontrada.' }, { status: 404 });
    }

    // Si se está actualizando el código, verificar que no exista
    if (code && code !== existingSubject.code) {
      const subjectWithCode = await db.subject.findUnique({
        where: { code },
      });

      if (subjectWithCode) {
        return NextResponse.json(
          { message: 'El código de asignatura ya está en uso.' },
          { status: 409 }
        );
      }
    }

    // Si se está actualizando el docente, verificar que exista y tenga el rol correcto
    if (teacherId && teacherId !== existingSubject.teacherId) {
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

    const updatedSubject = await db.subject.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(program !== undefined && { program }),
        ...(semester !== undefined && { semester: semester ? parseInt(semester) : null }),
        ...(credits !== undefined && { credits: credits ? parseInt(credits) : null }),
        ...(teacherId && { teacherId }),
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
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedSubject,
      studentCount: updatedSubject.studentIds.length,
      classCount: updatedSubject._count.classes,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar una asignatura
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = params;

    // Verificar que la asignatura existe
    const existingSubject = await db.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    if (!existingSubject) {
      return NextResponse.json({ message: 'Asignatura no encontrada.' }, { status: 404 });
    }

    // Verificar si tiene estudiantes o clases
    if (existingSubject.studentIds.length > 0 || existingSubject._count.classes > 0) {
      return NextResponse.json(
        {
          message:
            'No se puede eliminar una asignatura con estudiantes matriculados o clases programadas.',
        },
        { status: 400 }
      );
    }

    await db.subject.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Asignatura eliminada correctamente.' });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@/lib/roles';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// PATCH: Actualizar una asignatura
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, code, program, semester, credits, directHours, teacherId } = body;

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
        where: { code_group: { code, group: existingSubject.group || '' } },
      });

      if (subjectWithCode && subjectWithCode.id !== id) {
        return NextResponse.json(
          { message: 'Ya existe una asignatura con este código.' },
          { status: 409 }
        );
      }
    }

    // Solo un docente por materia y grupo
    if (teacherId !== undefined) {
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
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...(name && { name }),
      ...(code && { code }),
      ...(program !== undefined && { program }),
      ...(semester !== undefined && { semester: semester ? parseInt(semester) : null }),
      ...(credits !== undefined && { credits: credits ? parseInt(credits) : null }),
      ...(directHours !== undefined && { directHours: directHours ? parseInt(directHours) : null }),
      // Group fields
      ...(body.group !== undefined && { group: body.group }),
      ...(body.shift !== undefined && { shift: body.shift }),
      ...(body.academicPeriod !== undefined && { academicPeriod: body.academicPeriod }),
      // Un solo docente por asignatura
      ...(teacherId !== undefined && {
        teacherIds: teacherId ? [teacherId] : [],
      }),
    };

    const updatedSubject = await db.subject.update({
      where: { id },
      data: updateData,
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            institutionalEmail: true,
            teacherCode: true,
          },
        },
      },
    });

    // Calcular total de estudiantes desde el propio subject (mantener compatibilidad)
    const totalStudents = Array.isArray(updatedSubject.studentIds)
      ? updatedSubject.studentIds.length
      : 0;

    return NextResponse.json({
      ...updatedSubject,
      studentCount: totalStudents,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar una asignatura
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que la asignatura existe
    const existingSubject = await db.subject.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      return NextResponse.json({ message: 'Asignatura no encontrada.' }, { status: 404 });
    }

    // Verificar si tiene estudiantes matriculados
    const studentCount = existingSubject.studentIds?.length || 0;

    if (studentCount > 0) {
      return NextResponse.json(
        {
          message: 'No se puede eliminar una asignatura con estudiantes matriculados.',
        },
        { status: 400 }
      );
    }

    // Eliminar primero las clases asociadas
    await db.class.deleteMany({
      where: { subjectId: id },
    });

    // Eliminar la asignatura
    await db.subject.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Asignatura eliminada correctamente.' });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

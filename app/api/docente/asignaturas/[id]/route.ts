import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@/lib/roles';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { DocenteSubjectSchema } from '../schema';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    let subject = await db.subject.findFirst({
      where: {
        id,
        teacherIds: { has: session.user.id },
      },
    });

    // Si no se encuentra como Asignatura, podría ser un ID de Grupo
    if (!subject) {
      const grupo = await db.grupo.findFirst({
        where: {
          id,
          docenteIds: { has: session.user.id },
        },
        include: { subject: true },
      });

      if (grupo && grupo.subject) {
        subject = grupo.subject;
      }
    }

    if (!subject) {
      return NextResponse.json({ message: 'Asignatura o Grupo no encontrado' }, { status: 404 });
    }

    // Map Prisma shape (teacherIds) to schema shape (teacherId) for validation
    const validado = DocenteSubjectSchema.safeParse({
      ...subject,
      teacherId: subject.teacherIds?.[0] ?? '',
    });
    if (!validado.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validado.error.issues,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: validado.data,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}

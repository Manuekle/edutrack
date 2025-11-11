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
    const subject = await db.subject.findUnique({
      where: {
        id,
        teacherId: session.user.id, // Asegurarse de que el docente sea el dueño de la asignatura
      },
    });

    if (!subject) {
      return NextResponse.json({ message: 'Asignatura no encontrada' }, { status: 404 });
    }

    // Validar los datos de la asignatura
    const validado = DocenteSubjectSchema.safeParse(subject);
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

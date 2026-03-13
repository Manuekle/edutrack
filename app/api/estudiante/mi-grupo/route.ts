import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ESTUDIANTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const grupos = await db.grupo.findMany({
      where: { estudianteIds: { has: session.user.id } },
      include: {
        subject: { select: { name: true, code: true } },
        docentes: { select: { id: true, name: true, correoInstitucional: true } },
        horario: {
          select: { diaSemana: true, horaInicio: true, horaFin: true, periodicidad: true },
        },
        sala: { select: { name: true, type: true, capacity: true } },
        estudiantes: { select: { id: true, name: true, codigoEstudiantil: true } },
      },
    });
    return NextResponse.json({ grupos });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'DOCENTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const docenteId = session.user.id;

    const grupos = await db.grupo.findMany({
      where: { docenteIds: { has: docenteId } },
      include: {
        subject: { select: { id: true, name: true, code: true, credits: true } },
        horario: { select: { diaSemana: true, horaInicio: true, horaFin: true } },
        sala: { select: { name: true } },
        planeacion: {
          include: {
            semanas: {
              include: {
                clases: {
                  select: { id: true, status: true, bitacora: { select: { id: true } } },
                },
              },
              orderBy: { numero: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ grupos });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ grupoId: string }> }) {
  const { grupoId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'DOCENTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const grupo = await db.grupo.findUnique({
      where: { id: grupoId },
      include: {
        subject: { select: { name: true, code: true } },
        horario: { select: { diaSemana: true, horaInicio: true, horaFin: true } },
        sala: { select: { name: true } },
        planeacion: {
          include: {
            semanas: {
              include: {
                clases: {
                  include: { bitacora: true },
                  orderBy: { date: 'asc' },
                },
              },
              orderBy: { numero: 'asc' },
            },
          },
        },
      },
    });
    if (!grupo) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    return NextResponse.json(grupo);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

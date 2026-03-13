import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const includePlaneacion = req.nextUrl.searchParams.get('includePlaneacion') === 'true';

    const grupos = await db.grupo.findMany({
      include: {
        subject: { select: { id: true, name: true, code: true } },
        docentes: { select: { id: true, name: true } },
        horario: {
          select: {
            id: true,
            diaSemana: true,
            horaInicio: true,
            horaFin: true,
            sala: { select: { id: true, name: true } },
          },
        },
        sala: { select: { id: true, name: true } },
        _count: { select: { estudiantes: true } },
        ...(includePlaneacion
          ? {
              planeacion: {
                include: {
                  semanas: {
                    select: { id: true, numero: true, fechaInicio: true, fechaFin: true },
                  },
                },
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ grupos });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await req.json();
    const grupo = await db.grupo.create({
      data: {
        codigo: body.codigo,
        subjectId: body.subjectId,
        periodoAcademico: body.periodoAcademico,
        docenteIds: body.docenteIds ?? [],
        horarioId: body.horarioId ?? null,
        salaId: body.salaId ?? null,
      },
    });
    return NextResponse.json(grupo);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

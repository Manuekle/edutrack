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
        subject: {
          select: { name: true, code: true, credits: true, program: true, semester: true },
        },
        docentes: { select: { name: true } },
        horario: { select: { diaSemana: true, horaInicio: true, horaFin: true } },
        sala: { select: { name: true } },
      },
    });

    const asignaturas = grupos.map(g => ({
      grupoId: g.id,
      grupoCodigo: g.codigo,
      periodoAcademico: g.periodoAcademico,
      subject: g.subject,
      docentes: g.docentes,
      horario: g.horario,
      sala: g.sala,
    }));

    return NextResponse.json({ asignaturas });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

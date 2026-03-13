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
      where: { estudianteIds: { has: session.user.id }, horarioId: { not: null } },
      include: {
        subject: { select: { name: true, code: true } },
        horario: true,
        sala: { select: { name: true } },
        docentes: { select: { name: true } },
      },
    });

    const horarios = grupos
      .filter(g => g.horario)
      .map(g => ({
        grupoId: g.id,
        grupoCodigo: g.codigo,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        diaSemana: g.horario!.diaSemana,
        horaInicio: g.horario!.horaInicio,
        horaFin: g.horario!.horaFin,
        salaName: g.sala?.name ?? null,
        docenteName: g.docentes[0]?.name ?? null,
        periodoAcademico: g.periodoAcademico,
      }));

    return NextResponse.json({ horarios });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

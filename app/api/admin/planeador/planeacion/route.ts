import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { addDays, addWeeks } from 'date-fns';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { grupoId, fechaInicio } = await req.json();
    if (!grupoId || !fechaInicio) {
      return NextResponse.json({ error: 'grupoId y fechaInicio son requeridos' }, { status: 400 });
    }

    const grupo = await db.grupo.findUnique({
      where: { id: grupoId },
      include: { horario: true },
    });
    if (!grupo) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });

    // Delete existing planeacion if any
    const existing = await db.planeacion.findUnique({ where: { grupoId } });
    if (existing) {
      await db.planeacion.delete({ where: { grupoId } });
    }

    const start = new Date(fechaInicio);
    const end = addWeeks(start, 16);

    // Create planeacion with 16 semanas
    const planeacion = await db.planeacion.create({
      data: {
        grupoId,
        fechaInicio: start,
        fechaFin: end,
      },
    });

    // Generate 16 semanas and classes based on horario
    for (let i = 0; i < 16; i++) {
      const semanaInicio = addWeeks(start, i);
      const semanaFin = addDays(semanaInicio, 6);

      const semana = await db.semanaAcademica.create({
        data: {
          planeacionId: planeacion.id,
          numero: i + 1,
          fechaInicio: semanaInicio,
          fechaFin: semanaFin,
        },
      });

      // Create a class for the semana based on horario
      if (grupo.horario) {
        const DIA_TO_DAY_OFFSET: Record<string, number> = {
          LUNES: 0,
          MARTES: 1,
          MIERCOLES: 2,
          JUEVES: 3,
          VIERNES: 4,
          SABADO: 5,
          DOMINGO: 6,
        };
        const offset = DIA_TO_DAY_OFFSET[grupo.horario.diaSemana] ?? 0;
        const classDate = addDays(semanaInicio, offset);

        await db.class.create({
          data: {
            subjectId: grupo.subjectId,
            grupoId: grupo.id,
            semanaId: semana.id,
            date: classDate,
            status: 'PROGRAMADA',
          },
        });
      }
    }

    return NextResponse.json({ success: true, planeacionId: planeacion.id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

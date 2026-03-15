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

    // Get ONLY the groups where student is directly enrolled (via Group.studentIds)
    const groups = await db.group.findMany({
      where: { studentIds: { has: session.user.id } },
      include: {
        subject: {
          select: { name: true, code: true, credits: true, program: true, semester: true },
        },
        teachers: { select: { name: true } },
        schedule: { select: { dayOfWeek: true, startTime: true, endTime: true } },
        room: { select: { name: true } },
      },
    });

    const dayMap: Record<string, string> = {
      MONDAY: 'LUNES',
      TUESDAY: 'MARTES',
      WEDNESDAY: 'MIERCOLES',
      THURSDAY: 'JUEVES',
      FRIDAY: 'VIERNES',
      SATURDAY: 'SABADO',
      SUNDAY: 'DOMINGO',
    };

    const asignaturas = groups.map(g => ({
      grupoId: g.id,
      grupoCodigo: g.code,
      periodoAcademico: g.academicPeriod,
      subject: g.subject,
      docentes: g.teachers,
      horario: g.schedule
        ? {
            diaSemana: dayMap[g.schedule.dayOfWeek] || g.schedule.dayOfWeek,
            horaInicio: g.schedule.startTime,
            horaFin: g.schedule.endTime,
          }
        : null,
      sala: g.room,
    }));

    return NextResponse.json({ asignaturas });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

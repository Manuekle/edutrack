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

    // Get subjects where student is enrolled (via Subject.studentIds)
    const subjects = await db.subject.findMany({
      where: { studentIds: { has: session.user.id } },
      select: { id: true },
    });
    const subjectIds = subjects.map(s => s.id);

    // Also get groups where student is enrolled (via Group.studentIds)
    const groupsFromGroup = await db.group.findMany({
      where: { studentIds: { has: session.user.id } },
      select: { subjectId: true },
    });
    const groupSubjectIds = groupsFromGroup.map(g => g.subjectId);

    // Combine both lists of subject IDs
    const allSubjectIds = [...new Set([...subjectIds, ...groupSubjectIds])];

    // Get all groups from these subjects
    const groups = await db.group.findMany({
      where: { subjectId: { in: allSubjectIds }, scheduleId: { not: null } },
      include: {
        subject: {
          select: { name: true, code: true },
        },
        schedule: true,
        room: { select: { name: true } },
        teachers: { select: { name: true } },
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

    const horarios = groups.flatMap(g => {
      if (!g.schedule) return [];
      return [
        {
          grupoId: g.id,
          grupoCodigo: g.code,
          subjectName: g.subject.name,
          subjectCode: g.subject.code,
          diaSemana: dayMap[g.schedule.dayOfWeek] || g.schedule.dayOfWeek,
          horaInicio: g.schedule.startTime,
          horaFin: g.schedule.endTime,
          salaName: g.room?.name ?? null,
          docenteName: g.teachers[0]?.name ?? null,
          periodoAcademico: g.academicPeriod,
        },
      ];
    });

    return NextResponse.json({ horarios });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

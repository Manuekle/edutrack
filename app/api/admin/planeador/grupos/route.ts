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

    const groups = await db.group.findMany({
      include: {
        subject: { select: { id: true, name: true, code: true } },
        teachers: { select: { id: true, name: true } },
        schedule: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: { select: { id: true, name: true } },
          },
        },
        room: { select: { id: true, name: true } },
        _count: { select: { students: true } },
        ...(includePlaneacion
          ? {
              planning: {
                include: {
                  weeks: {
                    select: {
                      id: true,
                      number: true,
                      startDate: true,
                      endDate: true,
                      classes: { select: { id: true, status: true } },
                    },
                  },
                },
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    const groupsWithDocentes = groups.map(g => {
      const { teachers, schedule, room, code, academicPeriod, ...rest } = g;
      return {
        ...rest,
        codigo: code,
        periodoAcademico: academicPeriod,
        docentes: teachers,
        horario: schedule
          ? {
              ...schedule,
              diaSemana: schedule.dayOfWeek,
              horaInicio: schedule.startTime,
              horaFin: schedule.endTime,
            }
          : null,
        sala: room,
      };
    });

    return NextResponse.json({ grupos: groupsWithDocentes });
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
    const group = await db.group.create({
      data: {
        code: body.codigo,
        subjectId: body.subjectId,
        academicPeriod: body.periodoAcademico,
        teacherIds: body.docenteIds ?? [],
        scheduleId: body.horarioId ?? null,
        roomId: body.salaId ?? null,
      },
    });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

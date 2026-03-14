import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await req.json();

    // 1. Update Group basic fields and Shift
    const groupData: any = {
      ...(body.codigo && { code: body.codigo }),
      ...(body.subjectId && { subjectId: body.subjectId }),
      ...(body.periodoAcademico && { academicPeriod: body.periodoAcademico }),
      ...(body.docenteIds && { teacherIds: body.docenteIds }),
      ...(body.salaId !== undefined && { roomId: body.salaId }),
      ...(body.shift && { shift: body.shift }),
    };

    // 2. Handle Schedule Update (Day, Start, End)
    if (body.diaSemana || body.horaInicio || body.horaFin) {
      // Get current group to find subjectId if not provided
      const currentGroup = await db.group.findUnique({
        where: { id },
        select: { subjectId: true, schedule: true },
      });

      if (currentGroup) {
        const subjectId = body.subjectId || currentGroup.subjectId;
        const dayOfWeek = body.diaSemana || currentGroup.schedule?.dayOfWeek;
        const startTime = body.horaInicio || currentGroup.schedule?.startTime;
        const endTime = body.horaFin || currentGroup.schedule?.endTime;

        if (dayOfWeek && startTime && endTime) {
          // Find or create schedule
          let schedule = await db.schedule.findFirst({
            where: {
              dayOfWeek,
              startTime,
              endTime,
              subjectId,
            },
          });

          if (!schedule) {
            schedule = await db.schedule.create({
              data: {
                dayOfWeek,
                startTime,
                endTime,
                subjectId,
              },
            });
          }
          groupData.scheduleId = schedule.id;
        }
      }
    } else if (body.horarioId !== undefined) {
      groupData.scheduleId = body.horarioId;
    }

    const group = await db.group.update({
      where: { id },
      data: groupData,
    });

    return NextResponse.json(group);


  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    await db.group.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

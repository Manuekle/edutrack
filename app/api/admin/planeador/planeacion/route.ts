import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { addDays, addWeeks, startOfWeek } from 'date-fns';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { groupId, startDate } = await req.json();
    if (!groupId || !startDate) {
      return NextResponse.json({ error: 'groupId y startDate son requeridos' }, { status: 400 });
    }

    const group = await db.group.findUnique({
      where: { id: groupId },
      include: { schedule: true },
    });
    if (!group) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });

    // Delete existing planning if any
    const existing = await db.planning.findUnique({ where: { groupId } });
    if (existing) {
      // Classes don't have cascade delete, so we delete them manually
      await db.class.deleteMany({ where: { groupId } });
      await db.planning.delete({ where: { groupId } });
    }

    const start = new Date(startDate);
    const end = addWeeks(start, 16);

    // Create planning with 16 weeks
    const planning = await db.planning.create({
      data: {
        groupId,
        startDate: start,
        endDate: end,
      },
    });

    // Generate 16 weeks and classes based on schedule
    for (let i = 0; i < 16; i++) {
      const baseDate = addWeeks(start, i);
      const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 }); // Force Monday start
      const weekEnd = addDays(weekStart, 6);

      const week = await db.academicWeek.create({
        data: {
          planningId: planning.id,
          number: i + 1,
          startDate: weekStart,
          endDate: weekEnd,
        },
      });

      // Create a class for the week based on schedule
      if (group.schedule) {
        const DAY_TO_OFFSET: Record<string, number> = {
          MONDAY: 0,
          TUESDAY: 1,
          WEDNESDAY: 2,
          THURSDAY: 3,
          FRIDAY: 4,
          SATURDAY: 5,
          SUNDAY: 6,
        };
        const offset = DAY_TO_OFFSET[group.schedule.dayOfWeek] ?? 0;
        const classDate = addDays(weekStart, offset);

        // Pre-calculate start and end times based on classDate
        let startTime: Date | undefined;
        let endTime: Date | undefined;

        if (group.schedule.startTime && group.schedule.endTime) {
          const [sH, sM] = group.schedule.startTime.split(':').map(Number);
          const [eH, eM] = group.schedule.endTime.split(':').map(Number);
          
          startTime = new Date(classDate);
          startTime.setUTCHours(sH, sM, 0, 0);
          
          endTime = new Date(classDate);
          endTime.setUTCHours(eH, eM, 0, 0);
        }

        await db.class.create({
          data: {
            subjectId: group.subjectId,
            groupId: group.id,
            weekId: week.id,
            date: classDate,
            startTime,
            endTime,
            status: 'SCHEDULED',
          },
        });
      }
    }

    return NextResponse.json({ success: true, planningId: planning.id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

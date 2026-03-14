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

    // 0. Thorough cleanup: Delete all classes for this group ID first
    await db.class.deleteMany({
      where: { groupId }
    });

    // 1. Delete existing planning and its weeks explicitly (though cascade should handle it)
    const existingPlanning = await db.planning.findUnique({
      where: { groupId },
      include: { weeks: true }
    });

    if (existingPlanning) {
      // Manually delete weeks to be paranoid (Cascade should handle it usually)
      await db.academicWeek.deleteMany({
        where: { planningId: existingPlanning.id }
      });
      
      await db.planning.delete({
        where: { id: existingPlanning.id }
      });
    }

    const start = new Date(startDate);
    
    // Use UTC methods to avoid timezone shift issues on the server
    let firstClassDate = new Date(start);
    if (group.schedule) {
      const DAY_TO_OFFSET: Record<string, number> = {
        SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6
      };
      const targetDay = DAY_TO_OFFSET[group.schedule.dayOfWeek] ?? 1;
      
      // Ensure we hit the target day strictly ON or AFTER the start date
      // We use getUTCDay because startDate is usually "YYYY-MM-DD" which Date(s) parses as midnight UTC
      while (firstClassDate.getUTCDay() !== targetDay) {
        firstClassDate.setUTCDate(firstClassDate.getUTCDate() + 1);
      }
    }

    const end = addWeeks(firstClassDate, 15); // End of the 16th week

    // Create planning
    const planning = await db.planning.create({
      data: {
        groupId,
        startDate: firstClassDate,
        endDate: end,
      },
    });

    // Generate 16 weeks and classes based on schedule
    for (let i = 0; i < 16; i++) {
      const classDate = addWeeks(firstClassDate, i);
      const weekStart = startOfWeek(classDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);

      const week = await db.academicWeek.create({
        data: {
          planningId: planning.id,
          number: i + 1,
          startDate: weekStart,
          endDate: weekEnd,
        },
      });

      if (group.schedule) {
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

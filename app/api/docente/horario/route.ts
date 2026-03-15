import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'DOCENTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const teacher = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    const groups = await db.group.findMany({
      where: { teacherIds: { has: session.user.id } },
      include: {
        subject: {
          include: { schedules: true },
        },
        schedule: true,
        room: { select: { name: true } },
      },
    });

    const schedules = groups.flatMap(g => {
      // Get unique schedules by ID to avoid duplicates
      const allSchedules = [...(g.schedule ? [g.schedule] : []), ...(g.subject.schedules || [])];
      const uniqueSchedules = allSchedules.filter(
        (schedule, index, self) => index === self.findIndex(s => s.id === schedule.id)
      );

      if (uniqueSchedules.length === 0) return [];
      return uniqueSchedules.map(schedule => ({
        groupId: g.id,
        groupCode: g.code,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        roomName: g.room?.name ?? null,
        academicPeriod: g.academicPeriod,
        teacherName: teacher?.name ?? null,
      }));
    });

    return NextResponse.json({ horarios: schedules });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

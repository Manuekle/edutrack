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
    const groups = await db.group.findMany({
      where: { studentIds: { has: session.user.id }, scheduleId: { not: null } },
      include: {
        subject: { select: { name: true, code: true } },
        schedule: true,
        room: { select: { name: true } },
        teachers: { select: { name: true } },
      },
    });

    const schedules = groups
      .filter(g => g.schedule)
      .map(g => ({
        groupId: g.id,
        groupCode: g.code,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        dayOfWeek: g.schedule!.dayOfWeek,
        startTime: g.schedule!.startTime,
        endTime: g.schedule!.endTime,
        roomName: g.room?.name ?? null,
        teacherName: g.teachers[0]?.name ?? null,
        academicPeriod: g.academicPeriod,
      }));

    return NextResponse.json({ schedules });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

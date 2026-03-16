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

    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get('periodo');

    const groups = await db.group.findMany({
      where: {
        scheduleId: { not: null },
        ...(periodo ? { academicPeriod: periodo } : {}),
      },
      include: {
        subject: { select: { name: true, code: true } },
        schedule: true,
        room: { select: { name: true } },
        teachers: { select: { name: true } },
      },
      orderBy: { academicPeriod: 'desc' },
    });

    // Collect all distinct periods for the filter dropdown
    const allGroups = await db.group.findMany({
      where: { scheduleId: { not: null } },
      select: { academicPeriod: true },
      distinct: ['academicPeriod'],
      orderBy: { academicPeriod: 'desc' },
    });

    const periodos = allGroups.map(g => g.academicPeriod);

    const horarios = groups
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

    return NextResponse.json({ horarios, periodos });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

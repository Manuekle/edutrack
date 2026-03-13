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

    const subjects = groups.map(g => ({
      groupId: g.id,
      groupCode: g.code,
      academicPeriod: g.academicPeriod,
      subject: g.subject,
      teachers: g.teachers,
      schedule: g.schedule,
      room: g.room,
    }));

    return NextResponse.json({ subjects });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ docenteId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { docenteId } = await params;

    const groups = await db.group.findMany({
      where: { teacherIds: { has: docenteId } },
      include: {
        subject: { select: { id: true, name: true, code: true, credits: true } },
        schedule: { select: { dayOfWeek: true, startTime: true, endTime: true } },
        room: { select: { name: true, type: true } },
        planning: { select: { id: true, weeks: { select: { number: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const groupsWithStats = await Promise.all(
      groups.map(async g => {
        const totalStudents = g.studentIds?.length || 0;

        const classesCount = await db.class.count({
          where: { groupId: g.id },
        });

        const completedClasses = await db.class.count({
          where: {
            groupId: g.id,
            status: { in: ['SIGNED', 'COMPLETED'] as any },
          },
        });

        return {
          ...g,
          totalStudents,
          classesCount,
          completedClasses,
        };
      })
    );

    return NextResponse.json({ grupos: groupsWithStats });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

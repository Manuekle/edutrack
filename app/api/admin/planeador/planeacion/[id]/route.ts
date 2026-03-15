import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get group info before deleting to invalidate caches
    const planning = await db.planning.findUnique({
      where: { id },
      select: {
        groupId: true,
        group: { select: { studentIds: true, teacherIds: true } },
        weeks: { select: { id: true } },
      },
    });

    if (planning) {
      // Delete all classes for the group AND classes linked to the weeks
      const weekIds = planning.weeks.map(w => w.id);

      await db.class.deleteMany({
        where: {
          OR: [{ groupId: planning.groupId }, { weekId: { in: weekIds } }],
        },
      });

      // Invalidate Redis cache for all students in this group
      const studentIds = planning.group?.studentIds || [];
      for (const studentId of studentIds) {
        try {
          await redis.del(`dashboard:estudiante:${studentId}`);
        } catch {}
      }

      // Invalidate Redis cache for all teachers in this group
      const teacherIds = planning.group?.teacherIds || [];
      for (const teacherId of teacherIds) {
        try {
          await redis.del(`dashboard:docente:${teacherId}`);
        } catch {}
      }
    }

    await db.planning.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

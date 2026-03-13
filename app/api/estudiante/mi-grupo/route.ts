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
        subject: { select: { name: true, code: true } },
        teachers: { select: { id: true, name: true, institutionalEmail: true } },
        schedule: {
          select: { dayOfWeek: true, startTime: true, endTime: true },
        },
        room: { select: { name: true, type: true, capacity: true } },
        students: { select: { id: true, name: true, studentCode: true } },
      },
    });
    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

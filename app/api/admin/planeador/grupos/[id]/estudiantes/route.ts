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
    const { estudianteIds } = await req.json();

    // Update group's student IDs
    await db.group.update({
      where: { id },
      data: { studentIds: estudianteIds },
    });

    // Update each student's studentGroupsIds (sync back-reference)
    // Remove this group from all previous students not in new list
    await db.user.updateMany({
      where: { studentGroupsIds: { has: id } },
      data: { studentGroupsIds: { set: [] } }, // Will be corrected below
    });

    // Set correctly for each student
    for (const estudianteId of estudianteIds) {
      const user = await db.user.findUnique({
        where: { id: estudianteId },
        select: { studentGroupsIds: true },
      });
      if (user && !user.studentGroupsIds.includes(id)) {
        await db.user.update({
          where: { id: estudianteId },
          data: { studentGroupsIds: { push: id } },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const subjects = await db.subject.findMany({
      where: { group: { not: null } },
      select: { group: true },
      distinct: ['group'],
    });

    const groups = subjects
      .map(s => s.group)
      .filter(Boolean)
      .sort();

    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo grupos' }, { status: 500 });
  }
}

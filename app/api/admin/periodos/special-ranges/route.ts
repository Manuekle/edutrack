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

    const ranges = await db.specialRange.findMany({
      orderBy: { startDate: 'asc' },
      include: { year: { select: { year: true } } },
    });

    return NextResponse.json({ ranges });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { yearId, name, type, startDate, endDate } = body;

    const range = await db.specialRange.create({
      data: {
        name,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        yearId,
      },
    });

    return NextResponse.json(range);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

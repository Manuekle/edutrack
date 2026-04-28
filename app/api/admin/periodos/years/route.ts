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

    const years = await db.academicYear.findMany({
      orderBy: { year: 'desc' },
      include: {
        specialRanges: { orderBy: { startDate: 'asc' } },
        periods: { orderBy: { name: 'asc' } },
      },
    });

    return NextResponse.json({ years });
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

    const { year } = await req.json();
    const existing = await db.academicYear.findUnique({ where: { year } });
    if (existing) {
      return NextResponse.json({ error: 'El año ya existe' }, { status: 409 });
    }

    const academicYear = await db.academicYear.create({ data: { year } });
    return NextResponse.json(academicYear);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

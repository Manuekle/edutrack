import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const year = await db.academicYear.findUnique({
      where: { id },
      include: { periods: true },
    });

    if (!year) return NextResponse.json({ error: 'Año no encontrado' }, { status: 404 });

    if (year.periods.length > 0) {
      return NextResponse.json({ error: 'Este año ya tiene periodos' }, { status: 409 });
    }

    const startYear = new Date(year.year, 0, 1);
    const midYear = new Date(year.year, 6, 1);

    const [p1, p2] = await Promise.all([
      db.academicPeriod.create({
        data: {
          name: `${year.year}-1`,
          startDate: startYear,
          endDate: new Date(year.year, 5, 30),
          isActive: true,
          yearId: year.id,
        },
      }),
      db.academicPeriod.create({
        data: {
          name: `${year.year}-2`,
          startDate: midYear,
          endDate: new Date(year.year, 11, 31),
          isActive: false,
          yearId: year.id,
        },
      }),
    ]);

    return NextResponse.json({ periods: [p1, p2] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

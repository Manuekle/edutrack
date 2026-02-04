import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, reviewComment } = body;

    if (!status || !Object.values(BookingStatus).includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const booking = await db.roomBooking.update({
      where: { id },
      data: {
        status,
        reviewComment,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar reservación' }, { status: 500 });
  }
}

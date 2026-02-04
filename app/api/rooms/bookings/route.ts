import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  try {
    const where: any = {
      status: { in: [BookingStatus.APROBADO, BookingStatus.PENDIENTE] },
    };

    if (roomId) where.roomId = roomId;
    if (start && end) {
      where.startTime = { gte: new Date(start) };
      where.endTime = { lte: new Date(end) };
    }

    const bookings = await db.roomBooking.findMany({
      where,
      include: {
        room: true,
        teacher: {
          select: { name: true, correoInstitucional: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener reservaciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ error: 'Solo docentes pueden agendar salas' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { roomId, startTime, endTime, reason, signatureData } = body;

    if (!roomId || !startTime || !endTime || !reason || !signatureData) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verificar traslape de horarios
    const overlap = await db.roomBooking.findFirst({
      where: {
        roomId,
        status: BookingStatus.APROBADO,
        OR: [
          {
            startTime: { lt: new Date(endTime) },
            endTime: { gt: new Date(startTime) },
          },
        ],
      },
    });

    if (overlap) {
      return NextResponse.json(
        { error: 'El horario seleccionado ya está ocupado' },
        { status: 400 }
      );
    }

    const booking = await db.roomBooking.create({
      data: {
        roomId,
        teacherId: session.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reason,
        signatureUrl: signatureData, // Guardamos el base64 por ahora
        status: BookingStatus.PENDIENTE,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Error al crear la solicitud' }, { status: 500 });
  }
}

// @ts-nocheck
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// BookingStatus enum values (model no longer in schema, kept for backward compatibility)
const BookingStatus = { APROBADO: 'APROBADO', PENDIENTE: 'PENDIENTE' } as const;

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

    // Fetchear clases regulares para bloquear la disponibilidad visual
    let classWhere: any = {
      startTime: { not: null },
      endTime: { not: null },
      status: { not: 'CANCELADA' },
      AND: [{ classroom: { not: null } }, { classroom: { not: 'Por asignar' } }],
    };

    if (start && end) {
      classWhere.startTime = { gte: new Date(start) };
      classWhere.endTime = { lte: new Date(end) };
    }

    if (roomId) {
      const room = await db.room.findUnique({ where: { id: roomId } });
      if (room) {
        classWhere.classroom = room.name;
      } else {
        classWhere.classroom = 'INVALID_ROOM_NAME'; // Para que no retorne nada
      }
    }

    const classes = await db.class.findMany({
      where: classWhere,
      include: {
        subject: {
          include: {
            teachers: {
              select: { name: true, correoInstitucional: true },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Mapear clases para que el frontend las entienda como "RoomBookings aprobados"
    const mappedClasses = await Promise.all(
      classes.map(async cls => {
        // Necesitamos el "room" object simulado. Si tenemos el classroom, buscamos la sala real o creamos una simulada.
        return {
          id: `class-${cls.id}`,
          roomId: 'simulated-room-id',
          teacherId: 'simulated-teacher-id',
          startTime: cls.startTime,
          endTime: cls.endTime,
          reason: `Clase Regular: ${cls.subject.name} - Grp. ${cls.subject.group || 'A'}`,
          status: 'APROBADO',
          signatureUrl: null,
          reviewComment: null,
          reviewedAt: null,
          createdAt: cls.createdAt,
          updatedAt: cls.updatedAt,
          room: {
            id: 'simulated-room-id',
            name: cls.classroom,
            type: 'SALON',
            capacity: null,
            description: null,
            isActive: true,
          },
          teacher: {
            name:
              cls.subject.teachers.length > 0
                ? cls.subject.teachers.map(t => t.name).join(', ')
                : 'Docente Asignado',
            correoInstitucional: cls.subject.teachers[0]?.correoInstitucional || '',
          },
          isClass: true, // flag para el frontend si lo necesita
        };
      })
    );

    // Combinar y ordenar por fecha de inicio
    const combinedData = [...bookings, ...mappedClasses].sort(
      (a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return NextResponse.json(combinedData);
  } catch (error) {
    console.error('Error fetching calendar elements:', error);
    return NextResponse.json({ error: 'Error al obtener reservaciones y clases' }, { status: 500 });
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
        status: { in: [BookingStatus.APROBADO, BookingStatus.PENDIENTE] },
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
        { error: 'El horario seleccionado ya está ocupado por otra solicitud' },
        { status: 400 }
      );
    }

    // Identificar el nombre del salón para cruzarlo con el modelo de clases
    const room = await db.room.findUnique({ where: { id: roomId } });
    if (room) {
      const classOverlap = await db.class.findFirst({
        where: {
          classroom: room.name,
          status: { not: 'CANCELADA' },
          OR: [
            {
              startTime: { lt: new Date(endTime) },
              endTime: { gt: new Date(startTime) },
            },
          ],
        },
        include: {
          subject: true,
        },
      });

      if (classOverlap) {
        return NextResponse.json(
          {
            error: `El horario seleccionado ya está ocupado por la clase regular: ${classOverlap.subject.name}`,
          },
          { status: 400 }
        );
      }
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

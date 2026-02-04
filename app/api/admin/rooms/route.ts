import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { RoomType } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCENTE')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const rooms = await db.room.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener salas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, capacity, description } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Nombre y tipo son requeridos' }, { status: 400 });
    }

    if (!Object.values(RoomType).includes(type)) {
      return NextResponse.json({ error: 'Tipo de sala inválido' }, { status: 400 });
    }

    const room = await db.room.create({
      data: {
        name,
        type,
        capacity: capacity ? parseInt(capacity) : null,
        description,
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear sala' }, { status: 500 });
  }
}

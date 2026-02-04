import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { RoomType } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, type, capacity, description } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Nombre y tipo son requeridos' }, { status: 400 });
    }

    if (!Object.values(RoomType).includes(type)) {
      return NextResponse.json({ error: 'Tipo de sala inválido' }, { status: 400 });
    }

    const room = await db.room.update({
      where: { id },
      data: {
        name,
        type,
        capacity: capacity ? parseInt(capacity) : null,
        description,
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar sala' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Usamos borrado lógico para mantener integridad referencial
    await db.room.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar sala' }, { status: 500 });
  }
}

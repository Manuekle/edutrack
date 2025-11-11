import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { EstudianteHistorialArraySchema } from './schema';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado', data: [] }, { status: 401 });
    }
    if (session.user.role !== Role.ESTUDIANTE) {
      return NextResponse.json({ message: 'Prohibido', data: [] }, { status: 403 });
    }
    const userId = session.user.id;
    const attendances = await db.attendance.findMany({
      where: { studentId: userId },
      include: {
        class: {
          select: {
            id: true,
            date: true,
            topic: true,
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });
    const validated = EstudianteHistorialArraySchema.safeParse(attendances);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validated.error.issues,
          data: [],
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      data: validated.data,
      message: 'Historial obtenido correctamente',
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor', data: [] }, { status: 500 });
  }
}

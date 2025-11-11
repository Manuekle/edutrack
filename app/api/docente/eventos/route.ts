import { authOptions } from '@/lib/auth';
import { clearSubjectCache } from '@/lib/cache';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/docente/eventos?subjectId=... - Obtener todos los eventos de una asignatura

import { DocenteEventosQuerySchema } from './schema';

// Limpieza de parámetros: null, 'null', '' => undefined
function clean(val: string | null): string | undefined {
  if (val === null || val === '' || val === 'null') {
    return undefined;
  }
  return val;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  try {
    const query = DocenteEventosQuerySchema.safeParse({
      subjectId: clean(searchParams.get('subjectId')),
      sortBy: clean(searchParams.get('sortBy')),
      sortOrder: clean(searchParams.get('sortOrder')),
    });

    if (!query.success) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: query.error.issues },
        { status: 400 }
      );
    }

    const { subjectId, sortBy, sortOrder } = query.data;

    const subject = await db.subject.findFirst({
      where: {
        id: subjectId,
        teacherId: session.user.id,
      },
    });

    if (!subject) {
      return NextResponse.json(
        { message: 'Asignatura no encontrada o no tienes permiso' },
        { status: 404 }
      );
    }

    const events = await db.subjectEvent.findMany({
      where: { subjectId },
      orderBy: { [sortBy]: sortOrder },
    });

    return NextResponse.json({
      data: events,
      message: 'Eventos obtenidos correctamente',
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/docente/eventos - Crear un nuevo evento
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { title, description, date, type, subjectId } = await request.json();

    if (!title || !date || !type || !subjectId) {
      return NextResponse.json(
        {
          error: 'Todos los campos son requeridos: título, fecha, tipo y asignatura',
        },
        { status: 400 }
      );
    }

    // Verificar que el docente es el profesor de la asignatura
    const subject = await db.subject.findFirst({
      where: {
        id: subjectId,
        teacherId: session.user.id,
      },
    });

    if (!subject) {
      return NextResponse.json(
        {
          error: 'Asignatura no encontrada o no tienes permiso para añadir eventos',
        },
        { status: 404 }
      );
    }

    // Normalizar la fecha a medianoche (00:00:00) para que el evento se muestre todo el día
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    const newEvent = await db.subjectEvent.create({
      data: {
        title,
        description,
        date: eventDate,
        type,
        subject: { connect: { id: subjectId } },
        createdBy: { connect: { id: session.user.id } },
      },
    });

    // CACHE: Invalidate cache for this subject (affects students and teacher)
    await clearSubjectCache(subjectId);

    return NextResponse.json(
      { data: newEvent, message: 'Evento creado correctamente' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear el evento' }, { status: 500 });
  }
}

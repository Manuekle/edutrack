import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

import { DocenteEventoDetailSchema, DocenteEventoUpdateSchema } from './schema';

// GET /api/docente/eventos/[id] - Obtener un evento específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const eventId = params.id;
  if (!session || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    const event = await db.subjectEvent.findFirst({
      where: {
        id: eventId,
        subject: { teacherId: session.user.id },
      },
    });
    if (!event) {
      return NextResponse.json(
        { message: 'Evento no encontrado o no tienes permiso' },
        { status: 404 }
      );
    }
    const validated = DocenteEventoDetailSchema.safeParse(event);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validated.error.errors,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: validated.data });
  } catch (error) {
    return NextResponse.json({ message: 'Error al obtener el evento' }, { status: 500 });
  }
}

// PUT /api/docente/eventos/[id] - Actualizar un evento
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const eventId = params.id;
  if (!session || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const parsed = DocenteEventoUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: parsed.error.errors },
        { status: 400 }
      );
    }
    // Verificar que el evento existe y pertenece a una asignatura del docente
    const existingEvent = await db.subjectEvent.findFirst({
      where: {
        id: eventId,
        subject: { teacherId: session.user.id },
      },
    });
    if (!existingEvent) {
      return NextResponse.json(
        {
          message: 'Evento no encontrado o no tienes permiso para modificarlo',
        },
        { status: 404 }
      );
    }
    const updatedEvent = await db.subjectEvent.update({
      where: { id: eventId },
      data: parsed.data,
    });
    const validated = DocenteEventoDetailSchema.safeParse(updatedEvent);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validated.error.errors,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      data: validated.data,
      message: 'Evento actualizado correctamente',
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error al actualizar el evento' }, { status: 500 });
  }
}

// DELETE /api/docente/eventos/[id] - Eliminar un evento
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const eventId = params.id;
  if (!session || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    // Verificar que el evento existe y pertenece a una asignatura del docente
    const existingEvent = await db.subjectEvent.findFirst({
      where: {
        id: eventId,
        subject: { teacherId: session.user.id },
      },
    });
    if (!existingEvent) {
      return NextResponse.json(
        { message: 'Evento no encontrado o no tienes permiso para eliminarlo' },
        { status: 404 }
      );
    }
    const deleted = await db.subjectEvent.delete({ where: { id: eventId } });
    const validated = DocenteEventoDetailSchema.safeParse(deleted);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Evento eliminado, pero error de validación en la respuesta',
          errors: validated.error.errors,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { data: validated.data, message: 'Evento eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Error al eliminar el evento' }, { status: 500 });
  }
}

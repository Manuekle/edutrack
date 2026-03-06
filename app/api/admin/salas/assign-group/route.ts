import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { roomId, groupName, periodoAcademico } = await request.json();

    if (!roomId || !groupName) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    }

    // Actualizar todas las asignaturas que pertenecen a este grupo
    // Si se provee periodoAcademico, se filtra por él también
    const subjectFilter: any = { group: groupName };
    if (periodoAcademico) {
      subjectFilter.periodoAcademico = periodoAcademico;
    }

    const subjects = await db.subject.findMany({
      where: subjectFilter,
      select: { id: true },
    });

    if (subjects.length === 0) {
      return NextResponse.json({ error: 'No se encontraron asignaturas para este grupo' }, { status: 404 });
    }

    const subjectIds = subjects.map(s => s.id);

    // Ejecutar actualizaciones en transacción
    await db.$transaction([
      // 1. Actualizar el salón predeterminado en la asignatura
      db.subject.updateMany({
        where: { id: { in: subjectIds } },
        data: { classroom: room.name },
      }),
      // 2. Actualizar el salón en todas las clases programadas (futuras o todas?)
      // Por simplicidad y según el requerimiento "asignar sala a grupo", actualizamos todas las clases
      // de esas asignaturas que no hayan pasado o simplemente todas.
      // Generalmente se prefiere actualizar las PROGRAMADAS.
      db.class.updateMany({
        where: { 
          subjectId: { in: subjectIds },
          status: 'PROGRAMADA' 
        },
        data: { classroom: room.name },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Sala ${room.name} asignada exitosamente al grupo ${groupName}`,
      affectedSubjects: subjectIds.length,
    });

  } catch (error) {
    console.error('Error assigning room to group:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

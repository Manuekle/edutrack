import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ grupoId: string; claseId: string }> }
) {
  const { grupoId, claseId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'DOCENTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const clase = await db.class.findUnique({
      where: { id: claseId },
      include: {
        grupo: {
          select: { id: true, codigo: true, subject: { select: { name: true, code: true } } },
        },
        semana: { select: { numero: true } },
        bitacora: true,
        attendances: {
          include: { student: { select: { id: true, name: true } } },
        },
      },
    });
    if (!clase) return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });

    // Get all students in grupo if no attendance records exist
    const grupo = await db.grupo.findUnique({
      where: { id: grupoId },
      select: {
        estudianteIds: true,
        estudiantes: { select: { id: true, name: true } },
      },
    });

    const existingAttendanceIds = clase.attendances.map(a => a.studentId);
    const allStudents = grupo?.estudiantes ?? [];

    const asistencias = allStudents.map(student => {
      const existing = clase.attendances.find(a => a.studentId === student.id);
      return {
        id: existing?.id ?? null,
        studentId: student.id,
        studentName: student.name ?? 'Sin nombre',
        status: existing?.status ?? 'AUSENTE',
      };
    });

    return NextResponse.json({ ...clase, asistencias });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ grupoId: string; claseId: string }> }
) {
  const { claseId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'DOCENTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await req.json();
    const {
      temaPlaneado,
      temaEjecutado,
      actividades,
      observaciones,
      estadoClase,
      motivoCancelacion,
      asistencias,
      fecha, // New: allow changing the date
    } = body;

    // Update class status and date
    const updateData: any = {
      status: estadoClase,
      cancellationReason: motivoCancelacion ?? null,
    };

    if (fecha) {
      updateData.date = new Date(fecha);
    }

    await db.class.update({
      where: { id: claseId },
      data: updateData,
    });

    // Upsert bitacora - Always update temaPlaneado if provided
    const existingBitacora = await db.bitacora.findUnique({ where: { classId: claseId } });
    if (existingBitacora) {
      await db.bitacora.update({
        where: { classId: claseId },
        data: {
          temaPlaneado: temaPlaneado ?? existingBitacora.temaPlaneado,
          temaEjecutado: temaEjecutado ?? existingBitacora.temaEjecutado,
          actividades: actividades ?? existingBitacora.actividades,
          observaciones: observaciones ?? existingBitacora.observaciones,
        },
      });
    } else {
      await db.bitacora.create({
        data: {
          classId: claseId,
          temaPlaneado: temaPlaneado ?? '',
          temaEjecutado: temaEjecutado ?? '',
          actividades: actividades ?? '',
          observaciones: observaciones ?? '',
        },
      });
    }

    // Upsert attendance records
    if (asistencias && Array.isArray(asistencias)) {
      for (const a of asistencias) {
        const existing = await db.attendance.findFirst({
          where: { classId: claseId, studentId: a.studentId },
        });
        if (existing) {
          await db.attendance.update({
            where: { id: existing.id },
            data: { status: a.status },
          });
        } else {
          await db.attendance.create({
            data: { classId: claseId, studentId: a.studentId, status: a.status },
          });
        }
      }

      // Update class attendance metrics
      const counts = (asistencias as { status: string }[]).reduce(
        (acc, a) => {
          if (a.status === 'PRESENTE') acc.presente++;
          else if (a.status === 'AUSENTE') acc.ausente++;
          else if (a.status === 'TARDANZA') acc.tardanza++;
          else if (a.status === 'JUSTIFICADO') acc.justificado++;
          return acc;
        },
        { presente: 0, ausente: 0, tardanza: 0, justificado: 0 }
      );

      await db.class.update({
        where: { id: claseId },
        data: {
          totalStudents: asistencias.length,
          presentCount: counts.presente,
          absentCount: counts.ausente,
          lateCount: counts.tardanza,
          justifiedCount: counts.justificado,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

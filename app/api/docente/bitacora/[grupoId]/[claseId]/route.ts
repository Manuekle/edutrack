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
        group: {
          select: { id: true, code: true, subject: { select: { name: true, code: true } } },
        },
        week: { select: { number: true } },
        logbook: true,
        attendances: {
          include: { student: { select: { id: true, name: true } } },
        },
      },
    });
    if (!clase) return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });

    // Get all students in group if no attendance records exist
    const group = await db.group.findUnique({
      where: { id: grupoId },
      select: {
        studentIds: true,
        students: { select: { id: true, name: true } },
      },
    });

    const existingAttendanceIds = clase.attendances.map(a => a.studentId);
    const allStudents = group?.students ?? [];

    const asistencias = allStudents.map(student => {
      const existing = clase.attendances.find(a => a.studentId === student.id);
      return {
        id: existing?.id ?? null,
        studentId: student.id,
        studentName: student.name ?? 'Sin nombre',
        status: existing?.status ?? 'ABSENT',
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
      plannedTopic,
      executedTopic,
      activities,
      observations,
      classStatus, // 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
      cancellationReason,
      asistencias,
      fecha, // ISO string
      horaInicio, // "HH:MM"
      horaFin, // "HH:MM"
    } = body;

    // 1. Fetch current class data to have a base date
    const currentClass = await db.class.findUnique({ where: { id: claseId } });
    if (!currentClass) return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });

    // 2. Prepare class update data
    const updateData: any = {
      status: classStatus || 'SCHEDULED',
      cancellationReason: cancellationReason ?? null,
      topic: executedTopic || plannedTopic || currentClass.topic, // Sync Class.topic with logbook
    };

    // 3. Handle Date and Time updates
    const baseDate = fecha ? new Date(fecha) : new Date(currentClass.date);
    updateData.date = baseDate;

    if (horaInicio) {
      const [h, m] = horaInicio.split(':').map(Number);
      const start = new Date(baseDate);
      start.setUTCHours(h, m, 0, 0);
      updateData.startTime = start;
    }

    if (horaFin) {
      const [h, m] = horaFin.split(':').map(Number);
      const end = new Date(baseDate);
      end.setUTCHours(h, m, 0, 0);
      updateData.endTime = end;
    }

    await db.class.update({
      where: { id: claseId },
      data: updateData,
    });

    // Upsert logbook - Always update plannedTopic if provided
    const existingLogbook = await db.logbook.findUnique({ where: { classId: claseId } });
    if (existingLogbook) {
      await db.logbook.update({
        where: { classId: claseId },
        data: {
          plannedTopic: plannedTopic ?? existingLogbook.plannedTopic,
          executedTopic: executedTopic ?? existingLogbook.executedTopic,
          activities: activities ?? existingLogbook.activities,
          observations: observations ?? existingLogbook.observations,
        },
      });
    } else {
      await db.logbook.create({
        data: {
          classId: claseId,
          plannedTopic: plannedTopic ?? '',
          executedTopic: executedTopic ?? '',
          activities: activities ?? '',
          observations: observations ?? '',
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
          if (a.status === 'PRESENT') acc.presente++;
          else if (a.status === 'ABSENT') acc.ausente++;
          else if (a.status === 'LATE') acc.tardanza++;
          else if (a.status === 'JUSTIFIED') acc.justificado++;
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

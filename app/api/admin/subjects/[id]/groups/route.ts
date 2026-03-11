import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Jornada } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface GroupScheduleRow {
  codigo: string;
  grupo: string;
  jornada: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  salon: string;
}

/** Detecta delimitador: tab si la línea tiene tab, si no coma/punto y coma */
function detectDelimiter(line: string): RegExp {
  if (line.includes('\t')) return /\t/;
  return /[,;]/;
}

interface ScheduleEntry {
  dia: string;
  horaInicio: string;
  horaFin: string;
  salon: string;
}

interface GroupData {
  group: string;
  jornada: Jornada;
  schedule: ScheduleEntry[];
}

interface PreviewResult {
  grupo: string;
  jornada: string;
  status: 'success' | 'error' | 'existing';
  message: string;
  schedule?: ScheduleEntry[];
}

const normalizeJornada = (value: string): Jornada | null => {
  const normalized = value.toUpperCase().trim();
  if (normalized.includes('DIURNO')) return 'DIURNO';
  if (normalized.includes('NOCTURNO')) return 'NOCTURNO';
  return null;
};

const DAY_MAP: Record<string, string> = {
  lunes: 'LUNES',
  martes: 'MARTES',
  miércoles: 'MIERCOLES',
  miercoles: 'MIERCOLES',
  jueves: 'JUEVES',
  viernes: 'VIERNES',
  sábado: 'SABADO',
  sabado: 'SABADO',
  domingo: 'DOMINGO',
};

const normalizeDay = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  return DAY_MAP[normalized] || normalized.toUpperCase();
};

/** Convierte "HH:MM" a minutos desde medianoche */
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** True si los rangos [s1,e1) y [s2,e2) se solapan */
const rangesOverlap = (s1: number, e1: number, s2: number, e2: number): boolean =>
  s1 < e2 && s2 < e1;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: subjectId } = await params;

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json({ error: 'Asignatura no encontrada' }, { status: 404 });
    }

    const url = new URL(request.url, `https://${request.headers.get('host')}`);
    const isPreview = url.searchParams.get('preview') === 'true';

    const formData = await request.formData();
    const file = formData.get('file') as File;
    // Campos adicionales del formulario manual
    const docenteId = formData.get('docenteId') as string | null;
    const periodoAcademico = formData.get('periodoAcademico') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 });
    }

    const delimiter = detectDelimiter(lines[0]);
    const headers = lines[0]
      .toLowerCase()
      .split(delimiter)
      .map(h => h.trim());
    const codigoIdx = headers.findIndex(
      h =>
        h.includes('codigo') ||
        h.includes('código') ||
        h.includes('code') ||
        h.includes('asignatura')
    );
    const grupoIdx = headers.findIndex(h => h.includes('grupo'));
    const jornadaIdx = headers.findIndex(h => h.includes('jornada') || h.includes('turno'));
    const diaIdx = headers.findIndex(
      h => h.includes('dia') || h.includes('día') || h.includes('day')
    );
    const inicioIdx = headers.findIndex(h => h.includes('inicio') || h.includes('hora'));
    const finIdx = headers.findIndex(h => h.includes('fin'));
    const salonIdx = headers.findIndex(
      h => h.includes('salon') || h.includes('sala') || h.includes('aula')
    );

    const subjectCodeNormalized = subject.code.trim().toUpperCase();

    const rawRows: GroupScheduleRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim());
      if (cols.some(v => v)) {
        const codigo = codigoIdx !== -1 ? (cols[codigoIdx] ?? '') : '';
        rawRows.push({
          codigo,
          grupo: grupoIdx !== -1 ? cols[grupoIdx] : 'A',
          jornada: jornadaIdx !== -1 ? cols[jornadaIdx] : 'DIURNO',
          dia: diaIdx !== -1 ? cols[diaIdx] : '',
          horaInicio: inicioIdx !== -1 ? cols[inicioIdx] : '',
          horaFin: finIdx !== -1 ? cols[finIdx] : '',
          salon: salonIdx !== -1 ? cols[salonIdx] : '',
        });
      }
    }

    // Si el archivo trae codigo_asignatura, solo procesar filas de la asignatura seleccionada
    const rowsToProcess =
      codigoIdx !== -1
        ? rawRows.filter(row => row.codigo.trim().toUpperCase() === subjectCodeNormalized)
        : rawRows;

    const groupsMap = new Map<string, GroupData>();

    // Grupos que ya existen para este código (misma materia, otro grupo ya creado)
    const existingSubjectsWithCode = await db.subject.findMany({
      where: { code: subject.code },
      select: { group: true },
    });
    const existingGroups = new Set(
      existingSubjectsWithCode.map(s => s.group).filter((g): g is string => g != null)
    );

    for (const row of rowsToProcess) {
      const group = row.grupo?.trim() || 'A';
      const jornada = normalizeJornada(row.jornada) || 'DIURNO';
      const key = `${group}-${jornada}`;

      if (!jornada) {
        continue;
      }

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          group,
          jornada,
          schedule: [],
        });
      }

      if (row.dia && row.horaInicio && row.horaFin) {
        groupsMap.get(key)!.schedule.push({
          dia: normalizeDay(row.dia),
          horaInicio: row.horaInicio,
          horaFin: row.horaFin,
          salon: row.salon || subject.classroom || 'Por asignar',
        });
      }
    }

    // ──────────────────────────────────────────────
    // VALIDACIONES DE CHOQUE (antes del preview/confirm)
    // ──────────────────────────────────────────────
    const conflictErrors: string[] = [];

    for (const [, data] of groupsMap.entries()) {
      for (const slot of data.schedule) {
        const newStart = timeToMinutes(slot.horaInicio);
        const newEnd = timeToMinutes(slot.horaFin);
        const dia = slot.dia;

        // Buscar clases existentes el mismo día (por classroom o por docente)
        const existingClasses = await db.class.findMany({
          where: {
            ...(slot.salon && slot.salon !== 'Por asignar' ? { classroom: slot.salon } : {}),
            startTime: { not: null },
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            classroom: true,
            subjectId: true,
            subject: {
              select: {
                group: true,
                teacherIds: true,
                name: true,
                code: true,
              },
            },
          },
        });

        for (const cls of existingClasses) {
          if (!cls.startTime || !cls.endTime) continue;

          // Verificar que sea el mismo día de la semana
          const clsDayOfWeek = cls.startTime
            .toLocaleDateString('es-CO', { weekday: 'long' })
            .toUpperCase();
          const clsDayNormalized = normalizeDay(clsDayOfWeek);
          if (clsDayNormalized !== dia) continue;

          const clsStart = cls.startTime.getHours() * 60 + cls.startTime.getMinutes();
          const clsEnd = cls.endTime.getHours() * 60 + cls.endTime.getMinutes();

          if (!rangesOverlap(newStart, newEnd, clsStart, clsEnd)) continue;

          // Choque de salón
          if (slot.salon && slot.salon !== 'Por asignar' && cls.classroom === slot.salon) {
            conflictErrors.push(
              `⚠️ Choque de salón: "${slot.salon}" ya está ocupado el ${dia} de ${slot.horaInicio} a ${slot.horaFin} por "${cls.subject.code}".`
            );
          }

          // Choque de docente
          if (
            docenteId &&
            cls.subject.teacherIds.includes(docenteId) &&
            cls.subjectId !== subjectId
          ) {
            conflictErrors.push(
              `⚠️ Choque de docente: el docente ya tiene clase el ${dia} de ${slot.horaInicio} a ${slot.horaFin} en "${cls.subject.code} - ${cls.subject.name}".`
            );
          }

          // Choque de grupo
          if (cls.subject.group === data.group && cls.subjectId !== subjectId) {
            conflictErrors.push(
              `⚠️ Choque de grupo: el grupo "${data.group}" ya tiene clase el ${dia} de ${slot.horaInicio} a ${slot.horaFin} en "${cls.subject.code}".`
            );
          }
        }

        // Buscar reservas eventuales (RoomBooking) aprobadas para el salón asignado
        if (slot.salon && slot.salon !== 'Por asignar') {
          const existingBookings = await db.roomBooking.findMany({
            where: {
              status: 'APROBADO',
              room: { name: slot.salon },
            },
            include: {
              room: true,
              teacher: { select: { name: true } },
            },
          });

          for (const booking of existingBookings) {
            const bDayOfWeek = booking.startTime
              .toLocaleDateString('es-CO', { weekday: 'long' })
              .toUpperCase();
            const bDayNormalized = normalizeDay(bDayOfWeek);
            if (bDayNormalized !== dia) continue;

            const bStart = booking.startTime.getHours() * 60 + booking.startTime.getMinutes();
            const bEnd = booking.endTime.getHours() * 60 + booking.endTime.getMinutes();

            if (!rangesOverlap(newStart, newEnd, bStart, bEnd)) continue;

            conflictErrors.push(
              `⚠️ Choque con reserva puntual: El salón "${slot.salon}" ya tiene una reserva el ${booking.startTime.toLocaleDateString('es-CO')} de ${booking.startTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} a ${booking.endTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} por ${booking.teacher.name}.`
            );
          }
        }
      }
    }

    // Si hay conflictos graves, abortamos (en preview los mostramos como advertencia)
    const results: PreviewResult[] = [];
    for (const [, data] of groupsMap.entries()) {
      results.push({
        grupo: data.group,
        jornada: data.jornada,
        status: existingGroups.has(data.group) ? 'existing' : 'success',
        message: existingGroups.has(data.group)
          ? 'Grupo ya existe, se agregarán horarios'
          : 'Grupo válido para crear',
        schedule: data.schedule,
      });
    }

    if (isPreview) {
      return NextResponse.json({
        success: true,
        previewData: results,
        subjectName: subject.name,
        subjectCode: subject.code,
        conflicts: conflictErrors,
      });
    }

    // En confirmación, si hay conflictos, rechazamos
    if (conflictErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Se detectaron conflictos de horario. Corrígelos antes de confirmar.',
          conflicts: conflictErrors,
        },
        { status: 422 }
      );
    }

    const created: string[] = [];
    const errors: string[] = [];

    await db.$transaction(async tx => {
      for (const [, data] of groupsMap.entries()) {
        // Buscar o crear la asignatura para esta combinación (code, group)
        // Así la misma materia puede tener varios grupos (Gr. A, Gr. B, etc.)
        let targetSubject = await tx.subject.findUnique({
          where: {
            code_group: {
              code: subject.code,
              group: data.group,
            },
          },
        });

        if (!targetSubject) {
          // Crear nueva asignatura: mismo código, otro grupo
          targetSubject = await tx.subject.create({
            data: {
              name: subject.name,
              code: subject.code,
              group: data.group,
              jornada: data.jornada,
              program: subject.program ?? undefined,
              semester: subject.semester ?? undefined,
              credits: subject.credits ?? undefined,
              directHours: subject.directHours ?? undefined,
              description: subject.description ?? undefined,
              periodoAcademico: periodoAcademico ?? subject.periodoAcademico ?? undefined,
              teacherIds: docenteId ? [docenteId] : [],
              studentIds: [],
            },
          });
          created.push(`Grupo ${data.group} - ${data.jornada}`);
        } else {
          // Actualizar asignatura existente: jornada, periodo, docente
          const updateData: Record<string, unknown> = {
            jornada: data.jornada,
            ...(periodoAcademico ? { periodoAcademico } : {}),
          };
          if (docenteId) {
            const currentTeacherIds: string[] = targetSubject.teacherIds || [];
            if (!currentTeacherIds.includes(docenteId)) {
              updateData.teacherIds = { set: [docenteId] };
            }
          }
          await tx.subject.update({
            where: { id: targetSubject.id },
            data: updateData,
          });
        }

        if (data.schedule && data.schedule.length > 0) {
          const today = new Date();
          const classesToCreate = [];

          for (let week = 0; week < 16; week++) {
            for (const slot of data.schedule) {
              const classDate = new Date(today);
              const dayIndex = [
                'DOMINGO',
                'LUNES',
                'MARTES',
                'MIERCOLES',
                'JUEVES',
                'VIERNES',
                'SABADO',
              ].indexOf(slot.dia);

              const currentDay = today.getDay();
              const diff = dayIndex - currentDay;
              classDate.setDate(today.getDate() + diff + week * 7);

              const [startH, startM] = slot.horaInicio.split(':').map(Number);
              const [endH, endM] = slot.horaFin.split(':').map(Number);

              const startTime = new Date(classDate);
              startTime.setHours(startH, startM, 0, 0);

              const endTime = new Date(classDate);
              endTime.setHours(endH, endM, 0, 0);

              classesToCreate.push({
                subjectId: targetSubject.id,
                date: classDate,
                startTime,
                endTime,
                classroom: slot.salon,
                jornada: data.jornada,
                status: 'PROGRAMADA' as const,
              });
            }
          }

          if (classesToCreate.length > 0) {
            await tx.class.createMany({
              data: classesToCreate,
            });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: groupsMap.size,
        created: created.length,
      },
      createdGroups: created,
      errors,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

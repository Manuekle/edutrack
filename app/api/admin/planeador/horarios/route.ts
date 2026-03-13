import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { DayOfWeek } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

interface HorarioPreview {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  periodicidad: string;
  subjectCode: string;
  periodoAcademico: string;
  salaNombre?: string;
  salaId?: string;
  status: 'success' | 'error';
  message: string;
}

const DIA_VALIDOS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;

const DIA_TO_DAYOFWEEK: Record<string, DayOfWeek> = {
  LUNES: DayOfWeek.MONDAY,
  MARTES: DayOfWeek.TUESDAY,
  MIERCOLES: DayOfWeek.WEDNESDAY,
  JUEVES: DayOfWeek.THURSDAY,
  VIERNES: DayOfWeek.FRIDAY,
  SABADO: DayOfWeek.SATURDAY,
  DOMINGO: DayOfWeek.SUNDAY,
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const subjectId = req.nextUrl.searchParams.get('subjectId') ?? undefined;

    const schedules = await db.schedule.findMany({
      where: subjectId ? { subjectId } : undefined,
      include: {
        _count: { select: { groups: true } },
        subject: { select: { id: true, name: true, code: true } },
        room: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return NextResponse.json({ horarios: schedules });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // Creación manual JSON (desde el modal o formulario)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      let subjectId: string | null = body.subjectId ?? null;
      let roomId: string | null = body.salaId ?? null;

      if (!subjectId && body.subjectCode) {
        const subject = await db.subject.findFirst({
          where: { code: body.subjectCode },
          select: { id: true },
        });
        subjectId = subject?.id ?? null;
      }
      if (!roomId && body.salaNombre) {
        const room = await db.room.findFirst({
          where: { name: body.salaNombre.trim(), isActive: true },
          select: { id: true },
        });
        roomId = room?.id ?? null;
      }

      const dayOfWeek = body.diaSemana ? DIA_TO_DAYOFWEEK[body.diaSemana as string] ?? DayOfWeek.MONDAY : DayOfWeek.MONDAY;

      const schedule = await db.schedule.create({
        data: {
          dayOfWeek,
          startTime: body.horaInicio,
          endTime: body.horaFin,
          subjectId: subjectId ?? undefined,
          roomId: roomId ?? undefined,
        },
      });
      // Si se envía código de asignatura y grupo, crear/actualizar Grupo también
      const subjectForGroup = subjectId
        ? { id: subjectId }
        : await db.subject.findFirst({
            where: { code: body.subjectCode },
            select: { id: true },
          });
      if (subjectForGroup && body.subjectCode && body.groupCode) {
        const periodo = body.periodoAcademico || '2025-1';
        const existingGroup = await db.group.findFirst({
          where: {
            code: body.groupCode,
            subjectId: subjectForGroup.id,
            academicPeriod: periodo,
          },
          select: { id: true },
        });
        if (existingGroup) {
          await db.group.update({
            where: { id: existingGroup.id },
            data: { scheduleId: schedule.id, ...(roomId && { roomId }) },
          });
        } else {
          await db.group.create({
            data: {
              code: body.groupCode,
              subjectId: subjectForGroup.id,
              academicPeriod: periodo,
              teacherIds: [],
              scheduleId: schedule.id,
              roomId: roomId ?? undefined,
            },
          });
        }
      }
      return NextResponse.json(schedule);
    }

    // Carga masiva CSV (multipart/form-data)
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'Error al leer los datos del formulario' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const isPreview = formData.get('preview') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);

    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json(
        { error: 'El archivo CSV tiene un formato inválido' },
        { status: 400 }
      );
    }

    const headers = parsed.meta.fields || [];

    const headerMap: Record<string, string[]> = {
      dia: ['dia', 'dia_semana', 'diaSemana', 'día'],
      horaInicio: ['hora_inicio', 'horaInicio', 'inicio'],
      horaFin: ['hora_fin', 'horaFin', 'fin'],
      periodicidad: ['periodicidad', 'frecuencia'],
      subjectCode: ['codigo_asignatura', 'codigo', 'code', 'subject_code'],
      periodo: ['periodo', 'periodo_academico', 'periodoAcademico'],
      sala: ['sala', 'sala_nombre', 'salaNombre', 'salon', 'room'],
    };

    const findHeader = (variants: string[]): string | undefined => {
      for (const variant of variants) {
        const normalized = variant.toLowerCase().replace(/\s+/g, '');
        const found = headers.find(h => h.toLowerCase().replace(/\s+/g, '') === normalized);
        if (found) return found;
      }
      return undefined;
    };

    const getValue = (row: Record<string, string>, header: string | undefined): string => {
      if (!header) return '';
      return row[header] || '';
    };

    const diaHeader = findHeader(headerMap.dia);
    const inicioHeader = findHeader(headerMap.horaInicio);
    const finHeader = findHeader(headerMap.horaFin);
    const perHeader = findHeader(headerMap.periodicidad);
    const subjectHeader = findHeader(headerMap.subjectCode);
    const periodoHeader = findHeader(headerMap.periodo);
    const salaHeader = findHeader(headerMap.sala);

    if (!diaHeader || !inicioHeader || !finHeader || !subjectHeader || !periodoHeader) {
      return NextResponse.json(
        {
          error:
            'El CSV debe incluir columnas para día, hora inicio, hora fin, código de asignatura y periodo académico',
        },
        { status: 400 }
      );
    }

    const existingSubjects = await db.subject.findMany({ select: { id: true, code: true } });
    const subjectByCode = new Map(existingSubjects.map(s => [s.code, s.id]));
    const existingRooms = await db.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    const roomByName = new Map(existingRooms.map(r => [r.name.trim().toLowerCase(), r]));

    const previews: HorarioPreview[] = [];

    for (const row of parsed.data) {
      const diaRaw = getValue(row, diaHeader).trim().toUpperCase();
      const horaInicio = getValue(row, inicioHeader).trim();
      const horaFin = getValue(row, finHeader).trim();
      const periodicidad = getValue(row, perHeader).trim().toUpperCase() || 'SEMANAL';
      const subjectCode = getValue(row, subjectHeader).trim();
      const periodoAcademico = getValue(row, periodoHeader).trim();
      const salaNombre = salaHeader ? getValue(row, salaHeader).trim() : '';

      if (!diaRaw || !horaInicio || !horaFin || !subjectCode || !periodoAcademico) {
        previews.push({
          diaSemana: diaRaw || 'N/A',
          horaInicio,
          horaFin,
          periodicidad,
          subjectCode,
          periodoAcademico,
          salaNombre: salaNombre || undefined,
          status: 'error',
          message: 'Faltan datos requeridos (día, horas, código de asignatura o periodo)',
        });
        continue;
      }

      const diaValido = DIA_VALIDOS.includes(diaRaw as (typeof DIA_VALIDOS)[number]);
      const horaRegex = /^\d{2}:\d{2}$/;

      if (!diaValido || !horaRegex.test(horaInicio) || !horaRegex.test(horaFin)) {
        previews.push({
          diaSemana: diaRaw,
          horaInicio,
          horaFin,
          periodicidad,
          subjectCode,
          periodoAcademico,
          salaNombre: salaNombre || undefined,
          status: 'error',
          message: 'Formato inválido en día u horas (use HH:MM y día válido)',
        });
        continue;
      }

      const subjectId = subjectByCode.get(subjectCode);
      if (!subjectId) {
        previews.push({
          diaSemana: diaRaw,
          horaInicio,
          horaFin,
          periodicidad,
          subjectCode,
          periodoAcademico,
          salaNombre: salaNombre || undefined,
          status: 'error',
          message: `Código de asignatura no existe: ${subjectCode}`,
        });
        continue;
      }

      let salaId: string | undefined;
      if (salaNombre) {
        const room = roomByName.get(salaNombre.toLowerCase());
        if (!room) {
          previews.push({
            diaSemana: diaRaw,
            horaInicio,
            horaFin,
            periodicidad,
            subjectCode,
            periodoAcademico,
            salaNombre,
            status: 'error',
            message: `Sala no encontrada: ${salaNombre}`,
          });
          continue;
        }
        salaId = room.id;
      }

      previews.push({
        diaSemana: diaRaw,
        horaInicio,
        horaFin,
        periodicidad: periodicidad === 'QUINCENAL' ? 'QUINCENAL' : 'SEMANAL',
        subjectCode,
        periodoAcademico,
        salaNombre: salaNombre || undefined,
        salaId,
        status: 'success',
        message: 'Válido',
      });
    }

    if (isPreview) {
      return NextResponse.json({ success: true, previewData: previews });
    }

    const validItems = previews.filter(p => p.status === 'success');

    if (validItems.length === 0) {
      return NextResponse.json({ error: 'No hay horarios válidos para crear' }, { status: 400 });
    }

    let createdHorarios = 0;
    let errors = 0;

    for (const item of validItems) {
      try {
        const subjectId = subjectByCode.get(item.subjectCode);
        if (!subjectId) {
          errors += 1;
          continue;
        }
        let roomId: string | undefined;
        if (item.salaNombre) {
          const room = roomByName.get(item.salaNombre.toLowerCase());
          roomId = room?.id;
        }

        const dayOfWeek = DIA_TO_DAYOFWEEK[item.diaSemana] ?? DayOfWeek.MONDAY;

        const existing = await db.schedule.findFirst({
          where: {
            dayOfWeek,
            startTime: item.horaInicio,
            endTime: item.horaFin,
            subjectId,
            ...(roomId && { roomId }),
          },
        });

        if (!existing) {
          await db.schedule.create({
            data: {
              dayOfWeek,
              startTime: item.horaInicio,
              endTime: item.horaFin,
              subjectId,
              roomId,
            },
          });
          createdHorarios += 1;
        }
      } catch {
        errors += 1;
      }
    }

    return NextResponse.json({
      success: true,
      summary: { total: previews.length, createdHorarios, errors },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

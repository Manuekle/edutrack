import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Jornada } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface GroupScheduleRow {
  grupo: string;
  jornada: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  salon: string;
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

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 });
    }

    const headers = lines[0]
      .toLowerCase()
      .split(/[,;]/)
      .map(h => h.trim());
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

    const rawRows: GroupScheduleRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,;]/).map(c => c.trim());
      if (cols.some(v => v)) {
        rawRows.push({
          grupo: grupoIdx !== -1 ? cols[grupoIdx] : 'A',
          jornada: jornadaIdx !== -1 ? cols[jornadaIdx] : 'DIURNO',
          dia: diaIdx !== -1 ? cols[diaIdx] : '',
          horaInicio: inicioIdx !== -1 ? cols[inicioIdx] : '',
          horaFin: finIdx !== -1 ? cols[finIdx] : '',
          salon: salonIdx !== -1 ? cols[salonIdx] : '',
        });
      }
    }

    const groupsMap = new Map<string, GroupData>();
    const existingGroups = new Set<string>();
    existingGroups.add(subject.group || 'A');

    for (const row of rawRows) {
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

    const results: PreviewResult[] = [];
    for (const [key, data] of groupsMap.entries()) {
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
      });
    }

    const created: string[] = [];
    const errors: string[] = [];

    await db.$transaction(async tx => {
      for (const [key, data] of groupsMap.entries()) {
        const existingGroup = subject.group === data.group;

        if (!existingGroup) {
          await tx.subject.update({
            where: { id: subjectId },
            data: {
              group: data.group,
              jornada: data.jornada,
            },
          });
          created.push(`Grupo ${data.group} - ${data.jornada}`);
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
                subjectId: subject.id,
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

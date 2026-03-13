import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

interface ProgramacionPreview {
  periodoAcademico: string;
  codigoAsignatura: string;
  nombreAsignatura: string;
  grupo: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  salon: string;
  status: 'success' | 'error' | 'warning';
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

// Normalize day names: remove accents and handle aliases
function normalizeDia(raw: string): string {
  const normalized = raw
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const aliases: Record<string, string> = {
    LUNES: 'LUNES',
    MARTES: 'MARTES',
    MIERCOLES: 'MIERCOLES',
    MIÉRCOLES: 'MIERCOLES',
    JUEVES: 'JUEVES',
    VIERNES: 'VIERNES',
    SABADO: 'SABADO',
    SÁBADO: 'SABADO',
    DOMINGO: 'DOMINGO',
  };
  return aliases[normalized] ?? normalized;
}

// Normalize time: "7:50" → "07:50", "14:40" stays
function normalizeTime(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Se espera multipart/form-data con un archivo CSV' },
        { status: 400 }
      );
    }

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

    // Flexible header mapping
    const headerMap: Record<string, string[]> = {
      periodo: ['periodo_academico', 'periodo', 'periodoAcademico', 'semestre'],
      codigo: ['codigo_asignatura', 'codigo', 'code', 'subject_code', 'codigoAsignatura'],
      grupo: ['grupo', 'group', 'codigo_grupo'],
      docente: ['docente', 'profesor', 'teacher', 'nombre_docente'],
      dia: ['dia', 'dia_semana', 'diaSemana', 'día', 'day'],
      horaInicio: ['hora_inicio', 'horaInicio', 'inicio', 'start'],
      horaFin: ['hora_fin', 'horaFin', 'fin', 'end'],
      salon: ['salon', 'sala', 'sala_nombre', 'salaNombre', 'room', 'aula'],
    };

    const findHeader = (variants: string[]): string | undefined => {
      for (const variant of variants) {
        const normalized = variant.toLowerCase().replace(/[\s_]+/g, '');
        const found = headers.find(h => h.toLowerCase().replace(/[\s_]+/g, '') === normalized);
        if (found) return found;
      }
      return undefined;
    };

    const getValue = (row: Record<string, string>, header: string | undefined): string => {
      if (!header) return '';
      return (row[header] || '').trim();
    };

    const periodoH = findHeader(headerMap.periodo);
    const codigoH = findHeader(headerMap.codigo);
    const grupoH = findHeader(headerMap.grupo);
    const diaH = findHeader(headerMap.dia);
    const inicioH = findHeader(headerMap.horaInicio);
    const finH = findHeader(headerMap.horaFin);
    const salonH = findHeader(headerMap.salon);

    if (!periodoH || !codigoH || !grupoH || !diaH || !inicioH || !finH) {
      return NextResponse.json(
        {
          error:
            'El CSV debe incluir columnas: periodo_academico, codigo_asignatura, grupo, dia, hora_inicio, hora_fin. Columnas encontradas: ' +
            headers.join(', '),
        },
        { status: 400 }
      );
    }

    // Pre-fetch all relevant data
    const existingSubjects = await db.subject.findMany({
      select: { id: true, code: true, name: true },
    });
    const subjectByCode = new Map(existingSubjects.map(s => [s.code, s]));

    const existingRooms = await db.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    const roomByName = new Map(
      existingRooms.map(r => [r.name.trim().toLowerCase(), r])
    );

    // Build previews
    const previews: ProgramacionPreview[] = [];

    for (const row of parsed.data) {
      const periodo = getValue(row, periodoH);
      const codigo = getValue(row, codigoH);
      const grupo = getValue(row, grupoH);
      const diaRaw = getValue(row, diaH);
      const horaInicio = normalizeTime(getValue(row, inicioH));
      const horaFin = normalizeTime(getValue(row, finH));
      const salon = salonH ? getValue(row, salonH) : '';

      const dia = normalizeDia(diaRaw);

      // Validate required fields
      if (!periodo || !codigo || !grupo || !dia || !horaInicio || !horaFin) {
        previews.push({
          periodoAcademico: periodo,
          codigoAsignatura: codigo,
          nombreAsignatura: '',
          grupo,
          dia: diaRaw,
          horaInicio,
          horaFin,
          salon,
          status: 'error',
          message: 'Faltan datos requeridos (periodo, código, grupo, día, horas)',
        });
        continue;
      }

      // Validate day
      if (!DIA_VALIDOS.includes(dia as (typeof DIA_VALIDOS)[number])) {
        previews.push({
          periodoAcademico: periodo,
          codigoAsignatura: codigo,
          nombreAsignatura: '',
          grupo,
          dia: diaRaw,
          horaInicio,
          horaFin,
          salon,
          status: 'error',
          message: `Día inválido: "${diaRaw}". Use LUNES, MARTES, etc.`,
        });
        continue;
      }

      // Validate time format
      const horaRegex = /^\d{2}:\d{2}$/;
      if (!horaRegex.test(horaInicio) || !horaRegex.test(horaFin)) {
        previews.push({
          periodoAcademico: periodo,
          codigoAsignatura: codigo,
          nombreAsignatura: '',
          grupo,
          dia: diaRaw,
          horaInicio,
          horaFin,
          salon,
          status: 'error',
          message: 'Formato de hora inválido. Use HH:MM (ej: 07:00)',
        });
        continue;
      }

      // Validate subject
      const subject = subjectByCode.get(codigo);
      if (!subject) {
        previews.push({
          periodoAcademico: periodo,
          codigoAsignatura: codigo,
          nombreAsignatura: '',
          grupo,
          dia,
          horaInicio,
          horaFin,
          salon,
          status: 'error',
          message: `Asignatura no encontrada: ${codigo}`,
        });
        continue;
      }

      // Validate room (optional)
      let roomWarning = '';
      if (salon && salon.toUpperCase() !== 'S/A') {
        const room = roomByName.get(salon.toLowerCase());
        if (!room) {
          roomWarning = ` (Sala "${salon}" no encontrada, se creará vacía)`;
        }
      }

      const hasWarnings = roomWarning !== '';

      previews.push({
        periodoAcademico: periodo,
        codigoAsignatura: codigo,
        nombreAsignatura: subject.name,
        grupo,
        dia,
        horaInicio,
        horaFin,
        salon: salon || 'S/A',
        status: hasWarnings ? 'warning' : 'success',
        message: hasWarnings
          ? `Advertencias:${roomWarning}`
          : 'Válido',
      });
    }

    // Preview mode: just return the previews
    if (isPreview) {
      return NextResponse.json({ success: true, previewData: previews });
    }

    // Confirm mode: create all entities (including warnings)
    const validItems = previews.filter(p => p.status === 'success' || p.status === 'warning');

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'No hay filas válidas para procesar' },
        { status: 400 }
      );
    }

    let createdHorarios = 0;
    let createdGrupos = 0;
    let updatedGrupos = 0;
    let errors = 0;

    for (const item of validItems) {
      try {
        const subject = subjectByCode.get(item.codigoAsignatura);
        if (!subject) {
          errors++;
          continue;
        }

        // 1. Find or create Horario
        let salaId: string | undefined;
        if (item.salon && item.salon.toUpperCase() !== 'S/A') {
          const room = roomByName.get(item.salon.toLowerCase());
          salaId = room?.id;
        }

        let horario = await db.horario.findFirst({
          where: {
            diaSemana: item.dia as typeof DIA_VALIDOS[number],
            horaInicio: item.horaInicio,
            horaFin: item.horaFin,
            subjectId: subject.id,
          },
        });

        if (!horario) {
          horario = await db.horario.create({
            data: {
              diaSemana: item.dia as typeof DIA_VALIDOS[number],
              horaInicio: item.horaInicio,
              horaFin: item.horaFin,
              periodicidad: 'SEMANAL',
              subjectId: subject.id,
              salaId,
            },
          });
          createdHorarios++;
        }

        // 2. Find or create Grupo
        const existingGrupo = await db.grupo.findFirst({
          where: {
            codigo: item.grupo,
            subjectId: subject.id,
            periodoAcademico: item.periodoAcademico,
          },
        });

        if (existingGrupo) {
          // Update: assign horario, sala
          const updateData: Record<string, unknown> = {
            horarioId: horario.id,
          };
          if (salaId) updateData.salaId = salaId;

          await db.grupo.update({
            where: { id: existingGrupo.id },
            data: updateData,
          });
          updatedGrupos++;
        } else {
          await db.grupo.create({
            data: {
              codigo: item.grupo,
              subjectId: subject.id,
              periodoAcademico: item.periodoAcademico,
              horarioId: horario.id,
              salaId: salaId ?? undefined,
            },
          });
          createdGrupos++;
        }
      } catch {
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: previews.length,
        createdHorarios,
        createdGrupos,
        updatedGrupos,
        errors,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

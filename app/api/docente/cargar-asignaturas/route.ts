// app/api/docente/cargar-asignaturas/route.ts
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Interface for the raw data from the API/Excel file
interface RowData {
  codigoAsignatura: string;
  nombreAsignatura: string;
  'fechaClase (MM/DD/YYYY)': string | number | Date;
  'horaInicio (HH:MM)': string | number;
  'horaFin (HH:MM)'?: string | number;
  temaClase?: string;
  descripcionClase?: string;
  creditosClase?: number;
  programa?: string;
  semestreAsignatura?: string;
}

// Interface for generator data format
interface GeneratorSubjectData {
  id: string;
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditosClase: number;
  programa: string;
  semestreAsignatura: number;
  classes: Array<{
    id: string;
    fechaClase: string; // YYYY-MM-DD
    horaInicio: string; // HH:MM
    horaFin: string; // HH:MM
    temaClase?: string;
    descripcionClase?: string;
  }>;
}

// Función para dividir cadenas de hora de manera segura
const safeSplitTime = (timeInput: string | number): [string, string] => {
  if (typeof timeInput === 'number') {
    // Excel guarda las horas como fracción del día (0.5 = 12:00 PM)
    const totalMinutes = Math.round(timeInput * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return [String(hours).padStart(2, '0'), String(minutes).padStart(2, '0')];
  }

  // Si es string, limpiar y parsear
  const timeStr = String(timeInput).trim();
  const [h, m] = timeStr.split(':');
  return [(h || '00').padStart(2, '0'), (m || '00').padStart(2, '0')];
};

// Utilidad para parsear fechas en diferentes formatos
const parseExcelDate = (dateInput: string | number | Date): Date => {
  if (dateInput instanceof Date) {
    return dateInput;
  }

  // Si es un número, es un serial de Excel
  if (typeof dateInput === 'number') {
    // Excel cuenta los días desde 1900-01-01, pero tiene un bug: considera 1900 como año bisiesto
    // Días desde 1900-01-01 hasta 1970-01-01: 25569
    const excelEpoch = 25569;
    const millisecondsPerDay = 86400000;
    const dateMs = (dateInput - excelEpoch) * millisecondsPerDay;
    const date = new Date(dateMs);

    // Ajustar por zona horaria para obtener la fecha local correcta
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(dateMs + offsetMs);
  }

  // Si es string, intentar parsear diferentes formatos
  const dateStr = String(dateInput).trim();

  // Formato YYYY-MM-DD (viene del generador)
  const isoFormat = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoFormat) {
    const [, year, month, day] = isoFormat;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Formato MM/DD/YYYY
  const usFormat = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usFormat) {
    const [, month, day, year] = usFormat;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Formato DD/MM/YYYY
  const euFormat = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (euFormat) {
    const [, day, month, year] = euFormat;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Último recurso: parseo nativo
  return new Date(dateStr);
};

// Utilidad para formatear fecha a YYYY-MM-DD
const formatYMD = (date: Date): string => {
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Utilidad para parsear tiempo (HH:MM o fracción de día)
const parseExcelTime = (timeInput: string | number | undefined | null): string => {
  // Si es undefined o null, devolver string vacío
  if (timeInput === undefined || timeInput === null) {
    return '';
  }

  // Si es un número, es fracción de día (0.5 = 12:00 PM)
  if (typeof timeInput === 'number') {
    const totalMinutes = Math.round(timeInput * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Si es string, limpiar y validar formato HH:MM
  const timeStr = String(timeInput).trim();

  // Si el string está vacío, devolver string vacío
  if (!timeStr) {
    return '';
  }

  // Intentar parsear formato HH:MM
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    // Validar rangos
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  // Si no coincide con ningún formato válido, devolver string vacío
  return '';
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.formData();
    const file = data.get('file') as File;
    const isPreview = data.get('preview') === 'true';
    const editedPreviewRaw = data.get('editedPreview') as string | null;

    // Check if this is a direct generator submission (JSON format)
    const isGeneratorSubmission = !file && editedPreviewRaw;

    if (!file && !isGeneratorSubmission) {
      return NextResponse.json(
        { error: 'No se encontró el archivo o datos del generador' },
        { status: 400 }
      );
    }

    // Utilidad para parsear fechas YYYY-MM-DD en horario local
    const parseLocalYMD = (ymd: string) => {
      const [yy, mm, dd] = ymd.split('-').map(Number);
      return new Date(yy, (mm || 1) - 1, dd || 1);
    };

    // Reconstruir filas desde el Excel o desde el generador
    let rows: RowData[] = [];
    // Mapa de encabezados detectados en el Excel -> claves normalizadas requeridas
    let headerKeys: {
      codigoAsignatura?: string;
      nombreAsignatura?: string;
      fechaClase?: string;
      horaInicio?: string;
      horaFin?: string;
      creditosClase?: string;
      programa?: string;
      semestreAsignatura?: string;
      temaClase?: string;
      descripcionClase?: string;
    } = {};

    // Helper para leer una celda con clave dinámica de forma segura
    const cell = <K extends keyof RowData>(
      row: RowData,
      dynamicKey: string | undefined,
      fallback: K
    ): unknown => {
      const r = row as unknown as Record<string, unknown>;
      if (dynamicKey && dynamicKey in r) return r[dynamicKey];
      return r[String(fallback)];
    };

    if (editedPreviewRaw) {
      try {
        const editedPreview = JSON.parse(editedPreviewRaw) as GeneratorSubjectData[];

        // Convert generator format to RowData format
        rows = editedPreview.flatMap(s =>
          s.classes.map(c => ({
            codigoAsignatura: s.codigoAsignatura,
            nombreAsignatura: s.nombreAsignatura,
            'fechaClase (MM/DD/YYYY)': c.fechaClase,
            'horaInicio (HH:MM)': c.horaInicio,
            'horaFin (HH:MM)': c.horaFin,
            temaClase: c.temaClase,
            descripcionClase: c.descripcionClase,
            creditosClase: s.creditosClase,
            programa: s.programa,
            semestreAsignatura: String(s.semestreAsignatura),
          }))
        );
      } catch (err) {
        console.error('Error al procesar la solicitud:', err);
        return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
      }
    } else if (file) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet) as RowData[];
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No hay datos para procesar' }, { status: 400 });
    }

    // For generator submissions, skip header validation as data is already structured
    if (!isGeneratorSubmission) {
      const headers = Object.keys(rows[0] || {});
      const normalize = (s: string) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');

      // Log para depuración: encabezados y primeras filas
      try {
        console.log('Upload debug - headers:', headers);
        console.log('Upload debug - normalized headers:', headers.map(normalize));
        console.log('Upload debug - sample row 1:', rows[0]);
        console.log('Upload debug - sample rows (first 3):', rows.slice(0, 3));
      } catch {}

      const normalizedHeaders = headers.map(normalize);
      const hasBase = (base: string) =>
        normalizedHeaders.some(
          h => h === base || h.startsWith(base + ' ') || h.startsWith(base + '(')
        );
      const findKeyForBase = (base: string): string | undefined => {
        const idx = normalizedHeaders.findIndex(
          h => h === base || h.startsWith(base + ' ') || h.startsWith(base + '(')
        );
        return idx >= 0 ? headers[idx] : undefined;
      };

      const requiredBases = [
        'codigoasignatura',
        'nombreasignatura',
        'fechaclase',
        'horainicio',
        'horafin',
        'creditosclase',
        'programa',
        'semestreasignatura',
      ];

      const missingBases = requiredBases.filter(b => !hasBase(b));

      if (missingBases.length > 0) {
        return NextResponse.json(
          {
            error: `Faltan los siguientes encabezados requeridos: ` + missingBases.join(', '),
          },
          { status: 400 }
        );
      }

      // Construir mapa de claves reales detectadas
      headerKeys = {
        codigoAsignatura: findKeyForBase('codigoasignatura'),
        nombreAsignatura: findKeyForBase('nombreasignatura'),
        fechaClase: findKeyForBase('fechaclase'),
        horaInicio: findKeyForBase('horainicio'),
        horaFin: findKeyForBase('horafin'),
        creditosClase: findKeyForBase('creditosclase'),
        programa: findKeyForBase('programa'),
        semestreAsignatura: findKeyForBase('semestreasignatura'),
        // Opcionales
        temaClase: headers[normalizedHeaders.findIndex(h => h === 'temaclase')] || 'temaClase',
        descripcionClase:
          headers[normalizedHeaders.findIndex(h => h === 'descripcionclase')] || 'descripcionClase',
      };
    }

    const existingSubjects = await db.subject.findMany({
      where: {
        teacherId: session.user.id,
      },
      select: {
        code: true,
      },
    });
    const existingSubjectCodes = new Set(existingSubjects.map(s => s.code));

    if (isPreview && !editedPreviewRaw) {
      const previewData = rows.map(row => {
        try {
          const codigoAsignatura = String(
            cell(row, headerKeys.codigoAsignatura, 'codigoAsignatura') ?? ''
          ).trim();
          const nombreAsignatura = String(
            cell(row, headerKeys.nombreAsignatura, 'nombreAsignatura') ?? ''
          ).trim();

          // Procesar fecha y horas con manejo de valores undefined
          const fechaClase = parseExcelDate(
            cell(row, headerKeys.fechaClase, 'fechaClase (MM/DD/YYYY)') as string | number | Date
          );
          const horaInicio = parseExcelTime(
            cell(row, headerKeys.horaInicio, 'horaInicio (HH:MM)') as string | number | undefined
          );
          const horaFin = parseExcelTime(
            cell(row, headerKeys.horaFin, 'horaFin (HH:MM)') as string | number | undefined
          );
          const fechaFormateada = formatYMD(fechaClase);

          // Validar campos requeridos
          if (
            !codigoAsignatura ||
            !nombreAsignatura ||
            isNaN(fechaClase.getTime()) ||
            !horaInicio ||
            !horaFin ||
            (horaInicio === '00:00' && horaFin === '00:00') // Rechazar si no se pudo parsear la hora
          ) {
            return {
              ...row,
              status: 'error',
              error: 'Faltan datos requeridos o formato incorrecto (código, nombre, fecha u hora).',
            };
          }

          if (existingSubjectCodes.has(codigoAsignatura)) {
            return {
              ...row,
              status: 'error',
              error: `La asignatura con el código ${codigoAsignatura} ya existe.`,
            };
          }

          return {
            codigoAsignatura,
            nombreAsignatura,
            fechaClase: fechaFormateada,
            horaInicio,
            horaFin,
            creditosClase: (() => {
              const v = cell(row, headerKeys.creditosClase, 'creditosClase');
              return v !== undefined && v !== null && String(v).trim() !== '' ? Number(v) : null;
            })(),
            programa: (() => {
              const v = cell(row, headerKeys.programa, 'programa');
              return v !== undefined && v !== null ? String(v) : undefined;
            })(),
            semestreAsignatura: (() => {
              const v = cell(row, headerKeys.semestreAsignatura, 'semestreAsignatura');
              return v !== undefined && v !== null ? String(v) : undefined;
            })(),
            temaClase: (() => {
              const v = cell(row, headerKeys.temaClase, 'temaClase');
              return v !== undefined && v !== null ? String(v) : undefined;
            })(),
            descripcionClase: (() => {
              const v = cell(row, headerKeys.descripcionClase, 'descripcionClase');
              return v !== undefined && v !== null ? String(v) : undefined;
            })(),
            status: 'success' as const,
          };
        } catch (error) {
          return {
            ...row,
            status: 'error',
            error: error instanceof Error ? error.message : 'Error desconocido',
          };
        }
      });

      return NextResponse.json({ success: true, previewData });
    }

    // Procesar la carga real
    let processed = 0;
    const errors: string[] = [];
    const createdSubjects: string[] = []; // Track created subjects

    // Process in batches of 20 rows to avoid transaction timeouts
    const BATCH_SIZE = 20;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      try {
        await db.$transaction(async tx => {
          for (const row of batch) {
            try {
              const codigoAsignatura = String(
                cell(row as RowData, headerKeys.codigoAsignatura, 'codigoAsignatura') ?? ''
              ).trim();
              const nombreAsignatura = String(
                cell(row as RowData, headerKeys.nombreAsignatura, 'nombreAsignatura') ?? ''
              ).trim();
              const fechaClase = parseExcelDate(
                cell(row as RowData, headerKeys.fechaClase, 'fechaClase (MM/DD/YYYY)') as
                  | string
                  | number
                  | Date
              );
              const horaInicio = parseExcelTime(
                cell(row as RowData, headerKeys.horaInicio, 'horaInicio (HH:MM)') as
                  | string
                  | number
                  | undefined
              );
              const horaFin = parseExcelTime(
                cell(row as RowData, headerKeys.horaFin, 'horaFin (HH:MM)') as
                  | string
                  | number
                  | undefined
              );

              if (
                !codigoAsignatura ||
                !nombreAsignatura ||
                isNaN(fechaClase.getTime()) ||
                !horaInicio ||
                !horaFin
              ) {
                continue; // Skip rows with missing essential data
              }

              // Check for existing subject in the database
              let subject = await tx.subject.findUnique({
                where: { code: codigoAsignatura },
              });

              // If subject doesn't exist, create it
              let isNewSubject = false;
              if (!subject) {
                subject = await tx.subject.create({
                  data: {
                    code: codigoAsignatura,
                    name: nombreAsignatura,
                    credits: row['creditosClase'] ? Number(row['creditosClase']) : 0,
                    teacherId: session.user.id,
                    program: row['programa']?.toString(),
                    semester: row['semestreAsignatura'] ? Number(row['semestreAsignatura']) : 0,
                  },
                });
                isNewSubject = true;
                createdSubjects.push(codigoAsignatura);
              }

              // Crear fechas con hora usando la fecha base y las horas parseadas
              const [startH, startM] = safeSplitTime(horaInicio);
              const startDateTime = new Date(
                fechaClase.getFullYear(),
                fechaClase.getMonth(),
                fechaClase.getDate(),
                parseInt(startH, 10),
                parseInt(startM, 10),
                0
              );

              const [endH, endM] = safeSplitTime(horaFin);
              const endDateTime = new Date(
                fechaClase.getFullYear(),
                fechaClase.getMonth(),
                fechaClase.getDate(),
                parseInt(endH, 10),
                parseInt(endM, 10),
                0
              );

              // Always create the class record
              await tx.class.create({
                data: {
                  subjectId: subject.id,
                  date: fechaClase,
                  startTime: startDateTime,
                  endTime: endDateTime,
                  topic: row['temaClase']?.toString(),
                  description: row['descripcionClase']?.toString(),
                },
              });

              // Count processed only once per subject for generator submissions
              if (isGeneratorSubmission) {
                if (isNewSubject) {
                  processed++;
                }
              } else {
                // For Excel uploads, count each row
                processed++;
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
              errors.push(`Fila ${rows.indexOf(row) + 2}: ${errorMessage}`);
              // Continue with next row even if one fails
            }
          }
        });
      } catch (error) {
        console.error(`Error en el lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        errors.push(`Error en el lote ${Math.floor(i / BATCH_SIZE) + 1}: ${errorMessage}`);
        // Continue with next batch even if one fails
      }
    }

    // Return success response with processing summary
    return NextResponse.json({
      success: true,
      processed: isGeneratorSubmission ? createdSubjects.length : processed,
      total: rows.length,
      createdSubjects: isGeneratorSubmission ? createdSubjects : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido en el servidor';
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar el archivo',
        details: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}

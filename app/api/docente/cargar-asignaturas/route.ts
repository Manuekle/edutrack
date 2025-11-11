// app/api/docente/cargar-asignaturas/route.ts
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Interface for the raw data from the API/Excel/CSV file
interface RowData {
  codigoAsignatura: string;
  nombreAsignatura: string;
  'fechaClase (MM/DD/YYYY)': string | number | Date;
  'horaInicio (HH:MM)': string | number;
  'horaInicio (HH:MM:SS AM o PM)'?: string | number; // Formato alternativo para CSV
  'horaFin (HH:MM)'?: string | number;
  'horaFin (HH:MM:SS AM o PM)'?: string | number; // Formato alternativo para CSV
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
    // Crear fecha en hora local para evitar problemas de zona horaria
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }

  // Formato MM/DD/YYYY (priorizar este formato ya que el header del CSV lo indica)
  const usFormat = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usFormat) {
    const [, month, day, year] = usFormat;
    // Crear fecha en hora local para evitar problemas de zona horaria
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }

  // Formato DD/MM/YYYY
  const euFormat = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (euFormat) {
    const [, day, month, year] = euFormat;
    // Crear fecha en hora local para evitar problemas de zona horaria
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }

  // Intentar otros formatos comunes antes del parseo nativo
  // Formato YYYY/MM/DD
  const isoSlashFormat = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (isoSlashFormat) {
    const [, year, month, day] = isoSlashFormat;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }

  // Último recurso: intentar parseo usando diferentes estrategias
  // Primero intentar como si fuera una fecha ISO
  const isoDateMatch = dateStr.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }

  // Intentar parseo nativo, pero extraer componentes inmediatamente para evitar problemas de zona horaria
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    // Extraer componentes de la fecha parseada y crear una nueva en hora local
    // Usar getUTCFullYear/getUTCMonth/getUTCDate si la fecha fue parseada como UTC
    // o getFullYear/getMonth/getDate si fue parseada como local
    // Para ser seguro, intentar ambos y usar el que tenga más sentido
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth();
    const day = parsedDate.getDate();

    // Si la fecha parece haber sido convertida incorrectamente (año < 1970 o año > 2100),
    // puede ser un problema de zona horaria, usar UTC
    if (year < 1970 || year > 2100) {
      const utcYear = parsedDate.getUTCFullYear();
      const utcMonth = parsedDate.getUTCMonth();
      const utcDay = parsedDate.getUTCDate();
      if (utcYear >= 1970 && utcYear <= 2100) {
        return new Date(utcYear, utcMonth, utcDay, 0, 0, 0, 0);
      }
    }

    // Crear fecha en hora local usando los componentes extraídos
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  // Si todo falla, lanzar error
  throw new Error(`Formato de fecha no reconocido: ${dateStr}`);
};

// Utilidad para formatear fecha a YYYY-MM-DD
const formatYMD = (date: Date): string => {
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Utilidad para parsear tiempo (HH:MM, HH:MM:SS, o formato AM/PM, o fracción de día)
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

  // Si es string, limpiar y validar formato
  const timeStr = String(timeInput).trim().toUpperCase();

  // Si el string está vacío, devolver string vacío
  if (!timeStr) {
    return '';
  }

  // Intentar parsear formato AM/PM (ej: "8:00:00 AM", "5:00:00 PM", "8:00 AM")
  const amPmMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = parseInt(amPmMatch[2], 10);
    const period = amPmMatch[4].toUpperCase();

    // Convertir a formato 24 horas
    if (period === 'AM') {
      if (hours === 12) {
        hours = 0; // 12:00 AM = 00:00
      }
    } else if (period === 'PM') {
      if (hours !== 12) {
        hours += 12; // 1:00 PM = 13:00, etc.
      }
    }

    // Validar rangos
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  // Intentar parsear formato HH:MM o HH:MM:SS (24 horas)
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

    // Reconstruir filas desde el Excel/CSV o desde el generador
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
        return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
      }
    } else if (file) {
      const buffer = await file.arrayBuffer();
      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith('.csv');

      let workbook;
      if (isCSV) {
        // Para CSV, leer manualmente como texto para evitar conversión de fechas a números seriales
        const text = new TextDecoder('utf-8').decode(buffer);
        const lines = text.split(/\r?\n/).filter(line => line.trim());

        if (lines.length === 0) {
          return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 });
        }

        // Función para parsear una línea CSV manejando comas dentro de comillas
        const parseCSVLine = (line: string): string[] => {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // Comilla escapada ("" dentro de comillas)
                current += '"';
                i++; // Saltar la siguiente comilla
              } else {
                // Toggle estado de comillas
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // Separador de campo (solo fuera de comillas)
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          // Agregar el último valor
          values.push(current.trim());

          // Limpiar comillas de los valores
          return values.map(val => {
            // Remover comillas externas si existen
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              return val.slice(1, -1).replace(/""/g, '"'); // Reemplazar comillas escapadas
            }
            return val;
          });
        };

        // Parsear headers
        const headers = parseCSVLine(lines[0]).map(h => h.trim());

        // Parsear filas
        rows = lines
          .slice(1)
          .map(line => {
            const values = parseCSVLine(line);

            // Crear objeto con headers
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row as unknown as RowData;
          })
          .filter(row => {
            // Filtrar filas vacías
            return Object.values(row).some(val => val && String(val).trim());
          });
      } else {
        // Para Excel, usar buffer directamente
        workbook = XLSX.read(buffer, {
          type: 'buffer',
          cellDates: false, // NO convertir fechas automáticamente
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, {
          defval: '', // Valor por defecto para celdas vacías
          raw: true, // Mantener valores raw (no procesar) para que las fechas vengan como strings
          dateNF: 'mm/dd/yyyy', // Formato de fecha esperado
        }) as RowData[];
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No hay datos para procesar' }, { status: 400 });
    }

    // For generator submissions, skip header validation as data is already structured
    if (!isGeneratorSubmission) {
      const headers = Object.keys(rows[0] || {});
      const normalize = (s: string) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');

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

              // Asegurarse de que la fecha esté en hora local (sin problemas de zona horaria)
              // Extraer los componentes de la fecha parseada
              const year = fechaClase.getFullYear();
              const month = fechaClase.getMonth();
              const day = fechaClase.getDate();

              // Crear una nueva fecha en hora local para asegurar que no haya problemas de zona horaria
              const localDate = new Date(year, month, day, 0, 0, 0, 0);

              // Crear fechas con hora usando la fecha local y las horas parseadas
              const [startH, startM] = safeSplitTime(horaInicio);
              const startDateTime = new Date(
                year,
                month,
                day,
                parseInt(startH, 10),
                parseInt(startM, 10),
                0,
                0
              );

              const [endH, endM] = safeSplitTime(horaFin);
              const endDateTime = new Date(
                year,
                month,
                day,
                parseInt(endH, 10),
                parseInt(endM, 10),
                0,
                0
              );

              // Always create the class record
              await tx.class.create({
                data: {
                  subjectId: subject.id,
                  date: localDate, // Usar la fecha local creada explícitamente
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
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        errors.push(`Error en el lote ${Math.floor(i / BATCH_SIZE) + 1}: ${errorMessage}`);
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

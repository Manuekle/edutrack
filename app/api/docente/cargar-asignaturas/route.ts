import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Interface for the raw data from the API/Excel file
interface RowData {
  codigoAsignatura: string;
  nombreAsignatura: string;
  'fechaClase (YYYY-MM-DD)': string;
  'horaInicio (HH:MM)': string;
  'horaFin (HH:MM)'?: string;
  temaClase?: string;
  descripcionClase?: string;
  creditosClase?: number;
  programa?: string;
  semestreAsignatura?: string;
}

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

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    // Utilidad para parsear fechas YYYY-MM-DD en horario local
    const parseLocalYMD = (ymd: string) => {
      const [yy, mm, dd] = ymd.split('-').map(Number);
      return new Date(yy, (mm || 1) - 1, dd || 1);
    };

    // Reconstruir filas desde el Excel, a menos que recibamos editedPreview
    let rows: RowData[] = [];
    if (editedPreviewRaw) {
      // editedPreview es un arreglo de sujetos con sus clases editadas
      // Debemos aplanar a filas RowData para reutilizar el flujo actual
      const editedPreview = JSON.parse(editedPreviewRaw) as Array<{
        codigoAsignatura: string;
        nombreAsignatura: string;
        creditosClase: number;
        programa: string;
        semestreAsignatura: number;
        classes: Array<{
          fechaClase: string; // YYYY-MM-DD
          horaInicio: string; // HH:MM
          horaFin: string; // HH:MM
          temaClase?: string;
          descripcionClase?: string;
        }>;
      }>;

      rows = editedPreview.flatMap(s =>
        s.classes.map(c => ({
          codigoAsignatura: s.codigoAsignatura,
          nombreAsignatura: s.nombreAsignatura,
          'fechaClase (YYYY-MM-DD)': c.fechaClase,
          'horaInicio (HH:MM)': c.horaInicio,
          'horaFin (HH:MM)': c.horaFin,
          temaClase: c.temaClase,
          descripcionClase: c.descripcionClase,
          creditosClase: s.creditosClase,
          programa: s.programa,
          semestreAsignatura: String(s.semestreAsignatura),
        }))
      );
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet) as RowData[];
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'El archivo Excel está vacío' },
        {
          status: 400,
        }
      );
    }

    const requiredHeaders = [
      'codigoAsignatura',
      'nombreAsignatura',
      'fechaClase (YYYY-MM-DD)',
      'horaInicio (HH:MM)',
      'horaFin (HH:MM)',
      'creditosClase',
      'programa',
      'semestreAsignatura',
    ];
    const headers = Object.keys(rows[0] || {});
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Faltan los siguientes encabezados requeridos: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
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
          const codigoAsignatura = row['codigoAsignatura']?.toString().trim();
          const nombreAsignatura = row['nombreAsignatura']?.toString().trim();
          const fechaStr = row['fechaClase (YYYY-MM-DD)'];
          const fechaClase =
            typeof fechaStr === 'string' ? parseLocalYMD(fechaStr) : new Date(fechaStr);
          const horaInicio = row['horaInicio (HH:MM)'];
          const horaFin = row['horaFin (HH:MM)'];

          if (
            !codigoAsignatura ||
            !nombreAsignatura ||
            isNaN(fechaClase.getTime()) ||
            !horaInicio ||
            !horaFin
          ) {
            return {
              ...row,
              status: 'error',
              error: 'Faltan datos requeridos (código, nombre, fecha u hora de inicio).',
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
            fechaClase: fechaClase.toISOString(),
            horaInicio,
            horaFin,
            creditosClase: row['creditosClase'] ? Number(row['creditosClase']) : null,
            programa: row['programa']?.toString(),
            semestreAsignatura: row['semestreAsignatura']?.toString(),
            temaClase: row['temaClase']?.toString(),
            descripcionClase: row['descripcionClase']?.toString(),
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

    // Process in batches of 20 rows to avoid transaction timeouts
    const BATCH_SIZE = 20;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      try {
        await db.$transaction(async tx => {
          for (const row of batch) {
            try {
              const codigoAsignatura = row['codigoAsignatura']?.toString().trim();
              const nombreAsignatura = row['nombreAsignatura']?.toString().trim();
              const fechaStr = row['fechaClase (YYYY-MM-DD)'];
              const fechaClase =
                typeof fechaStr === 'string' ? parseLocalYMD(fechaStr) : new Date(fechaStr);
              const horaInicio = row['horaInicio (HH:MM)'];
              const horaFin = row['horaFin (HH:MM)'];

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
              }

              // Combine date with time strings for proper DateTime
              const startDateTime = new Date(fechaClase);
              const [startH, startM] = horaInicio.split(':');
              startDateTime.setHours(parseInt(startH), parseInt(startM));

              const endDateTime = new Date(fechaClase);
              const [endH, endM] = horaFin.split(':');
              endDateTime.setHours(parseInt(endH), parseInt(endM));

              // Always create the class record, but only count as processed if it's a new subject
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

              if (isNewSubject) {
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
      processed,
      total: rows.length,
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

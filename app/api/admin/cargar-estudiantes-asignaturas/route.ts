import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface ExcelRow {
  [key: string]: string | number;
}

interface RowCargaEstudiantes {
  codigoAsignatura: string;
  estudiantes: string[];
}

interface PreviewStudentDetail {
  doc: string;
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface PreviewRow {
  codigoAsignatura: string;
  estudiantes: PreviewStudentDetail[];
  error?: string;
}

interface StudentInfo {
  id: string;
  name: string | null;
  document: string | null;
}

interface ResultRow {
  codigoAsignatura: string;
  status: 'updated' | 'skipped' | 'error';
  error?: string;
  updated?: boolean;
  addedStudents?: StudentInfo[];
  totalStudents?: number;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Validar sesión y rol
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'No autorizado. Solo ADMIN puede realizar esta acción.' },
      { status: 401 }
    );
  }

  try {
    // Parse the URL safely for both client and server-side
    let isPreview = false;
    try {
      // First try to get from search params (client-side)
      const url = new URL(request.url);
      isPreview = url.searchParams.get('preview') === 'true';
    } catch {
      // If that fails, try with a base URL (server-side)
      let baseUrl = process.env.NEXTAUTH_URL || 'https://edutrack-fup.vercel.app';
      // Ensure the URL has a protocol
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `https://${baseUrl}`;
      }
      const url = new URL(request.url, baseUrl);
      isPreview = url.searchParams.get('preview') === 'true';
    }

    // Check content type to determine how to handle the request
    const contentType = request.headers.get('content-type') || '';
    let uploadedFile: File | null = null;

    // SIEMPRE esperamos multipart/form-data cuando hay un archivo
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Content-Type debe ser multipart/form-data para cargar archivos',
        },
        { status: 400 }
      );
    }

    // Handle form data (file upload)
    const formData = await request.formData();
    uploadedFile = formData.get('file') as File | null;

    if (!uploadedFile) {
      return NextResponse.json(
        { success: false, message: 'No se ha proporcionado ningún archivo' },
        { status: 400 }
      );
    }

    // Validar el archivo
    if (!uploadedFile.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, message: 'Tipo de archivo no válido, se requiere un archivo CSV (.csv)' },
        { status: 400 }
      );
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'El archivo es demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    // Procesar el archivo CSV
    const fileBuffer = await uploadedFile.arrayBuffer();
    // CSV Parsing Logic
    const text = new TextDecoder('utf-8').decode(fileBuffer);
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ success: false, message: 'El archivo CSV está vacío' }, { status: 400 });
    }

    const parseCSVLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
             if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
             else { inQuotes = !inQuotes; }
        } else if (char === ',' && !inQuotes) {
             values.push(current.trim());
             current = '';
        } else {
             current += char;
        }
      }
      values.push(current.trim());
      return values.map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
    };

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row: any = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'El archivo está vacío o no contiene datos válidos.' },
        { status: 400 }
      );
    }

    // Validar columnas mínimas
    const csvHeaders = Object.keys(rows[0]);
    const requiredHeaders = ['codigoAsignatura', 'documentoEstudiante'];
    const missingHeaders = requiredHeaders.filter(header => !csvHeaders.includes(header));

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `El archivo no tiene el formato correcto. Faltan las columnas: ${missingHeaders.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Convertir datos al formato esperado
    const excelData: RowCargaEstudiantes[] = rows.map((row: any) => {
      const estudiantes = String(row.documentoEstudiante || '')
        .split(',')
        .map((e: string) => e.trim())
        .filter(Boolean);
      return { codigoAsignatura: String(row.codigoAsignatura || ''), estudiantes };
    });

    if (isPreview) {
      // --- MODO VISTA PREVIA ---
      const previewResults: PreviewRow[] = [];

      for (const row of excelData) {
        const { codigoAsignatura, estudiantes } = row;
        if (!codigoAsignatura || estudiantes.length === 0) {
          previewResults.push({
            codigoAsignatura,
            estudiantes: [],
            error: 'Faltan datos en la fila',
          });
          continue;
        }

        const subject = await db.subject.findUnique({ where: { code: codigoAsignatura } });
        if (!subject) {
          previewResults.push({
            codigoAsignatura,
            estudiantes: [],
            error: 'Asignatura no encontrada',
          });
          continue;
        }

        const foundStudents = await db.user.findMany({
          where: { document: { in: estudiantes }, role: 'ESTUDIANTE' },
          select: { id: true, document: true, name: true },
        });

        const previewDetails = estudiantes.map((doc): PreviewStudentDetail => {
          const student = foundStudents.find(s => s.document === doc);
          if (!student) {
            return { doc, name: '', status: 'error', message: 'Estudiante no existe' };
          }
          if (subject.studentIds.includes(student.id)) {
            return { doc, name: student.name || '', status: 'warning', message: 'Ya inscrito' };
          }
          return {
            doc,
            name: student.name || '',
            status: 'success',
            message: 'Listo para inscribir',
          };
        });

        previewResults.push({ codigoAsignatura, estudiantes: previewDetails });
      }

      return NextResponse.json({
        success: true,
        resultados: previewResults,
        message: 'Proceso completado con éxito',
      });
    } else {
      // --- MODO PROCESAMIENTO FINAL ---
      // Para el procesamiento final, usaremos los datos del archivo Excel directamente
      const resultados: ResultRow[] = [];

      // Process in a transaction
      await db.$transaction(async tx => {
        for (const row of excelData) {
          const { codigoAsignatura, estudiantes } = row;

          // Validate input
          if (!codigoAsignatura || estudiantes.length === 0) {
            resultados.push({
              codigoAsignatura: codigoAsignatura || 'unknown',
              status: 'skipped',
              error: 'Código de asignatura faltante o sin estudiantes',
            });
            continue;
          }

          // Find the subject using the transaction
          const subject = await tx.subject.findUnique({
            where: { code: codigoAsignatura },
          });

          if (!subject) {
            resultados.push({
              codigoAsignatura,
              status: 'error',
              error: 'Asignatura no encontrada',
            });
            continue;
          }

          // Find existing students with their names
          const foundStudents = await tx.user.findMany({
            where: {
              document: { in: estudiantes },
              role: 'ESTUDIANTE',
            },
            select: {
              id: true,
              name: true,
              document: true,
            },
          });

          if (foundStudents.length === 0) {
            resultados.push({
              codigoAsignatura,
              status: 'skipped',
              error: 'No se encontraron estudiantes válidos',
            });
            continue;
          }

          // Create a map of document to student info for easy lookup
          const studentInfoMap = new Map(foundStudents.map(student => [student.document, student]));

          // Update subject with new students
          const newStudentIds = foundStudents.map(s => s.id);
          const currentStudentIds = subject.studentIds || [];

          // Only add students that are not already enrolled
          const studentsToAdd = newStudentIds.filter(id => !currentStudentIds.includes(id));

          if (studentsToAdd.length === 0) {
            resultados.push({
              codigoAsignatura,
              status: 'skipped',
              error: 'Todos los estudiantes ya están inscritos',
            });
            continue;
          }

          const finalStudentIds = [...currentStudentIds, ...studentsToAdd];

          // Get details of newly added students
          const addedStudents = studentsToAdd
            .map(id => foundStudents.find(s => s.id === id))
            .filter((student): student is NonNullable<typeof student> => student !== undefined)
            .map(({ id, name, document }) => ({
              id,
              name,
              document: document || null,
            }));

          await tx.subject.update({
            where: { id: subject.id },
            data: { studentIds: { set: finalStudentIds } },
          });

          // Sync: Update each added student's enrolledSubjectIds
          for (const studentToAdd of addedStudents) {
              await tx.user.update({
                  where: { id: studentToAdd.id },
                  data: {
                      enrolledSubjectIds: { push: subject.id }
                  }
              });
          }

          resultados.push({
            codigoAsignatura,
            status: 'updated',
            updated: true,
            addedStudents,
            totalStudents: finalStudentIds.length,
          });
        }
      });

      // After transaction completes successfully
      const updatedCount = resultados.filter(r => r.status === 'updated').length;
      const skippedCount = resultados.filter(r => r.status === 'skipped').length;
      const errorCount = resultados.filter(r => r.status === 'error').length;

      return NextResponse.json({
        success: true,
        message: 'Carga completada exitosamente',
        resultados,
        summary: {
          total: resultados.length,
          updated: updatedCount,
          skipped: skippedCount,
          errors: errorCount,
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const subjects = await db.subject.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        program: true,
        semester: true,
        periodoAcademico: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ subjects });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

interface PreviewResult {
  codigoAsignatura: string;
  nombreAsignatura: string;
  programa: string;
  semestre: number;
  horas: number;
  status: 'success' | 'error' | 'existing';
  message: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url, `https://${request.headers.get('host')}`);
    const isPreview = url.searchParams.get('preview') === 'true';

    const contentType = request.headers.get('content-type') || '';

    // Handle bulk JSON creation (non-preview mode, sent from Confirmar button)
    if (contentType.includes('application/json') && !isPreview) {
      const body = await request.json();
      const subjects: PreviewResult[] = body.subjects;

      if (!Array.isArray(subjects) || subjects.length === 0) {
        return NextResponse.json(
          { error: 'No se encontraron asignaturas para crear' },
          { status: 400 }
        );
      }

      const created: string[] = [];
      const errors: string[] = [];

      for (const item of subjects) {
        try {
          let subjectId: string;
          const existingSubject = await db.subject.findFirst({
            where: { code: item.codigoAsignatura },
            select: { id: true },
          });

          if (existingSubject) {
            // Actualizar si existe
            await db.subject.update({
              where: { id: existingSubject.id },
              data: {
                name: item.nombreAsignatura,
                program: item.programa || null,
                semester: item.semestre,
                directHours: item.horas,
              },
            });
            subjectId = existingSubject.id;

            // Eliminar temas antiguos para reemplazarlos (Upsert real en la colección conectada)
            await db.subjectContent.deleteMany({
              where: { subjectId: existingSubject.id, type: 'TEMA' },
            });
          } else {
            // Crear si no existe
            const subject = await db.subject.create({
              data: {
                code: item.codigoAsignatura,
                name: item.nombreAsignatura,
                program: item.programa || null,
                semester: item.semestre,
                directHours: item.horas,
              },
            });
            subjectId = subject.id;
          }

          created.push(item.codigoAsignatura);
        } catch (e) {
          errors.push(`Error procesando ${item.codigoAsignatura}: ${(e as Error).message}`);
        }
      }

      return NextResponse.json({
        success: true,
        summary: {
          total: subjects.length,
          created: created.length,
          existing: 0, // Como todo hace Upsert, no hay ignorados "existing".
          updatedCount: subjects.length - created.length - errors.length,
          errors: errors.length,
        },
        createdSubjects: created,
        errors,
      });
    }

    let formData: FormData | null = null;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Error al leer los datos del formulario' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);

    // Using PapaParse for reliable CSV parsing (handles quoted strings, specific delimiters)
    const parseResult = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return NextResponse.json(
        { error: 'El archivo CSV tiene un formato inválido' },
        { status: 400 }
      );
    }

    const dataRows = parseResult.data;
    if (dataRows.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 });
    }

    const headers = parseResult.meta.fields || [];

    const headerMap: Record<string, string[]> = {
      codigo: ['codigo_asignatura', 'codigo', 'code'],
      nombre: ['nombre_asignatura', 'nombre', 'name', 'asignatura'],
      programa: ['programa', 'program', 'carrera'],
      semestre: ['semestre', 'semester'],
      horas: ['horas', 'horas_acompanamiento', 'horas_acompañamiento'],
    };

    const findHeader = (variants: string[]): string | undefined => {
      for (const variant of variants) {
        const normalized = variant.toLowerCase().replace(/\s+/g, '');
        const found = headers.find(
          (h: string) => h.toLowerCase().replace(/\s+/g, '') === normalized
        );
        if (found) return found;
      }
      return undefined;
    };

    const getValue = (row: Record<string, string>, header: string | undefined): string => {
      if (!header) return '';
      return row[header] || '';
    };

    const results: PreviewResult[] = [];
    const existingCodes = new Set(
      (await db.subject.findMany({ select: { code: true } })).map(s => s.code)
    );

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const codigo = getValue(row, findHeader(headerMap.codigo)).trim();
      let nombre = getValue(row, findHeader(headerMap.nombre)).trim();
      if (nombre) {
        nombre = nombre
          .toLowerCase()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      const programa = getValue(row, findHeader(headerMap.programa)).trim();
      const semestreStr = getValue(row, findHeader(headerMap.semestre)).trim();
      const horasStr = getValue(row, findHeader(headerMap.horas)).trim();

      const semestre = parseInt(semestreStr) || 1;
      const horas = parseInt(horasStr) || 0;

      if (!codigo || !nombre) {
        results.push({
          codigoAsignatura: codigo || 'N/A',
          nombreAsignatura: nombre || 'Sin nombre',
          programa: '',
          semestre: 1,
          horas: 0,
          status: 'error',
          message: 'Faltan datos requeridos (código o nombre)',
        });
        continue;
      }

      if (existingCodes.has(codigo)) {
        results.push({
          codigoAsignatura: codigo,
          nombreAsignatura: nombre,
          programa,
          semestre,
          horas,
          status: 'existing',
          message: 'Existe (Se actualizará)',
        });
        continue;
      }

      results.push({
        codigoAsignatura: codigo,
        nombreAsignatura: nombre,
        programa,
        semestre,
        horas,
        status: 'success',
        message: 'Datos válidos',
      });
    }

    if (isPreview) {
      return NextResponse.json({ success: true, previewData: results });
    }

    return NextResponse.json({ error: 'Ruta no esperada' }, { status: 400 });
  } catch (error) {
    console.error('API Error microcurriculos: ', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

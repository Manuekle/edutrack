import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { parseCSV, validateCSVHeaders, parseCSVLine, detectDelimiter } from '@/lib/csv-parser';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface MicrocurriculoRow {
  codigoAsignatura: string;
  nombreAsignatura: string;
  programa: string;
  semestre: string;
  creditos: string;
  horasAcompanamiento: string;
}

interface PreviewResult {
  codigoAsignatura: string;
  nombreAsignatura: string;
  programa: string;
  semestre: number;
  creditos: number;
  directHours: number;
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const delimiter = detectDelimiter(text);
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 });
    }

    const headers = parseCSVLine(lines[0], delimiter);
    const requiredHeaders = ['codigoAsignatura', 'nombreAsignatura'];
    const validation = validateCSVHeaders(headers, requiredHeaders);

    if (!validation.valid) {
      return NextResponse.json(
        { error: `Faltan headers requeridos: ${validation.missing.join(', ')}` },
        { status: 400 }
      );
    }

    const headerMap: Record<string, string[]> = {
      codigoAsignatura: ['codigoAsignatura', 'codigo', 'code'],
      nombreAsignatura: ['nombreAsignatura', 'nombre', 'name', 'asignatura'],
      programa: ['programa', 'program', 'carrera'],
      semestre: ['semestre', 'semester'],
      creditos: ['creditos', 'credits', 'créditos'],
      horasAcompanamiento: ['horasAcompanamiento', 'horas', 'hours'],
    };

    const findHeader = (variants: string[]): string | undefined => {
      for (const variant of variants) {
        const normalized = variant.toLowerCase().replace(/\s+/g, '');
        const found = headers.find(h => h.toLowerCase().replace(/\s+/g, '') === normalized);
        if (found) return found;
      }
      return undefined;
    };

    const getValue = (row: string[], header: string | undefined, index: number): string => {
      if (!header) return row[index] || '';
      const headerIndex = headers.indexOf(header);
      return headerIndex >= 0 ? row[headerIndex] || '' : '';
    };

    const results: PreviewResult[] = [];
    const existingCodes = new Set(
      (await db.subject.findMany({ select: { code: true } })).map(s => s.code)
    );

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter);
      if (!values.some(v => v.trim())) continue;

      const codigo = getValue(values, findHeader(headerMap.codigoAsignatura), 0).trim();
      const nombre = getValue(values, findHeader(headerMap.nombreAsignatura), 1).trim();
      const programa = getValue(values, findHeader(headerMap.programa), 2).trim();
      const semestreStr = getValue(values, findHeader(headerMap.semestre), 3).trim();
      const creditosStr = getValue(values, findHeader(headerMap.creditos), 4).trim();
      const horasStr = getValue(values, findHeader(headerMap.horasAcompanamiento), 5).trim();

      const semestre = parseInt(semestreStr) || 1;
      const creditos = parseInt(creditosStr) || 0;
      const directHours = parseInt(horasStr) || 0;

      if (!codigo || !nombre) {
        results.push({
          codigoAsignatura: codigo || 'N/A',
          nombreAsignatura: nombre || 'Sin nombre',
          programa: '',
          semestre: 1,
          creditos: 0,
          directHours: 0,
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
          creditos,
          directHours,
          status: 'existing',
          message: 'La asignatura ya existe',
        });
        continue;
      }

      results.push({
        codigoAsignatura: codigo,
        nombreAsignatura: nombre,
        programa,
        semestre,
        creditos,
        directHours,
        status: 'success',
        message: 'Datos válidos',
      });
    }

    if (isPreview) {
      return NextResponse.json({ success: true, previewData: results });
    }

    // Crear asignaturas
    const toCreate = results.filter(r => r.status === 'success');
    const created: string[] = [];
    const errors: string[] = [];

    await db.$transaction(async tx => {
      for (const item of toCreate) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (tx as any).subject.create({
            data: {
              code: item.codigoAsignatura,
              name: item.nombreAsignatura,
              program: item.programa || null,
              semester: item.semestre,
              credits: item.creditos,
              directHours: item.directHours,
            },
          });
          created.push(item.codigoAsignatura);
        } catch (e) {
          errors.push(`Error creando ${item.codigoAsignatura}: ${(e as Error).message}`);
        }
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        created: created.length,
        existing: results.filter(r => r.status === 'existing').length,
        errors: results.filter(r => r.status === 'error').length,
      },
      createdSubjects: created,
      errors,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

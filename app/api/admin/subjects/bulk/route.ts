import { authOptions } from '@/lib/auth';
import { decodeCSVBuffer } from '@/lib/csv-encoding';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

interface SubjectPreview {
  name: string;
  code: string;
  program: string;
  semester: string;
  credits: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Se espera multipart/form-data con un archivo CSV' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const isPreview = formData.get('preview') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = decodeCSVBuffer(buffer);

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

    // Header mapping for subjects
    const headerMap: Record<string, string[]> = {
      name: ['nombre', 'name', 'asignatura', 'nombre_asignatura', 'subject_name'],
      code: ['codigo', 'code', 'codigo_asignatura', 'subject_code'],
      program: ['programa', 'program', 'carrera'],
      semester: ['semestre', 'semester', 'nivel'],
      credits: ['creditos', 'credits', 'creditos_clase'],
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

    const nameH = findHeader(headerMap.name);
    const codeH = findHeader(headerMap.code);
    const programH = findHeader(headerMap.program);
    const semesterH = findHeader(headerMap.semester);
    const creditsH = findHeader(headerMap.credits);

    if (!nameH || !codeH) {
      return NextResponse.json(
        {
          error:
            'El CSV debe incluir al menos las columnas: nombre/asignatura y código. Columnas encontradas: ' +
            headers.join(', '),
        },
        { status: 400 }
      );
    }

    const existingSubjects = await db.subject.findMany({ select: { code: true } });
    const existingCodes = new Set(existingSubjects.map(s => s.code));

    const previews: SubjectPreview[] = [];
    const processedCodes = new Set<string>();

    for (const row of parsed.data) {
      const name = getValue(row, nameH);
      const code = getValue(row, codeH);
      const program = programH ? getValue(row, programH) : '';
      const semester = semesterH ? getValue(row, semesterH) : '';
      const credits = creditsH ? getValue(row, creditsH) : '';

      if (!name || !code) {
        previews.push({
          name,
          code,
          program,
          semester,
          credits,
          status: 'error',
          message: 'Faltan campos requeridos (nombre o código)',
        });
        continue;
      }

      if (processedCodes.has(code)) {
        previews.push({
          name,
          code,
          program,
          semester,
          credits,
          status: 'error',
          message: 'Código de asignatura duplicado en el archivo',
        });
        continue;
      }

      processedCodes.add(code);

      if (existingCodes.has(code)) {
        previews.push({
          name,
          code,
          program,
          semester,
          credits,
          status: 'warning',
          message: 'Asignatura ya existe. Se omitirá o actualizará según confirmación.',
        });
        continue;
      }

      previews.push({
        name,
        code,
        program,
        semester,
        credits,
        status: 'success',
        message: 'Lista para crear',
      });
    }

    if (isPreview) {
      return NextResponse.json({ success: true, previewData: previews });
    }

    // Confirm mode: creation
    const validItems = previews.filter(p => p.status === 'success');
    
    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'No hay filas válidas para crear' },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let errorCount = 0;

    await db.$transaction(async (tx) => {
      for (const item of validItems) {
        try {
          await tx.subject.create({
            data: {
              name: item.name,
              code: item.code,
              program: item.program || null,
              semester: item.semester ? parseInt(item.semester, 10) : null,
              credits: item.credits ? parseInt(item.credits, 10) : null,
            },
          });
          createdCount++;
        } catch (e) {
          errorCount++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: previews.length,
        created: createdCount,
        errors: errorCount,
        skipped: previews.length - createdCount - errorCount,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

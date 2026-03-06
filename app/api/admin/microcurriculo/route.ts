import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface PreviewResult {
  codigoAsignatura: string;
  nombreAsignatura: string;
  programa: string;
  semestre: number;
  creditos: number;
  horas: number;
  temasCount: number;
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
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 });
    }

    const headers = lines[0]
      .toLowerCase()
      .split(/[,;]/)
      .map(h => h.trim());

    const headerMap: Record<string, string[]> = {
      codigo: ['codigo_asignatura', 'codigo', 'code'],
      nombre: ['nombre_asignatura', 'nombre', 'name', 'asignatura'],
      programa: ['programa', 'program', 'carrera'],
      semestre: ['semestre', 'semester'],
      creditos: ['creditos', 'credits'],
      horas: ['horas', 'horas_acompanamiento'],
      temas: ['temas', 'contenidos', 'temario'],
    };

    const findHeader = (variants: string[]): string | undefined => {
      for (const variant of variants) {
        const normalized = variant.toLowerCase().replace(/\s+/g, '');
        const found = headers.find(h => h.toLowerCase().replace(/\s+/g, '') === normalized);
        if (found) return found;
      }
      return undefined;
    };

    const getValue = (row: string[], header: string | undefined): string => {
      if (!header) return '';
      const headerIndex = headers.indexOf(header);
      return headerIndex >= 0 ? row[headerIndex] || '' : '';
    };

    const results: PreviewResult[] = [];
    const existingCodes = new Set(
      (await db.subject.findMany({ select: { code: true } })).map(s => s.code)
    );

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,;]/).map(c => c.trim());
      if (!cols.some(v => v)) continue;

      const codigo = getValue(cols, findHeader(headerMap.codigo)).trim();
      const nombre = getValue(cols, findHeader(headerMap.nombre)).trim();
      const programa = getValue(cols, findHeader(headerMap.programa)).trim();
      const semestreStr = getValue(cols, findHeader(headerMap.semestre)).trim();
      const creditosStr = getValue(cols, findHeader(headerMap.creditos)).trim();
      const horasStr = getValue(cols, findHeader(headerMap.horas)).trim();
      const temasStr = getValue(cols, findHeader(headerMap.temas)).trim();

      const semestre = parseInt(semestreStr) || 1;
      const creditos = parseInt(creditosStr) || 0;
      const horas = parseInt(horasStr) || 0;

      const temas = temasStr
        ? temasStr
            .split(/[|;]/)
            .map(t => t.trim())
            .filter(t => t)
        : [];

      if (!codigo || !nombre) {
        results.push({
          codigoAsignatura: codigo || 'N/A',
          nombreAsignatura: nombre || 'Sin nombre',
          programa: '',
          semestre: 1,
          creditos: 0,
          horas: 0,
          temasCount: 0,
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
          horas,
          temasCount: temas.length,
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
        horas,
        temasCount: temas.length,
        status: 'success',
        message: 'Datos válidos',
      });
    }

    if (isPreview) {
      return NextResponse.json({ success: true, previewData: results });
    }

    const toCreate = results.filter(r => r.status === 'success');
    const created: string[] = [];
    const errors: string[] = [];

    for (const item of toCreate) {
      try {
        const temasStr = getValue(
          lines
            .slice(1)
            .find(l => l.includes(item.codigoAsignatura))
            ?.split(/[,;]/) || [],
          findHeader(headerMap.temas)
        );
        const temas = temasStr
          ? temasStr
              .split(/[|;]/)
              .map(t => t.trim())
              .filter(t => t)
          : [];

        const subject = await db.subject.create({
          data: {
            code: item.codigoAsignatura,
            name: item.nombreAsignatura,
            program: item.programa || null,
            semester: item.semestre,
            credits: item.creditos,
            directHours: item.horas,
          },
        });

        if (temas.length > 0) {
          const contentData = temas.map((tema, index) => ({
            subjectId: subject.id,
            type: 'TEMA',
            title: tema.trim(),
            order: index + 1,
          }));

          await db.subjectContent.createMany({
            data: contentData,
          });
        }

        created.push(item.codigoAsignatura);
      } catch (e) {
        errors.push(`Error creando ${item.codigoAsignatura}: ${(e as Error).message}`);
      }
    }

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

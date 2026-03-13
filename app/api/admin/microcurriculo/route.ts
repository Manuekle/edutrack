import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

const capitalize = (str: string) => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const semester = searchParams.get('semester') || 'all';
    
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (semester !== 'all') {
      where.semester = parseInt(semester);
    }

    const [subjects, total] = await db.$transaction([
      db.subject.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.subject.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      subjects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isPreview = searchParams.get('preview') === 'true';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // CSV Upload
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('utf-8').decode(buffer);

      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });

      const headers = parsed.meta.fields || [];

      // Flexible mapping for the legacy component
      const findHeader = (variants: string[]): string | undefined => {
        for (const variant of variants) {
          const normalized = variant.toLowerCase().replace(/[\s_]+/g, '');
          const found = headers.find(h => h.toLowerCase().replace(/[\s_]+/g, '') === normalized);
          if (found) return found;
        }
        return undefined;
      };

      const nameH = findHeader(['nombreasignatura', 'nombre', 'asignatura', 'subject']);
      const codeH = findHeader(['codigoasignatura', 'codigo', 'code', 'codigo_asignatura']);
      const programH = findHeader(['programa', 'program', 'programa_academico']);
      const semesterH = findHeader(['semestre', 'semester', 'nivel']);
      const hoursH = findHeader(['horas', 'directhours', 'horas_acompanamiento_directo']);

      const existingSubjects = await db.subject.findMany({ select: { code: true } });
      const existingCodes = new Set(existingSubjects.map(s => s.code));

      const previewData = parsed.data.map((row, index) => {
        const name = capitalize((row[nameH || ''] || '').trim());
        const code = (row[codeH || ''] || '').trim();
        const program = (row[programH || ''] || '').trim();
        const semester = parseInt((row[semesterH || ''] || '').trim()) || 1;
        const hours = parseInt((row[hoursH || ''] || '').trim()) || 0;

        let status: 'success' | 'error' | 'existing' = 'success';
        let message = 'Válido';

        if (!name || !code) {
          status = 'error';
          message = 'Faltan campos obligatorios';
        } else if (existingCodes.has(code)) {
          status = 'existing';
          message = 'Ya existe';
        }

        return {
          id: `preview-${index}`,
          codigoAsignatura: code,
          nombreAsignatura: name,
          programa: program,
          semestre: semester,
          horas: hours,
          status,
          message,
        };
      });

      return NextResponse.json({ success: true, previewData });
    } else {
      // JSON Upload (Confirmation)
      const body = await req.json();
      const { subjects } = body;

      if (!Array.isArray(subjects)) {
        return NextResponse.json({ error: 'Se esperaba un array de asignaturas' }, { status: 400 });
      }

      let created = 0;
      let updatedCount = 0;
      let errors = 0;

      for (const item of subjects) {
        try {
          const data = {
            name: capitalize(item.nombreAsignatura),
            code: item.codigoAsignatura,
            program: item.programa,
            semester: item.semestre,
            directHours: item.horas,
          };

          const existing = await db.subject.findFirst({
            where: { code: item.codigoAsignatura }
          });

          if (existing) {
            await db.subject.update({
              where: { id: existing.id },
              data
            });
            updatedCount++;
          } else {
            await db.subject.create({ data });
            created++;
          }
        } catch (e) {
          errors++;
        }
      }

      return NextResponse.json({
        success: true,
        summary: {
          created,
          updatedCount,
          errors
        }
      });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

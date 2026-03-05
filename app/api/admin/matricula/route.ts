import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface EnrollmentRow {
  documentoEstudiante: string;
  codigoAsignatura: string;
  grupo: string;
}

interface PreviewResult {
  documentoEstudiante: string;
  codigoAsignatura: string;
  grupo: string;
  jornada: string;
  estudianteNombre: string;
  subjectId: string | null;
  status: 'success' | 'error' | 'full' | 'existing';
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
    const documentoIdx = headers.findIndex(h => h.includes('documento'));
    const codigoIdx = headers.findIndex(h => h.includes('codigo') || h.includes('asignatura'));
    const grupoIdx = headers.findIndex(h => h.includes('grupo'));

    if (documentoIdx === -1 || codigoIdx === -1) {
      return NextResponse.json(
        { error: 'El archivo debe tener columnas: documento, codigo_asignatura, grupo' },
        { status: 400 }
      );
    }

    const rawRows: EnrollmentRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,;]/).map(c => c.trim());
      if (cols[documentoIdx] && cols[codigoIdx]) {
        rawRows.push({
          documentoEstudiante: cols[documentoIdx],
          codigoAsignatura: cols[codigoIdx],
          grupo: grupoIdx !== -1 ? cols[grupoIdx] : 'A',
        });
      }
    }

    const documentos = [...new Set(rawRows.map(r => r.documentoEstudiante))];
    const estudiantes = await db.user.findMany({
      where: {
        document: { in: documentos },
        role: 'ESTUDIANTE',
      },
      select: { id: true, document: true, name: true },
    });

    const codigos = [...new Set(rawRows.map(r => r.codigoAsignatura))];
    const subjects = await db.subject.findMany({
      where: { code: { in: codigos } },
      select: {
        id: true,
        code: true,
        group: true,
        jornada: true,
        studentIds: true,
      },
    });

    const subjectMap = new Map(subjects.map(s => [`${s.code}-${s.group || 'A'}`, s]));
    const results: PreviewResult[] = [];

    for (const row of rawRows) {
      const documento = row.documentoEstudiante.trim();
      const grupo = row.grupo?.trim() || 'A';

      if (!documento) {
        results.push({
          documentoEstudiante: documento,
          codigoAsignatura: row.codigoAsignatura,
          grupo,
          jornada: '',
          estudianteNombre: '',
          subjectId: null,
          status: 'error',
          message: 'Falta documento del estudiante',
        });
        continue;
      }

      const estudiante = estudiantes.find(e => e.document === documento);
      if (!estudiante) {
        results.push({
          documentoEstudiante: documento,
          codigoAsignatura: row.codigoAsignatura,
          grupo,
          jornada: '',
          estudianteNombre: '',
          subjectId: null,
          status: 'error',
          message: 'Estudiante no encontrado',
        });
        continue;
      }

      const key = `${row.codigoAsignatura}-${grupo}`;
      const subject = subjectMap.get(key);

      if (!subject) {
        results.push({
          documentoEstudiante: documento,
          codigoAsignatura: row.codigoAsignatura,
          grupo,
          jornada: '',
          estudianteNombre: estudiante.name || '',
          subjectId: null,
          status: 'error',
          message: `Asignatura ${row.codigoAsignatura} con grupo ${grupo} no encontrada`,
        });
        continue;
      }

      const existingStudentIds = subject.studentIds || [];
      if (existingStudentIds.includes(estudiante.id)) {
        results.push({
          documentoEstudiante: documento,
          codigoAsignatura: row.codigoAsignatura,
          grupo,
          jornada: subject.jornada || '',
          estudianteNombre: estudiante.name || '',
          subjectId: subject.id,
          status: 'existing',
          message: 'Estudiante ya matriculado',
        });
        continue;
      }

      results.push({
        documentoEstudiante: documento,
        codigoAsignatura: row.codigoAsignatura,
        grupo,
        jornada: subject.jornada || '',
        estudianteNombre: estudiante.name || '',
        subjectId: subject.id,
        status: 'success',
        message: 'Listo para matricular',
      });
    }

    if (isPreview) {
      return NextResponse.json({
        preview: results,
        summary: {
          total: results.length,
          success: results.filter(r => r.status === 'success').length,
          existing: results.filter(r => r.status === 'existing').length,
          errors: results.filter(r => r.status === 'error').length,
        },
      });
    }

    const toEnroll = results.filter(r => r.status === 'success');

    const enrollBySubject = new Map<string, string[]>();
    for (const item of toEnroll) {
      if (!item.subjectId) continue;
      if (!enrollBySubject.has(item.subjectId)) {
        enrollBySubject.set(item.subjectId, []);
      }
      const estudiante = estudiantes.find(e => e.document === item.documentoEstudiante);
      if (estudiante) {
        enrollBySubject.get(item.subjectId)!.push(estudiante.id);
      }
    }

    await db.$transaction(async tx => {
      for (const [subjectId, studentIds] of enrollBySubject.entries()) {
        const subject = await tx.subject.findUnique({
          where: { id: subjectId },
          select: { studentIds: true },
        });

        if (subject) {
          const existingIds = new Set(subject.studentIds || []);
          const newIds = studentIds.filter(id => !existingIds.has(id));

          if (newIds.length > 0) {
            await tx.subject.update({
              where: { id: subjectId },
              data: {
                studentIds: { push: newIds },
              },
            });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        enrolled: toEnroll.length,
        existing: results.filter(r => r.status === 'existing').length,
        errors: results.filter(r => r.status === 'error').length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

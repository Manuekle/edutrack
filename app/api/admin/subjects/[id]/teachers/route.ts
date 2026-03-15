import { authOptions } from '@/lib/auth';
import { detectDelimiter, parseCSVLine, validateCSVHeaders } from '@/lib/csv-parser';
import { decodeCSVBuffer } from '@/lib/csv-encoding';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface TeacherAssignmentRow {
  codigoAsignatura: string;
  documentoDocente: string;
}

interface PreviewResult {
  codigoAsignatura: string;
  documentoDocente: string;
  docenteNombre: string;
  status: 'success' | 'error' | 'existing';
  message: string;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: subjectId } = await params;

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      include: { teachers: { select: { id: true, name: true, document: true } } },
    });

    if (!subject) {
      return NextResponse.json({ error: 'Asignatura no encontrada' }, { status: 404 });
    }

    const url = new URL(request.url, `https://${request.headers.get('host')}`);
    const isPreview = url.searchParams.get('preview') === 'true';

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = decodeCSVBuffer(buffer);
    const delimiter = detectDelimiter(text);
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 });
    }

    const headers = parseCSVLine(lines[0], delimiter);
    const requiredHeaders = ['codigoAsignatura', 'documentoDocente'];
    const validation = validateCSVHeaders(headers, requiredHeaders);

    if (!validation.valid) {
      return NextResponse.json(
        { error: `Faltan headers requeridos: ${validation.missing.join(', ')}` },
        { status: 400 }
      );
    }

    const findHeader = (variants: string[]): string | undefined => {
      for (const variant of variants) {
        const normalized = variant.toLowerCase().replace(/\s+/g, '');
        const found = headers.find(h => h.toLowerCase().replace(/\s+/g, '') === normalized);
        if (found) return found;
      }
      return undefined;
    };

    const getValue = (row: string[], variants: string[]): string => {
      const header = findHeader(variants);
      if (!header) return '';
      const index = headers.indexOf(header);
      return row[index] || '';
    };

    const results: PreviewResult[] = [];
    const existingTeacherDocs = new Set(subject.teachers.map(t => t.document).filter(Boolean));

    // Buscar docentes por documento o correo
    const allDocentes = await db.user.findMany({
      where: { role: Role.DOCENTE },
      select: {
        id: true,
        name: true,
        document: true,
        institutionalEmail: true,
        personalEmail: true,
      },
    });

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter);
      if (!values.some(v => v.trim())) continue;

      const documento = getValue(values, [
        'documentoDocente',
        'documento',
        'document',
        'docente',
      ]).trim();

      if (!documento) {
        results.push({
          codigoAsignatura: subject.code,
          documentoDocente: '',
          docenteNombre: '',
          status: 'error',
          message: 'Falta documento del docente',
        });
        continue;
      }

      const docente = allDocentes.find(
        d =>
          d.document === documento ||
          d.institutionalEmail?.toLowerCase() === documento.toLowerCase() ||
          d.personalEmail?.toLowerCase() === documento.toLowerCase()
      );

      if (!docente) {
        results.push({
          codigoAsignatura: subject.code,
          documentoDocente: documento,
          docenteNombre: '',
          status: 'error',
          message: 'Docente no encontrado en el sistema',
        });
        continue;
      }

      if (existingTeacherDocs.has(docente.document || '')) {
        results.push({
          codigoAsignatura: subject.code,
          documentoDocente: documento,
          docenteNombre: docente.name || 'Sin nombre',
          status: 'existing',
          message: 'Ya está asignado a esta asignatura',
        });
        continue;
      }

      results.push({
        codigoAsignatura: subject.code,
        documentoDocente: documento,
        docenteNombre: docente.name || 'Sin nombre',
        status: 'success',
        message: 'Docente válido para asignar',
      });
    }

    if (isPreview) {
      return NextResponse.json({ success: true, previewData: results });
    }

    // Regla: solo un docente por materia y grupo
    if (subject.teachers.length >= 1) {
      return NextResponse.json(
        {
          error:
            'No se puede asignar más de un docente a la misma materia con el mismo grupo. Esta asignatura ya tiene un docente asignado.',
        },
        { status: 400 }
      );
    }

    // Asignar un único docente (solo el primero del CSV)
    const toAssign = results.filter(r => r.status === 'success');
    const teacherIdToAdd =
      toAssign.length > 0
        ? (() => {
            const docente = allDocentes.find(d => d.document === toAssign[0].documentoDocente);
            return docente?.id;
          })()
        : null;

    if (teacherIdToAdd) {
      await db.subject.update({
        where: { id: subjectId },
        data: {
          teacherIds: {
            set: [teacherIdToAdd],
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        assigned: teacherIdToAdd ? 1 : 0,
        existing: results.filter(r => r.status === 'existing').length,
        errors: results.filter(r => r.status === 'error').length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

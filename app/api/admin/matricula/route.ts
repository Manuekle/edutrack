import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const grupoNombre = searchParams.get('grupoNombre');
    const periodo = searchParams.get('periodo');

    const where: Record<string, unknown> = {};
    if (grupoNombre) where.grupoNombre = grupoNombre;
    if (periodo) where.periodoAcademico = periodo;

    const assignments = await db.groupAssignment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            document: true,
            correoInstitucional: true,
            codigoEstudiantil: true,
          },
        },
      },
      orderBy: [{ grupoNombre: 'asc' }, { periodoAcademico: 'desc' }],
    });

    // Group by grupoNombre + periodoAcademico
    const groupMap = new Map<string, {
      grupoNombre: string;
      periodoAcademico: string;
      students: { id: string; name: string | null; document: string | null; correoInstitucional: string | null; codigoEstudiantil: string | null }[];
    }>();

    for (const a of assignments) {
      const key = `${a.grupoNombre}|${a.periodoAcademico}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          grupoNombre: a.grupoNombre,
          periodoAcademico: a.periodoAcademico,
          students: [],
        });
      }
      groupMap.get(key)!.students.push(a.student);
    }

    return NextResponse.json({
      groups: Array.from(groupMap.values()),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { studentId, grupoNombre, periodoAcademico } = await request.json();

    if (!studentId || !grupoNombre || !periodoAcademico) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    await db.groupAssignment.delete({
      where: {
        studentId_grupoNombre_periodoAcademico: {
          studentId,
          grupoNombre,
          periodoAcademico,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

interface AssignmentRow {
  documentoEstudiante: string;
  grupoNombre: string;
  periodoAcademico: string;
}

interface PreviewResult {
  documentoEstudiante: string;
  nombreEstudiante: string;
  grupoNombre: string;
  periodoAcademico: string;
  estudianteId?: string;
  status: 'success' | 'error' | 'existing' | 'manual';
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
    let rawRows: AssignmentRow[] = [];

    if (contentType.includes('multipart/form-data')) {
      // CSV upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('utf-8').decode(buffer);
      const lines = text.split(/\r?\n/).filter(l => l.trim());

      if (lines.length < 2) {
        return NextResponse.json({ error: 'El archivo CSV está vacío o solo tiene encabezados' }, { status: 400 });
      }

      const headers = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim());
      const docIdx = headers.findIndex(h => h.includes('documento') || h.includes('cedula'));
      const grupoIdx = headers.findIndex(h => h.includes('grupo') || h.includes('destino'));
      const periodoIdx = headers.findIndex(h => h.includes('periodo') || h.includes('academico'));

      if (docIdx === -1 || grupoIdx === -1) {
        return NextResponse.json(
          { error: 'El archivo debe tener columnas: documento_estudiante, grupo_destino, periodo_academico' },
          { status: 400 }
        );
      }

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;]/).map(c => c.trim());
        if (cols[docIdx]) {
          rawRows.push({
            documentoEstudiante: cols[docIdx],
            grupoNombre: grupoIdx !== -1 ? cols[grupoIdx] : '',
            periodoAcademico: periodoIdx !== -1 ? cols[periodoIdx] : '',
          });
        }
      }
    } else {
      // JSON body (manual)
      const body = await request.json();
      rawRows = body.assignments as AssignmentRow[];
    }

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ error: 'No hay datos para procesar' }, { status: 400 });
    }

    // Lookup students
    const documentos = [...new Set(rawRows.map(r => r.documentoEstudiante))];
    const estudiantes = await db.user.findMany({
      where: { document: { in: documentos }, role: 'ESTUDIANTE' },
      select: { id: true, name: true, document: true },
    });

    const estudianteMap = new Map(estudiantes.map(e => [e.document!, e]));

    // Check existing assignments
    const existingAssignments = await db.groupAssignment.findMany({
      where: {
        studentId: { in: estudiantes.map(e => e.id) },
        grupoNombre: { in: [...new Set(rawRows.map(r => r.grupoNombre))] },
      },
      select: { studentId: true, grupoNombre: true, periodoAcademico: true },
    });

    const existingSet = new Set(
      existingAssignments.map(a => `${a.studentId}-${a.grupoNombre}-${a.periodoAcademico}`)
    );

    const results: PreviewResult[] = [];

    for (const row of rawRows) {
      const estudiante = estudianteMap.get(row.documentoEstudiante.trim());

      if (!row.documentoEstudiante?.trim()) {
        results.push({
          documentoEstudiante: row.documentoEstudiante,
          nombreEstudiante: '',
          grupoNombre: row.grupoNombre,
          periodoAcademico: row.periodoAcademico,
          status: 'error',
          message: 'Falta el documento del estudiante',
        });
        continue;
      }

      if (!row.grupoNombre?.trim()) {
        results.push({
          documentoEstudiante: row.documentoEstudiante,
          nombreEstudiante: estudiante?.name || '',
          grupoNombre: row.grupoNombre,
          periodoAcademico: row.periodoAcademico,
          status: 'error',
          message: 'Falta el nombre del grupo',
        });
        continue;
      }

      if (!estudiante) {
        results.push({
          documentoEstudiante: row.documentoEstudiante,
          nombreEstudiante: '',
          grupoNombre: row.grupoNombre,
          periodoAcademico: row.periodoAcademico,
          status: 'error',
          message: 'Estudiante no encontrado en el sistema',
        });
        continue;
      }

      const key = `${estudiante.id}-${row.grupoNombre}-${row.periodoAcademico}`;
      if (existingSet.has(key)) {
        results.push({
          documentoEstudiante: row.documentoEstudiante,
          nombreEstudiante: estudiante.name || '',
          grupoNombre: row.grupoNombre,
          periodoAcademico: row.periodoAcademico,
          estudianteId: estudiante.id,
          status: 'existing',
          message: 'Estudiante ya asignado a este grupo en el mismo periodo',
        });
        continue;
      }

      results.push({
        documentoEstudiante: row.documentoEstudiante,
        nombreEstudiante: estudiante.name || '',
        grupoNombre: row.grupoNombre,
        periodoAcademico: row.periodoAcademico,
        estudianteId: estudiante.id,
        status: 'success',
        message: 'Listo para asignar',
      });
    }

    if (isPreview) {
      return NextResponse.json({
        success: true,
        preview: results,
        summary: {
          total: results.length,
          success: results.filter(r => r.status === 'success').length,
          existing: results.filter(r => r.status === 'existing').length,
          errors: results.filter(r => r.status === 'error').length,
        },
      });
    }

    // Confirm — save to DB
    const toCreate = results.filter(r => r.status === 'success');

    await db.$transaction(async tx => {
      for (const item of toCreate) {
        if (!item.estudianteId) continue;
        await tx.groupAssignment.upsert({
          where: {
            studentId_grupoNombre_periodoAcademico: {
              studentId: item.estudianteId,
              grupoNombre: item.grupoNombre,
              periodoAcademico: item.periodoAcademico,
            },
          },
          create: {
            studentId: item.estudianteId,
            grupoNombre: item.grupoNombre,
            periodoAcademico: item.periodoAcademico,
          },
          update: {},
        });
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        assigned: toCreate.length,
        existing: results.filter(r => r.status === 'existing').length,
        errors: results.filter(r => r.status === 'error').length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

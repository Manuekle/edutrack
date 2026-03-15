import { authOptions } from '@/lib/auth';
import { decodeCSVBuffer } from '@/lib/csv-encoding';
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
    const groupCode = searchParams.get('groupCode');
    const period = searchParams.get('period');

    const groups = await db.group.findMany({
      where: {
        ...(groupCode ? { code: groupCode } : {}),
        ...(period ? { academicPeriod: period } : {}),
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            document: true,
            institutionalEmail: true,
            studentCode: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      },
      orderBy: [{ academicPeriod: 'desc' }, { code: 'asc' }],
    });

    return NextResponse.json({
      groups: groups.map(g => ({
        id: g.id,
        groupCode: g.code,
        subjectId: g.subjectId,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        academicPeriod: g.academicPeriod,
        students: g.students,
      })),
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

    const { studentId, groupId } = await request.json();

    if (!studentId || !groupId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const group = await db.group.findUnique({
      where: { id: groupId },
      select: { studentIds: true, subjectId: true },
    });

    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const updatedStudentIds = group.studentIds.filter(id => id !== studentId);

    await db.group.update({
      where: { id: groupId },
      data: {
        studentIds: {
          set: updatedStudentIds,
        },
      },
    });

    // Also update subject if necessary
    if (group.subjectId) {
      const subject = await db.subject.findUnique({
        where: { id: group.subjectId },
        select: { studentIds: true },
      });
      if (subject) {
        await db.subject.update({
          where: { id: group.subjectId },
          data: {
            studentIds: {
              set: subject.studentIds.filter(id => id !== studentId),
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

interface AssignmentRow {
  studentDocument: string;
  groupCode: string;
  subjectCode: string;
  academicPeriod: string;
}

interface PreviewResult {
  studentDocument: string;
  studentName: string;
  groupCode: string;
  subjectCode: string;
  academicPeriod: string;
  studentId?: string;
  groupId?: string;
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
      const text = decodeCSVBuffer(buffer);
      const lines = text.split(/\r?\n/).filter(l => l.trim());

      if (lines.length < 2) {
        return NextResponse.json(
          { error: 'El archivo CSV está vacío o solo tiene encabezados' },
          { status: 400 }
        );
      }

      const headers = lines[0]
        .toLowerCase()
        .split(/[,;]/)
        .map(h => h.trim());
      const docIdx = headers.findIndex(h => h.includes('documento') || h.includes('cedula') || h.includes('student'));
      const grupoIdx = headers.findIndex(h => h.includes('grupo') || h.includes('destino') || h.includes('group'));
      const subjectIdx = headers.findIndex(h => h.includes('asignatura') || h.includes('materia') || h.includes('subject'));
      const periodoIdx = headers.findIndex(h => h.includes('periodo') || h.includes('academico') || h.includes('period'));

      if (docIdx === -1 || grupoIdx === -1 || subjectIdx === -1) {
        return NextResponse.json(
          {
            error:
              'El archivo debe tener columnas: documento_estudiante, grupo, codigo_asignatura, periodo_academico',
          },
          { status: 400 }
        );
      }

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;]/).map(c => c.trim());
        if (cols[docIdx]) {
          rawRows.push({
            studentDocument: cols[docIdx],
            groupCode: cols[grupoIdx] || 'A',
            subjectCode: cols[subjectIdx] || '',
            academicPeriod: periodoIdx !== -1 ? cols[periodoIdx] : '',
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
    const studentDocuments = [...new Set(rawRows.map(r => r.studentDocument))];
    const students = await db.user.findMany({
      where: { document: { in: studentDocuments }, role: 'ESTUDIANTE' },
      select: { id: true, name: true, document: true },
    });

    const studentMap = new Map(students.map(e => [e.document!, e]));

    // Lookup Groups
    const subjectCodes = [...new Set(rawRows.map(r => r.subjectCode))];
    const periods = [...new Set(rawRows.map(r => r.academicPeriod))];
    const groupCodes = [...new Set(rawRows.map(r => r.groupCode))];

    const allGroups = await db.group.findMany({
      where: {
        code: { in: groupCodes },
        academicPeriod: { in: periods },
        subject: { code: { in: subjectCodes } },
      },
      include: { subject: { select: { code: true } } },
    });

    const groupMap = new Map();
    for (const g of allGroups) {
      groupMap.set(`${g.subject.code}-${g.code}-${g.academicPeriod}`, g);
    }

    const results: PreviewResult[] = [];

    for (const row of rawRows) {
      const student = studentMap.get(row.studentDocument.trim());
      const group = groupMap.get(`${row.subjectCode}-${row.groupCode}-${row.academicPeriod}`);

      if (!row.studentDocument?.trim()) {
        results.push({
          studentDocument: row.studentDocument,
          studentName: '',
          groupCode: row.groupCode,
          subjectCode: row.subjectCode,
          academicPeriod: row.academicPeriod,
          status: 'error',
          message: 'Falta el documento del estudiante',
        });
        continue;
      }

      if (!student) {
        results.push({
          studentDocument: row.studentDocument,
          studentName: '',
          groupCode: row.groupCode,
          subjectCode: row.subjectCode,
          academicPeriod: row.academicPeriod,
          status: 'error',
          message: 'Estudiante no encontrado en el sistema',
        });
        continue;
      }

      if (!group) {
        results.push({
          studentDocument: row.studentDocument,
          studentName: student.name || '',
          groupCode: row.groupCode,
          subjectCode: row.subjectCode,
          academicPeriod: row.academicPeriod,
          status: 'error',
          message: 'Grupo no encontrado para esta asignatura y periodo',
        });
        continue;
      }

      const isAlreadyEnrolled = group.studentIds.includes(student.id);
      if (isAlreadyEnrolled) {
        results.push({
          studentDocument: row.studentDocument,
          studentName: student.name || '',
          groupCode: row.groupCode,
          subjectCode: row.subjectCode,
          academicPeriod: row.academicPeriod,
          studentId: student.id,
          groupId: group.id,
          status: 'existing',
          message: 'Estudiante ya asignado a este grupo',
        });
        continue;
      }

      results.push({
        studentDocument: row.studentDocument,
        studentName: student.name || '',
        groupCode: row.groupCode,
        subjectCode: row.subjectCode,
        academicPeriod: row.academicPeriod,
        studentId: student.id,
        groupId: group.id,
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
        if (!item.studentId || !item.groupId) continue;
        await tx.group.update({
          where: { id: item.groupId },
          data: {
            studentIds: {
              push: item.studentId,
            },
          },
        });
        // Also add to subject studentIds for backward compatibility/fast lookup
        const group = allGroups.find(g => g.id === item.groupId);
        if (group?.subjectId) {
          await tx.subject.update({
            where: { id: group.subjectId },
            data: {
              studentIds: {
                push: item.studentId,
              },
            },
          });
        }
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

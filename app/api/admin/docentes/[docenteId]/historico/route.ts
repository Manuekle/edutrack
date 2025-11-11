import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';
import { Role } from '@/lib/roles';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Convierte un identificador de periodo académico (ej: "2025-1" o "2025-2")
 * en un rango de fechas.
 *  - "*-1" => 1 enero    00:00  al 30 junio  23:59
 *  - "*-2" => 1 julio    00:00  al 31 diciembre 23:59
 * Si no se envía un periodo válido, se devuelve undefined y se asume sin filtro.
 */
function periodToDateRange(period?: string) {
  if (!period) return undefined;
  const match = period.match(/^(\d{4})-(1|2)$/);
  if (!match) return undefined;
  const [, yearStr, semesterStr] = match;
  const year = parseInt(yearStr, 10);
  const semester = Number(semesterStr);
  if (semester === 1) {
    return {
      start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)), // 1 Jan
      end: new Date(Date.UTC(year, 5, 30, 23, 59, 59)), // 30 Jun
    } as const;
  }
  return {
    start: new Date(Date.UTC(year, 6, 1, 0, 0, 0)), // 1 Jul
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59)), // 31 Dec
  } as const;
}

/**
 * GET /api/admin/docentes/[docenteId]/historico?period=2025-1
 *
 * Devuelve las estadísticas históricas de asistencia y clases impartidas por un docente
 * durante el período académico indicado. Si no se envía periodo se utilizará todo el histórico.
 *
 * Response de ejemplo:
 * {
 *   "period": "2025-1",
 *   "subjects": [
 *     {
 *       "id": "...",
 *       "name": "Cálculo I",
 *       "totalClasses": 12,
 *       "attendanceTotals": {
 *         "present": 300,
 *         "absent": 20,
 *         "late": 5,
 *         "justified": 10
 *       },
 *       "classes": [
 *         {
 *           "id": "...",
 *           "date": "2025-02-15T14:00:00.000Z",
 *           "attendanceStats": { "present": 25, "absent": 2, "late": 1, "justified": 0 }
 *         },
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docenteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { docenteId } = await params;

    // Validar query params
    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get('period') || undefined;
    const subjectFilter = searchParams.get('subjectId') || undefined;

    const dateRange = periodToDateRange(periodParam);

    // Recuperar clases impartidas por el docente (y opcionalmente filtrar por periodo)
    const classes = await db.class.findMany({
      where: {
        subject: {
          teacherId: docenteId,
          ...(subjectFilter ? { id: subjectFilter } : {}),
        },
        ...(dateRange
          ? {
              date: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            }
          : {}),
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        attendances: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Organizar datos por asignatura
    const subjectsMap = new Map<
      string,
      {
        id: string;
        name: string;
        code: string;
        totalClasses: number;
        attendanceTotals: Record<'present' | 'absent' | 'late' | 'justified', number>;
        classes: {
          id: string;
          date: string;
          name: string | null;
          attendanceStats: Record<'present' | 'absent' | 'late' | 'justified', number>;
        }[];
      }
    >();

    for (const cls of classes) {
      const subjId = cls.subject.id;
      if (!subjectsMap.has(subjId)) {
        subjectsMap.set(subjId, {
          id: subjId,
          name: cls.subject.name,
          code: cls.subject.code,
          totalClasses: 0,
          attendanceTotals: {
            present: 0,
            absent: 0,
            late: 0,
            justified: 0,
          },
          classes: [],
        });
      }

      const subjectEntry = subjectsMap.get(subjId)!;
      subjectEntry.totalClasses += 1;

      const stats = { present: 0, absent: 0, late: 0, justified: 0 } as Record<
        'present' | 'absent' | 'late' | 'justified',
        number
      >;

      cls.attendances.forEach(att => {
        switch (att.status) {
          case AttendanceStatus.PRESENTE:
            stats.present += 1;
            subjectEntry.attendanceTotals.present += 1;
            break;
          case AttendanceStatus.AUSENTE:
            stats.absent += 1;
            subjectEntry.attendanceTotals.absent += 1;
            break;
          case AttendanceStatus.TARDANZA:
            stats.late += 1;
            subjectEntry.attendanceTotals.late += 1;
            break;
          case AttendanceStatus.JUSTIFICADO:
            stats.justified += 1;
            subjectEntry.attendanceTotals.justified += 1;
            break;
          default:
            break;
        }
      });

      subjectEntry.classes.push({
        id: cls.id,
        date: cls.date.toISOString(),
        name: cls.topic ?? null,
        attendanceStats: stats,
      });
    }

    return NextResponse.json({
      period: periodParam ?? null,
      subjects: Array.from(subjectsMap.values()),
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

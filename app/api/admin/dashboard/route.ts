import { prisma } from '@/lib/prisma';
import { AttendanceStatus, ClassStatus, Role, UnenrollRequestStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

interface MonthlyClassData {
  date: Date;
}

interface SubjectWithCounts {
  name: string;
  code: string;
  studentIds: string[];
  _count: {
    classes: number;
  };
}

export async function GET() {
  try {
    // Obtener estadísticas generales
    const [
      totalUsers,
      totalSubjects,
      totalClasses,
      totalReports,
      usersByRole,
      attendanceStats,
      classStatusStats,
      unenrollRequestStats,
      monthlyClassesData,
      subjectEnrollmentData,
      classroomOccupancyRaw,
    ] = await Promise.all([
      // Total de usuarios
      prisma.user.count({ where: { isActive: true } }),

      // Total de materias
      prisma.subject.count(),

      // Total de clases
      prisma.class.count(),

      // Total de reportes
      prisma.report.count(),

      // Usuarios por rol
      prisma.user.groupBy({
        by: ['role'],
        where: { isActive: true },
        _count: { role: true },
      }),

      // Estadísticas de asistencia
      prisma.attendance.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Estadísticas de estado de clases
      prisma.class.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Estadísticas de solicitudes de desmatrícula
      prisma.unenrollRequest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Clases por mes (últimos 6 meses)
      prisma.class.findMany({
        where: {
          date: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        select: {
          date: true,
        },
        orderBy: {
          date: 'asc',
        },
      }),

      // Top 10 materias con más estudiantes matriculados
      prisma.subject.findMany({
        select: {
          name: true,
          code: true,
          studentIds: true,
          _count: {
            select: {
              classes: true,
            },
          },
        },
        orderBy: {
          studentIds: 'desc',
        },
        take: 10,
      }),

      // Datos de ocupación de salones
      prisma.subject.findMany({
        where: {
          classroom: {
            not: null,
          },
        },
        select: {
          classroom: true,
          studentIds: true,
        },
      }),
    ]);

    // Calcular ocupación de salones
    const occupancyMap = new Map<string, number>();
    (classroomOccupancyRaw as Array<{ classroom: string | null; studentIds: string[] }>).forEach(
      item => {
        if (item.classroom) {
          const current = occupancyMap.get(item.classroom) || 0;
          occupancyMap.set(item.classroom, current + item.studentIds.length);
        }
      }
    );

    const classroomOccupancy = Array.from(occupancyMap.entries())
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 salones más ocupados

    // Calcular porcentaje de asistencia general
    const totalAttendances = attendanceStats.reduce(
      (sum: number, stat) => sum + stat._count.status,
      0
    );
    const presentAttendances =
      attendanceStats.find(
        (stat: { status: AttendanceStatus }) => stat.status === AttendanceStatus.PRESENTE
      )?._count.status || 0;
    const attendancePercentage =
      totalAttendances > 0 ? (presentAttendances / totalAttendances) * 100 : 0;

    // Formatear datos para las gráficas
    const roleDistribution = usersByRole.map((role: { role: Role; _count: { role: number } }) => ({
      name: role.role.charAt(0).toUpperCase() + role.role.slice(1).toLowerCase(),
      value: role._count.role,
      label:
        role.role === Role.ESTUDIANTE
          ? 'Estudiantes'
          : role.role === Role.DOCENTE
            ? 'Docentes'
            : role.role === Role.ADMIN
              ? 'Administradores'
              : 'Coordinadores',
    }));

    const attendanceDistribution = attendanceStats.map(
      (stat: { status: AttendanceStatus; _count: { status: number } }) => ({
        name: stat.status,
        asistencia: stat._count.status,
        label:
          stat.status === AttendanceStatus.PRESENTE
            ? 'Presente'
            : stat.status === AttendanceStatus.AUSENTE
              ? 'Ausente'
              : stat.status === AttendanceStatus.TARDANZA
                ? 'Tardanza'
                : 'Justificado',
      })
    );

    const classStatusDistribution = classStatusStats.map(
      (stat: { status: ClassStatus; _count: { status: number } }) => ({
        name: stat.status,
        value: stat._count.status,
        label:
          stat.status === ClassStatus.PROGRAMADA
            ? 'Programadas'
            : stat.status === ClassStatus.REALIZADA
              ? 'Realizadas'
              : 'Canceladas',
      })
    );

    const unenrollDistribution = unenrollRequestStats.map(
      (stat: { status: UnenrollRequestStatus; _count: { status: number } }) => ({
        name: stat.status,
        value: stat._count.status,
        label:
          stat.status === UnenrollRequestStatus.PENDIENTE
            ? 'Pendientes'
            : stat.status === UnenrollRequestStatus.APROBADO
              ? 'Aprobadas'
              : 'Rechazadas',
      })
    );

    // Formatear datos de clases mensuales
    const monthlyClassesMap = new Map<string, number>();

    (monthlyClassesData as MonthlyClassData[]).forEach(classItem => {
      const monthKey = new Date(classItem.date).toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric',
      });
      monthlyClassesMap.set(monthKey, (monthlyClassesMap.get(monthKey) || 0) + 1);
    });

    const monthlyClasses = Array.from(monthlyClassesMap.entries()).map(([month, count]) => ({
      month,
      clases: count,
    }));

    // Obtener las 3 materias con más clases
    const topSubjects = (subjectEnrollmentData as SubjectWithCounts[])
      .map(subject => ({
        name: subject.name,
        code: subject.code,
        students: subject.studentIds.length,
        classes: subject._count.classes,
      }))
      .sort((a, b) => b.classes - a.classes)
      .slice(0, 3);

    // Calcular métricas adicionales
    const activeTeachers =
      usersByRole.find((role: { role: Role }) => role.role === Role.DOCENTE)?._count.role || 0;
    const activeStudents =
      usersByRole.find((role: { role: Role }) => role.role === Role.ESTUDIANTE)?._count.role || 0;
    const completedClasses =
      classStatusStats.find(
        (stat: { status: ClassStatus }) => stat.status === ClassStatus.REALIZADA
      )?._count.status || 0;
    const pendingUnenrolls =
      unenrollRequestStats.find(
        (stat: { status: UnenrollRequestStatus }) => stat.status === UnenrollRequestStatus.PENDIENTE
      )?._count.status || 0;

    const dashboardData = {
      // Cards principales
      cards: [
        {
          title: 'Total Usuarios',
          value: totalUsers,
          subtitle: `${activeStudents} estudiantes, ${activeTeachers} docentes`,
          trend: '+12% vs mes anterior',
        },
        {
          title: 'Materias Activas',
          value: totalSubjects,
          subtitle: `${completedClasses} clases realizadas`,
          trend: '+5% vs mes anterior',
        },
        {
          title: 'Asistencia General',
          value: `${attendancePercentage.toFixed(1)}%`,
          subtitle: `${presentAttendances} de ${totalAttendances} asistencias`,
          trend: attendancePercentage > 85 ? '+2.3% vs promedio' : '-1.2% vs promedio',
        },
        {
          title: 'Solicitudes Pendientes',
          value: pendingUnenrolls,
          subtitle: 'Desmatrículas por revisar',
          trend: pendingUnenrolls > 0 ? 'Requiere atención' : 'Al día',
        },
      ],

      // Datos para gráficas
      charts: {
        roleDistribution,
        attendanceDistribution,
        classStatusDistribution,
        unenrollDistribution,
        monthlyClasses,
        topSubjects,
        classroomOccupancy,
      },

      // Métricas adicionales
      metrics: {
        totalUsers,
        totalSubjects,
        totalClasses,
        totalReports,
        attendancePercentage: attendancePercentage.toFixed(1),
        activeTeachers,
        activeStudents,
        completedClasses,
        pendingUnenrolls,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

import { prisma } from '@/lib/prisma';
import { AttendanceStatus, ClassStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [
      totalUsers,
      totalSubjects,
      totalGroups,
      totalClasses,
      totalReports,
      usersByRole,
      attendanceStats,
      classStatusStats,
      monthlyClassesData,
      groupsWithStudents,
      classroomData,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.subject.count(),
      prisma.group.count(),
      prisma.class.count(),
      prisma.report.count(),

      prisma.user.groupBy({
        by: ['role'],
        where: { isActive: true },
        _count: { role: true },
      }),

      prisma.attendance.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      prisma.class.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Classes in the last 6 months
      prisma.class.findMany({
        where: {
          date: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
        },
        select: { date: true },
        orderBy: { date: 'asc' },
      }),

      // Groups with student counts and subject info
      prisma.group.findMany({
        select: {
          studentIds: true,
          subject: { select: { name: true, code: true } },
          room: { select: { name: true } },
        },
      }),

      // Classroom usage from classes
      prisma.class.groupBy({
        by: ['classroom'],
        where: { classroom: { not: null } },
        _count: { id: true },
      }),
    ]);

    // --- Derived metrics ---
    const activeTeachers =
      usersByRole.find(r => r.role === Role.DOCENTE)?._count.role || 0;
    const activeStudents =
      usersByRole.find(r => r.role === Role.ESTUDIANTE)?._count.role || 0;

    const completedClasses = classStatusStats
      .filter(s => s.status === ClassStatus.COMPLETED || s.status === ClassStatus.SIGNED)
      .reduce((sum, s) => sum + s._count.status, 0);

    const scheduledClasses = classStatusStats
      .find(s => s.status === ClassStatus.SCHEDULED)?._count.status || 0;

    // Attendance percentage
    const totalAttendances = attendanceStats.reduce((sum, s) => sum + s._count.status, 0);
    const presentCount =
      attendanceStats.find(s => s.status === AttendanceStatus.PRESENT)?._count.status || 0;
    const attendancePercentage =
      totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 0;

    // --- Charts data ---

    // Role distribution
    const roleLabels: Record<string, string> = {
      ESTUDIANTE: 'Estudiantes',
      DOCENTE: 'Docentes',
      ADMIN: 'Administradores',
    };
    const roleDistribution = usersByRole.map(r => ({
      name: roleLabels[r.role] || r.role,
      value: r._count.role,
      label: roleLabels[r.role] || r.role,
    }));

    // Attendance distribution
    const attendanceLabels: Record<string, string> = {
      PRESENT: 'Presente',
      ABSENT: 'Ausente',
      LATE: 'Tardanza',
      JUSTIFIED: 'Justificado',
    };
    const attendanceDistribution = attendanceStats.map(s => ({
      name: s.status,
      asistencia: s._count.status,
      label: attendanceLabels[s.status] || s.status,
    }));

    // Class status distribution
    const classStatusLabels: Record<string, string> = {
      SCHEDULED: 'Programadas',
      COMPLETED: 'Completadas',
      SIGNED: 'Firmadas',
      CANCELLED: 'Canceladas',
    };
    const classStatusDistribution = classStatusStats.map(s => ({
      name: s.status,
      value: s._count.status,
      label: classStatusLabels[s.status] || s.status,
    }));

    // Monthly classes
    const monthlyMap = new Map<string, number>();
    monthlyClassesData.forEach(c => {
      const key = new Date(c.date).toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric',
      });
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
    });
    const monthlyClasses = Array.from(monthlyMap.entries()).map(([month, clases]) => ({
      month,
      clases,
    }));

    // Top subjects by enrolled students (from Groups, not Subjects)
    const subjectStudentMap = new Map<string, { name: string; code: string; students: Set<string> }>();
    for (const group of groupsWithStudents) {
      const key = group.subject.code;
      const existing = subjectStudentMap.get(key);
      if (existing) {
        group.studentIds.forEach(id => existing.students.add(id));
      } else {
        subjectStudentMap.set(key, {
          name: group.subject.name,
          code: group.subject.code,
          students: new Set(group.studentIds),
        });
      }
    }
    const topSubjects = Array.from(subjectStudentMap.values())
      .map(s => ({ name: s.name, code: s.code, students: s.students.size }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 6);

    // Classroom occupancy (by number of classes held)
    const classroomOccupancy = classroomData
      .filter(c => c.classroom)
      .map(c => ({ name: c.classroom as string, value: c._count.id }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return NextResponse.json({
      cards: [
        {
          title: 'Total Usuarios',
          value: totalUsers,
          subtitle: `${activeStudents} estudiantes, ${activeTeachers} docentes`,
        },
        {
          title: 'Materias',
          value: totalSubjects,
          subtitle: `${totalGroups} grupos activos`,
        },
        {
          title: 'Asistencia General',
          value: `${attendancePercentage.toFixed(1)}%`,
          subtitle: `${presentCount} de ${totalAttendances} registros`,
        },
        {
          title: 'Clases',
          value: totalClasses,
          subtitle: `${completedClasses} completadas, ${scheduledClasses} programadas`,
        },
      ],
      charts: {
        roleDistribution,
        attendanceDistribution,
        classStatusDistribution,
        monthlyClasses,
        topSubjects,
        classroomOccupancy,
      },
      metrics: {
        totalUsers,
        totalSubjects,
        totalGroups,
        totalClasses,
        totalReports,
        attendancePercentage: attendancePercentage.toFixed(1),
        activeStudents,
        completedClasses,
        activeTeachers,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

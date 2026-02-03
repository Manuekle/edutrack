import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !['DOCENTE', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const teacherId = session.user.id;

  try {
    const now = new Date();

    // Find the currently active class for the teacher
    const liveClass = await db.class.findFirst({
      where: {
        subject: {
          teacherId: teacherId,
        },
        status: 'PROGRAMADA',
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      include: {
        subject: true,
      },
    });

    if (!liveClass) {
      return NextResponse.json({ liveClass: null });
    }

    // Get total number of students
    let totalStudents;

    if (session.user.role === 'ADMIN') {
      // For admin, count all students
      totalStudents = await db.user.count({
        where: {
          role: 'ESTUDIANTE',
          isActive: true,
        },
      });
    } else {
      // For teacher, count students in their subjects
      const subjectsWithStudents = await db.subject.findMany({
        where: { teacherId },
        select: { studentIds: true },
      });

      // Count unique students across all teacher's subjects
      const uniqueStudentIds = new Set<string>();

      subjectsWithStudents.forEach(subject => {
        subject.studentIds.forEach(id => uniqueStudentIds.add(id));
      });

      totalStudents = uniqueStudentIds.size;
    }

    // Get attendance stats for the live class
    const attendanceCounts = await db.attendance.groupBy({
      by: ['status'],
      where: {
        classId: liveClass.id,
      },
      _count: {
        status: true,
      },
    });

    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      justified: 0,
    };

    attendanceCounts.forEach(group => {
      switch (group.status) {
        case AttendanceStatus.PRESENTE:
          stats.present = group._count.status;
          break;
        case AttendanceStatus.AUSENTE:
          stats.absent = group._count.status;
          break;
        case AttendanceStatus.TARDANZA:
          stats.late = group._count.status;
          break;
        case AttendanceStatus.JUSTIFICADO:
          stats.justified = group._count.status;
          break;
        default:
          break;
      }
    });

    return NextResponse.json({
      liveClass: {
        id: liveClass.id,
        topic: liveClass.topic,
        status: liveClass.status,
        subjectName: liveClass.subject.name,
        classroom: liveClass.classroom,
        startTime: liveClass.startTime!.toISOString(),
        endTime: liveClass.endTime!.toISOString(),
        totalStudents,
        attendanceStats: stats,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

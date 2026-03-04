import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current time and calculate time range (current time ± 4 hours)
    const now = new Date();

    // Find the current class for the student
    const currentClass = await prisma.class.findFirst({
      where: {
        status: 'PROGRAMADA',
        subject: {
          studentIds: {
            has: session.user.id,
          },
        },
        OR: [
          // Class is in progress
          {
            startTime: { lte: now },
            endTime: { gte: now },
          },
          // Or class is starting within the next 30 minutes
          {
            startTime: {
              gte: now,
              lte: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
            },
          },
          // Or class ended in the last 30 minutes
          {
            endTime: {
              gte: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
              lte: now,
            },
          },
        ],
      },
      include: {
        subject: {
          select: {
            name: true,
            teachers: {
              select: {
                name: true,
              },
            },
          },
        },
        attendances: {
          where: {
            studentId: session.user.id,
          },
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    if (!currentClass) {
      return NextResponse.json({ liveClass: null });
    }

    // Get attendance stats for the class
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        classId: currentClass.id,
      },
      _count: {
        status: true,
      },
    });

    // Format the response
    const stats = {
      present:
        attendanceStats.find(
          (s: { status: string; _count: { status: number } }) => s.status === 'PRESENTE'
        )?._count.status || 0,
      absent:
        attendanceStats.find(
          (s: { status: string; _count: { status: number } }) => s.status === 'AUSENTE'
        )?._count.status || 0,
      late:
        attendanceStats.find(
          (s: { status: string; _count: { status: number } }) => s.status === 'TARDANZA'
        )?._count.status || 0,
      justified:
        attendanceStats.find(
          (s: { status: string; _count: { status: number } }) => s.status === 'JUSTIFICADO'
        )?._count.status || 0,
    };

    // Get total students in the subject
    const subject = await prisma.subject.findUnique({
      where: { id: currentClass.subjectId },
      select: { studentIds: true },
    });

    const response = {
      id: currentClass.id,
      subjectName: currentClass.subject.name,
      teacherName: currentClass.subject.teachers[0]?.name || 'Sin docente',
      topic: currentClass.topic || 'Clase en curso',
      date: currentClass.date,
      startTime: currentClass.startTime,
      endTime: currentClass.endTime,
      qrToken: currentClass.qrToken,
      attendanceStats: stats,
      totalStudents: subject?.studentIds.length || 0,
      myStatus: currentClass.attendances[0]?.status || 'AUSENTE',
      classroom: currentClass.classroom,
    };

    return NextResponse.json({ liveClass: response });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

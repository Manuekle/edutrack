import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface ClassWithProgress {
  id: string;
  date: Date;
  startTime: Date | null;
  topic: string | null;
  classroom: string | null;
  status: string;
  progress: number;
  attendances: Array<{
    id: string;
    status: string;
  }>;
}

interface SubjectWithClasses {
  id: string;
  name: string;
  code: string;
  classes: ClassWithProgress[];
  progress: number;
}

type PrismaSubject = Awaited<ReturnType<typeof db.subject.findFirst>> & {
  classes: Array<{
    id: string;
    date: Date;
    startTime: Date | null;
    topic: string | null;
    classroom: string | null;
    status: string;
    attendances: Array<{
      id: string;
      status: string;
    }>;
  }>;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCENTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // CACHE: Try to get from cache first (5 minutes TTL)
    const cacheKey = `dashboard:docente:${session.user.id}`;
    let cached = null;
    try {
      cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch {
      // Cache not available, continue without cache
    }

    // Obtener las asignaturas del docente
    const subjects = (await db.subject.findMany({
      where: {
        teacherId: session.user.id,
      },
      include: {
        classes: {
          select: {
            id: true,
            date: true,
            startTime: true,
            topic: true,
            classroom: true,
            status: true,
            attendances: {
              select: {
                id: true,
                status: true,
              },
              take: 1, // Solo necesitamos una asistencia por clase
            },
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    })) as PrismaSubject[];

    // Mapear y enriquecer los datos con el progreso calculado
    const subjectsWithProgress: SubjectWithClasses[] = subjects.map(subject => {
      const classesWithProgress: ClassWithProgress[] = subject.classes.map(cls => {
        // Calcular progreso basado en la asistencia (100% si asistió, 0% si no)
        const attendance = cls.attendances[0]; // Tomamos la primera asistencia
        const progress = attendance?.status === 'PRESENT' ? 100 : 0;

        return {
          id: cls.id,
          date: cls.date,
          startTime: cls.startTime,
          topic: cls.topic,
          classroom: cls.classroom,
          status: cls.status,
          progress,
          attendances: attendance
            ? [
                {
                  id: attendance.id,
                  status: attendance.status,
                },
              ]
            : [],
        };
      });

      // Calcular progreso promedio de la asignatura
      const totalProgress = classesWithProgress.reduce((sum, cls) => sum + cls.progress, 0);
      const averageProgress =
        classesWithProgress.length > 0 ? Math.round(totalProgress / classesWithProgress.length) : 0;

      return {
        ...subject,
        classes: classesWithProgress,
        progress: averageProgress,
      };
    });

    // Procesar los datos para el dashboard
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const processedSubjects = subjectsWithProgress.map(subject => {
      const totalClasses = subject.classes.length;
      const completedClasses = subject.classes.filter(
        cls => cls.status === 'REALIZADA' || cls.status === 'CANCELADA'
      ).length;

      const upcomingClass = subject.classes.find(
        cls => cls.status === 'PROGRAMADA' && new Date(cls.date) >= now
      );

      // Calcular progreso promedio de las clases
      const totalProgress = subject.classes.reduce((sum, cls) => sum + (cls.progress || 0), 0);
      const averageProgress = totalClasses > 0 ? totalProgress / totalClasses : 0;

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        totalClasses,
        completedClasses,
        progress: averageProgress,
        nextClass: upcomingClass
          ? {
              id: upcomingClass.id,
              date: upcomingClass.date.toISOString(),
              startTime: upcomingClass.startTime?.toISOString() || null,
              topic: upcomingClass.topic || 'Sin tema definido',
              classroom: upcomingClass.classroom || null,
            }
          : undefined,
      };
    });

    // Obtener las últimas 3 clases con progreso bajo (menor a 50%)
    const lowProgressClasses = subjectsWithProgress
      .flatMap(subject =>
        subject.classes
          .filter(cls => cls.progress < 50)
          .map(cls => ({
            id: cls.id,
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            date: cls.date.toISOString(),
            startTime: cls.startTime?.toISOString() || null,
            topic: cls.topic || 'Sin tema definido',
            progress: cls.progress,
          }))
      )
      .sort(
        (a: { date: string }, b: { date: string }) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 3);

    // Obtener las 3 próximas clases más cercanas
    const upcomingClasses = subjectsWithProgress
      .flatMap(subject =>
        subject.classes
          .filter(cls => {
            const classDate = new Date(cls.date);
            return classDate >= now && cls.status === 'PROGRAMADA';
          })
          .map(cls => ({
            id: cls.id,
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            date: cls.date.toISOString(),
            startTime: cls.startTime?.toISOString() || null,
            topic: cls.topic || 'Sin tema definido',
            classroom: cls.classroom || null,
          }))
      )
      .sort(
        (a: { date: string }, b: { date: string }) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .slice(0, 3);

    const response = {
      subjects: processedSubjects,
      lowProgressClasses,
      upcomingClasses,
    };

    // CACHE: Store in cache for 5 minutes (300 seconds)
    try {
      await redis.set(cacheKey, response, { ex: 300 });
    } catch {
      // Cache not available, continue without caching
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

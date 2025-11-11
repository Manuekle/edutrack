import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { ClassStatus, EventType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type SubjectResponse = {
  id: string;
  name: string;
  code: string;
  teacher: string;
  nextClass: {
    name: string;
    date: string;
    timeUntil: string;
    topic: string | null;
  } | null;
  attendancePercentage: number;
  totalClasses: number;
  attendedClasses: number;
};

type CardsResponse = {
  totalClasses: number;
  attendedClasses: number;
  globalAttendancePercentage: number;
  subjectsAtRisk: number;
  weeklyAttendanceAverage: number;
};

type EventResponse = {
  id: string;
  title: string;
  code: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  teacher: string;
  subjectName: string;
  description: string;
  isEvent: boolean;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // CACHE: Try to get from cache first (5 minutes TTL)
    const cacheKey = `dashboard:estudiante:${session.user.id}`;
    let cached = null;
    try {
      cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch {
      // Cache not available, continue without cache
    }

    const now = new Date();

    // Variables for general cards statistics
    let globalTotalClasses = 0;
    let globalAttendedClasses = 0;
    let subjectsAtRisk = 0;

    // Calculate date range for weekly average (last 4 weeks)
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    let weeklyTotalClasses = 0;
    let weeklyAttendedClasses = 0;

    // Get all subjects for the student
    const subjects = await db.subject.findMany({
      where: {
        studentIds: {
          has: session.user.id,
        },
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const subjectIds = subjects.map(s => s.id);

    // OPTIMIZATION: Get all classes for all subjects in a single query
    const allClasses = await db.class.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        status: 'PROGRAMADA',
      },
      select: {
        id: true,
        subjectId: true,
        date: true,
        topic: true,
        status: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // OPTIMIZATION: Get all attendances for this student in all subjects in a single query
    const allAttendances = await db.attendance.findMany({
      where: {
        studentId: session.user.id,
        class: {
          subjectId: {
            in: subjectIds,
          },
          status: { not: ClassStatus.CANCELADA },
        },
      },
      select: {
        id: true,
        status: true,
        class: {
          select: {
            id: true,
            subjectId: true,
            date: true,
            status: true,
          },
        },
      },
    });

    // OPTIMIZATION: Get weekly classes in a single query
    const weeklyClasses = await db.class.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        date: {
          gte: fourWeeksAgo,
          lte: now,
        },
        status: 'PROGRAMADA',
      },
      select: {
        id: true,
        subjectId: true,
      },
    });

    // OPTIMIZATION: Get weekly attendances in a single query
    const weeklyAttendances = await db.attendance.findMany({
      where: {
        studentId: session.user.id,
        class: {
          subjectId: {
            in: subjectIds,
          },
          date: {
            gte: fourWeeksAgo,
            lte: now,
          },
          status: 'PROGRAMADA',
        },
      },
      select: {
        status: true,
      },
    });

    // OPTIMIZATION: Get next classes for all subjects in a single query
    const nextClasses = await db.class.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        date: { gte: now },
        status: { not: ClassStatus.CANCELADA },
      },
      select: {
        id: true,
        subjectId: true,
        date: true,
        topic: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group data by subjectId for efficient lookup
    const classesBySubject = new Map<string, typeof allClasses>();
    allClasses.forEach(cls => {
      if (!classesBySubject.has(cls.subjectId)) {
        classesBySubject.set(cls.subjectId, []);
      }
      classesBySubject.get(cls.subjectId)!.push(cls);
    });

    const attendancesBySubject = new Map<string, typeof allAttendances>();
    allAttendances.forEach(att => {
      const subjectId = att.class.subjectId;
      if (!attendancesBySubject.has(subjectId)) {
        attendancesBySubject.set(subjectId, []);
      }
      attendancesBySubject.get(subjectId)!.push(att);
    });

    const weeklyClassesBySubject = new Map<string, number>();
    weeklyClasses.forEach(cls => {
      weeklyClassesBySubject.set(
        cls.subjectId,
        (weeklyClassesBySubject.get(cls.subjectId) || 0) + 1
      );
    });

    const weeklyAttendedCount = weeklyAttendances.filter(
      att => att.status === 'PRESENTE' || att.status === 'TARDANZA'
    ).length;

    const nextClassesBySubject = new Map<string, (typeof nextClasses)[0]>();
    nextClasses.forEach(cls => {
      if (!nextClassesBySubject.has(cls.subjectId)) {
        nextClassesBySubject.set(cls.subjectId, cls);
      }
    });

    // Process subjects using the pre-fetched data
    const processedSubjects: SubjectResponse[] = [];
    for (const subject of subjects) {
      const subjectClasses = classesBySubject.get(subject.id) || [];
      const subjectAttendances = attendancesBySubject.get(subject.id) || [];
      const nextClass = nextClassesBySubject.get(subject.id);
      const subjectWeeklyClasses = weeklyClassesBySubject.get(subject.id) || 0;

      // Count total classes for this subject
      const totalClasses = subjectClasses.length;

      // Count attended classes (PRESENTE + TARDANZA) from attendance records
      const attendedClasses = subjectAttendances.filter(
        att => att.status === 'PRESENTE' || att.status === 'TARDANZA'
      ).length;

      // Calcular porcentaje de asistencia
      let attendancePercentage = 0;
      if (totalClasses > 0) {
        attendancePercentage = Math.round((attendedClasses / totalClasses) * 100);
      }

      // Add to global counters
      globalTotalClasses += totalClasses;
      globalAttendedClasses += attendedClasses;

      // Check if subject is at risk (less than 70% attendance)
      if (attendancePercentage < 70 && totalClasses > 0) {
        subjectsAtRisk++;
      }

      // Add weekly counts
      weeklyTotalClasses += subjectWeeklyClasses;

      // Calculate time until next class
      let timeUntilNextClass = '';
      if (nextClass) {
        const timeDiff = new Date(nextClass.date).getTime() - now.getTime();
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));

        if (hoursDiff < 1) {
          const minutesDiff = Math.floor(timeDiff / (1000 * 60));
          timeUntilNextClass = `En ${minutesDiff} minutos`;
        } else if (hoursDiff < 24) {
          timeUntilNextClass = `En ${hoursDiff} horas`;
        } else {
          const daysDiff = Math.floor(hoursDiff / 24);
          timeUntilNextClass = `En ${daysDiff} días`;
        }
      }

      // Add the processed subject to the results
      processedSubjects.push({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        teacher: subject.teacher?.name || 'Docente no asignado',
        nextClass: nextClass
          ? {
              name: `Clase de ${subject.name}`,
              date: nextClass.date.toISOString().split('T')[0],
              timeUntil: timeUntilNextClass,
              topic: nextClass.topic || null,
            }
          : null,
        attendancePercentage: attendancePercentage,
        totalClasses,
        attendedClasses,
      });
    }

    // Calculate weekly attendance (global)
    weeklyAttendedClasses = weeklyAttendedCount;
    weeklyTotalClasses = weeklyClasses.length;

    // Process events
    // Obtener todos los eventos de las asignaturas del estudiante y filtrar en memoria
    // Esto evita problemas de zona horaria al comparar fechas
    const upcomingEvents: EventResponse[] = [];

    // Solo buscar eventos si el estudiante tiene asignaturas
    if (subjectIds.length > 0) {
      // Obtener todos los eventos de las asignaturas del estudiante
      const allEvents = await db.subjectEvent.findMany({
        where: {
          subjectId: {
            in: subjectIds,
          },
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              teacher: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Normalizar la fecha actual al inicio del día para comparar
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      // Filtrar eventos en memoria para incluir solo eventos de hoy en adelante
      for (const event of allEvents) {
        const eventDate = new Date(event.date);
        // Normalizar la fecha del evento al inicio del día para comparar
        const eventDateNormalized = new Date(eventDate);
        eventDateNormalized.setHours(0, 0, 0, 0);

        // Solo incluir eventos que sean de hoy o futuros (comparando fechas normalizadas)
        if (eventDateNormalized.getTime() >= startOfToday.getTime()) {
          // Get date in YYYY-MM-DD format using local time
          const year = eventDate.getFullYear();
          const month = String(eventDate.getMonth() + 1).padStart(2, '0');
          const day = String(eventDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          // Events are stored normalized to midnight, so startTime is 00:00
          const startTime = '00:00';
          const endTime = '23:59';

          upcomingEvents.push({
            id: event.id,
            title: event.title || 'Evento sin título',
            code: event.subject.code,
            type: event.type,
            date: dateStr,
            startTime,
            endTime,
            location: 'No especificada',
            teacher: event.subject.teacher?.name || 'Docente no asignado',
            subjectName: event.subject.name,
            description: event.description || 'Sin descripción',
            isEvent: true,
          });
        }
      }

      // Limitar a 50 eventos después del filtrado
      if (upcomingEvents.length > 50) {
        upcomingEvents.splice(50);
      }
    }

    // Calculate global attendance percentage
    const globalAttendancePercentage =
      globalTotalClasses > 0 ? Math.round((globalAttendedClasses / globalTotalClasses) * 100) : 0;

    // Calculate weekly attendance average
    const weeklyAttendanceAverage =
      weeklyTotalClasses > 0 ? Math.round((weeklyAttendedClasses / weeklyTotalClasses) * 100) : 0;

    // Create cards object with general statistics
    const cards: CardsResponse = {
      totalClasses: globalTotalClasses,
      attendedClasses: globalAttendedClasses,
      globalAttendancePercentage: globalAttendancePercentage,
      subjectsAtRisk: subjectsAtRisk,
      weeklyAttendanceAverage: weeklyAttendanceAverage,
    };

    const response = {
      cards,
      subjects: processedSubjects,
      upcomingItems: upcomingEvents,
    };

    // CACHE: Store in cache for 5 minutes (300 seconds)
    try {
      await redis.set(cacheKey, response, { ex: 300 });
    } catch {
      // Cache not available, continue without caching
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        error: 'Error al cargar los datos del dashboard',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

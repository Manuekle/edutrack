'use client';

import { LiveClassCard } from '@/components/estudiante/live-class-card';
import { StatCard } from '@/components/estudiante/stat-card';
import { SubjectsCard } from '@/components/estudiante/subjects-card';
import { UpcomingEventsCard } from '@/components/estudiante/upcoming-events-card';
import { LoadingPage } from '@/components/ui/loading';
import { AlertTriangle, BarChart3, BookOpen, Calendar } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type EventType = 'EXAMEN' | 'TRABAJO' | 'LIMITE' | 'ANUNCIO' | 'INFO';
// Removed unused import

interface UpcomingClass {
  id: string;
  title: string;
  code: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime?: string;
  description?: string;
  subjectName?: string;
  type: EventType;
  isEvent: boolean;
}

// Removed unused interfaces

interface NextClass {
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  topic?: string;
  timeUntil: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  teacher: string;
  attendancePercentage: number;
  nextClass?: NextClass;
  totalClasses: number;
  attendedClasses: number;
}

interface LiveClass {
  id: string;
  subjectName: string;
  teacherName: string;
  topic: string;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  qrToken: string;
  attendanceStats: {
    present: number;
    absent: number;
    late: number;
    justified: number;
  };
  totalStudents: number;
  myStatus: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';
  classroom?: string;
}

export default function EstudianteDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingUpcomingClasses, setIsLoadingUpcomingClasses] = useState(true);
  const [isLoadingLiveClass, setIsLoadingLiveClass] = useState(true);
  const [stats, setStats] = useState({
    globalAttendancePercentage: 0,
    attendedClasses: 0,
    totalClasses: 0,
    totalSubjects: 0,
    averageGrade: '0.0',
    subjectsAtRisk: 0,
    weeklyAttendanceAverage: 0,
  });

  const fetchLiveClass = useCallback(async () => {
    try {
      setIsLoadingLiveClass(true);
      const response = await fetch('/api/estudiante/current-class');

      if (!response.ok) {
        throw new Error('Error al cargar la clase en vivo');
      }

      const data = await response.json();

      if (data.liveClass) {
        const liveClassData = {
          id: data.liveClass.id,
          subjectName: data.liveClass.subjectName,
          teacherName: data.liveClass.teacherName,
          topic: data.liveClass.topic || 'Clase en curso',
          date: new Date(),
          startTime: data.liveClass.startTime ? new Date(data.liveClass.startTime) : null,
          endTime: data.liveClass.endTime ? new Date(data.liveClass.endTime) : null,
          qrToken: data.liveClass.qrToken,
          attendanceStats: data.liveClass.attendanceStats || {
            present: 0,
            absent: 0,
            late: 0,
            justified: 0,
          },
          totalStudents: data.liveClass.totalStudents || 0,
          myStatus: data.liveClass.myStatus || 'AUSENTE',
          classroom: data.liveClass.classroom,
        };
        setLiveClass(liveClassData);
      } else {
        setLiveClass(null);
      }
    } catch {
      setLiveClass(null);
    } finally {
      setIsLoadingLiveClass(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoadingUpcomingClasses(true);
      const response = await fetch('/api/estudiante/dashboard');
      if (!response.ok) {
        throw new Error('Error al cargar los datos del dashboard');
      }
      const data = await response.json();

      // Transform subjects to match our interface
      const transformedSubjects = (data.subjects || []).map((subj: Subject) => ({
        ...subj,
        teacher: subj.teacher || 'Profesor no asignado',
        attendancePercentage: subj.attendancePercentage || 0,
        totalClasses: subj.totalClasses || 0,
        attendedClasses: subj.attendedClasses || 0,
      }));

      setSubjects(transformedSubjects);

      // Transform upcoming items
      const transformedUpcomingItems = (data.upcomingItems || []).map((item: UpcomingClass) => ({
        ...item,
        isEvent: !!item.isEvent,
        endTime: item.endTime || '23:59',
        // Ensure all required fields are present
        title: item.title || 'Sin título',
        code: item.code || '',
        teacher: item.teacher || 'Profesor no asignado',
        date: item.date,
        startTime: item.startTime || '00:00',
        type: (item.type || 'INFO') as EventType, // Default to INFO type if not specified
      }));

      setUpcomingClasses(transformedUpcomingItems);

      // Usar los datos de 'cards' directamente de la API
      if (data.cards) {
        setStats(prev => ({
          ...prev,
          globalAttendancePercentage: data.cards.globalAttendancePercentage || 0,
          attendedClasses: data.cards.attendedClasses || 0,
          totalClasses: data.cards.totalClasses || 0,
          totalSubjects: transformedSubjects.length,
          subjectsAtRisk: data.cards.subjectsAtRisk || 0,
          weeklyAttendanceAverage: data.cards.weeklyAttendanceAverage || 0,
        }));
      }
    } catch {
      setSubjects([]);
      setUpcomingClasses([]);
    } finally {
      setIsLoadingUpcomingClasses(false);
    }
  }, []);

  // Combine data fetching into a single effect with proper cleanup
  useEffect(() => {
    let isMounted = true;
    let dashboardInterval: NodeJS.Timeout;
    let liveClassInterval: NodeJS.Timeout;

    const fetchAllData = async () => {
      if (!isMounted) return;

      try {
        await Promise.all([fetchDashboardData(), fetchLiveClass()]);
      } catch {
        // Error fetching dashboard data
      } finally {
        if (isMounted) {
          setIsInitialLoad(false);
        }
      }
    };

    // Initial fetch
    fetchAllData();

    // Only set up polling if component is still mounted
    if (isMounted) {
      // OPTIMIZATION: Dashboard data refreshes every 5 minutes (reduced from 10)
      // Cache is 5 minutes, so this aligns with cache invalidation
      dashboardInterval = setInterval(fetchDashboardData, 5 * 60 * 1000);

      // OPTIMIZATION: Live class polls every 2 minutes (increased from 30 seconds)
      // This reduces server load while still being responsive
      const checkLiveClass = () => {
        if (liveClass?.id) {
          fetchLiveClass();
        } else {
          // If no live class, check occasionally (every 5 minutes) for new classes
          fetchLiveClass();
        }
      };

      // Poll every 2 minutes if there's a live class, every 5 minutes if not
      liveClassInterval = setInterval(
        checkLiveClass,
        liveClass?.id ? 2 * 60 * 1000 : 5 * 60 * 1000
      );
    }

    return () => {
      isMounted = false;
      clearInterval(dashboardInterval);
      clearInterval(liveClassInterval);
    };
  }, [fetchDashboardData, fetchLiveClass, liveClass?.id]);

  if (isInitialLoad && (isLoadingUpcomingClasses || isLoadingLiveClass)) {
    return <LoadingPage />;
  }

  return (
    <div className="mx-auto">
      <div className="p-0 w-full mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Mi Panel</h1>
        <p className="text-xs text-muted-foreground">Resumen de tu progreso académico</p>
      </div>

      {/* Live Class Card */}
      {liveClass && <LiveClassCard liveClass={liveClass} />}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Asistencia global"
          value={`${stats.globalAttendancePercentage}%`}
          subtitle={`${stats.attendedClasses} de ${stats.totalClasses} clases`}
          icon={Calendar}
        />
        <StatCard
          title="Asignaturas"
          value={stats.totalSubjects}
          subtitle="Materias activas"
          icon={BookOpen}
        />
        <StatCard
          title="Riesgo"
          value={stats.subjectsAtRisk}
          subtitle="Asignaturas en riesgo"
          icon={AlertTriangle}
        />
        <StatCard
          title="Asistencia semanal"
          value={`${stats.weeklyAttendanceAverage}%`}
          subtitle="Promedio últimas 4 semanas"
          icon={BarChart3}
        />
      </div>

      {/* Asignaturas */}
      <SubjectsCard subjects={subjects} />

      {/* Próximas Clases */}
      <UpcomingEventsCard upcomingClasses={upcomingClasses} isLoading={isLoadingUpcomingClasses} />
    </div>
  );
}

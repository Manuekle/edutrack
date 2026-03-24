'use client';

import { LiveClassCard } from '@/components/docente/live-class-card';
import { TeacherStatsCards } from '@/components/docente/teacher-stats-cards';
import { TeacherSubjectsList } from '@/components/docente/teacher-subjects-list';
import { UpcomingClassesCard } from '@/components/docente/upcoming-classes-card';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getLiveClassData,
  getTeacherDashboardData,
  type LiveClassData,
} from '@/services/dashboardService';
import { RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type SubjectStats = {
  id: string;
  groupId: string;
  name: string;
  code: string;
  totalClasses: number;
  completedClasses: number;
  nextClass?: {
    id: string;
    date: Date;
    topic: string;
    classroom: string | null;
  };
};

interface UpcomingClass {
  id: string;
  groupId: string;
  subjectId: string;
  subjectName: string;
  topic: string | null;
  classroom?: string | null;
  date: Date;
  startTime?: string | null;
}

export default function DocenteDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [subjects, setSubjects] = useState<SubjectStats[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [liveClass, setLiveClass] = useState<LiveClassData | null>(null);

  // Función para cargar datos del dashboard (reutilizable)
  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    try {
      // Promise.all for parallel fetching
      const [dashboardRes, liveClassRes] = await Promise.all([
        getTeacherDashboardData(),
        getLiveClassData(),
      ]);

      // Handle Dashboard Data
      if (dashboardRes.data) {
        const transformedSubjects = dashboardRes.data.subjects.map(subject => ({
          ...subject,
          nextClass: subject.nextClass
            ? {
                ...subject.nextClass,
                date: new Date(subject.nextClass.date),
                classroom: subject.nextClass.classroom,
              }
            : undefined,
        }));
        setSubjects(transformedSubjects);

        const transformedUpcomingClasses = dashboardRes.data.upcomingClasses.map(cls => ({
          ...cls,
          date: new Date(cls.date),
        }));
        setUpcomingClasses(transformedUpcomingClasses);
      }

      // Handle Live Class Data
      setLiveClass(liveClassRes.data?.liveClass || null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Cargar datos del dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();

      // Polling for live class only (cada 10 segundos)
      const intervalId = setInterval(async () => {
        const { data } = await getLiveClassData();
        setLiveClass(data?.liveClass || null);
        setLastUpdated(new Date());
      }, 10000);

      return () => clearInterval(intervalId);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, fetchDashboardData]);

  // Función de refresh manual
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return <LoadingPage />;
  }

  // Calculate generic stats
  const totalClasses = subjects.reduce((sum, subj) => sum + subj.totalClasses, 0);
  const completedClasses = subjects.reduce((sum, subj) => sum + subj.completedClasses, 0);
  const nextClass =
    upcomingClasses.length > 0
      ? {
          id: upcomingClasses[0].id,
          subjectName: upcomingClasses[0].subjectName,
          date: upcomingClasses[0].date,
          topic: upcomingClasses[0].topic || 'Sin tema',
          classroom: upcomingClasses[0].classroom || '',
        }
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-card text-foreground">Inicio</h1>
          <p className="text-muted-foreground sm:text-sm text-xs mt-1">
            Resumen del día — clases activas, próximas clases y estadísticas generales.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Indicador de última actualización */}
          {lastUpdated && (
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              Actualizado hace{' '}
              {Math.floor((Date.now() - lastUpdated.getTime()) / 1000) < 60
                ? `${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s`
                : `${Math.floor((Date.now() - lastUpdated.getTime()) / 60000)}min`}
            </span>
          )}
          {/* Botón de refresh manual */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl h-9 px-3 shadow-none bg-muted/40 border-transparent hover:bg-muted/60 transition-colors"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto rounded-xl h-10 px-4 shadow-none bg-muted/40 border-transparent hover:bg-muted/60 transition-colors sm:text-sm text-xs font-medium"
            onClick={() => router.push('/dashboard/docente/grupos')}
          >
            Ver todos los grupos
          </Button>
        </div>
      </div>

      {/* Clase en Vivo */}
      {liveClass && <LiveClassCard liveClass={liveClass} />}

      {/* Estadísticas Rápidas */}
      <TeacherStatsCards
        subjectsCount={subjects.length}
        totalClasses={totalClasses}
        completedClasses={completedClasses}
        upcomingClassesCount={upcomingClasses.length}
        nextClass={nextClass}
        isLoading={refreshing}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {/* Asignaturas Recientes */}
        <TeacherSubjectsList subjects={subjects} />
        {/* Próximas Clases */}
        <UpcomingClassesCard classes={upcomingClasses} />
      </div>
    </div>
  );
}

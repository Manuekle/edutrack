'use client';

import { LiveClassCard } from '@/components/docente/live-class-card';
import { TeacherStatsCards } from '@/components/docente/teacher-stats-cards';
import { TeacherSubjectsList } from '@/components/docente/teacher-subjects-list';
import { UpcomingClassesCard } from '@/components/docente/upcoming-classes-card';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/ui/loading';
import {
  getLiveClassData,
  getTeacherDashboardData,
  type LiveClassData,
} from '@/services/dashboardService';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type SubjectStats = {
  id: string;
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
  subjectId: string;
  subjectName: string;
  topic: string | null;
  classroom?: string | null;
  date: Date;
}

export default function DocenteDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectStats[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [liveClass, setLiveClass] = useState<LiveClassData | null>(null);

  // Cargar datos del dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchDashboardData = async () => {
        setLoading(true);
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
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();

      // Polling for live class only
      const intervalId = setInterval(async () => {
        const { data } = await getLiveClassData();
        setLiveClass(data?.liveClass || null);
      }, 10000);

      return () => clearInterval(intervalId);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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
          <p className="text-muted-foreground text-sm mt-1">
            Resumen del día — clases activas, próximas clases y estadísticas generales.
          </p>
        </div>
        <div className="flex w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto rounded-xl h-10 px-4 shadow-none bg-muted/40 border-transparent hover:bg-muted/60 transition-colors text-sm font-medium"
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
      />

      <div className="grid gap-5 md:grid-cols-2">
        {/* Próximas Clases */}
        <UpcomingClassesCard classes={upcomingClasses} />

        {/* Asignaturas Recientes */}
        <TeacherSubjectsList subjects={subjects} />
      </div>
    </div>
  );
}

'use client';

import { LiveClassCard } from '@/components/estudiante/live-class-card';
import { StatCard } from '@/components/estudiante/stat-card';
import { SubjectsCard } from '@/components/estudiante/subjects-card';
import { UpcomingEventsCard } from '@/components/estudiante/upcoming-events-card';
import { LoadingPage } from '@/components/ui/loading';
import { useStudentDashboard } from '@/hooks/use-student-dashboard';
import { AlertTriangle, BarChart3, BookOpen, Calendar } from 'lucide-react';

export default function EstudianteDashboard() {
  const { subjects, upcomingClasses, liveClass, stats, isLoading } = useStudentDashboard();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-card text-foreground">Inicio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen de tu progreso académico y asistencia.
        </p>
      </div>

      {/* Live Class Card */}
      {liveClass && <LiveClassCard liveClass={liveClass} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Asistencia"
          value={`${stats.globalAttendancePercentage}%`}
          subtitle={`${stats.attendedClasses} de ${stats.totalClasses}`}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Activas"
          value={stats.totalSubjects}
          subtitle="asignaturas"
          icon={BookOpen}
        />
        <StatCard
          title="En riesgo"
          value={stats.subjectsAtRisk}
          subtitle="asignaturas"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Semanal"
          value={`${stats.weeklyAttendanceAverage}%`}
          subtitle="últimas 4 semanas"
          icon={BarChart3}
          color="green"
        />
      </div>

      {/* Asignaturas */}
      <SubjectsCard subjects={subjects} />

      {/* Próximas Clases */}
      <UpcomingEventsCard upcomingClasses={upcomingClasses} isLoading={isLoading} />
    </div>
  );
}

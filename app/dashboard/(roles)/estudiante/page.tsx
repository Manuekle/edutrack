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
    <div className="mx-auto">
      <div className="p-0 w-full mb-8">
        <h1 className="text-2xl font-semibold tracking-card mb-1">Mi Panel</h1>
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
      <UpcomingEventsCard upcomingClasses={upcomingClasses} isLoading={isLoading} />
    </div>
  );
}

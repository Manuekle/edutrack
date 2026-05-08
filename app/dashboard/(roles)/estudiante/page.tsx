'use client';

import { LiveClassCard } from '@/components/estudiante/live-class-card';
import { StatCard } from '@/components/estudiante/stat-card';
import { SubjectsCard } from '@/components/estudiante/subjects-card';
import { UpcomingEventsCard } from '@/components/estudiante/upcoming-events-card';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/ui/loading';
import { useStudentDashboard } from '@/hooks/use-student-dashboard';
import { AlertTriangle, BarChart3, BookOpen, Calendar, RefreshCw } from 'lucide-react';

export default function EstudianteDashboard() {
  const { subjects, upcomingClasses, liveClass, stats, isLoading, error, refetchDashboard } =
    useStudentDashboard();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-card text-foreground">Inicio</h1>
        <p className="text-muted-foreground sm:text-sm text-xs mt-1">
          Resumen de tu progreso académico y asistencia.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">
            No se pudieron cargar los datos del dashboard. Verifica tu conexión.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchDashboard()}
            className="shrink-0 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Live Class Card */}
      {liveClass && <LiveClassCard liveClass={liveClass} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Activas"
          value={stats.totalSubjects}
          subtitle="asignaturas"
          icon={BookOpen}
        />
        <StatCard
          title="Asistencia"
          value={`${stats.globalAttendancePercentage}%`}
          subtitle={`${stats.attendedClasses} de ${stats.totalClasses}`}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Semanal"
          value={`${stats.weeklyAttendanceAverage}%`}
          subtitle="últimas 4 semanas"
          icon={BarChart3}
          color="green"
        />
        <StatCard
          title="En riesgo"
          value={stats.subjectsAtRisk}
          subtitle="asignaturas"
          icon={AlertTriangle}
          color="amber"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Asignaturas */}
        <SubjectsCard subjects={subjects} />

        {/* Próximas Clases */}
        <UpcomingEventsCard upcomingClasses={upcomingClasses} isLoading={isLoading} />
      </div>
    </div>
  );
}

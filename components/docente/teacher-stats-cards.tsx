import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Calendar, Clock } from 'lucide-react';

interface StatsProps {
  subjectsCount: number;
  totalClasses: number;
  completedClasses: number;
  upcomingClassesCount: number;
  nextClass?: {
    id: string;
    subjectName: string;
    date: Date;
    topic: string;
    classroom?: string | null;
  };
  isLoading?: boolean;
}

export function TeacherStatsCards({
  subjectsCount,
  totalClasses,
  completedClasses,
  nextClass,
  isLoading = false,
}: StatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Asignaturas activas"
        value={subjectsCount}
        subtitle="asignaturas"
        icon={BookOpen}
        color="default"
      />

      <StatCard
        title="Clases totales"
        value={totalClasses}
        subtitle="programadas"
        icon={Calendar}
        color="blue"
      />

      <StatCard
        title="Clases impartidas"
        value={completedClasses}
        subtitle="completadas"
        icon={Clock}
        color="green"
      />

      <StatCard title="Próxima clase" value="" icon={Calendar} color="warm">
        {nextClass ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold tracking-tight text-foreground line-clamp-1">
              {nextClass.subjectName}
            </p>
            <div className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">
              <span>
                {nextClass.date.toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              {nextClass.classroom && <span>Salón: {nextClass.classroom}</span>}
            </div>
          </div>
        ) : (
          <p className="text-xs font-medium text-muted-foreground">
            No hay clases programadas
          </p>
        )}
      </StatCard>
    </div>
  );
}

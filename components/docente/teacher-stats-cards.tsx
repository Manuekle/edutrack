import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  upcomingClassesCount,
  nextClass,
  isLoading = false,
}: StatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card
            key={i}
            className="shadow-none border-0 bg-muted/50 dark:bg-white/[0.06] rounded-2xl"
          >
            <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Skeleton className="h-9 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1 - Asignaturas Activas */}
      <Card className="shadow-sm border-border/20 bg-card/80 backdrop-blur-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
        <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-2 tracking-wider uppercase">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <BookOpen className="h-4 w-4" />
            </div>
            Activas
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-4xl font-bold tracking-tight text-foreground">{subjectsCount}</div>
            <p className="text-xs font-medium text-muted-foreground">asignaturas</p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2 - Clases Totales */}
      <Card className="shadow-sm border-border/20 bg-blue-50/50 dark:bg-blue-500/5 backdrop-blur-sm hover:shadow-md hover:border-blue-200/30 transition-all duration-200">
        <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2 tracking-wider uppercase">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-4 w-4" />
            </div>
            Totales
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-4xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
              {totalClasses}
            </div>
            <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70">
              programadas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 - Clases Impartidas */}
      <Card className="shadow-sm border-border/20 bg-emerald-50/50 dark:bg-emerald-500/5 backdrop-blur-sm hover:shadow-md hover:border-emerald-200/30 transition-all duration-200">
        <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 tracking-wider uppercase">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
            Impartidas
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-4xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {completedClasses}
            </div>
            <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">
              completadas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 4 - Próxima Clase */}
      <Card className="shadow-sm border-border/20 bg-amber-50/50 dark:bg-amber-500/5 backdrop-blur-sm hover:shadow-md hover:border-amber-200/30 transition-all duration-200">
        <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 tracking-wider uppercase">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
            Próxima
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 mt-2">
          {nextClass ? (
            <div className="flex flex-col gap-1">
              <h4 className="sm:text-sm text-xs font-semibold tracking-card text-foreground line-clamp-1">
                {nextClass.subjectName}
              </h4>
              <div className="flex flex-col gap-0.5 text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80">
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
            <div className="flex items-center h-full">
              <p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">
                No hay clases programadas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

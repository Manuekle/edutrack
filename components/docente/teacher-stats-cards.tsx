import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

export function TeacherStatsCards({
  subjectsCount,
  totalClasses,
  completedClasses,
  upcomingClassesCount,
  nextClass,
}: StatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="shadow-none border-0 bg-muted/30 dark:bg-white/[0.02] rounded-2xl">
        <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[13px] font-medium text-muted-foreground flex items-center gap-2 tracking-card uppercase">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <BookOpen className="h-4 w-4" />
            </div>
            Activas
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-4xl font-semibold tracking-card text-foreground">
              {subjectsCount}
            </div>
            <p className="text-xs font-medium text-muted-foreground">asignaturas</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl">
        <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[13px] font-medium text-blue-700/70 dark:text-blue-400/70 flex items-center gap-2 tracking-card uppercase">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-500">
              <Calendar className="h-4 w-4" />
            </div>
            Totales
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-4xl font-semibold tracking-card text-blue-700 dark:text-blue-400">
              {totalClasses}
            </div>
            <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70">
              programadas
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-0 bg-green-500/5 dark:bg-green-500/10 rounded-2xl">
        <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[13px] font-medium text-green-700/70 dark:text-green-400/70 flex items-center gap-2 tracking-card uppercase">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-500">
              <Clock className="h-4 w-4" />
            </div>
            Impartidas
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-4xl font-semibold tracking-card text-green-700 dark:text-green-400">
              {completedClasses}
            </div>
            <p className="text-xs font-medium text-green-600/70 dark:text-green-400/70">
              completadas
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-0 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl">
        <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[13px] font-medium text-amber-700/70 dark:text-amber-400/70 flex items-center gap-2 tracking-card uppercase">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500">
              <Calendar className="h-4 w-4" />
            </div>
            Próxima
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 mt-2">
          {nextClass ? (
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold tracking-card text-foreground line-clamp-1">
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

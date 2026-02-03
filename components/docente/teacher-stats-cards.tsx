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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Asignaturas Activas</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="sm:text-3xl text-2xl tracking-card font-semibold">{subjectsCount}</div>
          <p className="text-xs text-muted-foreground">En este semestre</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Clases Totales</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="sm:text-3xl text-2xl tracking-card font-semibold">{totalClasses}</div>
          <p className="text-xs text-muted-foreground">Programadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Clases Impartidas</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="sm:text-3xl text-2xl tracking-card font-semibold">{completedClasses}</div>
          <p className="text-xs text-muted-foreground">Completadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Próxima Clase</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {nextClass ? (
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="sm:text-3xl text-2xl font-semibold tracking-card">{nextClass.subjectName}</h4>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {nextClass.date.toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                    })}
                    {nextClass.classroom && ` • Salón: ${nextClass.classroom}`}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs">No hay clases programadas</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

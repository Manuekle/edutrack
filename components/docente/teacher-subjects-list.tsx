'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface SubjectStats {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  completedClasses: number;
}

interface TeacherSubjectsListProps {
  subjects: SubjectStats[];
}

export function TeacherSubjectsList({ subjects }: TeacherSubjectsListProps) {
  const router = useRouter();

  return (
    <Card className="shadow-none border-0 bg-muted/20 dark:bg-white/[0.02] rounded-3xl shrink-0 h-fit">
      <CardHeader className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="sm:text-lg text-base font-semibold tracking-card text-foreground">
            Mis Asignaturas
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {subjects.length > 0 ? (
          <div className="space-y-3">
            {subjects.slice(0, 3).map(subject => {
              const progress =
                subject.totalClasses > 0
                  ? (subject.completedClasses / subject.totalClasses) * 100
                  : 0;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={subject.id}
                  className="group relative rounded-2xl border-0 transition-all duration-300 hover:bg-card hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:hover:bg-[#1C1C1E] cursor-pointer bg-muted/40 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => router.push(`/dashboard/docente/asignaturas/${subject.id}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/dashboard/docente/asignaturas/${subject.id}`);
                    }
                  }}
                  aria-label={`Ver detalles de la asignatura ${subject.name}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold truncate text-foreground">
                          {subject.name}
                        </h4>
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground font-mono uppercase tracking-card mb-2">
                        {subject.code}
                      </p>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="text-muted-foreground uppercase opacity-80">
                            Progreso del curso
                          </span>
                          <span className="text-foreground">
                            {subject.completedClasses}/{subject.totalClasses}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-1.5 w-full bg-muted/70 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end pt-1 justify-center shrink-0">
                      <div className="text-right flex flex-col items-center justify-center p-3 rounded-xl bg-background/50 border border-border/40 min-w-[64px]">
                        <div className="text-[17px] font-semibold text-foreground tracking-card">
                          {Math.round(progress)}%
                        </div>
                        <div className="text-[9px] uppercase font-bold text-muted-foreground mt-0.5">
                          completado
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col text-center py-16 items-center justify-center h-[calc(50vh-200px)]">
            <p className="text-xs">No tienes asignaturas asignadas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Registra una asignatura para comenzar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

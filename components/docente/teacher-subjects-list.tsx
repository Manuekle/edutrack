'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight } from 'lucide-react';

interface SubjectStats {
  id: string;
  groupId: string;
  name: string;
  code: string;
  totalClasses: number;
  completedClasses: number;
}

interface TeacherSubjectsListProps {
  subjects: SubjectStats[];
  isLoading?: boolean;
}

export function TeacherSubjectsList({ subjects, isLoading = false }: TeacherSubjectsListProps) {
  const router = useRouter();

  return (
    <Card className="shadow-sm border-border bg-card rounded-2xl shrink-0 h-fit">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Mis Asignaturas</CardTitle>
          <span className="text-xs text-muted-foreground">{subjects.length}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-2.5 w-24" />
                        <Skeleton className="h-2.5 w-10" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : subjects.length > 0 ? (
          <div className="space-y-2">
            {subjects.slice(0, 3).map(subject => {
              const progress =
                subject.totalClasses > 0
                  ? (subject.completedClasses / subject.totalClasses) * 100
                  : 0;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={subject.groupId}
                  onClick={() => router.push(`/dashboard/docente/grupos/${subject.groupId}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/dashboard/docente/grupos/${subject.groupId}`);
                    }
                  }}
                  className="group relative rounded-xl border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm cursor-pointer p-3.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                          <BookOpen className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="sm:text-sm text-xs font-semibold truncate text-foreground">
                          {subject.name}
                        </h4>
                      </div>
                      <p className="text-[11px] font-medium text-muted-foreground font-mono uppercase ml-9">
                        {subject.code}
                      </p>

                      <div className="space-y-1.5 mt-2">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="text-muted-foreground uppercase opacity-70">
                            Progreso
                          </span>
                          <span className="text-foreground font-medium">
                            {subject.completedClasses}/{subject.totalClasses} clases
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center shrink-0">
                      <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 min-w-[52px]">
                        <div className="sm:text-base text-sm font-bold text-violet-700 dark:text-violet-400">
                          {Math.round(progress)}%
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col text-center py-12 items-center justify-center min-h-[160px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30 mb-3">
              <BookOpen className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">No tienes asignaturas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Contacta al administrador para asignarte materias
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

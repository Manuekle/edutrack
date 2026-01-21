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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl font-semibold tracking-card">Mis Asignaturas</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {subjects.length > 0 ? (
          <div className="space-y-3">
            {subjects.slice(0, 3).map(subject => {
              const progress = (subject.completedClasses / subject.totalClasses) * 100;
              return (
                <div
                  key={subject.id}
                  className="group relative rounded-lg border transition-all duration-200 hover:border-border hover:shadow-sm cursor-pointer bg-card p-4"
                  onClick={() => router.push(`/dashboard/docente/asignaturas/${subject.id}`)}
                >
                  <div className="flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-xs font-medium truncate">{subject.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{subject.code}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progreso del curso</span>
                          <span className="text-xs text-muted-foreground">
                            {subject.completedClasses}/{subject.totalClasses}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col items-end">
                      <div className="text-right">
                        <div className="text-xs font-normal font-mono text-foreground">
                          {Math.round(progress)}%
                        </div>
                        <div className="text-xs text-muted-foreground">completado</div>
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

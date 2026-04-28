'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface NextClass {
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  topic?: string;
  timeUntil: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  teacher: string;
  attendancePercentage: number;
  nextClass?: NextClass;
  totalClasses: number;
  attendedClasses: number;
}

interface SubjectsCardProps {
  subjects: Subject[];
}

function getAttendanceColor(percentage: number) {
  if (percentage >= 80) return 'bg-emerald-500';
  if (percentage >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

export function SubjectsCard({ subjects }: SubjectsCardProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(subjects.length / itemsPerPage);

  const paginatedSubjects = subjects.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <Card className="shadow-sm border-border/20 bg-card/80 backdrop-blur-sm rounded-2xl shrink-0 h-fit">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Mis Asignaturas</CardTitle>
          <span className="text-xs text-muted-foreground">{subjects.length}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {subjects.length > 0 ? (
          <div className="space-y-2">
            {paginatedSubjects.map(subject => {
              const progress = subject.attendancePercentage;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={subject.id}
                  className="group relative rounded-xl border border-border/20 bg-muted/20 hover:bg-muted/40 hover:border-primary/20 hover:shadow-sm p-3.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                          <BookOpen className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="sm:text-sm text-xs font-semibold truncate text-foreground">
                          {subject.name}
                        </h4>
                      </div>
                      <p className="text-[11px] font-medium text-muted-foreground font-mono uppercase ml-9">
                        {subject.code}
                      </p>

                      <div className="space-y-1.5 mt-2 ml-9">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="text-muted-foreground uppercase opacity-70">
                            Asistencia
                          </span>
                          <span className="text-foreground font-medium">
                            {subject.attendedClasses}/{subject.totalClasses}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getAttendanceColor(progress)} rounded-full transition-all duration-500`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div
                        className={`text-sm font-bold ${
                          progress >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : progress >= 60
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {progress}%
                      </div>
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
              Contacta al administrador para matricularte
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-xs text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

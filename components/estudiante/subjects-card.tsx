'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <Card className="shadow-none border-0 bg-muted/20 dark:bg-white/[0.02] rounded-3xl shrink-0 h-fit">
      <CardHeader className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="sm:text-lg text-xs font-semibold tracking-card text-foreground">
            Mis Asignaturas
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {subjects.length > 0 ? (
          <div className="space-y-3">
            {paginatedSubjects.map(subject => {
              const progress = subject.attendancePercentage;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={subject.id}
                  className="group relative rounded-2xl border-0 transition-all duration-300 bg-muted/40 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="sm:text-sm text-xs font-semibold truncate text-foreground">
                          {subject.name}
                        </h4>
                      </div>
                      <p className="text-[11px] font-semibold text-muted-foreground font-mono uppercase tracking-card mb-2">
                        {subject.code}
                      </p>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="text-muted-foreground uppercase opacity-80">
                            Asistencia
                          </span>
                          <span className="text-foreground">
                            {subject.attendedClasses}/{subject.totalClasses}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-1.5 w-full bg-muted/70 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${progress}%`,
                                backgroundColor:
                                  progress >= 80
                                    ? '#10b981'
                                    : progress >= 60
                                      ? '#f59e0b'
                                      : '#f43f5e',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end pt-1 justify-center shrink-0">
                      <div className="text-right flex flex-col items-center justify-center p-3 rounded-xl bg-background/50 border border-border/40 min-w-[64px]">
                        <div className="sm:text-[17px] text-xs font-semibold text-foreground tracking-card">
                          {Math.round(progress)}%
                        </div>
                        <div className="text-[9px] uppercase font-semibold text-muted-foreground mt-0.5">
                          asistencia
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
            <p className="text-xs">No tienes asignaturas registradas</p>
            <p className="text-xs text-muted-foreground mt-1">Tus asignaturas aparecerán aquí</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1.5 rounded-lg bg-muted/40 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${currentPage === i ? 'bg-primary' : 'bg-muted/40 hover:bg-muted'
                    }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1.5 rounded-lg bg-muted/40 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

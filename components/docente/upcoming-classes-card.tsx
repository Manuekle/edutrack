'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface UpcomingClass {
  id: string;
  groupId: string;
  subjectId: string;
  subjectName: string;
  topic: string | null;
  classroom?: string | null;
  date: Date;
  startTime?: string | null;
}

interface UpcomingClassesCardProps {
  classes: UpcomingClass[];
  isLoading?: boolean;
}

export function UpcomingClassesCard({ classes, isLoading = false }: UpcomingClassesCardProps) {
  return (
    <Card className="shadow-sm border-border/20 bg-card/80 backdrop-blur-sm rounded-2xl shrink-0 h-fit">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Próximas Clases</CardTitle>
          <span className="text-xs text-muted-foreground">{classes.length}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl bg-muted/30 p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex items-center gap-2 pt-0.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : classes.length > 0 ? (
          <div className="space-y-2">
            {classes.slice(0, 3).map(cls => (
              <div
                key={cls.id}
                className="group relative rounded-xl border border-border/20 bg-muted/20 hover:bg-muted/40 hover:border-primary/20 hover:shadow-sm p-3.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <h4 className="sm:text-sm text-xs font-semibold truncate text-foreground">
                        {cls.subjectName}
                      </h4>
                    </div>
                    <div className="flex flex-col gap-1.5 ml-8">
                      <p className="text-[12px] text-muted-foreground line-clamp-1">
                        {cls.topic || 'Sin tema definido'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(cls.date).toLocaleDateString('es-CO', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            timeZone: 'UTC',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cls.startTime
                            ? /^\d{2}:\d{2}/.test(cls.startTime)
                              ? cls.startTime.substring(0, 5)
                              : (() => {
                                  const d = new Date(cls.startTime);
                                  return isNaN(d.getTime())
                                    ? cls.startTime
                                    : `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
                                })()
                            : 'Sin hora'}
                        </span>
                        {cls.classroom && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="font-semibold text-foreground">{cls.classroom}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col text-center py-12 items-center justify-center min-h-[160px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30 mb-3">
              <Calendar className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">No hay clases programadas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Las próximas clases aparecerán aquí
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, FileText } from 'lucide-react';

type EventType = 'EXAMEN' | 'TRABAJO' | 'LIMITE' | 'ANUNCIO' | 'INFO';

interface UpcomingClass {
  id: string;
  title: string;
  code: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime?: string;
  description?: string;
  subjectName?: string;
  type: EventType;
  isEvent: boolean;
}

interface UpcomingEventsCardProps {
  upcomingClasses: UpcomingClass[];
  isLoading: boolean;
}

const TYPE_COLORS: Record<EventType, string> = {
  EXAMEN: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  TRABAJO: 'bg-primary/10 text-primary border-primary/20',
  LIMITE: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  ANUNCIO: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  INFO: 'bg-muted text-muted-foreground border-border/40',
};

export function UpcomingEventsCard({ upcomingClasses, isLoading }: UpcomingEventsCardProps) {
  return (
    <Card className="shrink-0 h-fit">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Próximas Clases</CardTitle>
          <span className="text-xs text-muted-foreground">{upcomingClasses.length}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {upcomingClasses.length > 0 ? (
          <div className="space-y-1.5">
            {upcomingClasses.slice(0, 3).map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="group relative rounded-xl bg-muted/30 hover:bg-muted/50 p-3.5 transition-colors duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-lg ${TYPE_COLORS[item.type] || TYPE_COLORS.INFO} shrink-0`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <h4 className="sm:text-sm text-xs font-semibold truncate text-foreground">
                        {item.title}
                      </h4>
                    </div>
                    {item.subjectName && (
                      <p className="text-[12px] text-muted-foreground font-medium mb-1 ml-8">
                        {item.subjectName}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-[12px] text-muted-foreground line-clamp-1 mb-2 ml-8">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium ml-8">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.date
                          ? new Date(item.date).toLocaleDateString('es-CO', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              timeZone: 'UTC',
                            })
                          : 'Sin fecha'}
                      </span>
                      {item.startTime && (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(() => {
                              const d = new Date(item.startTime);
                              const h = d.getUTCHours();
                              const m = d.getUTCMinutes();
                              return !isNaN(h) && !isNaN(m)
                                ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                                : 'Sin hora';
                            })()}
                          </span>
                        </>
                      )}
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
            <p className="text-sm font-medium">No hay eventos programados</p>
            <p className="text-xs text-muted-foreground mt-1">
              Los próximos eventos aparecerán aquí
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

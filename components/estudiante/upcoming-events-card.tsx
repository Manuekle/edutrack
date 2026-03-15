'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

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
  TRABAJO: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  LIMITE: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  ANUNCIO: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  INFO: 'bg-muted text-muted-foreground border-border/40',
};

export function UpcomingEventsCard({ upcomingClasses, isLoading }: UpcomingEventsCardProps) {
  return (
    <Card className="shadow-none border-0 bg-muted/20 dark:bg-white/[0.02] rounded-3xl shrink-0 h-fit">
      <CardHeader className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="sm:text-lg text-base font-semibold tracking-card text-foreground">
            Próximas Clases
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {upcomingClasses.length > 0 ? (
          <div className="space-y-3">
            {upcomingClasses.slice(0, 3).map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="group relative rounded-2xl border-0 transition-all duration-300 bg-muted/40 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold truncate text-foreground">
                        {item.title}
                      </h4>
                    </div>
                    {item.subjectName && (
                      <p className="text-[12px] text-muted-foreground font-medium mb-1">
                        {item.subjectName}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-[13px] text-muted-foreground line-clamp-1 mb-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1 text-primary">
                        <Calendar className="h-3 w-3" />
                        {item.date
                          ? new Date(item.date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            timeZone: 'UTC',
                          })
                          : 'Sin fecha'}
                      </span>
                      {item.startTime && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>
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
          <div className="flex flex-col text-center py-16 items-center justify-center h-[calc(50vh-200px)]">
            <p className="text-xs">No hay eventos programados</p>
            <p className="text-xs text-muted-foreground mt-1">
              Los próximos eventos aparecerán aquí
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

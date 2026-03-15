'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
}

export function UpcomingClassesCard({ classes }: UpcomingClassesCardProps) {
  const router = useRouter();

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
        {classes.length > 0 ? (
          <div className="space-y-3">
            {classes.slice(0, 3).map(cls => (
              <div
                key={cls.id}
                className="group relative rounded-2xl border-0 transition-all duration-300 bg-muted/40 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold truncate text-foreground">
                        {cls.subjectName}
                      </h4>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[13px] text-muted-foreground line-clamp-1">
                        {cls.topic || 'Sin tema definido'}
                      </p>
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1 text-primary">
                          <Calendar className="h-3 w-3" />
                          {new Date(cls.date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            timeZone: 'UTC',
                          })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>
                          {cls.startTime
                            ? `${String(new Date(cls.startTime).getUTCHours()).padStart(2, '0')}:${String(new Date(cls.startTime).getUTCMinutes()).padStart(2, '0')}`
                            : 'Sin hora definida'}
                        </span>
                        {cls.classroom && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="font-semibold text-foreground">{cls.classroom}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col text-center py-16 items-center justify-center h-[calc(50vh-200px)]">
            <p className="text-xs">No hay clases programadas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Las próximas clases aparecerán aquí
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpcomingClass {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string | null;
  date: Date;
}

interface UpcomingClassesCardProps {
  classes: UpcomingClass[];
}

export function UpcomingClassesCard({ classes }: UpcomingClassesCardProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">Próximas Clases</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {classes.length > 0 ? (
          <div className="space-y-3">
            {classes.map(cls => (
              <div
                key={cls.id}
                className="group relative rounded-lg border transition-all duration-200 hover:border-border hover:shadow-sm cursor-pointer bg-card p-4"
                onClick={() => router.push(`/dashboard/docente/asignaturas/${cls.subjectId}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-medium truncate">{cls.subjectName}</h4>
                    </div>
                    <span className="flex flex-col">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {cls.topic || 'Sin tema definido'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(cls.date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {'-'}
                        <span>
                          {cls.date
                            ? new Date(cls.date)
                                .toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })
                                .replace(/a\.\s*m\./i, 'AM')
                                .replace(/p\.\s*m\./i, 'PM')
                            : 'Sin hora definida'}
                        </span>
                      </div>
                    </span>
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

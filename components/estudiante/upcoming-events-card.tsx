import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays } from 'lucide-react';

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
    <Card className="mb-8 border-0 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-[15px] font-semibold tracking-card text-foreground">
          Próximas Fechas
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : upcomingClasses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {upcomingClasses.map((item, index) => (
              <Card
                key={`${item.id}-${index}`}
                className="rounded-2xl border-border/50 shadow-sm hover:shadow-md hover:border-border transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-5 flex flex-col h-full justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-[14px] tracking-card text-foreground line-clamp-2 flex-1">
                        {item.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium uppercase px-1.5 py-0 shrink-0 ${TYPE_COLORS[item.type] || TYPE_COLORS.INFO}`}
                      >
                        {item.type}
                      </Badge>
                    </div>
                    {item.subjectName && (
                      <p className="text-[12px] text-muted-foreground font-medium">
                        {item.subjectName}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-[12px] text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40 text-[12px] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">
                      {new Date(item.date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-medium text-foreground">No hay eventos programados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los próximos eventos aparecerán aquí
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

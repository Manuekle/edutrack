import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';

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

export function UpcomingEventsCard({ upcomingClasses, isLoading }: UpcomingEventsCardProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-card">Próximas Fechas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        ) : upcomingClasses.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {upcomingClasses.map((item, index) => (
              <Card key={`${item.id}-${index}`} className="p-0">
                <CardContent className="p-4 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-xs tracking-card text-foreground">
                        {item.title}
                      </span>
                      <Badge variant="outline" className="text-xs font-normal lowercase">
                        {item.type}
                      </Badge>
                    </div>
                    {item.subjectName && (
                      <span className="text-xs text-muted-foreground">{item.subjectName}</span>
                    )}
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
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
          <div className="text-center py-12">
            <p className="text-xs text-muted-foreground">No hay eventos programados</p>
            <p className="text-xs text-muted-foreground/70">Los próximos eventos aparecerán aquí</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

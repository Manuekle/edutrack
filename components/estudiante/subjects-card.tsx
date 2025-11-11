import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export function SubjectsCard({ subjects }: SubjectsCardProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-card">Mis Asignaturas</CardTitle>
      </CardHeader>
      <CardContent>
        {subjects.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {subjects.map(subject => (
              <Card key={subject.id}>
                <CardContent className="px-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <h3 className="font-medium text-xs tracking-card">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground">{subject.teacher}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-primary">
                        {subject.attendancePercentage}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {subject.attendedClasses}/{subject.totalClasses} clases
                      </div>
                    </div>
                  </div>

                  {subject.nextClass && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs font-medium lowercase">
                              {subject.nextClass.timeUntil}
                            </Badge>
                          </div>
                          {subject.nextClass.topic && (
                            <div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {subject.nextClass.topic}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-muted-foreground flex flex-col items-center justify-center h-32">
            <p className="text-xs text-muted-foreground">No tienes asignaturas registradas</p>
            <p className="text-xs text-muted-foreground/70">Tus asignaturas aparecerán aquí</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

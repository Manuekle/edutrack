import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, User } from 'lucide-react';

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
  if (percentage >= 80) return 'text-emerald-700 dark:text-emerald-400';
  if (percentage >= 60) return 'text-amber-700 dark:text-amber-400';
  return 'text-rose-700 dark:text-rose-400';
}

export function SubjectsCard({ subjects }: SubjectsCardProps) {
  return (
    <Card className="mb-8 border-0 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-[15px] font-semibold tracking-card text-foreground">
          Mis Asignaturas
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {subjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map(subject => (
              <Card
                key={subject.id}
                className="rounded-2xl border-border/50 shadow-sm hover:shadow-md hover:border-border transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h3 className="font-semibold text-[14px] tracking-card text-foreground line-clamp-2">
                        {subject.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">{subject.teacher}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xl font-semibold ${getAttendanceColor(subject.attendancePercentage)}`}>
                        {subject.attendancePercentage}%
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {subject.attendedClasses}/{subject.totalClasses} clases
                      </div>
                    </div>
                  </div>

                  {subject.nextClass && (
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium lowercase px-1.5 py-0 shrink-0"
                        >
                          {subject.nextClass.timeUntil}
                        </Badge>
                        {subject.nextClass.topic && (
                          <p className="text-[12px] text-muted-foreground line-clamp-1 flex-1">
                            {subject.nextClass.topic}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-medium text-foreground">
              No tienes asignaturas registradas
            </p>
            <p className="text-sm text-muted-foreground mt-1">Tus asignaturas aparecerán aquí</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

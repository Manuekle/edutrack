import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Video } from 'lucide-react';

interface LiveClass {
  id: string;
  subjectName: string;
  teacherName: string;
  topic: string;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  qrToken: string;
  attendanceStats: {
    present: number;
    absent: number;
    late: number;
    justified: number;
  };
  totalStudents: number;
  myStatus: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';
  classroom?: string;
}

interface LiveClassCardProps {
  liveClass: LiveClass;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PRESENTE: {
    label: 'Presente',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  AUSENTE: {
    label: 'Ausente',
    className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  },
  TARDANZA: {
    label: 'Tardanza',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  JUSTIFICADO: {
    label: 'Justificado',
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
};

export function LiveClassCard({ liveClass }: LiveClassCardProps) {
  const statusInfo = STATUS_MAP[liveClass.myStatus] ?? STATUS_MAP.AUSENTE;

  return (
    <Card className="mb-6 border border-red-500/20 shadow-lg shadow-red-500/5 bg-card rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse" />
      <CardHeader className="px-5 pt-5 pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 pl-2">
            <CardTitle className="sm:text-lg text-base font-semibold text-foreground">
              Clase en curso
            </CardTitle>
            <p className="text-sm font-medium text-muted-foreground">
              {liveClass.subjectName}
              {liveClass.topic && <span className="mx-1.5 opacity-50">&bull;</span>}
              {liveClass.topic}
              {liveClass.classroom && (
                <>
                  <span className="mx-1.5 opacity-50">&bull;</span> Aula:{' '}
                  <span className="text-foreground font-medium">{liveClass.classroom}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full shrink-0">
            <Video className="h-3 w-3 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">En vivo</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pl-7">
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tu asistencia
            </h3>
            <div className="flex items-center gap-3">
              {liveClass.startTime && (
                <span className="text-xs font-mono text-muted-foreground">
                  {format(
                    liveClass.startTime instanceof Date
                      ? liveClass.startTime
                      : new Date(liveClass.startTime),
                    'h:mm a'
                  )}
                  {liveClass.endTime &&
                    ` - ${format(liveClass.endTime instanceof Date ? liveClass.endTime : new Date(liveClass.endTime), 'h:mm a')}`}
                </span>
              )}
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-semibold ${statusInfo.className}`}
              >
                {statusInfo.label}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/30 rounded-xl p-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  {liveClass.attendanceStats.present}
                </span>
                <span className="text-[10px] text-muted-foreground">Presentes</span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  {liveClass.attendanceStats.absent}
                </span>
                <span className="text-[10px] text-muted-foreground">Ausentes</span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  {liveClass.attendanceStats.late}
                </span>
                <span className="text-[10px] text-muted-foreground">Tardanzas</span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  {liveClass.attendanceStats.justified}
                </span>
                <span className="text-[10px] text-muted-foreground">Justif.</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] font-medium text-muted-foreground text-right uppercase tracking-wider">
            Total matriculados:{' '}
            <span className="font-semibold text-foreground">{liveClass.totalStudents}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

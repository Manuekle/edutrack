import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

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
    <Card className="mb-8 border-0 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)] bg-card rounded-3xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/80 animate-pulse" />
      <CardHeader className="px-6 pt-6 pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 pl-2">
            <CardTitle className="sm:text-xl text-lg font-semibold tracking-card text-foreground">
              Clase en curso
            </CardTitle>
            <p className="text-[13px] font-medium text-muted-foreground">
              {liveClass.subjectName} <span className="mx-1.5 opacity-50">&bull;</span>{' '}
              {liveClass.topic}
              {liveClass.classroom && (
                <>
                  <span className="mx-1.5 opacity-50">&bull;</span> Aula:{' '}
                  <span className="text-foreground">{liveClass.classroom}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-card hidden md:block mt-0.5">
              En vivo
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pl-8">
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-foreground/80 uppercase tracking-card">
              Tu asistencia
            </h3>
            <div className="flex items-center gap-3">
              {liveClass.startTime && (
                <span className="text-[12px] font-mono text-muted-foreground">
                  {format(new Date(liveClass.startTime), 'h:mm a')}
                  {liveClass.endTime && ` - ${format(new Date(liveClass.endTime), 'h:mm a')}`}
                </span>
              )}
              <Badge variant="outline" className={`text-[10px] uppercase font-medium ${statusInfo.className}`}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 rounded-2xl p-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none text-foreground">
                  {liveClass.attendanceStats.present}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">Presentes</span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none text-foreground">
                  {liveClass.attendanceStats.absent}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">Ausentes</span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none text-foreground">
                  {liveClass.attendanceStats.late}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">Tardanzas</span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none text-foreground">
                  {liveClass.attendanceStats.justified}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">Justificados</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-medium text-muted-foreground text-right uppercase tracking-card">
            Total matriculados:{' '}
            <span className="font-semibold text-foreground mx-1 text-xs">
              {liveClass.totalStudents}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

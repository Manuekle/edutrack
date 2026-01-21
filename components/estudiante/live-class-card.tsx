import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Clock, MapPin } from 'lucide-react';

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

export function LiveClassCard({ liveClass }: LiveClassCardProps) {
  return (
    <Card className="mb-8 border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">Clase en curso</CardTitle>
            <p className="text-xs text-muted-foreground">
              {liveClass.subjectName} • {liveClass.topic}
            </p>
          </div>
          <div className="flex items-center md:space-x-2 md:bg-foreground/5 px-2 md:px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-foreground animate-pulse"></div>
            <span className="text-xs font-medium hidden md:block">En curso</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-0">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xs font-medium">Detalles de la Clase</h3>
            <div className="flex gap-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">
                  {liveClass.startTime
                    ? format(new Date(liveClass.startTime), 'h:mm a')
                    : 'Sin hora'}
                  {liveClass.endTime && ` - ${format(new Date(liveClass.endTime), 'h:mm a')}`}
                </span>
              </div>
              {liveClass.classroom && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">Aula {liveClass.classroom}</span>
                </div>
              )}
            </div>
            {liveClass.myStatus === 'PRESENTE' && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-green-700 text-xs font-medium">
                  ¡Estás presente en esta clase!
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

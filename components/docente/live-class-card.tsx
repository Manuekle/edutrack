import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveClassData } from '@/services/dashboardService';

interface LiveClassCardProps {
  liveClass: LiveClassData;
}

export function LiveClassCard({ liveClass }: LiveClassCardProps) {
  return (
    <Card className="mb-8 border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold tracking-card">Clase en curso</CardTitle>
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
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-medium">Asistencia en Tiempo Real</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/80"></div>
                <span className="text-xs">
                  <span className="font-semibold">{liveClass.attendanceStats.present}</span>{' '}
                  Presentes
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/80"></div>
                <span className="text-xs">
                  <span className="font-semibold">{liveClass.attendanceStats.absent}</span> Ausentes
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/80"></div>
                <span className="text-xs">
                  <span className="font-semibold">{liveClass.attendanceStats.late}</span> Tardanzas
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/80"></div>
                <span className="text-xs">
                  <span className="font-semibold">{liveClass.attendanceStats.justified}</span>{' '}
                  Justificados
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Total de estudiantes: {liveClass.totalStudents}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

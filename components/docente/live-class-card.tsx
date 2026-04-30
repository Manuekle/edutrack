import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveClassData } from '@/services/dashboardService';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LiveClassCardProps {
  liveClass: LiveClassData;
}

export function LiveClassCard({ liveClass }: LiveClassCardProps) {
  const router = useRouter();
  return (
    <Card className="mb-8 border border-red-500/20 border-t-4 border-t-red-500 shadow-[0_4px_24px_rgba(239,68,68,0.08)] dark:shadow-[0_4px_24px_rgba(239,68,68,0.15)] bg-card rounded-3xl overflow-hidden relative">
      <div className="absolute top-4 left-0 w-1 h-[calc(100%-2rem)] bg-red-500/60"></div>
      <CardHeader className="px-6 pt-6 pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 pl-2">
            <CardTitle className="sm:text-xl text-lg font-semibold tracking-card text-foreground">
              Clase en curso
            </CardTitle>
            <p className="text-[13px] font-medium text-muted-foreground">
              {liveClass.subjectName} <span className="mx-1.5 opacity-50">•</span> {liveClass.topic}
              {liveClass.classroom && (
                <>
                  <span className="mx-1.5 opacity-50">•</span> Salón:{' '}
                  <span className="text-foreground">{liveClass.classroom}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full shrink-0" role="status" aria-label="Clase en vivo">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-card mt-0.5">
              EN VIVO
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pl-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4 w-full">
            <h3 className="text-[13px] font-semibold text-foreground/80 uppercase tracking-card">
              Asistencia en Tiempo Real
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 rounded-2xl p-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold leading-none text-foreground">
                    {liveClass.attendanceStats.present}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">Presentes</span>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold leading-none text-foreground">
                    {liveClass.attendanceStats.absent}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">Ausentes</span>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold leading-none text-foreground">
                    {liveClass.attendanceStats.late}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">Tardanzas</span>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold leading-none text-foreground">
                    {liveClass.attendanceStats.justified}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Justificados
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-card">
                Total matriculados:{' '}
                <span className="font-semibold text-foreground mx-1 text-xs">
                  {liveClass.totalStudents}
                </span>
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 rounded-xl shadow-none border-transparent bg-muted/60 hover:bg-muted transition-colors gap-1.5 text-xs font-semibold"
                onClick={() => router.push('/dashboard/docente/grupos')}
              >
                Ir a mis grupos
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

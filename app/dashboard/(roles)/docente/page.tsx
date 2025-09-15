'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import {
  getLiveClassData,
  getTeacherDashboardData,
  type LiveClassData,
} from '@/services/dashboardService';
import { BookOpen, Calendar, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type SubjectStats = {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  completedClasses: number;
  nextClass?: {
    id: string;
    date: Date;
    topic: string;
  };
};

interface UpcomingClass {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string | null;
  date: Date;
}

export default function DocenteDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectStats[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [liveClass, setLiveClass] = useState<LiveClassData | null>(null);

  // Cargar datos del dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchDashboardData = async () => {
        setLoading(true);
        try {
          const { data, error } = await getTeacherDashboardData();

          if (error) {
            // Mostrar mensaje de error al usuario
            return;
          }

          if (data) {
            const transformedSubjects = data.subjects.map(subject => ({
              ...subject,
              nextClass: subject.nextClass
                ? {
                    ...subject.nextClass,
                    date: new Date(subject.nextClass.date),
                  }
                : undefined,
            }));
            setSubjects(transformedSubjects);

            const transformedUpcomingClasses = data.upcomingClasses.map(cls => ({
              ...cls,
              date: new Date(cls.date),
            }));
            setUpcomingClasses(transformedUpcomingClasses);
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      };

      const fetchLiveClass = async () => {
        try {
          const { data } = await getLiveClassData();
          setLiveClass(data?.liveClass || null);
        } catch (error) {
          setLiveClass(null);
        }
      };

      fetchDashboardData();
      fetchLiveClass(); // Carga inicial

      const intervalId = setInterval(fetchLiveClass, 10000); // Polling cada 10 segundos

      return () => clearInterval(intervalId); // Limpiar intervalo al desmontar
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <CardHeader className="p-0 w-full">
          <CardTitle className="text-2xl font-semibold tracking-tight">Mi Panel</CardTitle>
          <CardDescription className="text-xs">
            Gestiona tus asignaturas y clases en vivo.
          </CardDescription>
        </CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/docente/asignaturas')}>
              Ver todas las asignaturas
            </Button>
          </div>
        </div>
      </div>

      {/* Tarjeta de Clase en Vivo */}
      {liveClass && (
        <Card className="mb-8 border shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold tracking-card">
                  Clase en curso
                </CardTitle>
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
                      <span className="font-semibold">{liveClass.attendanceStats.absent}</span>{' '}
                      Ausentes
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground/80"></div>
                    <span className="text-xs">
                      <span className="font-semibold">{liveClass.attendanceStats.late}</span>{' '}
                      Tardanzas
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
      )}

      {/* Estadísticas Rápidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Asignaturas Activas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl tracking-card font-semibold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">En este semestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Clases Totales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl tracking-card font-semibold">
              {subjects.reduce((sum, subj) => sum + subj.totalClasses, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Clases Impartidas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl tracking-card font-semibold">
              {subjects.reduce((sum, subj) => sum + subj.completedClasses, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Próxima Clase</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingClasses.length > 0 ? (
              <>
                {/* <div className="text-lg font-semibold">{upcomingClasses[0].subjectName}</div>
                <p className="text-xs text-muted-foreground">
                  {new Date(upcomingClasses[0].date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(upcomingClasses[0].date).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p> */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-semibold tracking-card">
                        {upcomingClasses[0].subjectName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {new Date(upcomingClasses[0].date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                      {/* <span>
                        {new Date(upcomingClasses[0].date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span> */}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs">No hay clases programadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximas Clases */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-semibold tracking-card">Próximas Clases</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.map(cls => (
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
                <p className="text-xs text-muted-foreground font-medium">
                  No hay clases programadas
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Las próximas clases aparecerán aquí
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asignaturas Recientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-semibold tracking-card">Mis Asignaturas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {subjects.length > 0 ? (
              <div className="space-y-3">
                {subjects.slice(0, 3).map(subject => {
                  const progress = (subject.completedClasses / subject.totalClasses) * 100;
                  return (
                    <div
                      key={subject.id}
                      className="group relative rounded-lg border transition-all duration-200 hover:border-border hover:shadow-sm cursor-pointer bg-card p-4"
                      onClick={() => router.push(`/dashboard/docente/asignaturas/${subject.id}`)}
                    >
                      <div className="flex items-end justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xs font-medium truncate">{subject.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{subject.code}</p>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progreso del curso</span>
                              <span className="text-xs text-muted-foreground">
                                {subject.completedClasses}/{subject.totalClasses}
                              </span>
                            </div>
                            <div className="relative">
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end">
                          <div className="text-right">
                            <div className="text-xs font-normal font-mono text-foreground">
                              {Math.round(progress)}%
                            </div>
                            <div className="text-xs text-muted-foreground">completado</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xs text-muted-foreground font-medium">
                  No tienes asignaturas asignadas
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Registra una asignatura para comenzar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

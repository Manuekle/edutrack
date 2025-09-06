'use client';

import { Badge } from '@/components/ui/badge';
// Removed unused imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading, LoadingPage } from '@/components/ui/loading';
import { format } from 'date-fns';
import { AlertTriangle, BarChart3, BookOpen, Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type EventType = 'EXAMEN' | 'TRABAJO' | 'LIMITE' | 'ANUNCIO' | 'INFO';
// Removed unused import

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

// Removed unused interfaces

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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const IconComponent = Icon;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function EstudianteDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingUpcomingClasses, setIsLoadingUpcomingClasses] = useState(true);
  const [isLoadingLiveClass, setIsLoadingLiveClass] = useState(true);
  const [stats, setStats] = useState({
    globalAttendancePercentage: 0,
    attendedClasses: 0,
    totalClasses: 0,
    totalSubjects: 0,
    averageGrade: '0.0',
    subjectsAtRisk: 0,
    weeklyAttendanceAverage: 0,
  });

  const fetchLiveClass = useCallback(async () => {
    try {
      setIsLoadingLiveClass(true);
      const response = await fetch('/api/estudiante/current-class');

      if (!response.ok) {
        throw new Error('Error al cargar la clase en vivo');
      }

      const data = await response.json();

      if (data.liveClass) {
        const liveClassData = {
          id: data.liveClass.id,
          subjectName: data.liveClass.subjectName,
          teacherName: data.liveClass.teacherName,
          topic: data.liveClass.topic || 'Clase en curso',
          date: new Date(),
          startTime: data.liveClass.startTime ? new Date(data.liveClass.startTime) : null,
          endTime: data.liveClass.endTime ? new Date(data.liveClass.endTime) : null,
          qrToken: data.liveClass.qrToken,
          attendanceStats: data.liveClass.attendanceStats || {
            present: 0,
            absent: 0,
            late: 0,
            justified: 0,
          },
          totalStudents: data.liveClass.totalStudents || 0,
          myStatus: data.liveClass.myStatus || 'AUSENTE',
          classroom: data.liveClass.classroom,
        };
        setLiveClass(liveClassData);
      } else {
        setLiveClass(null);
      }
    } catch (error) {
      setLiveClass(null);
    } finally {
      setIsLoadingLiveClass(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoadingUpcomingClasses(true);
      const response = await fetch('/api/estudiante/dashboard');
      if (!response.ok) {
        throw new Error('Error al cargar los datos del dashboard');
      }
      const data = await response.json();

      // Transform subjects to match our interface
      const transformedSubjects = (data.subjects || []).map((subj: Subject) => ({
        ...subj,
        teacher: subj.teacher || 'Profesor no asignado',
        attendancePercentage: subj.attendancePercentage || 0,
        totalClasses: subj.totalClasses || 0,
        attendedClasses: subj.attendedClasses || 0,
      }));

      setSubjects(transformedSubjects);

      // Transform upcoming items
      const transformedUpcomingItems = (data.upcomingItems || []).map((item: UpcomingClass) => ({
        ...item,
        isEvent: !!item.isEvent,
        endTime: item.endTime || '23:59',
        // Ensure all required fields are present
        title: item.title || 'Sin título',
        code: item.code || '',
        teacher: item.teacher || 'Profesor no asignado',
        date: item.date,
        startTime: item.startTime || '00:00',
        type: (item.type || 'INFO') as EventType, // Default to INFO type if not specified
      }));

      setUpcomingClasses(transformedUpcomingItems);

      // Usar los datos de 'cards' directamente de la API
      if (data.cards) {
        setStats(prev => ({
          ...prev,
          globalAttendancePercentage: data.cards.globalAttendancePercentage || 0,
          attendedClasses: data.cards.attendedClasses || 0,
          totalClasses: data.cards.totalClasses || 0,
          totalSubjects: transformedSubjects.length,
          subjectsAtRisk: data.cards.subjectsAtRisk || 0,
          weeklyAttendanceAverage: data.cards.weeklyAttendanceAverage || 0,
        }));
      }
    } catch (error) {
      setSubjects([]);
      setUpcomingClasses([]);
    } finally {
      setIsLoadingUpcomingClasses(false);
    }
  }, []);

  // Combine data fetching into a single effect with proper cleanup
  useEffect(() => {
    let isMounted = true;
    let dashboardInterval: NodeJS.Timeout;
    let liveClassInterval: NodeJS.Timeout;

    const fetchAllData = async () => {
      if (!isMounted) return;

      try {
        await Promise.all([fetchDashboardData(), fetchLiveClass()]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        if (isMounted) {
          setIsInitialLoad(false);
        }
      }
    };

    // Initial fetch
    fetchAllData();

    // Only set up polling if component is still mounted
    if (isMounted) {
      // Dashboard data refreshes every 10 minutes
      dashboardInterval = setInterval(fetchDashboardData, 10 * 60 * 1000);

      // Live class only polls when there's an active class
      const checkLiveClass = () => {
        if (liveClass?.id) {
          fetchLiveClass();
        }
      };

      // Initial check with shorter interval
      liveClassInterval = setInterval(checkLiveClass, 30000);
    }

    return () => {
      isMounted = false;
      clearInterval(dashboardInterval);
      clearInterval(liveClassInterval);
    };
  }, [fetchDashboardData, fetchLiveClass, liveClass?.id]);

  if (isInitialLoad && (isLoadingUpcomingClasses || isLoadingLiveClass)) {
    return <LoadingPage />;
  }

  return (
    <div className="mx-auto">
      <div className="p-0 w-full mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Mi Panel</h1>
        <p className="text-xs text-muted-foreground">Resumen de tu progreso académico</p>
      </div>

      {/* Live Class Card */}
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
              <div className="flex items-center md:space-x-2 bg-foreground/5 px-2 md:px-3 py-1 rounded-full">
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
                {liveClass.myStatus === 'PRESENTE' ? (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-green-700 text-xs font-medium">
                      ¡Estás presente en esta clase!
                    </span>
                  </div>
                ) : (
                  <Link
                    href={`/dashboard/estudiante/escanear/${liveClass.qrToken}`}
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-2"
                    tabIndex={!liveClass.qrToken ? -1 : 0}
                    aria-disabled={!liveClass.qrToken}
                  >
                    Unirse a la clase
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Asistencia global"
          value={`${stats.globalAttendancePercentage}%`}
          subtitle={`${stats.attendedClasses} de ${stats.totalClasses} clases`}
          icon={Calendar}
        />
        <StatCard
          title="Asignaturas"
          value={stats.totalSubjects}
          subtitle="Materias activas"
          icon={BookOpen}
        />
        <StatCard
          title="Riesgo"
          value={stats.subjectsAtRisk}
          subtitle="Asignaturas en riesgo"
          icon={AlertTriangle}
        />
        <StatCard
          title="Asistencia semanal"
          value={`${stats.weeklyAttendanceAverage}%`}
          subtitle="Promedio últimas 4 semanas"
          icon={BarChart3}
        />
      </div>
      {/* Asignaturas */}
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
                        <h3 className="font-medium tracking-card">{subject.name}</h3>
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

      {/* Próximas Clases */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-card">Próximas Fechas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUpcomingClasses ? (
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
                        <span className="font-medium text-md tracking-card text-foreground">
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
              <p className="text-xs text-muted-foreground/70">
                Los próximos eventos aparecerán aquí
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

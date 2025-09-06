'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';

// --- CONSTANTES ---
const TEACHERS_PER_PAGE = 5;
const ALL_SUBJECTS_VALUE = 'all';
const PIE_COLORS = ['#4CAF50', '#F44336', '#FF9800'] as const;
const LINE_COLORS = ['#404040', '#525252', '#737373', '#a3a3a3', '#d4d4d4'] as const;

// --- TIPOS Y INTERFACES ---
interface Teacher {
  id: string;
  name: string;
  document?: string;
  codigoDocente?: string;
}

interface ClassAttendance {
  id: string;
  date: string;
  name?: string;
  attendanceStats: Record<'present' | 'absent' | 'late' | 'justified', number>;
}

interface SubjectHistoric {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  attendanceTotals: Record<'present' | 'absent' | 'late' | 'justified', number>;
  classes: ClassAttendance[];
}

interface HistoricApiResponse {
  period: string | null;
  subjects: SubjectHistoric[];
}

interface ChartRow {
  date: string;
  displayDate: string;
  subjectNames: Record<string, string>;
  [key: string]: string | number | Record<string, string>;
}

interface TooltipEntry {
  color: string;
  value: number;
  dataKey: string;
  payload: ChartRow & { subjectNames: Record<string, string> };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

// --- FUNCIONES DE UTILIDAD ---
const calculatePercentage = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

const getBadgeClass = (percentage: number) => {
  if (percentage < 60) return 'bg-rose-600 text-white hover:bg-rose-700';
  if (percentage >= 80) return 'bg-emerald-600 text-white hover:bg-emerald-700';
  return 'bg-amber-600 text-white hover:bg-amber-700';
};

const formatDateForDisplay = (date: Date) => {
  const dayName = date.toLocaleDateString('es-CO', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('es-CO', { month: 'short' });
  return { dayName, day, month };
};

// --- COMPONENTES AUXILIARES ---
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload?.length) {
    const displayDate = payload[0]?.payload?.displayDate || label;
    const subjectNames = payload[0]?.payload?.subjectNames || {};

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium text-sm mb-2">{displayDate}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {subjectNames[entry.dataKey] || entry.dataKey}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const SubjectDetailsPanel = ({ subject }: { subject: SubjectHistoric }) => {
  const { attendanceTotals, totalClasses, classes } = subject;
  const totalAttendance =
    attendanceTotals.present +
    attendanceTotals.absent +
    attendanceTotals.late +
    attendanceTotals.justified;

  const pieData = useMemo(
    () =>
      [
        {
          name: 'Presente',
          value: attendanceTotals.present,
          percentage: calculatePercentage(attendanceTotals.present, totalAttendance),
        },
        {
          name: 'Ausente',
          value: attendanceTotals.absent + attendanceTotals.late,
          percentage: calculatePercentage(
            attendanceTotals.absent + attendanceTotals.late,
            totalAttendance
          ),
        },
        {
          name: 'Justificado',
          value: attendanceTotals.justified,
          percentage: calculatePercentage(attendanceTotals.justified, totalAttendance),
        },
      ].filter(item => item.value > 0),
    [attendanceTotals, totalAttendance]
  );

  const chartConfig = useMemo(
    () =>
      pieData.reduce(
        (acc, item, index) => {
          acc[item.name] = { label: item.name, color: PIE_COLORS[index % PIE_COLORS.length] };
          return acc;
        },
        {} as Record<string, { label: string; color: string }>
      ),
    [pieData]
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-card">{subject.name}</CardTitle>
        <p className="text-xs text-muted-foreground">Código: {subject.code}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de clases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h4 className="text-sm font-medium">Clases Impartidas</h4>
              <Badge variant="secondary">{totalClasses} en total</Badge>
            </div>
            <div className="max-h-[420px] overflow-y-auto pr-2 -mr-2 space-y-3">
              {classes.map((cls, index) => {
                const totalInClass =
                  cls.attendanceStats.present +
                  cls.attendanceStats.absent +
                  cls.attendanceStats.late +
                  cls.attendanceStats.justified;
                const percentage = calculatePercentage(cls.attendanceStats.present, totalInClass);
                const { dayName, day, month } = formatDateForDisplay(new Date(cls.date));

                return (
                  <div
                    key={cls.id}
                    className="group relative rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-muted/50 text-center">
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {dayName}.
                          </span>
                          <span className="text-lg font-bold">{day}</span>
                          <span className="text-xs text-muted-foreground uppercase">{month}</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">
                            {cls.name ?? `Clase ${index + 1}`}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="h-5 px-1.5 text-xs font-mono">
                              <span className="text-emerald-600 mr-1">P:</span>
                              {cls.attendanceStats.present}
                            </Badge>
                            <Badge variant="outline" className="h-5 px-1.5 text-xs font-mono">
                              <span className="text-rose-600 mr-1">A:</span>
                              {cls.attendanceStats.absent + cls.attendanceStats.late}
                            </Badge>
                            {cls.attendanceStats.justified > 0 && (
                              <Badge variant="outline" className="h-5 px-1.5 text-xs font-mono">
                                <span className="text-amber-600 mr-1">J:</span>
                                {cls.attendanceStats.justified}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={`h-6 px-2 text-xs font-medium ${getBadgeClass(percentage)}`}
                      >
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico de distribución */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h4 className="text-sm font-medium">Distribución Total</h4>
              <Badge variant="secondary">{totalAttendance} registros</Badge>
            </div>
            <div className="border rounded-lg p-4">
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="grid grid-cols-3 gap-4 pt-8">
                {pieData.map((item, index) => (
                  <div key={index} className="rounded-xl p-4 border bg-muted/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-xl font-bold">{item.percentage}%</span>
                    <p className="text-xs text-muted-foreground">({item.value} registros)</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function TeacherReport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [period, setPeriod] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(ALL_SUBJECTS_VALUE);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. OBTENCIÓN DE DATOS
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users?role=DOCENTE');
      if (!response.ok) throw new Error('No se pudo cargar la lista de docentes.');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: historicData,
    isLoading: loadingData,
    error,
  } = useQuery<HistoricApiResponse>({
    queryKey: ['teacherHistoric', selectedTeacher?.id, period],
    queryFn: async () => {
      if (!selectedTeacher?.id) return { period: null, subjects: [] };
      const query = period ? `?period=${period}` : '';
      const res = await fetch(`/api/admin/docentes/${selectedTeacher.id}/historico${query}`);
      if (!res.ok) throw new Error(`Error ${res.status}: No se pudo cargar el histórico.`);
      const data = await res.json();
      if (!data?.subjects) throw new Error('La respuesta de la API no tiene el formato esperado.');
      return data;
    },
    enabled: !!selectedTeacher,
    staleTime: 5 * 60 * 1000,
  });

  // 2. PROCESAMIENTO Y MEMOIZACIÓN DE DATOS
  const filteredTeachers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return searchTerm
      ? teachers.filter(
          t =>
            t.name.toLowerCase().includes(searchLower) ||
            t.document?.toLowerCase().includes(searchLower) ||
            t.codigoDocente?.toLowerCase().includes(searchLower)
        )
      : teachers;
  }, [teachers, searchTerm]);

  const allSubjects = useMemo(() => historicData?.subjects ?? [], [historicData]);

  const periodOptions = useMemo(() => {
    const periodSet = new Set<string>();
    allSubjects.forEach(subject => {
      subject.classes?.forEach(cls => {
        const date = new Date(cls.date);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = date.getMonth();
          periodSet.add(`${year}-${month < 6 ? '1' : '2'}`);
        }
      });
    });
    return Array.from(periodSet).sort((a, b) => b.localeCompare(a));
  }, [allSubjects]);

  const { chartData, subjectsForChart } = useMemo(() => {
    const activeSubjects = allSubjects.filter(s => s.classes?.length > 0);
    const subjectNamesMap = Object.fromEntries(activeSubjects.map(s => [s.code, s.name]));

    const rowsByDate: Record<string, ChartRow> = {};

    activeSubjects.forEach(subject => {
      subject.classes?.forEach(cls => {
        const date = new Date(cls.date);
        if (isNaN(date.getTime())) return;

        const dateKey = date.toISOString().split('T')[0];
        if (!rowsByDate[dateKey]) {
          rowsByDate[dateKey] = {
            date: dateKey,
            displayDate: date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }),
            subjectNames: subjectNamesMap,
          };
        }

        const { present, absent, late, justified } = cls.attendanceStats;
        const total = present + absent + late + justified;
        rowsByDate[dateKey][subject.code] = calculatePercentage(present, total);
      });
    });

    const sortedDates = Object.keys(rowsByDate).sort();
    const finalChartData = sortedDates.map(date => rowsByDate[date]);

    return { chartData: finalChartData, subjectsForChart: activeSubjects };
  }, [allSubjects]);

  const paginatedTeachers = useMemo(
    () =>
      filteredTeachers.slice(
        (currentPage - 1) * TEACHERS_PER_PAGE,
        currentPage * TEACHERS_PER_PAGE
      ),
    [filteredTeachers, currentPage]
  );

  const selectedSubjectData = useMemo(() => {
    if (selectedSubjectId === ALL_SUBJECTS_VALUE) return null;
    return allSubjects.find(s => s.id === selectedSubjectId);
  }, [selectedSubjectId, allSubjects]);

  // 3. MANEJO DE EFECTOS SECUNDARIOS
  useEffect(() => {
    if (periodOptions.length > 0 && !period) {
      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${now.getMonth() < 6 ? '1' : '2'}`;
      setPeriod(periodOptions.includes(currentPeriod) ? currentPeriod : periodOptions[0]);
    }
  }, [periodOptions, period]);

  useEffect(() => {
    if (
      selectedSubjectId !== ALL_SUBJECTS_VALUE &&
      !allSubjects.some(s => s.id === selectedSubjectId)
    ) {
      setSelectedSubjectId(ALL_SUBJECTS_VALUE);
    }
  }, [selectedSubjectId, allSubjects]);

  useEffect(() => {
    setCurrentPage(1); // Reset page on new search
  }, [searchTerm]);

  // 4. LÓGICA DE RENDERIZADO
  const totalPages = Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE);
  const subjectsToDisplayInChart = subjectsForChart.filter(
    s => selectedSubjectId === ALL_SUBJECTS_VALUE || s.id === selectedSubjectId
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background gap-6">
      {/* Sidebar */}
      <aside className="w-full md:w-96 md:sticky self-start top-4">
        <Card>
          <CardHeader>
            <Input
              placeholder="Buscar docente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </CardHeader>
          <CardContent className="pr-2 -mr-2 max-h-[50vh] overflow-y-auto">
            {loadingTeachers ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : paginatedTeachers.length > 0 ? (
              <div className="space-y-1">
                {paginatedTeachers.map(teacher => (
                  <Button
                    key={teacher.id}
                    variant={selectedTeacher?.id === teacher.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-auto p-3 text-left"
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    <span className="h-9 w-9 rounded-full bg-muted border flex items-center justify-center font-semibold text-muted-foreground mr-3">
                      {teacher.name.charAt(0)}
                    </span>
                    <div>
                      <p className="font-medium text-sm truncate">{teacher.name}</p>
                      {teacher.codigoDocente && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {teacher.codigoDocente}
                        </p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground p-4">
                No se encontraron docentes.
              </div>
            )}
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="p-2 border-t flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm font-mono text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </CardFooter>
          )}
        </Card>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de Carga</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {!selectedTeacher ? (
          <Card className="flex items-center justify-center min-h-[400px]">
            <div className="text-center p-8">
              <h3 className="text-lg font-medium text-muted-foreground">Selecciona un docente</h3>
              <p className="text-sm text-muted-foreground/80 mt-1">
                Elige un docente de la lista para ver su historial.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="h-14 w-14 rounded-full bg-muted border flex items-center justify-center font-bold text-lg text-muted-foreground">
                    {selectedTeacher.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <div>
                    <CardTitle className="text-xl font-semibold">{selectedTeacher.name}</CardTitle>
                    {selectedTeacher.codigoDocente && (
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedTeacher.codigoDocente}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Select
                    value={period}
                    onValueChange={setPeriod}
                    disabled={periodOptions.length === 0}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map(p => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedSubjectId}
                    onValueChange={setSelectedSubjectId}
                    disabled={allSubjects.length === 0}
                  >
                    <SelectTrigger className="w-full md:w-56">
                      <SelectValue placeholder="Asignatura" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_SUBJECTS_VALUE}>Todas las asignaturas</SelectItem>
                      {allSubjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolución de Asistencia por Clase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-[350px]">
                  {loadingData && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                  {chartData.length > 0 ? (
                    <ChartContainer config={{}} className="w-full h-full">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          className="stroke-muted/50"
                        />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(_val, index) => chartData[index]?.displayDate ?? ''}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {subjectsToDisplayInChart.map((s, i) => (
                          <Line
                            key={s.id}
                            type="monotone"
                            dataKey={s.code}
                            stroke={LINE_COLORS[i % LINE_COLORS.length]}
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    !loadingData && (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <h3 className="text-base font-medium">Sin datos disponibles</h3>
                          <p className="text-sm text-muted-foreground/80">
                            No hay información de asistencia para este periodo.
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedSubjectData && <SubjectDetailsPanel subject={selectedSubjectData} />}
          </div>
        )}
      </main>
    </div>
  );
}

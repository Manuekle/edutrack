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
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';

interface Teacher {
  id: string;
  name: string;
  document?: string;
  codigoDocente?: string;
  correoInstitucional?: string;
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
  subjects?: SubjectHistoric[];
  [key: string]: number | string | SubjectHistoric[] | undefined;
}

interface TooltipEntry {
  color: string;
  value: number;
  dataKey: string;
  payload: ChartRow;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const calculatePercentage = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

const getBadgeClass = (percentage: number) => {
  if (percentage < 60) return 'bg-rose-600 text-white';
  if (percentage >= 80) return 'bg-emerald-600 text-white';
  return 'bg-amber-600 text-white';
};

const NEUTRAL_PALETTE = ['#404040', '#525252', '#737373', '#a3a3a3', '#d4d4d4'] as const;

// Paleta de colores más sutiles y contrastantes para el gráfico de pastel
const PIE_COLORS = [
  '#4CAF50', // Presente - verde suave
  '#F44336', // Ausente - rojo vibrante
  '#FF9800', // Justificado - naranja cálido
] as const;

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // Obtener la fecha formateada del primer payload
    const displayDate = payload[0]?.payload?.displayDate || label;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-normal text-xs mb-2">{displayDate}</p>
        <div className="space-y-1">
          {payload.map((entry: TooltipEntry, index: number) => {
            const className = entry.payload[`${entry.dataKey}_className`] as string | undefined;
            const subjectName =
              className ??
              entry.payload.subjects?.find((s: SubjectHistoric) => s.code === entry.dataKey)
                ?.name ??
              entry.dataKey;
            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground">{subjectName}</span>
                </div>
                <span className="font-mono text-xs font-normal">{entry.value}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

function SubjectDetailsPanel({
  subject,
  apiResponse,
}: {
  subject: { id: string; name: string; code: string };
  apiResponse: HistoricApiResponse | null;
}) {
  if (!apiResponse) return null;

  const subjectData = apiResponse.subjects.find(s => s.id === subject.id);
  if (!subjectData) return null;

  const { attendanceTotals } = subjectData;
  const totalAttendance =
    attendanceTotals.present +
    attendanceTotals.absent +
    attendanceTotals.late +
    attendanceTotals.justified;

  const pieData = [
    {
      name: 'Presente',
      value: attendanceTotals.present,
      fill: '#0F7B3F',
      percentage: calculatePercentage(attendanceTotals.present, totalAttendance),
    },
    {
      name: 'Ausente',
      value: attendanceTotals.absent + attendanceTotals.late,
      fill: '#8C171D',
      percentage: calculatePercentage(
        attendanceTotals.absent + attendanceTotals.late,
        totalAttendance
      ),
    },
    {
      name: 'Justificado',
      value: attendanceTotals.justified,
      fill: '#FDBE0F',
      percentage: calculatePercentage(attendanceTotals.justified, totalAttendance),
    },
  ].filter(item => item.value > 0);

  const chartConfig = {
    Presente: {
      label: 'Presente',
      color: '#0F7BF0',
    },
    Ausente: {
      label: 'Ausente',
      color: '#8C171D',
    },
    Justificado: {
      label: 'Justificado',
      color: '#FDBE0F',
    },
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div>
            <CardTitle className="text-lg font-semibold tracking-card">{subject.name}</CardTitle>
            <p className="text-xs text-muted-foreground">Código: {subject.code}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de clases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h4 className="text-xs font-medium text-foreground tracking-tight flex items-center gap-2">
                Clases Impartidas
              </h4>
              <Badge variant="outline" className="font-normal bg-muted/50 font-sans text-xs">
                {subjectData.totalClasses} {subjectData.totalClasses === 1 ? 'clase' : 'clases'}
              </Badge>
            </div>
            <div className="max-h-[420px] overflow-y-auto pr-2 -mr-2 space-y-3 [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar-track]:hidden [&::-webkit-scrollbar-thumb]:hidden">
              {subjectData.classes.map((cls, index) => {
                const totalInClass =
                  cls.attendanceStats.present +
                  cls.attendanceStats.absent +
                  cls.attendanceStats.late +
                  cls.attendanceStats.justified;
                const percentage = calculatePercentage(cls.attendanceStats.present, totalInClass);
                const date = new Date(cls.date);
                const dayName = date.toLocaleDateString('es-CL', { weekday: 'short' });
                const day = date.getDate();
                const month = date.toLocaleDateString('es-CL', { month: 'short' });

                return (
                  <div
                    key={cls.id}
                    className="group relative rounded-lg border p-4 hover:bg-muted/30 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-muted/50 group-hover:bg-muted/70 transition-colors">
                          <span className="text-xs font-normal text-muted-foreground">
                            {dayName}
                          </span>
                          <span className="text-lg font-semibold">{day}</span>
                          <span className="text-xs text-muted-foreground uppercase">{month}</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-normal text-foreground">
                            {cls.name ?? `Clase ${index + 1}`}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 text-xs font-mono border-muted-foreground/30 bg-muted/50"
                            >
                              <span className="text-emerald-600">P:</span>{' '}
                              {cls.attendanceStats.present}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 text-xs font-mono border-muted-foreground/30 bg-muted/50"
                            >
                              <span className="text-rose-600">A:</span>{' '}
                              {cls.attendanceStats.absent + cls.attendanceStats.late}
                            </Badge>
                            {cls.attendanceStats.justified > 0 && (
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 text-xs font-mono border-muted-foreground/30 bg-muted/50"
                              >
                                <span className="text-amber-600">J:</span>{' '}
                                {cls.attendanceStats.justified}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`h-6 px-2 text-xs font-normal ${getBadgeClass(percentage)}`}
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
            <div className="flex items-center justify-between pb-2">
              <h4 className="text-xs font-medium text-foreground tracking-tight">
                Distribución de Asistencia
              </h4>
              <Badge variant="outline" className="font-normal bg-muted/50 font-sans text-xs">
                {subjectData.classes.reduce(
                  (sum, cls) =>
                    sum +
                    cls.attendanceStats.present +
                    cls.attendanceStats.absent +
                    cls.attendanceStats.late +
                    cls.attendanceStats.justified,
                  0
                )}{' '}
                estudiantes
              </Badge>
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
                    fill="#8884d8"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        style={{
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-8 [&>*:nth-child(3)]:col-span-2 md:[&>*:nth-child(3)]:col-span-1">
                {pieData.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl p-4 border bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-xs font-normal text-foreground">{item.name}</span>
                    </div>
                    <div className="flex flex-col items-baseline gap-1.5">
                      <span className="text-lg font-semibold">{item.percentage}%</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.value} {item.value === 1 ? 'estudiante' : 'estudiantes'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeacherReport() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  // El periodo inicial es '' y se ajusta automáticamente según los periodos disponibles
  const [period, setPeriod] = useState('');
  const [periodOptions, setPeriodOptions] = useState<string[]>([]);
  const [historicData, setHistoricData] = useState<HistoricApiResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const TEACHERS_PER_PAGE = 5;

  const lineColors = NEUTRAL_PALETTE;

  // Update period options based on teacher's historic data
  useEffect(() => {
    if (!historicData) {
      return;
    }

    // Construir periodos válidos según las clases del docente
    const periodSet = new Set<string>();
    historicData.subjects.forEach(subject => {
      subject.classes.forEach(cls => {
        const date = new Date(cls.date);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = date.getMonth();
          // Enero-Junio: periodo 1, Julio-Diciembre: periodo 2
          const period = `${year}-${month < 6 ? '1' : '2'}`;
          periodSet.add(period);
        }
      });
    });
    // Ordenar periodos de más reciente a más antiguo y quitar 'all'
    const options = Array.from(periodSet).sort((a, b) => b.localeCompare(a));
    setPeriodOptions(options);

    // Seleccionar automáticamente el periodo actual si existe, si no el primero disponible
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentPeriod = `${currentYear}-${currentMonth < 6 ? '1' : '2'}`;
    if (options.includes(currentPeriod)) {
      setPeriod(currentPeriod);
    } else if (options.length > 0) {
      setPeriod(options[0]);
    } else {
      setPeriod('');
    }
  }, [historicData]);

  // Cargar lista de docentes
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const response = await fetch('/api/admin/users?role=DOCENTE');
        if (!response.ok) throw new Error('No se pudo cargar la lista de docentes.');
        const data = await response.json();
        setTeachers(data);
        setFilteredTeachers(data);
      } catch (err: unknown) {
        console.error('Error fetching teachers:', err);
        setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de docentes.');
      } finally {
        setLoadingTeachers(false);
      }
    };
    fetchTeachers();
  }, []);

  // Filtrar docentes según búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTeachers(teachers);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = teachers.filter(
        teacher =>
          teacher.name.toLowerCase().includes(searchLower) ||
          teacher.document?.toLowerCase().includes(searchLower) ||
          teacher.codigoDocente?.toLowerCase().includes(searchLower)
      );
      setFilteredTeachers(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, teachers]);

  // Cargar histórico
  useEffect(() => {
    if (!selectedTeacher) {
      setChartData([]);
      setSubjects([]);
      return;
    }

    const fetchHistoric = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        // Siempre agregar el periodo seleccionado si existe
        if (period) query.set('period', period);
        const res = await fetch(
          `/api/admin/docentes/${selectedTeacher.id}/historico?${query.toString()}`
        );
        if (!res.ok) {
          throw new Error(`Error ${res.status}: No se pudo cargar el histórico.`);
        }
        const data: HistoricApiResponse = await res.json();
        setHistoricData(data);

        if (!data || !Array.isArray(data.subjects)) {
          throw new Error('La respuesta de la API no tiene el formato esperado.');
        }

        const activeSubjects = data.subjects.filter(s => s.classes.length > 0);
        setSubjects(activeSubjects.map(s => ({ id: s.id, name: s.name, code: s.code })));

        if (selectedSubjectId !== 'all' && !activeSubjects.some(s => s.id === selectedSubjectId)) {
          setSelectedSubjectId('all');
        }

        const rowsByDate: Record<string, ChartRow> = {};
        activeSubjects.forEach(subject => {
          subject.classes.forEach(cls => {
            // Asegurarnos de que la fecha es un objeto Date válido
            const classDate = new Date(cls.date);
            if (isNaN(classDate.getTime())) {
              console.warn('Fecha de clase inválida:', cls.date);
              return; // Saltar esta clase si la fecha no es válida
            }

            // Usar la fecha ISO como clave para agrupar
            const dateKey = classDate.toISOString().split('T')[0];

            // Solo crear la entrada si no existe
            if (!rowsByDate[dateKey]) {
              rowsByDate[dateKey] = {
                date: dateKey, // Formato YYYY-MM-DD
                displayDate: classDate.toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'long',
                }),
                subjects: activeSubjects,
              };
            }

            const { present, absent, late, justified } = cls.attendanceStats;
            const total = present + absent + late + justified;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
            rowsByDate[dateKey][subject.code] = percentage;
            rowsByDate[dateKey][`${subject.code}_className`] = cls.name;
          });
        });

        const sortedDates = Object.keys(rowsByDate).sort();
        const finalChartData = sortedDates.map(date => rowsByDate[date]);
        setChartData(finalChartData);
      } catch (err: unknown) {
        console.error('Error fetching historic data:', err);
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
        setChartData([]);
        setSubjects([]);
      } finally {
        setLoadingData(false);
      }
    };
    fetchHistoric();
  }, [selectedTeacher, period, selectedSubjectId]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE);
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * TEACHERS_PER_PAGE,
    currentPage * TEACHERS_PER_PAGE
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar - Only sticky on desktop */}
      <Card className="p-0 w-full md:w-96 shadow-sm rounded-xl flex flex-col self-start md:sticky md:top-0 h-auto md:h-[53dvh] z-10 overflow-y-auto">
        <CardHeader className="p-0">
          <div className="relative p-0 px-3 pt-4">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar-track]:hidden [&::-webkit-scrollbar-thumb]:hidden">
          {loadingTeachers ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: TEACHERS_PER_PAGE }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-1 px-3 sm:pb-2 pb-4">
              {paginatedTeachers.map(teacher => (
                <Button
                  key={teacher.id}
                  variant={selectedTeacher?.id === teacher.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-auto p-3 rounded-lg"
                  onClick={() => setSelectedTeacher(teacher)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-8 w-8 rounded-full bg-muted border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-xs tracking-card truncate">
                        {teacher.name}
                      </div>
                      {teacher.codigoDocente && (
                        <div className="text-xs text-muted-foreground/80 font-mono truncate">
                          {teacher.codigoDocente}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
          {/* {loadingData && <LoadingPage />} */}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="p-2 border-t">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                Ant.
              </Button>
              <span className="text-xs font-mono text-muted-foreground">
                {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Sig.
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Main Content */}
      <div className="flex-1 w-full overflow-auto md:pl-6 pt-4 md:pt-0 [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar-track]:hidden [&::-webkit-scrollbar-thumb]:hidden">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {selectedTeacher ? (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {selectedTeacher.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold tracking-heading">
                        {selectedTeacher.name}
                      </CardTitle>
                      {selectedTeacher.codigoDocente && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {selectedTeacher.codigoDocente}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 font-sans w-full sm:w-auto">
                      <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="Selecciona un periodo" />
                        </SelectTrigger>
                        <SelectContent>
                          {periodOptions.map(p => (
                            <SelectItem key={p} value={p} className="font-sans">
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 font-sans w-full sm:w-auto">
                      <Select
                        value={selectedSubjectId}
                        onValueChange={setSelectedSubjectId}
                        disabled={!subjects.length}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Todas las asignaturas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="font-sans">
                            Todas las asignaturas
                          </SelectItem>
                          {subjects.map(s => (
                            <SelectItem key={s.id} value={s.id} className="font-sans">
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Chart */}
            <Card>
              <CardContent>
                <div className="relative h-72 md:h-80">
                  {loadingData && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {chartData.length > 0 ? (
                    <ChartContainer
                      config={{}}
                      className="aspect-auto h-[250px] md:h-[350px] w-full"
                    >
                      <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="date"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                          className="fill-muted-foreground font-mono"
                          tickFormatter={(_value, index) => chartData[index]?.displayDate ?? ''}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {subjects
                          .filter(s => selectedSubjectId === 'all' || s.id === selectedSubjectId)
                          .map((s, i) => (
                            <Line
                              key={s.id}
                              type="monotone"
                              dataKey={s.code}
                              name={s.name}
                              stroke={lineColors[i % lineColors.length]}
                              strokeWidth={2}
                              dot={{
                                r: 3,
                                stroke: 'currentColor',
                                className: 'text-foreground',
                                strokeWidth: 2,
                              }}
                              activeDot={{
                                r: 3,
                                stroke: 'currentColor',
                                className: 'text-foreground',
                                strokeWidth: 2,
                              }}
                              animationDuration={800}
                              animationEasing="ease-in-out"
                            />
                          ))}
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <h3 className="text-xs text-muted-foreground">Sin datos disponibles</h3>
                        <p className="text-xs text-muted-foreground/70">
                          No hay información de asistencia para mostrar
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subject Details */}
            {selectedSubjectId !== 'all' && subjects.find(s => s.id === selectedSubjectId) && (
              <SubjectDetailsPanel
                subject={subjects.find(s => s.id === selectedSubjectId)!}
                apiResponse={historicData}
              />
            )}
          </div>
        ) : (
          <Card className="flex items-center justify-center h-56 sm:h-[calc(65vh-7rem)] border p-0 m-0">
            <div className="p-8">
              <div className="text-center">
                <h3 className="text-xs text-muted-foreground">Selecciona un docente</h3>
                <p className="text-xs text-muted-foreground/70 max-w-md">
                  Elige un docente de la lista para ver su historial de asistencia y estadísticas
                  detalladas
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

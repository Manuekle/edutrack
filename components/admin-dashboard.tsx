'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { CHART_COLORS } from '@/lib/chart-colors';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Layout,
  Percent,
  TrendingUp,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChartContainer, ChartTooltipContent } from './ui/chart';

interface CardData {
  title: string;
  value: string | number;
  subtitle: string;
}

interface ChartData {
  name: string;
  value: number;
  label: string;
  [key: string]: unknown;
}

interface DashboardData {
  cards: CardData[];
  charts: {
    roleDistribution: ChartData[];
    attendanceDistribution: ChartData[];
    classStatusDistribution: ChartData[];
    monthlyClasses: { month: string; clases: number }[];
    topSubjects: Array<{
      name: string;
      code: string;
      students: number;
    }>;
    classroomOccupancy: Array<{
      name: string;
      value: number;
    }>;
  };
  metrics: {
    completedClasses: number;
    totalReports: number;
    activeTeachers: number;
    [key: string]: unknown;
  };
}

const CARD_ICONS = [Users, BookOpen, Percent, CalendarDays];

const AdminDashboardComponent = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/dashboard', { credentials: 'include' });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingPage />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-sm w-full border-destructive/30">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="sm:text-sm text-xs font-semibold">Error al cargar datos</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error || 'No se pudieron obtener los datos'}
              </p>
            </div>
            <Button size="default" variant="outline" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const PIE_COLORS = CHART_COLORS.primary;
  const BAR_COLORS = CHART_COLORS.primary;
  const axisStyle = {
    fontSize: '0.7rem',
    fill: 'var(--muted-foreground)',
    fontFamily: 'var(--font-sans)',
  } as const;
  const gridStyle = { stroke: 'var(--border)', strokeOpacity: 0.4 } as const;

  const maxStudents = Math.max(...data.charts.topSubjects.map(s => s.students), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-card">Panel de Administración</h1>
          <p className="text-muted-foreground sm:text-sm text-xs mt-1">
            Estado general del sistema académico.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-normal px-3 py-1.5 capitalize shrink-0">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Badge>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: '/dashboard/admin/planeador', icon: CalendarDays, label: 'Planeador', desc: 'Configurar semestre' },
          { href: '/dashboard/admin/salas', icon: Layout, label: 'Salas', desc: 'Gestionar espacios' },
          { href: '/dashboard/admin/reportes', icon: TrendingUp, label: 'Reportes', desc: 'Ver avance docentes' },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-all hover:bg-muted/40 cursor-pointer border-border/30">
              <CardContent className="py-3.5 px-4 flex items-center gap-3">
                <div className="flex w-9 items-center justify-center  text-primary shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="sm:text-sm text-xs font-medium leading-none">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.cards.map((card, i) => {
          const Icon = CARD_ICONS[i];
          return (
            <Card key={i} className="border-border/30">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                  <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-semibold tracking-card">{card.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{card.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Role Distribution */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">
              Distribución de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="mx-auto aspect-square max-h-[260px] w-full">
              <PieChart>
                <Pie
                  data={data.charts.roleDistribution}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {data.charts.roleDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: '16px' }}
                  formatter={value => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Classes */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">Clases por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="mx-auto aspect-square max-h-[260px] w-full">
              <AreaChart
                data={data.charts.monthlyClasses}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorClases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" style={gridStyle} vertical={false} />
                <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="clases"
                  stroke={CHART_COLORS.primary[0]}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorClases)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Distribution */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">
              Estado de Asistencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.charts.attendanceDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground text-xs">No hay datos disponibles</p>
              </div>
            ) : (
              <ChartContainer config={{}} className="mx-auto aspect-square max-h-[260px] w-full">
                <BarChart
                  data={data.charts.attendanceDistribution}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barSize={36}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} style={gridStyle} />
                  <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="asistencia" radius={[6, 6, 0, 0]}>
                    {data.charts.attendanceDistribution.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Classroom Occupancy */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">
              Uso de Salones
            </CardTitle>
            <p className="text-xs text-muted-foreground">Por cantidad de clases realizadas</p>
          </CardHeader>
          <CardContent>
            {data.charts.classroomOccupancy.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground text-xs">No hay salones registrados</p>
              </div>
            ) : (
              <ChartContainer config={{}} className="mx-auto max-h-[260px] w-full">
                <BarChart
                  data={data.charts.classroomOccupancy}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} style={gridStyle} />
                  <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={axisStyle}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {data.charts.classroomOccupancy.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Subjects */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">
              Materias con Más Estudiantes
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Estudiantes matriculados por grupo
          </p>
        </CardHeader>
        <CardContent>
          {data.charts.topSubjects.length === 0 || maxStudents === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <BookOpen className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No hay matriculas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.charts.topSubjects.map((subject, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-5 text-center">
                    <span className="text-xs font-semibold text-muted-foreground">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{subject.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase">
                          {subject.code}
                        </p>
                      </div>
                      <span className="sm:text-sm text-xs font-semibold tabular-nums ml-3 shrink-0">
                        {subject.students}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(subject.students / maxStudents) * 100}%`,
                          backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardComponent;

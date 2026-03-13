'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { CHART_COLORS } from '@/lib/chart-colors';
import {
  AlertCircle,
  BookOpen,
  BookText,
  CalendarDays,
  Layout,
  TrendingUp,
  Users,
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
  trend: string;
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
    unenrollDistribution: ChartData[];
    monthlyClasses: { month: string; count: number }[];
    topSubjects: Array<{
      name: string;
      code: string;
      students: number;
      classes: number;
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
    pendingUnenrolls: number;
  };
}

const AdminDashboardComponent = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include', // Incluir credenciales para autenticación
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result: DashboardData = await response.json();
      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al cargar los datos del dashboard'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="p-6 rounded-lg max-w-md w-full flex flex-col justify-center items-center bg-destructive border border-destructive">
          <AlertCircle className="h-12 w-12 text-white mb-4" />
          <h2 className="sm:text-sm text-xs text-white text-center font-semibold tracking-card pb-2">
            Error al cargar datos
          </h2>
          <p className="text-white text-xs text-center mb-6">
            {error || 'No se pudieron obtener los datos del dashboard'}
          </p>
          <div className="flex gap-3">
            <Button className="text-xs" onClick={() => window.location.reload()} variant="outline">
              Recargar página
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getCardIcon = (index: number) => {
    const icons = [Users, BookOpen, TrendingUp, AlertCircle];
    const Icon = icons[index];
    return <Icon className="h-4 w-4" />;
  };

  // Paleta colorida usando CHART_COLORS
  const PIE_COLORS = CHART_COLORS.primary;
  const BAR_COLORS = CHART_COLORS.primary;

  const axisStyle = {
    fontSize: '0.75rem',
    fill: 'var(--foreground)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 400,
  } as const;
  const gridStyle = { stroke: 'var(--border)', strokeOpacity: 0.1 } as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div id="tour-admin-title">
          <h1 className="text-2xl font-semibold flex items-center gap-2.5 tracking-card">
            Panel de administración
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Estado general del sistema académico.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full justify-start sm:justify-end">
          <Badge variant="outline" className="text-xs font-normal px-3 py-1">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Badge>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            href: '/dashboard/admin/microcurriculo',
            icon: BookText,
            label: 'Microcurrículo',
            desc: 'Cargar asignaturas',
          },
          {
            href: '/dashboard/admin/planeador',
            icon: CalendarDays,
            label: 'Planeador',
            desc: 'Configurar semestre',
          },
          {
            href: '/dashboard/admin/salas',
            icon: Layout,
            label: 'Salas',
            desc: 'Gestionar espacios',
          },
          {
            href: '/dashboard/admin/reportes',
            icon: TrendingUp,
            label: 'Reportes',
            desc: 'Ver avance docentes',
          },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-all hover:bg-accent/40 dark:hover:bg-white/[0.04] hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-border/20 dark:border-white/[0.06]">
              <CardContent className="py-3.5 px-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-none">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="tour-admin-metrics">
        {data.cards.map((card, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center text-primary">
                {getCardIcon(index)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-card">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1.5">{card.subtitle}</p>
              <div className="mt-2.5 flex items-center text-xs">
                <span
                  className={`font-medium ${card.trend.includes('+') ? 'text-accent-green' : 'text-destructive'}`}
                >
                  {card.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribución por Roles */}
        <Card id="tour-admin-users-chart">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">
                Distribución de Usuarios
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={{}}
              className="mx-auto aspect-square max-h-[310px] sm:max-h-[250px] w-full justify-center items-center"
            >
              <PieChart>
                <defs>
                  {PIE_COLORS.map((color, i) => (
                    <linearGradient key={i} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={data.charts.roleDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {data.charts.roleDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="transparent"
                      strokeWidth={0}
                      style={{
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={value => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Clases por Mes */}
        <Card id="tour-admin-classes-chart">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">
                Clases por Mes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={{}}
              className="mx-auto aspect-square max-h-[310px] sm:max-h-[250px] w-full justify-center items-center"
            >
              <AreaChart
                data={data.charts.monthlyClasses}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" style={gridStyle} />
                <XAxis dataKey="month" tick={axisStyle} tickLine={false} />
                <YAxis tick={axisStyle} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS.primary[0]}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Estado de Asistencias */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">
                Estado de Asistencias
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            {data.charts.attendanceDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-32 sm:h-full">
                <p className="text-muted-foreground text-xs">No hay datos disponibles</p>
              </div>
            ) : (
              <ChartContainer
                config={{}}
                className="mx-auto aspect-square max-h-[310px] sm:max-h-[250px] w-full justify-center items-center"
              >
                <BarChart
                  data={data.charts.attendanceDistribution}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} style={gridStyle} />
                  <XAxis dataKey="label" tick={axisStyle} tickLine={false} />
                  <YAxis tick={axisStyle} tickLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="asistencia" fill={CHART_COLORS.primary[0]} radius={[4, 4, 0, 0]}>
                    {data.charts.attendanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Ocupación de Salones */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">
                Ocupación de Salones
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            {data.charts.classroomOccupancy.length === 0 ? (
              <div className="flex items-center justify-center h-32 sm:h-full">
                <p className="text-muted-foreground text-xs">No hay salones registrados</p>
              </div>
            ) : (
              <ChartContainer
                config={{}}
                className="mx-auto aspect-square max-h-[310px] sm:max-h-[250px] w-full justify-center items-center"
              >
                <BarChart
                  data={data.charts.classroomOccupancy}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} style={gridStyle} />
                  <XAxis type="number" tick={axisStyle} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={axisStyle}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={CHART_COLORS.primary[0]} radius={[0, 4, 4, 0]}>
                    {data.charts.classroomOccupancy.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Materias */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-card">
                Materias con Más Estudiantes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.charts.topSubjects.slice(0, 6).map((subject, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{subject.code}</p>
                    <p className="text-xs text-muted-foreground truncate">{subject.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold">{subject.students}</p>
                    <p className="text-xs text-muted-foreground">estudiantes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardComponent;

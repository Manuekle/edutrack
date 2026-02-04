import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { CHART_COLORS } from '@/lib/chart-colors';
import { AlertCircle, BookOpen, TrendingUp, Users } from 'lucide-react';
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
          <h2 className="sm:text-3xl text-2xl text-white text-center font-semibold tracking-card pb-2">
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
  // Paleta vibrante para barras
  const BAR_COLORS = CHART_COLORS.primary;

  const axisStyle = { fontSize: '0.75rem', fill: 'var(--foreground)' } as const;
  const gridStyle = { stroke: 'hsl(var(--border) / 0.5)' } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <CardHeader className="p-0 w-full">
          <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">Mi Panel</CardTitle>
          <CardDescription className="text-xs">Resumen y gestión académica</CardDescription>
        </CardHeader>
        <div className="flex items-center gap-2 w-full justify-start sm:justify-end">
          <Badge variant="outline" className="text-xs font-normal">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Badge>
        </div>
      </div>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">{card.title}</CardTitle>
              <div className="text-muted-foreground">{getCardIcon(index)}</div>
            </CardHeader>
            <CardContent>
              <div className="sm:text-3xl text-2xl font-semibold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <span className={card.trend.includes('+') ? 'text-green-500' : 'text-red-500'}>
                  {card.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Roles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
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
                      stroke="#fff"
                      strokeWidth={1}
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">Clases por Mes</CardTitle>
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
                  dataKey="clases"
                  stroke={CHART_COLORS.primary[0]}
                  strokeWidth={2}
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
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
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
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
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
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
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
                  <YAxis dataKey="name" type="category" tick={axisStyle} tickLine={false} width={80} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={CHART_COLORS.primary[0]} radius={[0, 4, 4, 0]}>
                    {data.charts.classroomOccupancy.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
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
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Materias con Más Estudiantes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.charts.topSubjects.slice(0, 6).map((subject, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium">{subject.code}</p>
                    <p className="text-xs text-muted-foreground truncate">{subject.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{subject.students}</p>
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

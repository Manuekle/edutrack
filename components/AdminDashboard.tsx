import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result: DashboardData = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xs font-medium text-gray-900">Error al cargar datos</h3>
          <p className="mt-1 text-xs text-gray-500">
            No se pudieron obtener los datos del dashboard
          </p>
        </div>
      </div>
    );
  }

  const getCardIcon = (index: number) => {
    const icons = [Users, BookOpen, TrendingUp, AlertCircle];
    const Icon = icons[index];
    return <Icon className="h-4 w-4" />;
  };

  // Paleta colorida solo para la dona
  const PIE_COLORS = ['#4CAF50', '#4E71FF', '#F44336', '#FF9800'];
  // Paleta neutra para área y barras
  const NEUTRAL_PALETTE = ['#525252', '#737373', '#a3a3a3', '#d4d4d4', '#e5e7eb'];

  const axisStyle = { fontSize: '0.75rem', fill: 'hsl(var(--muted-foreground))' } as const;
  const gridStyle = { stroke: 'hsl(var(--border) / 0.5)' } as const;

  return (
    <div className="space-y-6">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">{card.title}</CardTitle>
              <div className="text-muted-foreground">{getCardIcon(index)}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
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
              <CardTitle className="text-xl font-semibold tracking-card">
                Distribución de Usuarios
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={{}}
              className="mx-auto aspect-square max-h-[250px] w-full justify-center items-center"
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
              <CardTitle className="text-xl font-semibold tracking-card">Clases por Mes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={{}}
              className="mx-auto aspect-square max-h-[250px] w-full justify-center items-center"
            >
              <AreaChart
                data={data.charts.monthlyClasses}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={NEUTRAL_PALETTE[0]} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={NEUTRAL_PALETTE[3]} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" style={gridStyle} />
                <XAxis dataKey="month" tick={axisStyle} tickLine={false} />
                <YAxis tick={axisStyle} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="clases"
                  stroke={NEUTRAL_PALETTE[0]}
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
              <CardTitle className="text-xl font-semibold tracking-card">
                Estado de Asistencias
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            {data.charts.attendanceDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-16">
                <p className="text-muted-foreground text-xs">No hay datos disponibles</p>
              </div>
            ) : (
              <ChartContainer
                config={{}}
                className="mx-auto aspect-square max-h-[250px] w-full justify-center items-center"
              >
                <BarChart
                  data={data.charts.attendanceDistribution}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  barSize={40}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={NEUTRAL_PALETTE[0]} />
                      <stop offset="100%" stopColor={NEUTRAL_PALETTE[2]} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} style={gridStyle} />
                  <XAxis dataKey="label" tick={axisStyle} tickLine={false} />
                  <YAxis tick={axisStyle} tickLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="asistencia" fill={NEUTRAL_PALETTE[0]} radius={[4, 4, 0, 0]}>
                    {data.charts.attendanceDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={NEUTRAL_PALETTE[index % NEUTRAL_PALETTE.length]}
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
              <CardTitle className="text-xl font-semibold tracking-card">
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

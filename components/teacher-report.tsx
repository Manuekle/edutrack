'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CHART_COLORS } from '@/lib/chart-colors';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Layout,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Sector,
  Tooltip,
  YAxis
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
const RISK_THRESHOLD = 75;

const DIAS_ES: Record<string, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

const PIE_COLORS = [
  CHART_COLORS.attendance.present,
  CHART_COLORS.attendance.absent,
  CHART_COLORS.attendance.justified,
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcPct = (v: number, t: number) => (t === 0 ? 0 : Math.round((v / t) * 100));

const formatDay = (raw: string) => DIAS_ES[raw?.toUpperCase()] ?? raw;

const statusColor = (p: number) =>
  p >= 80 ? 'text-emerald-600 dark:text-emerald-400' : p >= 75 ? 'text-amber-500' : 'text-destructive';

const barColor = (p: number) =>
  p >= 80 ? 'bg-emerald-500' : p >= 75 ? 'bg-amber-500' : 'bg-destructive';

const areaStroke = (p: number) =>
  p >= 80
    ? CHART_COLORS.attendance.present
    : p >= 75
      ? '#f59e0b'
      : 'hsl(var(--destructive))';

// ─── Sparkline tooltip ────────────────────────────────────────────────────────
function SparkTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const isRisk = d.value < RISK_THRESHOLD;
  return (
    <div className="rounded-xl border bg-background/95 backdrop-blur-sm px-3 py-2.5 shadow-xl text-xs min-w-[150px]">
      <p className="font-semibold text-foreground mb-1.5 pb-1.5 border-b border-border/40">
        {d.displayDate}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground flex items-start gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Presentes
          </span>
          <span className="font-mono font-semibold">{d.present}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground flex items-center gap-1">
            <XCircle className="h-3 w-3 text-destructive" /> Ausentes
          </span>
          <span className="font-mono font-semibold">{d.absent}</span>
        </div>
        {d.justified > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-amber-500" /> Justificados
            </span>
            <span className="font-mono font-semibold">{d.justified}</span>
          </div>
        )}
        <div
          className={`flex justify-between gap-4 pt-1.5 border-t border-border/40 font-semibold ${isRisk ? 'text-destructive' : 'text-emerald-600'
            }`}
        >
          <span className="flex items-center gap-1">
            {isRisk ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            Asistencia
          </span>
          <span className="font-mono">{d.value}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sparkline card ───────────────────────────────────────────────────────────
function SubjectSparkCard({
  subject,
  colorIndex,
  isSelected,
  onSelect,
}: {
  subject: SubjectHistoric;
  colorIndex: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { attendanceTotals, classes, name, code } = subject;
  const total =
    attendanceTotals.present +
    attendanceTotals.absent +
    attendanceTotals.late +
    attendanceTotals.justified;
  const pct = calcPct(attendanceTotals.present, total);
  const isRisk = pct < RISK_THRESHOLD;
  const lineColor = areaStroke(pct);

  const sparkData = [...classes]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(cls => {
      const t =
        cls.attendanceStats.present +
        cls.attendanceStats.absent +
        cls.attendanceStats.late +
        cls.attendanceStats.justified;
      const d = new Date(cls.date);
      return {
        date: d.toISOString().split('T')[0],
        displayDate: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }),
        value: calcPct(cls.attendanceStats.present, t),
        present: cls.attendanceStats.present,
        absent: cls.attendanceStats.absent + cls.attendanceStats.late,
        justified: cls.attendanceStats.justified,
      };
    });

  const trend =
    sparkData.length >= 2
      ? sparkData[sparkData.length - 1].value - sparkData[sparkData.length - 2].value
      : null;

  // unique id per chart for gradient
  const gradId = `spark-grad-${code.replace(/\W/g, '')}`;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border transition-all duration-300 overflow-hidden
        ${isSelected
          ? 'border-primary/50 bg-primary/5 shadow-lg ring-1 ring-primary/20 scale-[1.01]'
          : 'border-border/50 bg-card hover:border-border hover:shadow-md hover:scale-[1.005]'
        }`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{name}</p>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{code}</p>
          </div>
          <div className="flex flex-col items-end shrink-0 gap-0.5">
            <span className={`text-xl font-bold leading-none tabular-nums ${statusColor(pct)}`}>
              {pct}%
            </span>
            {isRisk ? (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-destructive">
                <AlertTriangle className="h-2.5 w-2.5" />
                Riesgo
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">{subject.totalClasses} clases</span>
            )}
          </div>
        </div>

        {/* Sparkline — fixed height, no ResponsiveContainer width issues */}
        <div className="w-full" style={{ height: 64 }}>
          <ResponsiveContainer width="100%" height={64}>
            <AreaChart
              data={sparkData}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 100]} hide />
              <ReferenceLine
                y={RISK_THRESHOLD}
                stroke="hsl(var(--destructive))"
                strokeDasharray="3 3"
                strokeOpacity={0.45}
                strokeWidth={1}
              />
              <Tooltip content={<SparkTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={1.5}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: lineColor }}
                isAnimationActive={true}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {attendanceTotals.present}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" />
              {attendanceTotals.absent + attendanceTotals.late}
            </span>
            {attendanceTotals.justified > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-amber-500" />
                {attendanceTotals.justified}
              </span>
            )}
          </div>
          {trend !== null && trend !== 0 && (
            <span
              className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend > 0 ? 'text-emerald-500' : 'text-destructive'
                }`}
            >
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend > 0 ? '+' : ''}
              {trend}%
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Donut active shape ───────────────────────────────────────────────────────
function ActiveDonutShape(props: any) {
  const {
    cx, cy,
    innerRadius, outerRadius,
    startAngle, endAngle,
    fill, payload, percent, value,
  } = props;
  return (
    <g>
      <text
        x={cx} y={cy - 9}
        textAnchor="middle"
        style={{ fontSize: 12, fontWeight: 600, fill: 'currentColor' }}
      >
        {payload.name}
      </text>
      <text
        x={cx} y={cy + 9}
        textAnchor="middle"
        style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
      >
        {value} · {(percent * 100).toFixed(0)}%
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 7}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 11}
        outerRadius={outerRadius + 13}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

// ─── Subject detail panel ─────────────────────────────────────────────────────
function SubjectDetailPanel({ subject }: { subject: SubjectHistoric }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const { attendanceTotals, classes, name, code } = subject;

  const totalAtt =
    attendanceTotals.present +
    attendanceTotals.absent +
    attendanceTotals.late +
    attendanceTotals.justified;
  const pct = calcPct(attendanceTotals.present, totalAtt);
  const isRisk = pct < RISK_THRESHOLD;

  const pieData = [
    { name: 'Presente', value: attendanceTotals.present },
    { name: 'Ausente', value: attendanceTotals.absent + attendanceTotals.late },
    { name: 'Justificado', value: attendanceTotals.justified },
  ].filter(d => d.value > 0);

  const sorted = [...classes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card className="rounded-2xl border-border/50 mt-6">
      <CardHeader className="pb-3">
        {/* Title + risk banner */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-xs font-semibold">{name}</CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{code}</p>
          </div>
          {isRisk && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
              <span className="text-xs font-semibold text-destructive">
                {pct}% — Riesgo de pérdida
              </span>
            </div>
          )}
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            {
              label: 'Presentes',
              val: attendanceTotals.present,
              Icon: CheckCircle2,
              cls: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              label: 'Ausentes',
              val: attendanceTotals.absent + attendanceTotals.late,
              Icon: XCircle,
              cls: 'text-destructive',
            },
            {
              label: 'Justificados',
              val: attendanceTotals.justified,
              Icon: BookOpen,
              cls: 'text-amber-500',
            },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl border bg-muted/10 px-3 py-2.5 flex items-center gap-2.5"
            >
              <s.Icon className={`h-4 w-4 shrink-0 ${s.cls}`} />
              <div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-xs font-bold leading-tight">{s.val}</p>
              </div>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Class list ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Clases impartidas
              </h4>
              <Badge variant="outline" className="text-xs bg-muted/30">
                {subject.totalClasses} {subject.totalClasses === 1 ? 'clase' : 'clases'}
              </Badge>
            </div>

            <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
              {sorted.map((cls, i) => {
                const t =
                  cls.attendanceStats.present +
                  cls.attendanceStats.absent +
                  cls.attendanceStats.late +
                  cls.attendanceStats.justified;
                const p = calcPct(cls.attendanceStats.present, t);
                const d = new Date(cls.date);
                const isRiskClass = p < RISK_THRESHOLD;

                return (
                  <div
                    key={cls.id}
                    className={`rounded-xl border p-3 transition-colors ${isRiskClass
                      ? 'border-destructive/20 bg-destructive/5'
                      : 'border-border/50 hover:bg-muted/20'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Date block */}
                      <div className="w-11 h-11 rounded-lg bg-muted/50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-muted-foreground capitalize leading-none">
                          {d.toLocaleDateString('es-CO', { weekday: 'short' })}
                        </span>
                        <span className="sm:text-sm text-xs font-bold leading-tight">{d.getDate()}</span>
                        <span className="text-[10px] text-muted-foreground uppercase leading-none">
                          {d.toLocaleDateString('es-CO', { month: 'short' })}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {cls.name ?? `Clase ${i + 1}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-emerald-600">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {cls.attendanceStats.present}
                          </span>
                          <span className="text-muted-foreground/30 text-xs">·</span>
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-destructive">
                            <XCircle className="h-2.5 w-2.5" />
                            {cls.attendanceStats.absent + cls.attendanceStats.late}
                          </span>
                          {cls.attendanceStats.justified > 0 && (
                            <>
                              <span className="text-muted-foreground/30 text-xs">·</span>
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-amber-500">
                                <BookOpen className="h-2.5 w-2.5" />
                                {cls.attendanceStats.justified}
                              </span>
                            </>
                          )}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor(p)}`}
                            style={{ width: `${p}%` }}
                          />
                        </div>
                      </div>

                      <span className={`sm:text-sm text-xs font-bold shrink-0 tabular-nums ${statusColor(p)}`}>
                        {p}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Donut ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Distribución
              </h4>
              <Badge variant="outline" className="text-xs bg-muted/30">
                {totalAtt} registros
              </Badge>
            </div>

            <div className="rounded-xl border bg-muted/5 p-4">
              {/* Donut chart — fixed height to guarantee render */}
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      {...{ activeIndex: activeIdx, activeShape: ActiveDonutShape } as any}
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={64}
                      outerRadius={90}
                      onMouseEnter={(_, i) => setActiveIdx(i)}
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                          style={{ cursor: 'pointer', outline: 'none' }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend cards */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {pieData.map((item, i) => (
                  <button
                    key={i}
                    className="rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors p-2.5 text-left focus:outline-none"
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-[10px] text-muted-foreground leading-none">
                        {item.name}
                      </span>
                    </div>
                    <p className="text-xs font-bold leading-none tabular-nums">
                      {calcPct(item.value, totalAtt)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {item.value} est.
                    </p>
                    <div className="mt-1.5 h-0.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${calcPct(item.value, totalAtt)}%`,
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TeacherReport() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [period, setPeriod] = useState('');
  const [periodOptions, setPeriodOptions] = useState<string[]>([]);
  const [historicData, setHistoricData] = useState<HistoricApiResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [subjects, setSubjects] = useState<SubjectHistoric[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [docenteGrupos, setDocenteGrupos] = useState<any[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);

  const TEACHERS_PER_PAGE = 5;

  // Period options
  useEffect(() => {
    if (!historicData) return;
    const set = new Set<string>();
    historicData.subjects.forEach(s =>
      s.classes.forEach(cls => {
        const d = new Date(cls.date);
        if (!isNaN(d.getTime()))
          set.add(`${d.getFullYear()}-${d.getMonth() < 6 ? '1' : '2'}`);
      })
    );
    const opts = Array.from(set).sort((a, b) => b.localeCompare(a));
    setPeriodOptions(opts);
    const now = new Date();
    const cur = `${now.getFullYear()}-${now.getMonth() < 6 ? '1' : '2'}`;
    setPeriod(opts.includes(cur) ? cur : opts[0] ?? '');
  }, [historicData]);

  // Load teachers
  useEffect(() => {
    setLoadingTeachers(true);
    fetch('/api/admin/users?role=DOCENTE&limit=100')
      .then(r => {
        if (!r.ok) throw new Error('No se pudo cargar la lista de docentes.');
        return r.json();
      })
      .then(d => {
        const l = Array.isArray(d.data) ? d.data : [];
        setTeachers(l);
        setFilteredTeachers(l);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingTeachers(false));
  }, []);

  // Filter teachers
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTeachers(teachers);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredTeachers(
        teachers.filter(
          t =>
            t.name.toLowerCase().includes(q) ||
            t.document?.toLowerCase().includes(q) ||
            t.codigoDocente?.toLowerCase().includes(q)
        )
      );
    }
    setCurrentPage(1);
  }, [searchTerm, teachers]);

  // Load historic
  useEffect(() => {
    if (!selectedTeacher) {
      setSubjects([]);
      setHistoricData(null);
      return;
    }
    setLoadingData(true);
    setError(null);
    const q = new URLSearchParams();
    if (period) q.set('period', period);
    fetch(`/api/admin/docentes/${selectedTeacher.id}/historico?${q}`)
      .then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data: HistoricApiResponse) => {
        setHistoricData(data);
        const active = (data.subjects ?? []).filter(s => s.classes.length > 0);
        setSubjects(active);
        if (selectedSubjectId && !active.some(s => s.id === selectedSubjectId))
          setSelectedSubjectId(null);
      })
      .catch(e => {
        setError(e.message);
        setSubjects([]);
      })
      .finally(() => setLoadingData(false));
  }, [selectedTeacher, period]);

  // Load grupos
  useEffect(() => {
    if (!selectedTeacher) {
      setDocenteGrupos([]);
      return;
    }
    setLoadingGrupos(true);
    fetch(`/api/admin/docentes/${selectedTeacher.id}/grupos`)
      .then(r => r.json())
      .then(d => setDocenteGrupos(d.grupos ?? []))
      .finally(() => setLoadingGrupos(false));
  }, [selectedTeacher]);

  const safe = Array.isArray(filteredTeachers) ? filteredTeachers : [];
  const totalPages = Math.ceil(safe.length / TEACHERS_PER_PAGE);
  const paginated = safe.slice(
    (currentPage - 1) * TEACHERS_PER_PAGE,
    currentPage * TEACHERS_PER_PAGE
  );

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) ?? null;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* ── Sidebar ── */}
      <Card
        className="w-full md:w-72 py-0 shrink-0 rounded-2xl border-border/50 shadow-sm flex flex-col self-start md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] overflow-hidden"
        id="tour-reportes-list"
      >
        <div className="px-3 pt-3 pb-2 border-b border-border/40">
          <Input
            placeholder="Buscar docente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="sm:text-sm text-xs rounded-xl h-9"
          />
        </div>

        <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden">
          {loadingTeachers ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: TEACHERS_PER_PAGE }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {paginated.map(teacher => {
                const isSelected = selectedTeacher?.id === teacher.id;
                const initials = teacher.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <button
                    key={teacher.id}
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setSelectedSubjectId(null);
                    }}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${isSelected ? 'bg-blue-500/5' : ''
                      }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                        : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[13px] font-medium truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'
                          }`}
                      >
                        {teacher.name}
                      </p>
                      {teacher.codigoDocente && (
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {teacher.codigoDocente}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-2.5 border-t border-border/40 bg-muted/5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 rounded-lg"
            >
              <span className="text-xs">←</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${currentPage === i + 1
                    ? 'w-4 bg-primary'
                    : 'w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'
                    }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-7 w-7 rounded-lg"
            >
              <span className="text-xs">→</span>
            </Button>
          </div>
        )}
      </Card>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedTeacher ? (
          <Card className="rounded-3xl border-dashed border-border/50 bg-gradient-to-b from-muted/5 to-transparent">
            <CardContent className="py-24 flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-muted/30 rounded-3xl flex items-center justify-center mb-6 border border-border/30">
                <Users className="h-11 w-11 text-muted-foreground/25" />
              </div>
              <p className="sm:text-[17px] text-xs tracking-card font-semibold text-foreground">Selecciona un docente</p>
              <p className="sm:text-sm text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
                Elige un docente de la lista lateral para visualizar su historial de asistencia, grupos asignados y estadísticas detalladas.
              </p>
              <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground/60">
                <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                <span>{teachers.length} docentes disponibles</span>
                <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Teacher header + filters */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center sm:text-sm text-xs font-bold text-blue-700 dark:text-blue-400 shrink-0">
                      {selectedTeacher.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="sm:text-[17px] text-xs tracking-card font-semibold">{selectedTeacher.name}</p>
                      {selectedTeacher.codigoDocente && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {selectedTeacher.codigoDocente}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap" id="tour-reportes-filters">
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-32 rounded-xl sm:text-sm text-xs h-9">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grupos */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">

                    <CardTitle className="sm:text-sm text-xs font-semibold">Grupos asignados</CardTitle>
                  </div>
                  {docenteGrupos.length > 0 && (
                    <Badge variant="secondary" className="text-xs rounded-full">
                      {docenteGrupos.length} {docenteGrupos.length === 1 ? 'grupo' : 'grupos'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingGrupos ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-52 rounded-xl" />
                    ))}
                  </div>
                ) : docenteGrupos.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-muted/20 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                    <p className="sm:text-sm text-xs text-muted-foreground font-medium">Sin grupos asignados</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Este docente no tiene grupos activos actualmente.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {docenteGrupos.map(g => (
                      <div
                        key={g.id}
                        className="rounded-xl border border-border/50 p-4 hover:shadow-md hover:border-primary/20 hover:bg-muted/10 transition-all duration-300 flex flex-col gap-2 group/card"
                      >
                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">
                            Grupo {g.code}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {g.academicPeriod}
                          </Badge>
                        </div>

                        {/* Subject */}
                        <div>
                          <p className="sm:text-sm text-xs font-semibold leading-snug">{g.subject.name}</p>
                          <code className="text-xs text-muted-foreground">{g.subject.code}</code>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          {g.schedule && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                {formatDay(g.schedule.dayOfWeek)} · {g.schedule.startTime} – {g.schedule.endTime}
                              </span>
                            </div>
                          )}
                          {g.room && (
                            <div className="flex items-center gap-2">
                              <Layout className="h-3.5 w-3.5 shrink-0" />
                              <span>{g.room.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {g.totalStudents}{' '}
                              {g.totalStudents === 1 ? 'estudiante' : 'estudiantes'}
                            </span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-semibold tabular-nums">
                              {g.completedClasses}/{g.classesCount} clases
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-700"
                              style={{
                                width: `${g.classesCount > 0
                                  ? Math.round((g.completedClasses / g.classesCount) * 100)
                                  : 0
                                  }%`,
                              }}
                            />
                          </div>
                        </div>

                        <Button asChild size="default" variant="default" className="w-full text-xs h-8 mt-auto">
                          <Link href={`/dashboard/admin/reportes/bitacora/${g.id}`}>
                            Ver Bitácora
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sparkline grid */}
            <Card className="rounded-2xl border-border/50 shadow-sm" id="tour-reportes-chart">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="sm:text-sm text-xs font-semibold">
                      Asistencia por asignatura
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Haz clic en una tarjeta para ver el detalle completo
                    </p>
                  </div>
                  {loadingData && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {loadingData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-44 rounded-2xl" />
                    ))}
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    <p className="sm:text-sm text-xs">Sin datos para este periodo</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {subjects.map((s, i) => (
                      <SubjectSparkCard
                        key={s.id}
                        subject={s}
                        colorIndex={i}
                        isSelected={selectedSubjectId === s.id}
                        onSelect={() =>
                          setSelectedSubjectId(prev => (prev === s.id ? null : s.id))
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Detail panel inline */}
                {selectedSubject && (
                  <SubjectDetailPanel subject={selectedSubject} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

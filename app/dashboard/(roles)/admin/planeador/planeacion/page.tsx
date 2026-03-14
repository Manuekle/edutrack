'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CalendarIcon,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { sileo } from 'sileo';

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Grupo {
  id: string;
  codigo: string;
  periodoAcademico: string;
  subject: { name: string; code: string };
  docentes: { name: string }[];
  planning: {
    id: string;
    startDate: string;
    endDate: string | null;
    weeks: {
      id: string;
      number: number;
      startDate: string;
      endDate: string;
      classes: { id: string; status: string }[];
    }[];
  } | null;
}

export default function PlaneacionPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrupo, setSelectedGrupo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    // Carga paralela de grupos y periodos
    Promise.all([
      fetch('/api/admin/planeador/grupos?includePlaneacion=true').then(r => r.json()),
      fetch('/api/admin/periodos').then(r => r.json()),
    ])
      .then(([gData, pData]) => {
        setGrupos(gData.grupos ?? []);
        setPeriods(pData.periods ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const currentGrupo = grupos.find(g => g.id === selectedGrupo);

  const matchingPeriod = useMemo(() => {
    if (!currentGrupo) return null;
    const pName = currentGrupo.periodoAcademico?.replace(/[-\s]/g, '') || '';
    return periods.find(p => p.name.replace(/[-\s]/g, '') === pName);
  }, [currentGrupo, periods]);

  async function generatePlaneacion() {
    if (!selectedGrupo) return;

    // Determine the start date automatically based on the selected group's academic period
    if (!matchingPeriod) {
      sileo.error({
        description: `Periodo "${currentGrupo?.periodoAcademico}" no configurado. Ve a Configuración de Periodos.`,
      });
      return;
    }

    const finalFechaInicio = new Date(matchingPeriod.startDate);

    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/planeador/planeacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGrupo,
          startDate: finalFechaInicio.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        sileo.error({ description: data.error ?? 'Error al generar planeación' });
        return;
      }
      sileo.success({ description: 'Planeación de 16 semanas generada' });
      setSelectedGrupo('');
      load();
    } catch {
      sileo.error({ description: 'Error al generar planeación' });
    } finally {
      setGenerating(false);
    }
  }

  async function deletePlaneacion(planeacionId: string) {
    setDeletingId(planeacionId);
    try {
      await fetch(`/api/admin/planeador/planeacion/${planeacionId}`, { method: 'DELETE' });
      sileo.success({ description: 'Planeación eliminada' });
      load();
    } finally {
      setDeletingId(null);
    }
  }

  const gruposConPlaneacion = grupos.filter(g => g.planning);
  const gruposSinPlaneacion = grupos.filter(g => !g.planning);

  const gruposOrdenados = useMemo(
    () =>
      [...grupos].sort((a, b) => {
        const cmpPeriodo = (b.periodoAcademico ?? '').localeCompare(a.periodoAcademico ?? '');
        if (cmpPeriodo !== 0) return cmpPeriodo;
        return (a.subject?.code ?? '').localeCompare(b.subject?.code ?? '');
      }),
    [grupos]
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2 text-foreground">
          Planeación del semestre
        </h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Aquí defines el calendario de 16 semanas para cada grupo. El docente verá esas semanas en
          su Bitácora para registrar el avance de cada clase semana a semana.
        </p>
      </div>

      {/* Resumen de estado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <Card className="shadow-none border-0 bg-muted/30 dark:bg-white/[0.02] rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-[13px] font-medium text-muted-foreground flex items-center gap-2 tracking-card uppercase">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Users className="h-4 w-4" />
              </div>
              Total grupos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-4xl font-semibold tracking-card text-foreground mt-2">
              {loading ? '—' : grupos.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-0 bg-green-500/5 dark:bg-green-500/10 rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-[13px] font-medium text-green-700/70 dark:text-green-400/70 flex items-center gap-2 tracking-card uppercase">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              Con plan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-4xl font-semibold tracking-card text-green-700 dark:text-green-400">
                {loading ? '—' : gruposConPlaneacion.length}
              </p>
              <p className="text-xs font-medium text-green-600/70 dark:text-green-400/70">listos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-0 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-[13px] font-medium text-amber-700/70 dark:text-amber-400/70 flex items-center gap-2 tracking-card uppercase">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500">
                <AlertCircle className="h-4 w-4" />
              </div>
              Sin plan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-4xl font-semibold tracking-card text-amber-700 dark:text-amber-400">
                {loading ? '—' : gruposSinPlaneacion.length}
              </p>
              <p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">
                pendientes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bloque A: Generar nueva planeación */}
      <Card className="border shadow-xs overflow-hidden p-0 bg-card rounded-2xl w-full relative z-10 mt-6">
        <CardHeader className="bg-muted/10 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              1
            </span>
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
              Generar nueva planeación
            </CardTitle>
          </div>
          <CardDescription className="text-[11px] mt-0.5 ml-8">
            Sigue los pasos y pulsa Generar. El sistema creará 16 semanas.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:pl-10">
          {/* Sin grupos disponibles */}
          {!loading && grupos.length === 0 && (
            <div className="flex items-start gap-4 rounded-xl border-0 bg-amber-50/50 dark:bg-amber-500/5 p-4 text-[13px] text-amber-800 dark:text-amber-400 mb-6">
              <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">No hay grupos creados aún.</p>
                <p className="mt-1 leading-relaxed opacity-90 text-[12px]">
                  Primero importa la programación en el{' '}
                  <Link
                    href="/dashboard/admin/planeador/horarios"
                    className="underline font-medium hover:text-amber-700 dark:hover:text-amber-200"
                  >
                    Paso 1 · Programación
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Paso 1 — Grupo */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold ml-0.5">Elige el grupo</Label>
              <Select value={selectedGrupo} onValueChange={setSelectedGrupo} disabled={loading}>
                <SelectTrigger className="w-full h-11 rounded-xl text-sm px-4 shadow-none bg-muted/40 border border-muted-foreground/10 focus:bg-background focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Seleccionar grupo..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-muted-foreground/10 max-h-80">
                  {gruposOrdenados.map(g => (
                    <SelectItem
                      key={g.id}
                      value={g.id}
                      className="py-2.5 px-3 rounded-lg mx-1 my-0.5 text-[14px]"
                    >
                      <span className="flex items-center gap-2">
                        {g.planning ? (
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span className="font-mono text-muted-foreground mr-1 text-xs">
                          [Grupo: {g.codigo}]
                        </span>
                        <span className="font-medium truncate text-sm">{g.subject.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-4 pl-1 text-[11px] text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Ya tiene planeación
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Pendiente
                </span>
              </div>

              {/* Info del grupo seleccionado */}
              {currentGrupo && (
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 text-sm border border-blue-100 dark:border-blue-500/10 mt-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-[13px] text-foreground truncate">
                      {currentGrupo.subject.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-[10px] uppercase">
                      Cód: {currentGrupo.subject.code}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                    <span>{currentGrupo.periodoAcademico}</span>
                  </div>
                  <div className="mt-1">
                    {currentGrupo.planning ? (
                      <Badge className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-0 shadow-none px-1.5 py-0 rounded-sm">
                        Ya tiene planeación
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border-0 shadow-none px-1.5 py-0 rounded-sm"
                      >
                        Sin planeación
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Paso 2 — Fecha (Automática) */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold ml-0.5">Fechas del semestre</Label>
              <div className="w-full h-11 rounded-xl text-sm px-4 shadow-none bg-muted/20 border border-muted flex items-center gap-3">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {matchingPeriod ? (
                  <span className="text-foreground font-medium">
                    {format(new Date(matchingPeriod.startDate), 'd MMM yyyy', { locale: es })} —{' '}
                    {format(new Date(matchingPeriod.endDate), 'd MMM yyyy', { locale: es })}
                  </span>
                ) : currentGrupo ? (
                  <span className="text-destructive font-medium flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Periodo no configurado ({currentGrupo.periodoAcademico})
                  </span>
                ) : (
                  <span className="text-muted-foreground">Selecciona un grupo primero</span>
                )}
              </div>
              {!matchingPeriod && currentGrupo && (
                <p className="text-[11px] text-destructive pl-1 leading-relaxed max-w-[90%] font-medium">
                  Error: Las fechas del periodo &quot;{currentGrupo.periodoAcademico}&quot; no están
                  definidas. Configúralas en la pestaña de Periodos.
                </p>
              )}
              {matchingPeriod && (
                <p className="text-[11px] text-muted-foreground pl-1 leading-relaxed max-w-[90%]">
                  Las fechas se asignan automáticamente según la configuración del periodo académico
                  (ajustable en el Paso 1).
                </p>
              )}
            </div>
          </div>

          {/* Aviso si ya tiene planeación */}
          {currentGrupo?.planning && (
            <div className="flex items-start gap-4 rounded-xl border-0 bg-amber-50/80 dark:bg-amber-500/5 p-3 text-[12px] text-amber-800 dark:text-amber-300 mt-4">
              <div className="bg-amber-100 dark:bg-amber-500/20 p-1.5 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="leading-relaxed flex-1 pt-0.5">
                Este grupo ya tiene planeación. Si generas de nuevo,{' '}
                <strong className="font-semibold text-amber-900 dark:text-amber-100">
                  se reemplazará la actual
                </strong>{' '}
                y el docente perderá el calendario.
              </span>
            </div>
          )}

          <div className="pt-6">
            <Button
              onClick={generatePlaneacion}
              disabled={!selectedGrupo || generating || loading || !matchingPeriod}
              className="w-full sm:w-auto rounded-xl shadow-none h-10 px-8 text-xs font-medium transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Generando semanas...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                  Generar 16 semanas
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bloque B: Planeaciones ya creadas */}
      <div className="space-y-4 w-full pt-6">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold">
            2
          </span>
          <h2 className="text-sm font-semibold tracking-card">Planeaciones activas</h2>
        </div>
        <p className="text-[12px] text-muted-foreground sm:ml-8 mb-6 max-w-lg">
          Puedes eliminar una planeación desde aquí si ocurrió un error en las fechas.
        </p>

        {loading ? (
          <div className="space-y-4 sm:ml-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : gruposConPlaneacion.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/10 border-none rounded-3xl sm:ml-8 p-6">
            <div className="bg-background p-3 rounded-2xl shadow-sm mb-3">
              <ClipboardList className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-[13px] font-medium text-foreground">
              Aún no hay planeaciones generadas.
            </p>
            <p className="text-[11px] mt-1 text-muted-foreground max-w-sm">
              Usa el formulario de arriba para crear uno.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 sm:ml-8">
            {gruposConPlaneacion.map(g => {
              const semanas = g.planning!.weeks;
              // Sumamos todas las clases de todas las semanas de la planeación
              const todasLasClases = semanas.flatMap(s => s.classes);
              const totalClases = todasLasClases.length || 16; // Fallback a 16 si no hay clases registradas aún
              const clasesCompletadas = todasLasClases.filter(
                c => c.status === 'SIGNED' || c.status === 'CANCELADA'
              ).length;

              const progress = (clasesCompletadas / totalClases) * 100;

              return (
                <div
                  key={g.id}
                  className="group relative flex flex-col justify-between bg-card text-card-foreground p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] border-0 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all overflow-hidden"
                >

                  <div className="space-y-3.5 z-10">
                    {/* Encabezado de la tarjeta */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm text-foreground tracking-card line-clamp-1">
                          {g.subject.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] uppercase font-semibold tracking-card rounded-full px-2 py-0 w-fit"
                        >
                          Grupo: {g.codigo}
                        </Badge>
                      </div>

                      {/* Botón eliminar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-all -mt-1 -mr-1"
                        onClick={() => deletePlaneacion(g.planning!.id)}
                        disabled={deletingId === g.planning!.id}
                        title="Eliminar planeación"
                      >
                        {deletingId === g.planning!.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-1">
                      {/* Docente */}
                      <p className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {g.docentes?.[0]?.name ?? (
                            <span className="text-amber-600 dark:text-amber-500 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
                              Sin asignar
                            </span>
                          )}
                        </span>
                      </p>

                      {/* Fechas */}
                      <p className="flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <span>
                          {format(new Date(g.planning!.startDate), 'MMM d', { locale: es })} —{' '}
                          {g.planning!.endDate
                            ? format(new Date(g.planning!.endDate), 'MMM d', { locale: es })
                            : 'N/A'}
                        </span>
                      </p>
                    </div>

                    {/* Barra de semanas configuradas */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                        <span>Progreso Académico</span>
                        <span>
                          {clasesCompletadas} / {totalClases} Clases
                        </span>
                      </div>
                      <Progress
                        value={progress}
                        className="h-1.5 bg-muted/40 rounded-full overflow-hidden"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

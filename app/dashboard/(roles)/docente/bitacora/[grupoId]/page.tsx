'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ArrowLeft, BookOpen, CalendarDays, Clock, Printer, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';

interface ClaseBitacora {
  id: string;
  date: string; // ISO
  status: 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA';
  bitacora: {
    id: string;
    temaEjecutado: string | null;
    observaciones: string | null;
  } | null;
  semana: { numero: number };
}

interface GrupoData {
  id: string;
  codigo: string;
  periodoAcademico: string;
  subject: { name: string; code: string };
  horario: { horaInicio: string; horaFin: string } | null;
  sala: { name: string } | null;
  docentes: { name: string; correoInstitucional: string | null }[];
  estudianteIds: string[];
  planeacion: {
    id: string;
    fechaInicio: string;
    semanas: {
      id: string;
      numero: number;
      clases: ClaseBitacora[];
    }[];
  } | null;
}

// Inline editable row state
interface RowEdit {
  claseId: string;
  dd: string;
  mm: string;
  horaInicio: string;
  horaFin: string;
  tema: string;
  totalHoras: string;
  dirty: boolean;
}

function calcHoras(inicio: string, fin: string): string {
  if (!inicio || !fin) return '';
  const [ih, im] = inicio.split(':').map(Number);
  const [fh, fm] = fin.split(':').map(Number);
  const mins = fh * 60 + fm - (ih * 60 + im);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}` : `${h}.${String(Math.round((m / 60) * 10)).padStart(1, '0')}`;
}

export default function BitacoraTablaPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const [data, setData] = useState<GrupoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RowEdit[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/docente/bitacora/${grupoId}`)
      .then(r => r.json())
      .then((d: GrupoData) => {
        setData(d);
        // Build flat list of all classes in semana order
        const clases = (d.planeacion?.semanas ?? [])
          .sort((a, b) => a.numero - b.numero)
          .flatMap(s =>
            s.clases.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          );

        setRows(
          clases.map(c => {
            const dt = new Date(c.date);
            return {
              claseId: c.id,
              dd: c.bitacora ? format(dt, 'dd') : format(dt, 'dd'),
              mm: c.bitacora ? format(dt, 'MM') : format(dt, 'MM'),
              horaInicio: d.horario?.horaInicio ?? '',
              horaFin: d.horario?.horaFin ?? '',
              tema: c.bitacora?.temaEjecutado ?? '',
              totalHoras: calcHoras(d.horario?.horaInicio ?? '', d.horario?.horaFin ?? ''),
              dirty: false,
            };
          })
        );
      })
      .finally(() => setLoading(false));
  }, [grupoId]);

  function updateRow(claseId: string, field: keyof RowEdit, value: string) {
    setRows(prev =>
      prev.map(r => {
        if (r.claseId !== claseId) return r;
        const updated = { ...r, [field]: value, dirty: true };
        if (field === 'horaInicio' || field === 'horaFin') {
          updated.totalHoras = calcHoras(
            field === 'horaInicio' ? value : r.horaInicio,
            field === 'horaFin' ? value : r.horaFin
          );
        }
        return updated;
      })
    );
  }

  async function saveRow(claseId: string) {
    const row = rows.find(r => r.claseId === claseId);
    if (!row) return;
    setSaving(claseId);
    try {
      await fetch(`/api/docente/bitacora/${grupoId}/${claseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temaEjecutado: row.tema,
          estadoClase: row.tema.trim() ? 'REALIZADA' : 'PROGRAMADA',
          asistencias: [],
        }),
      });
      setRows(prev => prev.map(r => (r.claseId === claseId ? { ...r, dirty: false } : r)));
      sileo.success({ title: 'Fila guardada' });
    } catch {
      sileo.error({ title: 'Error al guardar' });
    } finally {
      setSaving(null);
    }
  }

  async function saveAll() {
    const dirtyRows = rows.filter(r => r.dirty);
    if (!dirtyRows.length) {
      sileo.info({ title: 'No hay cambios' });
      return;
    }
    setSaving('all');
    try {
      await Promise.all(
        dirtyRows.map(async row => {
          await fetch(`/api/docente/bitacora/${grupoId}/${row.claseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              temaEjecutado: row.tema,
              estadoClase: row.tema.trim() ? 'REALIZADA' : 'PROGRAMADA',
              asistencias: [],
            }),
          });
        })
      );
      setRows(prev => prev.map(r => ({ ...r, dirty: false })));
      sileo.success({ title: `${dirtyRows.length} filas guardadas` });
    } catch {
      sileo.error({ title: 'Error al guardar' });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Grupo no encontrado.</p>;

  const docente = data.docentes[0];
  const año = data.planeacion
    ? new Date(data.planeacion.fechaInicio).getFullYear()
    : new Date().getFullYear();
  const totalHorasAcum = rows.reduce((acc, r) => acc + (parseFloat(r.totalHoras) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
            <Link href={`/dashboard/docente/grupos/${grupoId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-card">Bitácora Docente</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-none gap-1.5 h-8 text-[13px]"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </Button>
          <Button
            size="sm"
            className="rounded-full shadow-none gap-1.5 h-8 text-[13px]"
            onClick={saveAll}
            disabled={saving === 'all'}
          >
            <Save className="h-3.5 w-3.5" />
            {saving === 'all' ? 'Guardando...' : 'Guardar Todo'}
          </Button>
        </div>
      </div>

      {/* Encabezado del documento */}
      <div
        ref={tableRef}
        className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1"
      >
        {/* Header */}
        <div className="bg-background rounded-2xl p-5 mb-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-[13px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-card text-muted-foreground uppercase">
                Docente
              </span>
              <span className="font-semibold text-foreground truncate">{docente?.name ?? '—'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-card text-muted-foreground uppercase">
                Asignatura
              </span>
              <span className="font-semibold text-foreground truncate">{data.subject.name}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-card text-muted-foreground uppercase">
                Programa
              </span>
              <span className="font-medium text-foreground truncate">{data.subject.code}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-card text-muted-foreground uppercase">
                Grupo
              </span>
              <span className="font-mono text-foreground">{data.codigo}</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-card text-muted-foreground uppercase">
                Período
              </span>
              <span className="font-medium text-foreground">{data.periodoAcademico}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-card text-muted-foreground uppercase">
                Año
              </span>
              <span className="font-medium text-foreground">{año}</span>
            </div>
            {data.sala && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-card text-muted-foreground uppercase">
                  Sala
                </span>
                <span className="font-medium text-foreground truncate">{data.sala.name}</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-card text-muted-foreground uppercase">
                Estudiantes
              </span>
              <span className="font-medium text-foreground">{data.estudianteIds.length}</span>
            </div>
          </div>
        </div>

        {/* Tabla principal */}
        {!data.planeacion ? (
          <div className="bg-background rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-[15px] font-medium text-foreground">No hay planeación académica.</p>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
              El administrador debe generar la planeación de 16 semanas primero para habilitar la
              bitácora.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {rows.map((row, index) => (
              <div
                key={row.claseId}
                className={`flex flex-col md:flex-row md:items-start gap-4 p-4 transition-colors ${
                  row.tema.trim()
                    ? 'bg-primary/5 dark:bg-primary/10'
                    : row.dirty
                      ? 'bg-amber-500/5 dark:bg-amber-500/10'
                      : ''
                } hover:bg-muted/50 dark:hover:bg-white/[0.02]`}
              >
                {/* Info and Time block */}
                <div className="flex items-center gap-3 md:w-56 shrink-0">
                  <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-muted/50 text-[11px] font-bold text-muted-foreground shrink-0 border border-border/50">
                    {index + 1}
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-1.5 bg-background rounded-lg border shadow-sm px-1.5 py-1">
                      <CalendarDays className="h-3 w-3 text-muted-foreground ml-1" />
                      <Input
                        value={row.dd}
                        onChange={e => updateRow(row.claseId, 'dd', e.target.value)}
                        className="h-6 w-7 font-mono text-center text-[13px] p-0 border-0 bg-transparent focus-visible:ring-1 hover:bg-muted/50"
                        maxLength={2}
                        placeholder="DD"
                        aria-label="Día"
                      />
                      <span className="text-muted-foreground/40 font-light">/</span>
                      <Input
                        value={row.mm}
                        onChange={e => updateRow(row.claseId, 'mm', e.target.value)}
                        className="h-6 w-7 font-mono text-center text-[13px] p-0 border-0 bg-transparent focus-visible:ring-1 hover:bg-muted/50"
                        maxLength={2}
                        placeholder="MM"
                        aria-label="Mes"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-background rounded-lg border shadow-sm px-1.5 py-1">
                      <Clock className="h-3 w-3 text-muted-foreground ml-1" />
                      <Input
                        value={row.horaInicio}
                        onChange={e => updateRow(row.claseId, 'horaInicio', e.target.value)}
                        className="h-6 w-11 font-mono text-center text-[13px] p-0 border-0 bg-transparent focus-visible:ring-1 hover:bg-muted/50"
                        placeholder="00:00"
                        aria-label="Hora Inicio"
                      />
                      <span className="text-muted-foreground/40 font-light">-</span>
                      <Input
                        value={row.horaFin}
                        onChange={e => updateRow(row.claseId, 'horaFin', e.target.value)}
                        className="h-6 w-11 font-mono text-center text-[13px] p-0 border-0 bg-transparent focus-visible:ring-1 hover:bg-muted/50"
                        placeholder="00:00"
                        aria-label="Hora Fin"
                      />
                    </div>
                  </div>
                </div>

                {/* Tema Textarea */}
                <div className="flex-1 min-w-0">
                  <Textarea
                    value={row.tema}
                    onChange={e => updateRow(row.claseId, 'tema', e.target.value)}
                    className="min-h-[4.5rem] h-full text-[13px] resize-none bg-background rounded-xl border border-border/50 shadow-sm focus-visible:ring-1 leading-snug p-3"
                    placeholder="Describir el tema ejecutado en esta sesión..."
                  />
                </div>

                {/* Horas & Acciones */}
                <div className="flex md:flex-col items-center justify-between md:justify-start gap-4 md:w-20 shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold tracking-card uppercase text-muted-foreground">
                      Horas
                    </span>
                    <Input
                      value={row.totalHoras}
                      onChange={e => updateRow(row.claseId, 'totalHoras', e.target.value)}
                      className="h-8 w-14 font-mono font-semibold text-center text-[13px] bg-background border border-border/50 shadow-sm rounded-lg focus-visible:ring-1"
                      aria-label="Total Horas"
                    />
                  </div>

                  <div className="h-8 flex items-center justify-center">
                    {row.dirty && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-primary"
                        onClick={() => saveRow(row.claseId)}
                        disabled={saving === row.claseId}
                        title="Guardar fila"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Footer Total */}
            <div className="bg-background rounded-b-2xl p-4 flex items-center justify-end gap-3 border-t">
              <span className="text-[13px] font-medium text-muted-foreground">
                Total horas acumuladas:
              </span>
              <span className="font-mono font-semibold text-[15px] bg-muted/50 px-3 py-1 rounded-lg border">
                {totalHorasAcum > 0 ? totalHorasAcum.toFixed(1) : '0.0'}
              </span>
              <div className="w-20 md:block hidden" /> {/* Spacer to align with inputs */}
            </div>
          </div>
        )}
      </div>

      {/* Botón guardar inferior */}
      {rows.some(r => r.dirty) && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={saveAll}
            disabled={saving === 'all'}
            className="gap-2 rounded-full px-6 shadow-md shadow-primary/20"
          >
            <Save className="h-4 w-4" />
            {saving === 'all'
              ? 'Guardando...'
              : `Guardar ${rows.filter(r => r.dirty).length} cambios`}
          </Button>
        </div>
      )}
    </div>
  );
}

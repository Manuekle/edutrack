'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarRange, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Week {
  id: string;
  number: number;
  name: string | null;
  startDate: string;
  endDate: string;
}

interface Props {
  periods: Period[];
}

export function PeriodWeeksEditor({ periods }: Props) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periods[0]?.id ?? '');
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(16);

  const loadWeeks = async (periodId: string) => {
    if (!periodId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/period-weeks?periodId=${periodId}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setWeeks(json.weeks ?? []);
    } catch {
      sileo.error({ description: 'Error al cargar semanas' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) loadWeeks(selectedPeriodId);
  }, [selectedPeriodId]);

  const handleGenerate = async () => {
    if (!selectedPeriodId) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/period-weeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          periodId: selectedPeriodId,
          count,
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setWeeks(json.weeks ?? []);
      sileo.success({ description: `Generadas ${count} semanas` });
    } catch {
      sileo.error({ description: 'Error al generar semanas' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/period-weeks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setWeeks(w => w.filter(x => x.id !== id));
      sileo.success({ description: 'Semana eliminada' });
    } catch {
      sileo.error({ description: 'Error al eliminar' });
    }
  };

  const handleUpdate = async (id: string, patch: Partial<Pick<Week, 'name' | 'startDate' | 'endDate'>>) => {
    try {
      const res = await fetch(`/api/admin/period-weeks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setWeeks(w => w.map(x => (x.id === id ? json.week : x)));
    } catch {
      sileo.error({ description: 'Error al actualizar' });
    }
  };

  if (periods.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
            <CalendarRange className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold">Sin periodos configurados</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea periodos en la pestaña <strong>Periodos</strong> antes de definir semanas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Periodo</Label>
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cantidad de semanas</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={count}
                onChange={e => setCount(Math.max(1, Math.min(52, parseInt(e.target.value, 10) || 16)))}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={!selectedPeriodId || generating}
                className="w-full"
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generar semanas
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Genera la cantidad de semanas indicada a partir de la fecha de inicio del periodo. <strong>Reemplaza</strong> las semanas existentes para este periodo.
          </p>
        </CardContent>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ) : weeks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold">Sin semanas configuradas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Usa el botón <strong>Generar semanas</strong> para crearlas automáticamente.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map(w => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono font-semibold">{w.number}</TableCell>
                  <TableCell>
                    <Input
                      defaultValue={w.name ?? ''}
                      placeholder={`Semana ${w.number}`}
                      onBlur={e => {
                        const v = e.target.value.trim();
                        if (v !== (w.name ?? '')) handleUpdate(w.id, { name: v || null });
                      }}
                      className="h-8 bg-transparent border-transparent hover:border-border focus-visible:border-primary/40 px-2"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      defaultValue={w.startDate.split('T')[0]}
                      onBlur={e => {
                        if (e.target.value && e.target.value !== w.startDate.split('T')[0]) {
                          handleUpdate(w.id, { startDate: e.target.value });
                        }
                      }}
                      className="h-8 bg-transparent border-transparent hover:border-border focus-visible:border-primary/40 px-2 w-36"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      defaultValue={w.endDate.split('T')[0]}
                      onBlur={e => {
                        if (e.target.value && e.target.value !== w.endDate.split('T')[0]) {
                          handleUpdate(w.id, { endDate: e.target.value });
                        }
                      }}
                      className="h-8 bg-transparent border-transparent hover:border-border focus-visible:border-primary/40 px-2 w-36"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(w.id)}
                      aria-label="Eliminar semana"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <p className="text-[11px] text-muted-foreground px-1">
        Para guardar cambios en nombre o fechas: edita el campo y haz clic fuera del input.
      </p>
    </div>
  );
}

export function formatRange(start: string, end: string) {
  return `${format(new Date(start), 'd MMM', { locale: es })} → ${format(new Date(end), 'd MMM', { locale: es })}`;
}

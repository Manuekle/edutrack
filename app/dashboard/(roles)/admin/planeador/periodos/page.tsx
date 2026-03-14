'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

import { CalendarDays, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function PeriodosPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/periodos')
      .then(r => r.json())
      .then(d => setPeriods(d.periods ?? []))
      .catch(() => sileo.error({ description: 'Error al cargar periodos' }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function handleAdd() {
    if (!newName || !newStart || !newEnd) {
      sileo.error({ description: 'Completa todos los campos' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/periodos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          startDate: newStart,
          endDate: newEnd,
          isActive: true,
        }),
      });

      if (!res.ok) throw new Error();

      sileo.success({ description: 'Periodo creado exitosamente' });
      setIsAdding(false);
      setNewName('');
      setNewStart('');
      setNewEnd('');
      load();
    } catch {
      sileo.error({ description: 'Error al crear el periodo' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-1">

          <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2 text-foreground">
            Configuración de Periodos
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Gestiona los ciclos académicos y sus fechas de inicio/fin. Estas fechas determinan cómo
            se generan las planeaciones de 16 semanas.
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-xl shadow-none h-10 px-6 text-xs font-medium gap-2"
        >
          {isAdding ? 'Cancelar' : <><Plus className="h-4 w-4" /> Agregar Periodo</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border shadow-xs overflow-hidden p-0 bg-card rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-muted/10 border-b px-5 py-4">
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
              Nuevo Periodo Académico
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold ml-0.5">Nombre del Periodo</Label>
                <Input
                  placeholder="Ej: 2026-1 o 20261"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="rounded-xl h-10 text-sm shadow-none bg-muted/20 border-transparent focus:bg-background focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold ml-0.5">Fecha Inicio</Label>
                <Input
                  type="date"
                  value={newStart}
                  onChange={e => setNewStart(e.target.value)}
                  className="rounded-xl h-10 text-sm shadow-none bg-muted/20 border-transparent focus:bg-background focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold ml-0.5">Fecha Fin</Label>
                <Input
                  type="date"
                  value={newEnd}
                  onChange={e => setNewEnd(e.target.value)}
                  className="rounded-xl h-10 text-sm shadow-none bg-muted/20 border-transparent focus:bg-background focus:border-primary/50"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleAdd}
                disabled={saving}
                className="rounded-xl px-8 h-10 text-xs font-medium"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar Periodo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="p-0 overflow-hidden border shadow-xs">
        <CardHeader className="border-b px-5 py-4 bg-muted/5">
          <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
            Periodos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : periods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center p-6">
              <div className="bg-muted/30 p-4 rounded-full mb-4">
                <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                No hay periodos configurados
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Registra el primer periodo académico para que el sistema pueda asignar fechas automáticamente.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5 border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold px-5">Nombre</TableHead>
                  <TableHead className="text-xs font-semibold px-5">Fecha Inicio</TableHead>
                  <TableHead className="text-xs font-semibold px-5">Fecha Fin</TableHead>
                  <TableHead className="text-xs font-semibold px-5">Estado</TableHead>
                  <TableHead className="text-xs font-semibold px-5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map(p => (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="px-5 font-medium text-sm">
                      {p.name}
                    </TableCell>
                    <TableCell className="px-5 text-xs text-muted-foreground">
                      {format(new Date(p.startDate), 'PPPP', { locale: es })}
                    </TableCell>
                    <TableCell className="px-5 text-xs text-muted-foreground">
                      {format(new Date(p.endDate), 'PPPP', { locale: es })}
                    </TableCell>
                    <TableCell className="px-5">
                      <Badge className="bg-green-500/10 text-green-600 border-0 shadow-none text-[10px] font-semibold uppercase rounded-sm">
                        Activo
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className="h-8 w-8 rounded-full opacity-30 cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

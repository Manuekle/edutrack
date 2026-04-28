'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { CalendarDays, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface AcademicYear {
  id: string;
  year: number;
  isActive: boolean;
  periods: AcademicPeriod[];
  specialRanges: SpecialRange[];
}

interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  yearId: string | null;
}

interface SpecialRange {
  id: string;
  name: string;
  type: 'VACATION' | 'HOLIDAY' | 'RECESS';
  startDate: string;
  endDate: string;
  yearId: string;
}

export default function PeriodosPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false,
  });

  const [editingRange, setEditingRange] = useState<SpecialRange | null>(null);
  const [rangeForm, setRangeForm] = useState({
    name: '',
    type: 'VACATION' as 'VACATION' | 'HOLIDAY' | 'RECESS',
    startDate: '',
    endDate: '',
  });

  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const [newYearValue, setNewYearValue] = useState('');

  const loadYears = () => {
    setLoading(true);
    fetch('/api/admin/periodos/years')
      .then(r => r.json())
      .then(d => {
        setYears(d.years ?? []);
        if (d.years?.length > 0 && !selectedYearId) {
          setSelectedYearId(d.years[0].id);
        }
      })
      .catch(() => sileo.error({ description: 'Error al cargar años' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadYears();
  }, []);

  const selectedYear = years.find(y => y.id === selectedYearId);

  const handleCreateYear = async () => {
    const yearNum = parseInt(newYearValue, 10);
    if (!yearNum || yearNum < 2000 || yearNum > 2100) {
      sileo.error({ description: 'Ingresa un año válido (2000-2100)' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/periodos/years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: yearNum }),
      });

      if (!res.ok) throw new Error();

      sileo.success({ description: 'Año creado exitosamente' });
      setShowNewYearDialog(false);
      setNewYearValue('');
      setSelectedYearId(null);
      loadYears();
    } catch {
      sileo.error({ description: 'Error al crear el año' });
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestPeriods = async () => {
    if (!selectedYearId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/periodos/years/${selectedYearId}/suggest`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error();

      sileo.success({ description: 'Periodos sugeridos correctamente' });
      loadYears();
    } catch {
      sileo.error({ description: 'Error al sugerir periodos' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPeriod) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/periodos/${editingPeriod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          isActive: editForm.isActive,
        }),
      });

      if (!res.ok) throw new Error();

      sileo.success({ description: 'Periodo actualizado' });
      setEditingPeriod(null);
      loadYears();
    } catch {
      sileo.error({ description: 'Error al actualizar el periodo' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRange = async () => {
    if (!selectedYearId || !rangeForm.name || !rangeForm.startDate || !rangeForm.endDate) {
      sileo.error({ description: 'Completa todos los campos' });
      return;
    }

    if (new Date(rangeForm.startDate) >= new Date(rangeForm.endDate)) {
      sileo.error({ description: 'La fecha de inicio debe ser anterior a la fecha fin' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/periodos/special-ranges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rangeForm.name,
          type: rangeForm.type,
          startDate: rangeForm.startDate,
          endDate: rangeForm.endDate,
          yearId: selectedYearId,
        }),
      });

      if (!res.ok) throw new Error();

      sileo.success({ description: 'Fecha especial agregada' });
      setRangeForm({ name: '', type: 'VACATION', startDate: '', endDate: '' });
      loadYears();
    } catch {
      sileo.error({ description: 'Error al agregar la fecha especial' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRange = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/periodos/special-ranges/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error();

      sileo.success({ description: 'Fecha especial eliminada' });
      loadYears();
    } catch {
      sileo.error({ description: 'Error al eliminar la fecha especial' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRangeEdit = async () => {
    if (!editingRange) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/periodos/special-ranges/${editingRange.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rangeForm.name,
          type: rangeForm.type,
          startDate: rangeForm.startDate,
          endDate: rangeForm.endDate,
        }),
      });

      if (!res.ok) throw new Error();

      sileo.success({ description: 'Fecha especial actualizada' });
      setEditingRange(null);
      setRangeForm({ name: '', type: 'VACATION', startDate: '', endDate: '' });
      loadYears();
    } catch {
      sileo.error({ description: 'Error al actualizar la fecha especial' });
    } finally {
      setSaving(false);
    }
  };

  const openEditPeriod = (period: AcademicPeriod) => {
    setEditingPeriod(period);
    setEditForm({
      name: period.name,
      startDate: period.startDate.split('T')[0],
      endDate: period.endDate.split('T')[0],
      isActive: period.isActive,
    });
  };

  const openEditRange = (range: SpecialRange) => {
    setEditingRange(range);
    setRangeForm({
      name: range.name,
      type: range.type,
      startDate: range.startDate.split('T')[0],
      endDate: range.endDate.split('T')[0],
    });
  };

  const getTypeBadge = (type: 'VACATION' | 'HOLIDAY' | 'RECESS') => {
    const styles = {
      VACATION: 'bg-blue-500/10 text-blue-600 border-0',
      HOLIDAY: 'bg-red-500/10 text-red-600 border-0',
      RECESS: 'bg-yellow-500/10 text-yellow-600 border-0',
    };
    const labels = {
      VACATION: 'Vacaciones',
      HOLIDAY: 'Festivo',
      RECESS: 'Receso',
    };
    return (
      <Badge className={`shadow-none text-[10px] font-semibold ${styles[type]}`}>
        {labels[type]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2 text-foreground">
            Configuración de Periodos
          </h1>
          <p className="text-muted-foreground sm:text-sm text-xs max-w-2xl">
            Gestiona los ciclos académicos, sus periodos y fechas especiales por año.
          </p>
        </div>
      </div>

      {years.length === 0 ? (
        <Card className="border shadow-xs overflow-hidden p-0 bg-card rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center p-6">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h4 className="sm:text-sm text-xs font-semibold text-foreground mb-1">
              No hay años académicos configurados
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
              Crea el primer año académico para comenzar a configurar periodos y fechas especiales.
            </p>
            <Button
              onClick={() => setShowNewYearDialog(true)}
              className="rounded-xl shadow-none h-10 px-6 text-xs font-medium gap-2"
            >
              <Plus className="h-4 w-4" /> Crear Primer Año
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-2 items-center">
            <Select value={selectedYearId ?? ''} onValueChange={v => setSelectedYearId(v)}>
              <SelectTrigger className="w-[180px] rounded-xl h-10">
                <SelectValue placeholder="Selecciona un año" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.year}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="h-4 w-4" /> Crear año
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedYearId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewYearDialog(true)}
              className="rounded-xl h-9 gap-1"
            >
              <Plus className="h-4 w-4" /> Nuevo Año
            </Button>
          )}
        </div>
      )}

      {!selectedYearId && years.length > 0 && (
        <Card className="border shadow-xs p-0 bg-card rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center p-6">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h4 className="sm:text-sm text-xs font-semibold text-foreground mb-1">
              Selecciona un año para comenzar
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Elige un año del dropdown superior para gestionar sus periodos y fechas especiales.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedYear && (
        <Tabs defaultValue="periodos" className="w-full">
          <TabsList className="rounded-xl bg-muted/50 h-10 p-1">
            <TabsTrigger value="periodos" className="rounded-lg text-xs px-4">
              Periodos
            </TabsTrigger>
            <TabsTrigger value="especiales" className="rounded-lg text-xs px-4">
              Fechas Especiales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="periodos" className="mt-6 space-y-4">
            <Card className="p-0 overflow-hidden border shadow-xs">
              <CardHeader className="border-b px-5 py-4 bg-muted/5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                    Periodos del Año {selectedYear.year}
                  </CardTitle>
                  {selectedYear.periods.length === 0 && (
                    <Button
                      onClick={handleSuggestPeriods}
                      disabled={saving}
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2 text-xs"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Sugerir Periodos
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {selectedYear.periods.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center p-6">
                    <div className="bg-muted/30 p-4 rounded-full mb-4">
                      <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <h4 className="sm:text-sm text-xs font-semibold text-foreground mb-1">
                      No hay periodos configurados
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Crea periodos manualmente o usa la función &quot;Sugerir Periodos&quot; para
                      generarlos automáticamente.
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
                        <TableHead className="text-xs font-semibold px-5 text-right">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedYear.periods.map(p => (
                        <TableRow key={p.id} className="hover:bg-muted/30 transition-colors group">
                          <TableCell className="px-5 font-medium sm:text-sm text-xs">
                            {p.name}
                          </TableCell>
                          <TableCell className="px-5 text-xs text-muted-foreground">
                            {format(new Date(p.startDate), 'PPPP', { locale: es })}
                          </TableCell>
                          <TableCell className="px-5 text-xs text-muted-foreground">
                            {format(new Date(p.endDate), 'PPPP', { locale: es })}
                          </TableCell>
                          <TableCell className="px-5">
                            {p.isActive ? (
                              <Badge className="bg-green-500/10 text-green-600 border-0 shadow-none text-[10px] font-semibold uppercase rounded-sm">
                                Activo
                              </Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground border-0 shadow-none text-[10px] font-semibold uppercase rounded-sm">
                                Inactivo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditPeriod(p)}
                              className="h-8 rounded-xl text-xs gap-1"
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="especiales" className="mt-6 space-y-4">
            <Card className="p-0 overflow-hidden border shadow-xs">
              <CardHeader className="border-b px-5 py-4 bg-muted/5">
                <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                  Fechas Especiales del Año {selectedYear.year}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2 lg:col-span-1">
                    <Label className="text-xs font-semibold ml-0.5">Nombre</Label>
                    <Input
                      placeholder="Ej: Semana Santa"
                      value={rangeForm.name}
                      onChange={e => setRangeForm(f => ({ ...f, name: e.target.value }))}
                      className="rounded-xl h-10 sm:text-sm text-xs shadow-none bg-muted/20 border-transparent focus:bg-background focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold ml-0.5">Tipo</Label>
                    <Select
                      value={rangeForm.type}
                      onValueChange={v =>
                        setRangeForm(f => ({ ...f, type: v as 'VACATION' | 'HOLIDAY' | 'RECESS' }))
                      }
                    >
                      <SelectTrigger className="rounded-xl h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VACATION">Vacaciones</SelectItem>
                        <SelectItem value="HOLIDAY">Festivo</SelectItem>
                        <SelectItem value="RECESS">Receso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold ml-0.5">Fecha Inicio</Label>
                    <Input
                      type="date"
                      value={rangeForm.startDate}
                      onChange={e => setRangeForm(f => ({ ...f, startDate: e.target.value }))}
                      className="rounded-xl h-10 sm:text-sm text-xs shadow-none bg-muted/20 border-transparent focus:bg-background focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold ml-0.5">Fecha Fin</Label>
                    <Input
                      type="date"
                      value={rangeForm.endDate}
                      onChange={e => setRangeForm(f => ({ ...f, endDate: e.target.value }))}
                      className="rounded-xl h-10 sm:text-sm text-xs shadow-none bg-muted/20 border-transparent focus:bg-background focus:border-primary/50"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddRange}
                      disabled={saving}
                      className="rounded-xl h-10 text-xs font-medium w-full"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Agregar
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                {selectedYear.specialRanges.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-xs text-muted-foreground">
                      No hay fechas especiales configuradas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedYear.specialRanges.map(r => (
                      <div
                        key={r.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 rounded-xl bg-muted/20 border"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <span className="font-medium text-sm">{r.name}</span>
                          {getTypeBadge(r.type)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(r.startDate), 'PP', { locale: es })} -{' '}
                            {format(new Date(r.endDate), 'PP', { locale: es })}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditRange(r)}
                            className="h-8 rounded-xl text-xs"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRange(r.id)}
                            disabled={saving}
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!editingPeriod} onOpenChange={() => setEditingPeriod(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Editar Periodo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={v => setEditForm(f => ({ ...f, isActive: !!v }))}
              />
              <Label htmlFor="edit-active">Periodo activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPeriod(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="rounded-xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRange} onOpenChange={() => setEditingRange(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Editar Fecha Especial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={rangeForm.name}
                onChange={e => setRangeForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={rangeForm.type}
                onValueChange={v =>
                  setRangeForm(f => ({ ...f, type: v as 'VACATION' | 'HOLIDAY' | 'RECESS' }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VACATION">Vacaciones</SelectItem>
                  <SelectItem value="HOLIDAY">Festivo</SelectItem>
                  <SelectItem value="RECESS">Receso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={rangeForm.startDate}
                  onChange={e => setRangeForm(f => ({ ...f, startDate: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={rangeForm.endDate}
                  onChange={e => setRangeForm(f => ({ ...f, endDate: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRange(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSaveRangeEdit} disabled={saving} className="rounded-xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewYearDialog} onOpenChange={setShowNewYearDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Año</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Año</Label>
              <Input
                type="number"
                placeholder="Ej: 2027"
                value={newYearValue}
                onChange={e => setNewYearValue(e.target.value)}
                className="rounded-xl"
                min={2000}
                max={2100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewYearDialog(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateYear} disabled={saving} className="rounded-xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

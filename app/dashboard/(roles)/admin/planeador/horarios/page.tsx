'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  BookOpen,
  CalendarDays,
  Clock,
  Download,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Horario {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  periodicidad: 'SEMANAL' | 'QUINCENAL';
  subject?: { id: string; name: string; code: string } | null;
  sala?: { id: string; name: string } | null;
  _count: { grupos: number };
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const DIA_LABELS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 6; // 6:00 - 20:00
  return `${h.toString().padStart(2, '0')}:00`;
});

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Horario | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [dia, setDia] = useState('LUNES');
  const [horaInicio, setHoraInicio] = useState('07:00');
  const [horaFin, setHoraFin] = useState('09:00');

  // Carga masiva
  const [file, setFile] = useState<File | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [previewData, setPreviewData] = useState<
    {
      diaSemana: string;
      horaInicio: string;
      horaFin: string;
      subjectCode?: string;
      salaNombre?: string;
      groupCode?: string;
      periodoAcademico?: string;
      status: string;
      message: string;
    }[]
  >([]);

  // Formulario manual
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [salas, setSalas] = useState<{ id: string; name: string }[]>([]);
  const [manualSubjectCode, setManualSubjectCode] = useState('');
  const [manualSalaId, setManualSalaId] = useState('');
  const [manualPeriodo, setManualPeriodo] = useState('2025-1');
  const [manualSaving, setManualSaving] = useState(false);
  const [mode, setMode] = useState<'csv' | 'manual'>('csv');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/planeador/horarios').then(r => r.json()),
      fetch('/api/admin/asignaturas').then(r => r.json()),
      fetch('/api/admin/rooms').then(r => r.json()),
    ])
      .then(([h, s, rooms]) => {
        setHorarios(h.horarios ?? []);
        setSubjects(s.subjects ?? []);
        const roomList = Array.isArray(rooms) ? rooms : (rooms?.rooms ?? []);
        setSalas(roomList.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  function openDialog(h?: Horario) {
    if (h) {
      setEditing(h);
      setDia(h.diaSemana);
      setHoraInicio(h.horaInicio);
      setHoraFin(h.horaFin);
    } else {
      setEditing(null);
      setDia('LUNES');
      setHoraInicio('07:00');
      setHoraFin('09:00');
    }
    setDialog(true);
  }

  async function save() {
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/planeador/horarios/${editing.id}`
        : '/api/admin/planeador/horarios';
      await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diaSemana: dia, horaInicio, horaFin }),
      });
      sileo.success({ description: editing ? 'Horario actualizado' : 'Horario creado' });
      setDialog(false);
      load();
    } catch {
      sileo.error({ description: 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteHorario(id: string) {
    await fetch(`/api/admin/planeador/horarios/${id}`, { method: 'DELETE' });
    sileo.success({ description: 'Horario eliminado' });
    load();
  }

  const handleCancel = () => {
    setFile(null);
    setPreviewData([]);
  };

  const filtered = horarios.filter(h => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      DIA_LABELS[h.diaSemana]?.toLowerCase().includes(q) ||
      h.horaInicio.includes(q) ||
      h.horaFin.includes(q) ||
      h.subject?.name.toLowerCase().includes(q) ||
      h.subject?.code.toLowerCase().includes(q) ||
      h.sala?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">Horarios</h1>
        <p className="text-muted-foreground text-sm">
          Define los bloques de hora en que se dan las clases. Después, en Grupos y Asignación
          podrás elegir qué bloque usa cada grupo.
        </p>
      </div>

      <Tabs defaultValue="carga">
        <TabsList className="mb-4">
          <TabsTrigger value="carga">Crear horarios</TabsTrigger>
          <TabsTrigger value="listado">Ver listado</TabsTrigger>
        </TabsList>

        {/* ─── Tab: Crear horarios ─── */}
        <TabsContent value="carga" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              variant={mode === 'csv' ? 'default' : 'outline'}
              onClick={() => {
                setMode('csv');
                handleCancel();
              }}
              className="text-xs"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Carga Masiva (CSV)
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => setMode('manual')}
              className="text-xs"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Manual
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sidebar: Instructions + Forms */}
            <div className="lg:col-span-1 space-y-6">
              {mode === 'csv' ? (
                <>
                  {/* Instrucciones CSV */}
                  <Card className="p-0 overflow-hidden border shadow-xs">
                    <CardHeader className="border-b px-5 py-4 bg-muted/10">
                      <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                        Instrucciones
                      </CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">
                        Sigue estos pasos para la carga masiva.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold">1. Descarga la plantilla</p>
                        <a href="/formatos/plantilla_horarios.csv" download>
                          <Button variant="outline" className="w-full justify-start h-9 text-xs">
                            <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                            Descargar Plantilla CSV
                          </Button>
                        </a>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold">2. Completa los datos</p>
                        <div className="rounded-md bg-muted/30 p-3 space-y-2 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3 w-3" />
                            <span className="font-semibold text-foreground">
                              Columnas requeridas:
                            </span>
                          </div>
                          <ul className="space-y-1 ml-5 list-disc text-[10px]">
                            <li>Día (LUNES, MARTES, …)</li>
                            <li>Hora inicio y hora fin (ej: 07:00, 09:00)</li>
                            <li>Código asignatura y periodo académico</li>
                            <li>Sala (nombre; opcional)</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subir archivo CSV */}
                  <Card className="p-0 overflow-hidden border shadow-xs">
                    <CardHeader className="border-b px-5 py-4 bg-muted/10">
                      <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                        Subir Archivo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <SubjectFileUpload file={file} onFileSelect={setFile} />
                      <div className="flex gap-2 mt-4 flex-col">
                        <Button
                          onClick={async () => {
                            if (!file) {
                              sileo.error({ description: 'Selecciona un archivo primero' });
                              return;
                            }
                            setPreviewLoading(true);
                            try {
                              const fd = new FormData();
                              fd.append('file', file);
                              fd.append('preview', 'true');
                              const res = await fetch('/api/admin/planeador/horarios', {
                                method: 'POST',
                                body: fd,
                              });
                              const data = await res.json();
                              if (!res.ok || !data.success) {
                                sileo.error({
                                  description: data.error || 'Error al generar vista previa',
                                });
                                setPreviewData([]);
                              } else {
                                setPreviewData(data.previewData || []);
                              }
                            } catch {
                              sileo.error({ description: 'Error al generar vista previa' });
                            } finally {
                              setPreviewLoading(false);
                            }
                          }}
                          disabled={!file || previewLoading || previewData.length > 0}
                          className="w-full text-xs h-9"
                        >
                          {previewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Generar Vista Previa
                        </Button>
                        {(file || previewData.length > 0) && (
                          <Button
                            onClick={handleCancel}
                            variant="ghost"
                            className="w-full text-xs h-9 text-muted-foreground hover:text-destructive"
                          >
                            Limpiar todo
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* Formulario manual */
                <Card className="p-0 overflow-hidden border shadow-xs">
                  <CardHeader className="border-b px-5 py-4 bg-muted/10">
                    <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                      Nuevo Horario
                    </CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">
                      Ingresa los detalles manualmente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Día de la semana</Label>
                      <Select value={dia} onValueChange={setDia}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAS.map(d => (
                            <SelectItem key={d} value={d} className="text-xs">
                              {DIA_LABELS[d]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Hora inicio</Label>
                        <Select value={horaInicio} onValueChange={setHoraInicio}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map(h => (
                              <SelectItem key={h} value={h} className="text-xs">
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Hora fin</Label>
                        <Select value={horaFin} onValueChange={setHoraFin}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map(h => (
                              <SelectItem key={h} value={h} className="text-xs">
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Asignatura (obligatoria)</Label>
                      <Select value={manualSubjectCode} onValueChange={setManualSubjectCode}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Seleccionar asignatura" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(s => (
                            <SelectItem key={s.id} value={s.code} className="text-xs">
                              {s.name} ({s.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Sala (opcional)</Label>
                      <Select
                        value={manualSalaId || 'none'}
                        onValueChange={v => setManualSalaId(v === 'none' ? '' : v)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Sin sala" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">
                            Sin sala
                          </SelectItem>
                          {salas.map(s => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Periodo académico (obligatorio)
                      </Label>
                      <Input
                        value={manualPeriodo}
                        onChange={e => setManualPeriodo(e.target.value)}
                        placeholder="Ej: 2025-1"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        className="w-full h-9 text-xs"
                        disabled={manualSaving}
                        onClick={async () => {
                          if (!dia || !horaInicio || !horaFin) {
                            sileo.error({
                              description: 'Día, hora inicio y hora fin son obligatorios',
                            });
                            return;
                          }
                          if (!manualSubjectCode || !manualPeriodo) {
                            sileo.error({
                              description:
                                'El código de asignatura y el periodo académico son obligatorios',
                            });
                            return;
                          }
                          setManualSaving(true);
                          try {
                            const res = await fetch('/api/admin/planeador/horarios', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                diaSemana: dia,
                                horaInicio,
                                horaFin,
                                subjectCode: manualSubjectCode,
                                periodoAcademico: manualPeriodo,
                                salaId:
                                  manualSalaId && manualSalaId !== 'none'
                                    ? manualSalaId
                                    : undefined,
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok) {
                              sileo.error({ description: data.error || 'Error al crear horario' });
                            } else {
                              sileo.success({ description: 'Horario creado correctamente' });
                              setManualSubjectCode('');
                              setManualSalaId('');
                              setManualPeriodo('2025-1');
                              load();
                            }
                          } catch {
                            sileo.error({ description: 'Error al crear horario' });
                          } finally {
                            setManualSaving(false);
                          }
                        }}
                      >
                        {manualSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Horario
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Preview table */}
            <div className="lg:col-span-2">
              <Card className="p-0 overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                    Horarios para Cargar ({previewData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {previewLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground animate-pulse">
                        Procesando archivo...
                      </p>
                    </div>
                  ) : previewData.length > 0 ? (
                    <div className="relative overflow-x-auto overflow-y-auto max-h-[600px]">
                      <Table>
                        <TableHeader className="rounded-none sticky top-0 z-10">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Día
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Inicio
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Fin
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Asignatura
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground hidden sm:table-cell">
                              Sala
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground hidden sm:table-cell">
                              Periodo
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                              Estado
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="rounded-none">
                          {previewData.map((row, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/50 group">
                              <TableCell className="text-xs px-4 py-3 font-medium">
                                {DIA_LABELS[row.diaSemana] ?? row.diaSemana}
                              </TableCell>
                              <TableCell className="text-xs px-4 py-3 text-muted-foreground">
                                {row.horaInicio}
                              </TableCell>
                              <TableCell className="text-xs px-4 py-3 text-muted-foreground">
                                {row.horaFin}
                              </TableCell>
                              <TableCell className="text-xs px-4 py-3 max-w-[120px] truncate">
                                {row.subjectCode ?? '—'}
                              </TableCell>
                              <TableCell className="text-xs px-4 py-3 hidden sm:table-cell">
                                {row.salaNombre ?? '—'}
                              </TableCell>
                              <TableCell className="text-xs px-4 py-3 hidden sm:table-cell">
                                {row.periodoAcademico ?? '—'}
                              </TableCell>
                              <TableCell className="text-xs px-4 py-3 text-right">
                                <Badge
                                  variant={row.status === 'success' ? 'default' : 'destructive'}
                                  className={
                                    row.status === 'success'
                                      ? 'text-[9px] px-1.5 py-0 h-4 font-normal bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-0'
                                      : 'text-[9px] px-1.5 py-0 h-4 font-normal bg-red-500/10 text-red-600 border-0 shadow-none hover:bg-red-500/20'
                                  }
                                >
                                  {row.status === 'success' ? 'Válido' : 'Error'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-72 py-12 text-center p-6">
                      <div className="bg-muted/30 p-4 rounded-full mb-4">
                        <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        Sin información para cargar
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        {mode === 'csv'
                          ? 'Sube un archivo CSV o utiliza la carga manual para ver los datos aquí.'
                          : 'Crea un horario usando el formulario lateral y este se guardará directamente.'}
                      </p>
                    </div>
                  )}

                  {previewData.length > 0 && (
                    <div className="border-t px-5 py-4 bg-muted/5 flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">
                          Resumen de carga
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {previewData.filter(r => r.status === 'success').length} horario
                          {previewData.filter(r => r.status === 'success').length !== 1
                            ? 's'
                            : ''}{' '}
                          válido
                          {previewData.filter(r => r.status === 'success').length !== 1 ? 's' : ''}
                          {previewData.filter(r => r.status !== 'success').length > 0 &&
                            ` · ${previewData.filter(r => r.status !== 'success').length} con errores`}
                        </span>
                      </div>
                      <Button
                        onClick={async () => {
                          if (!file) {
                            sileo.error({ description: 'Selecciona un archivo primero' });
                            return;
                          }
                          setConfirmLoading(true);
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch('/api/admin/planeador/horarios', {
                              method: 'POST',
                              body: fd,
                            });
                            const data = await res.json();
                            if (!res.ok || !data.success) {
                              sileo.error({
                                description: data.error || 'Error al procesar horarios',
                              });
                            } else {
                              sileo.success({
                                description: `Se crearon ${data.summary?.createdHorarios ?? 0} horarios. Errores: ${data.summary?.errors ?? 0}`,
                              });
                              setFile(null);
                              setPreviewData([]);
                              load();
                            }
                          } catch {
                            sileo.error({ description: 'Error al procesar horarios' });
                          } finally {
                            setConfirmLoading(false);
                          }
                        }}
                        disabled={confirmLoading || !file}
                        className="h-9 px-6 text-xs min-w-[150px]"
                      >
                        {confirmLoading ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          'Confirmar y Crear'
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Tab: Listado ─── */}
        <TabsContent value="listado" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Horarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{loading ? '—' : horarios.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Días Cubiertos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {loading ? '—' : new Set(horarios.map(h => h.diaSemana)).size}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En Uso por Grupos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {loading ? '—' : horarios.filter(h => h._count.grupos > 0).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por día, asignatura, sala..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Día</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Asignatura</TableHead>
                    <TableHead className="hidden sm:table-cell">Sala</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Grupos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10">
                        <div className="flex flex-col items-center justify-center text-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {search
                              ? 'No hay resultados para esa búsqueda.'
                              : 'No hay horarios cargados aún.'}
                          </p>
                          {!search && (
                            <p className="text-xs text-muted-foreground">
                              Ve a la pestaña <strong>&quot;Crear horarios&quot;</strong> para
                              agregar el primer bloque.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(h => {
                      const [startH, startM] = h.horaInicio.split(':').map(Number);
                      const [endH, endM] = h.horaFin.split(':').map(Number);
                      const durMin = endH * 60 + endM - (startH * 60 + startM);
                      const dur =
                        durMin > 0
                          ? `${Math.floor(durMin / 60)}h ${durMin % 60 > 0 ? `${durMin % 60}m` : ''}`.trim()
                          : '—';

                      return (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium">{DIA_LABELS[h.diaSemana]}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">
                                {h.horaInicio} – {h.horaFin}
                              </span>
                              <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                                {dur}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {h.subject ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{h.subject.name}</span>
                                <code className="text-[10px] text-muted-foreground">
                                  {h.subject.code}
                                </code>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {h.sala?.name ?? '—'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right">
                            {h._count.grupos > 0 ? (
                              <Badge variant="secondary" className="text-[10px] font-normal">
                                {h._count.grupos} grupo{h._count.grupos !== 1 && 's'}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                onClick={() => openDialog(h)}
                                aria-label="Editar horario"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                onClick={() => deleteHorario(h.id)}
                                disabled={h._count.grupos > 0}
                                aria-label="Eliminar horario"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for quick edit */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Horario' : 'Nuevo Horario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Día de la semana</Label>
              <Select value={dia} onValueChange={setDia}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS.map(d => (
                    <SelectItem key={d} value={d} className="text-xs">
                      {DIA_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hora de inicio</Label>
                <Select value={horaInicio} onValueChange={setHoraInicio}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map(h => (
                      <SelectItem key={h} value={h} className="text-xs">
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hora de fin</Label>
                <Select value={horaFin} onValueChange={setHoraFin}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map(h => (
                      <SelectItem key={h} value={h} className="text-xs">
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDialog(false)} className="text-xs h-9">
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving} className="text-xs h-9">
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Horario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

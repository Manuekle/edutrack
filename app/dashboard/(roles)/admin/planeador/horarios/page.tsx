'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { TimePicker } from '@/components/ui/time-picker';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Edit2,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface PreviewRow {
  periodoAcademico: string;
  codigoAsignatura: string;
  nombreAsignatura: string;
  grupo: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  salon: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

interface GrupoResumen {
  id: string;
  codigo: string;
  periodoAcademico: string;
  subject: { name: string; code: string };
  docentes: { id: string; name: string | null }[];
  horario: { id?: string; diaSemana: string; horaInicio: string; horaFin: string } | null;
  sala: { id: string; name: string } | null;
  shift: 'DAY' | 'NIGHT' | null;
  _count: { estudiantes: number };
}

const DIA_LABELS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
  // Prisma enum variants
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export default function ProgramacionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  // Resumen de grupos existentes
  const [grupos, setGrupos] = useState<GrupoResumen[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [search, setSearch] = useState('');

  // CRUD State
  const [groupToDelete, setGroupToDelete] = useState<GrupoResumen | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<GrupoResumen | null>(null);

  // Preview CRUD State
  const [rowToEdit, setRowToEdit] = useState<{ idx: number; row: PreviewRow } | null>(null);

  const loadGrupos = () => {
    setLoadingGrupos(true);
    fetch('/api/admin/planeador/grupos')
      .then(r => r.json())
      .then(d => setGrupos(d.grupos ?? []))
      .catch(() => { })
      .finally(() => setLoadingGrupos(false));
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/planeador/grupos/${groupToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        sileo.success({ description: 'Grupo eliminado correctamente' });
        setGroupToDelete(null);
        loadGrupos();
      } else {
        const d = await res.json();
        sileo.error({ description: d.error || 'Error al eliminar' });
      }
    } catch {
      sileo.error({ description: 'Error al eliminar' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const [editLoading, setEditLoading] = useState(false);
  // State for group editing
  const [editShift, setEditShift] = useState<'DAY' | 'NIGHT'>('DAY');
  const [editDia, setEditDia] = useState<string>('MONDAY');
  const [editHoraInicio, setEditHoraInicio] = useState<string>('07:00');
  const [editHoraFin, setEditHoraFin] = useState<string>('09:00');

  // Initialize edit state when group selected
  useEffect(() => {
    if (groupToEdit) {
      setEditShift(groupToEdit.shift || 'DAY');
      setEditDia(groupToEdit.horario?.diaSemana || 'MONDAY');
      setEditHoraInicio(groupToEdit.horario?.horaInicio || '07:00');
      setEditHoraFin(groupToEdit.horario?.horaFin || '09:00');
    }
  }, [groupToEdit]);

  const handleEditGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!groupToEdit) return;
    setEditLoading(true);
    const formData = new FormData(e.currentTarget);
    const codigo = formData.get('codigo') as string;
    const periodoAcademico = formData.get('periodoAcademico') as string;

    try {
      const res = await fetch(`/api/admin/planeador/grupos/${groupToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          periodoAcademico,
          shift: editShift,
          diaSemana: editDia,
          horaInicio: editHoraInicio,
          horaFin: editHoraFin,
        }),
      });
      if (res.ok) {
        sileo.success({ description: 'Grupo actualizado correctamente' });
        setGroupToEdit(null);
        loadGrupos();
      } else {
        const d = await res.json();
        sileo.error({ description: d.error || 'Error al actualizar' });
      }
    } catch {
      sileo.error({ description: 'Error al actualizar' });
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(loadGrupos, []);

  const handleCancel = () => {
    setFile(null);
    setPreviewData([]);
  };

  const handleRemovePreviewRow = (idx: number) => {
    setPreviewData(prev => prev.filter((_, i) => i !== idx));
    sileo.success({ description: 'Fila eliminada de la vista previa' });
  };

  const handleSavePreviewEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rowToEdit) return;
    const formData = new FormData(e.currentTarget);
    const updatedRow: PreviewRow = {
      ...rowToEdit.row,
      periodoAcademico: formData.get('periodoAcademico') as string,
      codigoAsignatura: formData.get('codigoAsignatura') as string,
      grupo: formData.get('grupo') as string,
      salon: formData.get('salon') as string,
      // Status remains or we could re-validate, but for simplicity we keep it
      status: 'success',
      message: 'Modificado manualmente',
    };

    setPreviewData(prev => prev.map((r, i) => (i === rowToEdit.idx ? updatedRow : r)));
    setRowToEdit(null);
    sileo.success({ description: 'Fila actualizada en la vista previa' });
  };

  const handlePreview = async () => {
    if (!file) {
      sileo.error({ description: 'Selecciona un archivo primero' });
      return;
    }
    setPreviewLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('preview', 'true');
      const res = await fetch('/api/admin/planeador/programacion', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        sileo.error({ description: data.error || 'Error al generar vista previa' });
        setPreviewData([]);
      } else {
        setPreviewData(data.previewData || []);
      }
    } catch {
      sileo.error({ description: 'Error al generar vista previa' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) {
      sileo.error({ description: 'Selecciona un archivo primero' });
      return;
    }
    setConfirmLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/planeador/programacion', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        sileo.error({ description: data.error || 'Error al procesar' });
      } else {
        const s = data.summary;
        sileo.success({
          description: `✅ Horarios: ${s.createdHorarios} · Grupos creados: ${s.createdGrupos} · Actualizados: ${s.updatedGrupos} · Errores: ${s.errors}`,
        });
        setFile(null);
        setPreviewData([]);
        loadGrupos();
      }
    } catch {
      sileo.error({ description: 'Error al procesar' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const validCount = previewData.filter(r => r.status === 'success' || r.status === 'warning').length;
  const errorCount = previewData.filter(r => r.status === 'error').length;

  const filteredGrupos = grupos.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.codigo.toLowerCase().includes(q) ||
      g.subject.name.toLowerCase().includes(q) ||
      g.subject.code.toLowerCase().includes(q) ||
      g.periodoAcademico.toLowerCase().includes(q) ||
      g.docentes?.some(d => d.name?.toLowerCase().includes(q)) ||
      g.sala?.name.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">

          <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
            Programación
          </h1>
          <p className="text-muted-foreground sm:text-sm text-xs max-w-2xl">
            Sube el archivo CSV con la programación del semestre. El sistema creará automáticamente los
            horarios, grupos, y asignará los docentes y salones en un solo paso.
          </p>
        </div>

        <Tabs defaultValue="carga">
          <TabsList className="mb-4">
            <TabsTrigger value="carga">
              <Upload className="mr-2 h-3.5 w-3.5" />
              Importar CSV
            </TabsTrigger>
            <TabsTrigger value="resumen">
              <Users className="mr-2 h-3.5 w-3.5" />
              Resumen ({grupos.length})
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab: Importar CSV ─── */}
          <TabsContent value="carga" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left sidebar: Instructions + Upload */}
              <div className="lg:col-span-1 space-y-6">
                {/* Instrucciones */}
                <Card className="p-0 overflow-hidden border shadow-xs">
                  <CardHeader className="border-b px-5 py-4 bg-muted/10">
                    <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                      Instrucciones
                    </CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">
                      Un solo archivo para configurar todo el semestre.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">1. Descarga la plantilla</p>
                      <a href="/formatos/plantilla_programacion.csv" download>
                        <Button variant="outline" className="w-full justify-start  text-xs">
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
                          <span className="font-semibold text-foreground">Columnas del CSV:</span>
                        </div>
                        <ul className="space-y-1 ml-5 list-disc text-[10px]">
                          <li>
                            <strong>periodo_academico</strong> — Ej: 20261
                          </li>
                          <li>
                            <strong>codigo_asignatura</strong> — Código oficial
                          </li>
                          <li>
                            <strong>grupo</strong> — Ej: Grupo: 1
                          </li>
                          <li>
                            <strong>dia</strong> — LUNES, MARTES, etc.
                          </li>
                          <li>
                            <strong>hora_inicio</strong> — Ej: 07:00, 14:40
                          </li>
                          <li>
                            <strong>hora_fin</strong> — Ej: 11:10, 18:00
                          </li>
                          <li>
                            <strong>salon</strong> — Opcional (Ej: SJ 213 o S/A)
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">3. ¿Qué se crea automáticamente?</p>
                      <div className="rounded-md bg-primary/5 p-3 space-y-1.5 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          <span>Horarios (bloques de tiempo)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          <span>Grupos (asignatura + periodo)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          <span>Asignación de salón al grupo</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subir archivo */}
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
                        onClick={handlePreview}
                        disabled={!file || previewLoading}
                        className="w-full text-xs "
                      >
                        {previewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generar Vista Previa
                      </Button>
                      {(file || previewData.length > 0) && (
                        <Button
                          onClick={handleCancel}
                          variant="ghost"
                          className="w-full text-xs  text-muted-foreground hover:text-destructive"
                        >
                          Limpiar todo
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Preview table */}
              <div className="lg:col-span-2">
                <Card className="p-0 overflow-hidden border shadow-xs">
                  <CardHeader className="border-b px-5 py-4 bg-muted/10">
                    <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                      Vista Previa ({previewData.length} filas)
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
                                Periodo
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                Asignatura
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                Grupo
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                Día
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                Horario
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground hidden sm:table-cell">
                                Salón
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                                Estado
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                                Acciones
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="rounded-none">
                            {previewData.map((row, idx) => (
                              <TableRow key={idx} className="hover:bg-muted/50 group">
                                <TableCell className="text-xs px-4 py-3 font-medium">
                                  {row.periodoAcademico}
                                </TableCell>
                                <TableCell className="text-xs px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium truncate max-w-[140px]">
                                      {row.nombreAsignatura || row.codigoAsignatura}
                                    </span>
                                    {row.nombreAsignatura && (
                                      <span className="text-[10px] text-muted-foreground uppercase">
                                        {row.codigoAsignatura}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs px-4 py-3 text-muted-foreground">
                                  {row.grupo}
                                </TableCell>
                                <TableCell className="text-xs px-4 py-3">
                                  {DIA_LABELS[row.dia] ?? row.dia}
                                </TableCell>
                                <TableCell className="text-xs px-4 py-3 text-muted-foreground whitespace-nowrap">
                                  {row.horaInicio} – {row.horaFin}
                                </TableCell>
                                <TableCell className="text-xs px-4 py-3 hidden sm:table-cell">
                                  {row.salon || '—'}
                                </TableCell>
                                <TableCell className="text-xs px-4 py-3 text-right">
                                  {row.status === 'success' ? (
                                    <Badge className="text-[9px] px-1.5 py-0 h-4 font-normal bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-0">
                                      Válido
                                    </Badge>
                                  ) : row.status === 'warning' ? (
                                    <Badge
                                      className="text-[9px] px-1.5 py-0 h-4 font-normal bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-none border-0"
                                      title={row.message}
                                    >
                                      Advertencia
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="destructive"
                                      className="text-[9px] px-1.5 py-0 h-4 font-normal bg-red-500/10 text-red-600 border-0 shadow-none hover:bg-red-500/20"
                                      title={row.message}
                                    >
                                      Error
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right px-4 py-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32 text-xs">
                                      <DropdownMenuItem className="cursor-pointer gap-2 py-2.5 rounded-lg focus:bg-primary/10" onClick={() => setRowToEdit({ idx, row })}>
                                        <Edit2 className="h-4 w-4 text-primary" />
                                        <span className="text-xs text-primary">Editar</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="cursor-pointer gap-2 py-2.5 rounded-lg text-destructive focus:bg-destructive/10"
                                        onClick={() => handleRemovePreviewRow(idx)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        <span className="text-xs text-destructive">Eliminar</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-72 py-12 text-center p-6">
                        <div className="bg-muted/30 p-4 rounded-full mb-4">
                          <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <h4 className="sm:text-[17px] text-xs font-semibold tracking-card text-foreground mb-1">
                          Sin información para cargar
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          Sube un archivo CSV con la programación del semestre para ver los datos
                          aquí antes de confirmar.
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
                            {validCount} fila{validCount !== 1 ? 's' : ''} válida
                            {validCount !== 1 ? 's' : ''}
                            {errorCount > 0 && ` · ${errorCount} con errores`}
                          </span>
                        </div>
                        <Button
                          onClick={handleConfirm}
                          disabled={confirmLoading || !file || validCount === 0}
                          className=" px-6 text-xs min-w-[150px]"
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

          {/* ─── Tab: Resumen de lo cargado ─── */}
          <TabsContent value="resumen" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-none border-0 bg-muted/30 dark:bg-white/[0.02] rounded-2xl">
                <CardHeader className="pb-1 pt-5 px-5">
                  <CardTitle className="text-[13px] font-medium text-muted-foreground flex items-center gap-2 tracking-card uppercase">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                      <Users className="h-4 w-4" />
                    </div>
                    Total Grupos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-4xl font-semibold tracking-card text-foreground mt-2">
                    {loadingGrupos ? '—' : grupos.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-none border-0 bg-green-500/5 dark:bg-green-500/10 rounded-2xl">
                <CardHeader className="pb-1 pt-5 px-5">
                  <CardTitle className="text-[13px] font-medium text-green-700/70 dark:text-green-400/70 flex items-center gap-2 tracking-card uppercase">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    Con docente
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-4xl font-semibold tracking-card text-green-700 dark:text-green-400 mt-2">
                    {loadingGrupos ? '—' : grupos.filter(g => (g.docentes?.length ?? 0) > 0).length}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-none border-0 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl">
                <CardHeader className="pb-1 pt-5 px-5">
                  <CardTitle className="text-[13px] font-medium text-amber-700/70 dark:text-amber-400/70 flex items-center gap-2 tracking-card uppercase">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    Con horario
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-4xl font-semibold tracking-card text-amber-700 dark:text-amber-400 mt-2">
                    {loadingGrupos ? '—' : grupos.filter(g => g.horario).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden border shadow-xs">
              <CardHeader className="bg-muted/10 border-b px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por asignatura, docente, grupo, periodo..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9  text-xs bg-background shadow-none"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/5 border-none">
                      <TableHead className="text-xs font-semibold px-5">Periodo</TableHead>
                      <TableHead className="text-xs font-semibold px-5">Asignatura</TableHead>
                      <TableHead className="text-xs font-semibold px-5">Grupo</TableHead>
                      <TableHead className="text-xs font-semibold px-5 hidden md:table-cell">
                        Docente
                      </TableHead>
                      <TableHead className="text-xs font-semibold px-5">Horario</TableHead>
                      <TableHead className="text-xs font-semibold px-5 hidden sm:table-cell">
                        Salón
                      </TableHead>
                      <TableHead className="text-xs font-semibold px-5 text-right">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingGrupos ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredGrupos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10">
                          <div className="flex flex-col items-center justify-center text-center gap-2">
                            <p className="sm:text-sm text-xs font-medium text-foreground">
                              {search
                                ? 'No hay resultados para esa búsqueda.'
                                : 'No hay grupos cargados aún.'}
                            </p>
                            {!search && (
                              <p className="text-xs text-muted-foreground">
                                Ve a la pestaña <strong>&quot;Importar CSV&quot;</strong> para
                                subir la programación del semestre.
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGrupos.map(g => (
                        <TableRow key={g.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="px-5">
                            <Badge variant="outline" className="font-mono text-[10px] shadow-none">
                              {g.periodoAcademico}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground">
                                {g.subject.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {g.subject.code}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-5">
                            <Badge variant="outline" className="font-mono text-xs shadow-none">
                              Grupo: {g.codigo}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 hidden md:table-cell">
                            <span className="text-xs text-muted-foreground truncate max-w-[150px] block">
                              {g.docentes.length > 0
                                ? g.docentes.map(d => d.name).join(', ')
                                : '—'}
                            </span>
                          </TableCell>
                          <TableCell className="px-5">
                            {g.horario ? (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {DIA_LABELS[g.horario.diaSemana] ?? g.horario.diaSemana}{' '}
                                {g.horario.horaInicio}–{g.horario.horaFin}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600">Sin horario</span>
                            )}
                          </TableCell>
                          <TableCell className="px-5 hidden sm:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {g.sala?.name ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 py-2.5 rounded-lg"
                                  onClick={() => setGroupToEdit(g)}
                                >
                                  <Edit2 className="h-4 w-4 text-primary" />
                                  <span className="text-xs text-primary">Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 py-2.5 rounded-lg text-destructive focus:bg-destructive/10"
                                  onClick={() => setGroupToDelete(g)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="text-xs text-destructive">Eliminar grupo</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog
          open={!!groupToDelete}
          onOpenChange={open => !open && setGroupToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el grupo <strong>{groupToDelete?.codigo}</strong> de la
                asignatura <strong>{groupToDelete?.subject.name}</strong> para el periodo{' '}
                <strong>{groupToDelete?.periodoAcademico}</strong>. Esta acción no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={e => {
                  e.preventDefault();
                  handleDeleteGroup();
                }}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar definitivamente'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!groupToEdit} onOpenChange={open => !open && setGroupToEdit(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Grupo</DialogTitle>
              <DialogDescription>
                Modifica los detalles del grupo y pulsa guardar cambios.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditGroup} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código del Grupo</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  defaultValue={groupToEdit?.codigo}
                  placeholder="Ej: 1, A, G1..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodoAcademico">Periodo Académico</Label>
                <Input
                  id="periodoAcademico"
                  name="periodoAcademico"
                  defaultValue={groupToEdit?.periodoAcademico}
                  placeholder="Ej: 2025-1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shift">Jornada</Label>
                  <Select value={editShift} onValueChange={(v: any) => setEditShift(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar jornada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAY">Diurna</SelectItem>
                      <SelectItem value="NIGHT">Nocturna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diaSemana">Día</Label>
                  <Select value={editDia} onValueChange={setEditDia}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar día" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DIA_LABELS)
                        .filter(([key]) => ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].includes(key))
                        .map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Hora Inicio</Label>
                  <TimePicker value={editHoraInicio} onChange={setEditHoraInicio} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFin">Hora Fin</Label>
                  <TimePicker value={editHoraFin} onChange={setEditHoraFin} />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGroupToEdit(null)}
                  disabled={editLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!rowToEdit} onOpenChange={open => !open && setRowToEdit(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Fila de Vista Previa</DialogTitle>
              <DialogDescription>Ajusta los datos antes de confirmar la carga.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSavePreviewEdit} className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preview-periodo">Periodo</Label>
                  <Input
                    id="preview-periodo"
                    name="periodoAcademico"
                    defaultValue={rowToEdit?.row.periodoAcademico}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preview-codigo">Cód. Asignatura</Label>
                  <Input
                    id="preview-codigo"
                    name="codigoAsignatura"
                    defaultValue={rowToEdit?.row.codigoAsignatura}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-grupo">Grupo</Label>
                <Input
                  id="preview-grupo"
                  name="grupo"
                  defaultValue={rowToEdit?.row.grupo}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-salon">Salón</Label>
                <Input
                  id="preview-salon"
                  name="salon"
                  defaultValue={rowToEdit?.row.salon}
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRowToEdit(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar en Vista Previa</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

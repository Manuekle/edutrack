'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Search,
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
  horario: { diaSemana: string; horaInicio: string; horaFin: string } | null;
  sala: { id: string; name: string } | null;
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

  const loadGrupos = () => {
    setLoadingGrupos(true);
    fetch('/api/admin/planeador/grupos')
      .then(r => r.json())
      .then(d => setGrupos(d.grupos ?? []))
      .catch(() => {})
      .finally(() => setLoadingGrupos(false));
  };

  useEffect(loadGrupos, []);

  const handleCancel = () => {
    setFile(null);
    setPreviewData([]);
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
      g.docentes.some(d => d.name?.toLowerCase().includes(q)) ||
      g.sala?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          Programación
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
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
                          Columnas del CSV:
                        </span>
                      </div>
                      <ul className="space-y-1 ml-5 list-disc text-[10px]">
                        <li><strong>periodo_academico</strong> — Ej: 20261</li>
                        <li><strong>codigo_asignatura</strong> — Código oficial</li>
                        <li><strong>grupo</strong> — Ej: Grupo: 1</li>
                        <li><strong>jornada</strong> — DIURNO, NOCTURNO</li>
                        <li><strong>dia</strong> — LUNES, MARTES, etc.</li>
                        <li><strong>hora_inicio</strong> — Ej: 07:00, 14:40</li>
                        <li><strong>hora_fin</strong> — Ej: 11:10, 18:00</li>
                        <li><strong>salon</strong> — Nombre de la sala o S/A</li>
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
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        Sin información para cargar
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Sube un archivo CSV con la programación del semestre para ver los datos aquí
                        antes de confirmar.
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
                  {loadingGrupos ? '—' : grupos.filter(g => g.docentes.length > 0).length}
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
                    className="pl-9 h-9 text-xs bg-background shadow-none"
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingGrupos ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredGrupos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10">
                        <div className="flex flex-col items-center justify-center text-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {search
                              ? 'No hay resultados para esa búsqueda.'
                              : 'No hay grupos cargados aún.'}
                          </p>
                          {!search && (
                            <p className="text-xs text-muted-foreground">
                              Ve a la pestaña <strong>&quot;Importar CSV&quot;</strong> para subir
                              la programación del semestre.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGrupos.map(g => (
                      <TableRow key={g.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-5">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] shadow-none"
                          >
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
                            {g.codigo}
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

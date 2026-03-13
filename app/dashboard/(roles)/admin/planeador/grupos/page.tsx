'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getAvailableAcademicPeriods } from '@/lib/academic-period';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Grupo {
  id: string;
  codigo: string;
  periodoAcademico: string;
  subject: { id: string; name: string; code: string };
  docentes: { id: string; name: string | null }[];
  horario: { id: string; diaSemana: string; horaInicio: string; horaFin: string } | null;
  sala: { id: string; name: string } | null;
  _count: { estudiantes: number };
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Horario {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  subjectId?: string | null;
  subject?: { id: string; name: string; code: string } | null;
  salaId?: string | null;
  sala?: { id: string; name: string } | null;
}

interface Docente {
  id: string;
  name: string | null;
}

interface Sala {
  id: string;
  name: string;
}

interface PreviewRow {
  id: string;
  codigo: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  periodoAcademico: string;
  horarioId: string | null;
  salaId: string | null;
  docenteIds: string[];
  status: 'success' | 'error';
  message: string;
}

const DIA_LABELS: Record<string, string> = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};

function parseGruposCsv(
  text: string,
  subjects: { id: string; code: string; name: string }[]
): Omit<PreviewRow, 'id' | 'status' | 'message'>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = /[,;\t]/;
  const headerCols = lines[0].split(sep).map(c => c.trim().toLowerCase());
  const codigoIdx = headerCols.findIndex(c => c === 'codigo' || c === 'grupo');
  const codeAsigIdx = headerCols.findIndex(
    c => c === 'codigoasignatura' || c === 'asignatura' || c === 'codigo_asignatura'
  );
  const periodoIdx = headerCols.findIndex(
    c => c === 'periodoacademico' || c === 'periodo' || c === 'periodo_academico'
  );
  const i0 = codigoIdx >= 0 ? codigoIdx : 0;
  const i1 = codeAsigIdx >= 0 ? codeAsigIdx : 1;
  const i2 = periodoIdx >= 0 ? periodoIdx : 2;
  const rows: Omit<PreviewRow, 'id' | 'status' | 'message'>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim());
    const codigo = cols[i0] ?? '';
    const codeAsig = (cols[i1] ?? '').toUpperCase();
    const periodo = cols[i2] ?? '';
    const subject = subjects.find(s => s.code.toUpperCase() === codeAsig);
    rows.push({
      codigo,
      subjectId: subject?.id ?? '',
      subjectCode: subject?.code ?? codeAsig,
      subjectName: subject?.name ?? '',
      periodoAcademico: periodo,
      horarioId: null,
      salaId: null,
      docenteIds: [],
    });
  }
  return rows;
}

export default function PlaneadorGruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listado');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [search, setSearch] = useState('');

  const [mode, setMode] = useState<'csv' | 'manual'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [manualCodigo, setManualCodigo] = useState('');
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualPeriodo, setManualPeriodo] = useState('2025-1');
  const [manualHorarioId, setManualHorarioId] = useState('');
  const [manualSalaId, setManualSalaId] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/planeador/grupos').then(r => r.json()),
      fetch('/api/admin/asignaturas').then(r => r.json()),
      fetch('/api/admin/planeador/horarios').then(r => r.json()),
      fetch('/api/admin/usuarios?role=DOCENTE').then(r => r.json()),
      fetch('/api/admin/rooms').then(r => r.json()),
    ])
      .then(([g, a, h, u, s]) => {
        setGrupos(g.grupos ?? []);
        setSubjects(a.subjects ?? []);
        setHorarios(h.horarios ?? []);
        setDocentes(u.users ?? []);
        setSalas(Array.isArray(s) ? s : (s.rooms ?? []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handlePreviewCsv = () => {
    if (!file) {
      sileo.error({ description: 'Selecciona un archivo primero' });
      return;
    }
    setPreviewLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const parsed = parseGruposCsv(text, subjects);
      const withMeta: PreviewRow[] = parsed.map((row, idx) => {
        const valid = row.codigo && row.subjectId && row.periodoAcademico;
        return {
          ...row,
          id: `csv-${idx}-${Date.now()}`,
          status: valid ? 'success' : 'error',
          message: valid ? 'Válido' : 'Faltan código, asignatura o periodo',
        };
      });
      setPreviewData(withMeta);
      setPreviewLoading(false);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const addManual = () => {
    if (!manualCodigo.trim() || !manualSubjectId || !manualPeriodo.trim()) {
      sileo.error({ description: 'Código, asignatura y periodo son obligatorios' });
      return;
    }
    const subject = subjects.find(s => s.id === manualSubjectId);
    const horarioId = manualHorarioId && manualHorarioId !== 'none' ? manualHorarioId : null;
    const salaId = manualSalaId && manualSalaId !== 'none' ? manualSalaId : null;
    const newRow: PreviewRow = {
      id: `manual-${Date.now()}`,
      codigo: manualCodigo.trim(),
      subjectId: manualSubjectId,
      subjectCode: subject?.code ?? '',
      subjectName: subject?.name ?? '',
      periodoAcademico: manualPeriodo.trim(),
      horarioId,
      salaId,
      docenteIds: [],
      status: 'success',
      message: 'Válido',
    };
    setPreviewData(prev => [...prev, newRow]);
    setManualCodigo('');
    setManualSubjectId('');
    setManualPeriodo('2025-1');
    setManualHorarioId('');
    setManualSalaId('');
    sileo.success({ description: 'Agregado a la lista de carga' });
  };

  const removePreviewRow = (id: string) => {
    setPreviewData(prev => prev.filter(r => r.id !== id));
  };

  const handleConfirm = async () => {
    const valid = previewData.filter(
      r => r.status === 'success' && r.subjectId && r.codigo && r.periodoAcademico
    );
    if (valid.length === 0) {
      sileo.error({ description: 'No hay filas válidas para crear' });
      return;
    }
    setConfirmLoading(true);
    let created = 0;
    let errors = 0;
    for (const row of valid) {
      try {
        const res = await fetch('/api/admin/planeador/grupos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: row.codigo,
            subjectId: row.subjectId,
            periodoAcademico: row.periodoAcademico,
            horarioId: row.horarioId || null,
            salaId: row.salaId || null,
            docenteIds: row.docenteIds ?? [],
          }),
        });
        if (res.ok) {
          created++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }
    setConfirmLoading(false);
    setPreviewData([]);
    setFile(null);
    if (created > 0) {
      sileo.success({ description: `Se crearon ${created} grupos. Errores: ${errors}` });
      load();
    } else {
      sileo.error({ description: `No se pudo crear ningún grupo. Errores: ${errors}` });
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewData([]);
  };

  const filtered = grupos.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.codigo.toLowerCase().includes(q) ||
      g.subject.name.toLowerCase().includes(q) ||
      g.subject.code.toLowerCase().includes(q) ||
      g.periodoAcademico.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">Grupos</h1>
        <p className="text-muted-foreground text-sm">
          Cada grupo pertenece a una asignatura en un periodo. Aquí creas la lista; en Asignación
          les pones sala y docentes.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="carga">Crear grupos</TabsTrigger>
          <TabsTrigger value="listado">Ver listado</TabsTrigger>
        </TabsList>

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
              Carga Manual
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              {mode === 'csv' ? (
                <>
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
                        <Button
                          variant="outline"
                          className="w-full justify-start h-9 text-xs"
                          onClick={() => {
                            const header = 'codigo,codigo_asignatura,periodo_academico';
                            const blob = new Blob([header], { type: 'text/csv' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = 'plantilla_grupos.csv';
                            a.click();
                            URL.revokeObjectURL(a.href);
                          }}
                        >
                          <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                          Descargar Plantilla CSV
                        </Button>
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
                            <li>codigo (ej. A, B, G-01)</li>
                            <li>codigo_asignatura (código oficial)</li>
                            <li>periodo_academico (ej. 2025-1)</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
                          onClick={handlePreviewCsv}
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
                <Card className="p-0 overflow-hidden border shadow-xs">
                  <CardHeader className="border-b px-5 py-4 bg-muted/10">
                    <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                      Carga manual
                    </CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">
                      Ingresa los detalles manualmente a la lista.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Código del grupo</Label>
                      <Input
                        value={manualCodigo}
                        onChange={e => setManualCodigo(e.target.value)}
                        placeholder="Ej: A, B"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Asignatura (obligatoria)</Label>
                      <Select value={manualSubjectId} onValueChange={setManualSubjectId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Seleccionar asignatura" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(s => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">
                              {s.name} ({s.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Periodo académico (obligatorio)
                      </Label>
                      <Select value={manualPeriodo} onValueChange={setManualPeriodo}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Seleccionar periodo" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableAcademicPeriods().map(p => (
                            <SelectItem key={p} value={p} className="text-xs">
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Horario (opcional)</Label>
                      <Select
                        value={manualHorarioId || 'none'}
                        onValueChange={v => {
                          const id = v === 'none' ? '' : v;
                          setManualHorarioId(id);
                          if (id) {
                            const h = horarios.find(x => x.id === id);
                            if (h?.sala?.id) setManualSalaId(h.sala.id);
                          } else {
                            setManualSalaId('');
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Sin horario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">
                            Sin horario
                          </SelectItem>
                          {(manualSubjectId
                            ? horarios.filter(
                                h => (h.subjectId ?? h.subject?.id) === manualSubjectId
                              )
                            : horarios
                          ).map(h => (
                            <SelectItem key={h.id} value={h.id} className="text-xs">
                              {DIA_LABELS[h.diaSemana] ?? h.diaSemana} {h.horaInicio}-{h.horaFin}
                              {h.sala?.name ? ` — ${h.sala.name}` : ''}
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
                    <div className="flex gap-2 pt-4 border-t">
                      <Button className="w-full h-9 text-xs" onClick={addManual}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar a la lista
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2">
              <Card className="p-0 overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                    Grupos para Cargar ({previewData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {previewLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground animate-pulse">
                        Generando vista previa...
                      </p>
                    </div>
                  ) : previewData.length > 0 ? (
                    <div className="relative overflow-x-auto overflow-y-auto max-h-[600px]">
                      <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Código
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Asignatura
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Periodo
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                              Estado
                            </TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.map(row => (
                            <TableRow key={row.id} className="hover:bg-muted/50 group">
                              <TableCell className="text-xs px-4 py-3 font-medium">
                                {row.codigo}
                              </TableCell>
                              <TableCell className="text-xs px-4 py-3 text-muted-foreground">
                                {row.subjectName || row.subjectCode}
                              </TableCell>
                              <TableCell className="text-xs px-4 py-3 text-muted-foreground">
                                {row.periodoAcademico}
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
                                  {row.message}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removePreviewRow(row.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-72 py-12 text-center p-6">
                      <div className="bg-muted/30 p-4 rounded-full mb-4">
                        <Users className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        Sin información para cargar
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Sube un archivo CSV o utiliza la carga manual para ver los datos aquí antes
                        de confirmar.
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
                          {previewData.filter(r => r.status === 'success').length} grupo
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
                        onClick={handleConfirm}
                        disabled={confirmLoading}
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

        <TabsContent value="listado" className="space-y-4">
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
                  Con horario
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-4xl font-semibold tracking-card text-green-700 dark:text-green-400 mt-2">
                  {loading ? '—' : grupos.filter(g => g.horario).length}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none border-0 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl">
              <CardHeader className="pb-1 pt-5 px-5">
                <CardTitle className="text-[13px] font-medium text-amber-700/70 dark:text-amber-400/70 flex items-center gap-2 tracking-card uppercase">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  Sin horario
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-4xl font-semibold tracking-card text-amber-700 dark:text-amber-400 mt-2">
                  {loading ? '—' : grupos.filter(g => !g.horario).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden border shadow-xs">
            <CardHeader className="bg-muted/10 border-b px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código de grupo, asignatura, periodo..."
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
                    <TableHead className="w-[100px] text-xs font-semibold px-5">Código</TableHead>
                    <TableHead className="text-xs font-semibold px-5">Asignatura</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs font-semibold px-5">
                      Periodo
                    </TableHead>
                    <TableHead className="text-xs font-semibold px-5">Horario</TableHead>
                    <TableHead className="hidden md:table-cell text-right text-xs font-semibold px-5">
                      Estudiantes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10">
                        <div className="flex flex-col items-center justify-center text-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {search
                              ? 'No hay resultados para esa búsqueda.'
                              : 'No hay grupos cargados aún.'}
                          </p>
                          {!search && (
                            <p className="text-xs text-muted-foreground">
                              Ve a la pestaña <strong>&quot;Crear grupos&quot;</strong> para agregar
                              los primeros.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(g => (
                      <TableRow key={g.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-5">
                          <Badge variant="outline" className="font-mono text-xs shadow-none">
                            {g.codigo}
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
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground px-5">
                          {g.periodoAcademico}
                        </TableCell>
                        <TableCell className="px-5">
                          {g.horario ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-medium">
                                {DIA_LABELS[g.horario.diaSemana] ?? g.horario.diaSemana}
                              </span>
                              <span className="text-muted-foreground">
                                {g.horario.horaInicio}–{g.horario.horaFin}
                              </span>
                              {g.sala && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 h-4 ml-1 border-0 shadow-none bg-muted/50 text-muted-foreground"
                                >
                                  {g.sala.name}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-none border-0 text-[10px] uppercase tracking-card font-semibold"
                            >
                              Sin horario
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-xs px-5 text-muted-foreground">
                          {g._count?.estudiantes ?? 0}
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

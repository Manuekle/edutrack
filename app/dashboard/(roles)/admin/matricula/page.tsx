'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MultiStudentCombobox } from '@/components/ui/multi-student-combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  CheckCircle,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Info,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Student {
  id: string;
  name: string | null;
  document: string | null;
  correoInstitucional: string | null;
  codigoEstudiantil: string | null;
}

interface GroupWithStudents {
  grupoNombre: string;
  periodoAcademico: string;
  students: Student[];
}

interface GroupInfo {
  id: string;
  code: string;
  name: string;
  group: string | null;
  jornada: string | null;
  periodoAcademico: string | null;
}

interface PreviewItem {
  id: string;
  documentoEstudiante: string;
  nombreEstudiante: string;
  grupoNombre: string;
  periodoAcademico: string;
  status: 'success' | 'error' | 'existing' | 'manual';
  message: string;
}

export default function MatriculaPage() {
  const [mode, setMode] = useState<'csv' | 'manual'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [periodo, setPeriodo] = useState<string>('');
  const [grupoDestino, setGrupoDestino] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [groupInfoList, setGroupInfoList] = useState<GroupInfo[]>([]);
  const [enrolledGroups, setEnrolledGroups] = useState<GroupWithStudents[]>([]);

  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<{
    assigned: number;
    errors: number;
    existing: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(true);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);

  const loadEnrolledGroups = async () => {
    try {
      const res = await fetch('/api/admin/matricula');
      const data = await res.json();
      setEnrolledGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading enrolled groups:', error);
    } finally {
      setIsLoadingEnrolled(false);
    }
  };

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await fetch('/api/admin/users?role=ESTUDIANTE&limit=1000');
        const data = await res.json();
        setStudentsData(data.data || []);
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    const loadGroups = async () => {
      try {
        const res = await fetch('/api/admin/grupos');
        const data = await res.json();
        setGroupInfoList(data.groups || []);
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setIsLoadingGroups(false);
      }
    };

    loadStudents();
    loadGroups();
    loadEnrolledGroups();
  }, []);

  const uniqueGroupNames = Array.from(
    new Set(groupInfoList.map(g => g.group).filter((g): g is string => Boolean(g)))
  ).sort();

  const uniquePeriods = Array.from(
    new Set([
      ...groupInfoList.map(g => g.periodoAcademico).filter((p): p is string => Boolean(p)),
      ...enrolledGroups.map(g => g.periodoAcademico),
    ])
  ).sort().reverse();

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      handleCancel();
    } else {
      setFinalResults(null);
      setIsPreview(false);
      setPreviewData([]);
    }
  };

  const handlePreview = async () => {
    if (mode === 'csv' && !file) {
      sileo.error({ title: 'Archivo requerido', description: 'Por favor, selecciona un archivo CSV' });
      return;
    }
    setIsLoading(true);
    try {
      let res: Response;
      if (mode === 'csv' && file) {
        const formData = new FormData();
        formData.append('file', file);
        res = await fetch('/api/admin/matricula?preview=true', { method: 'POST', body: formData });
      } else {
        if (!periodo || !grupoDestino || selectedStudents.length === 0) {
          sileo.error({ title: 'Campos requeridos', description: 'Faltan campos por completar' });
          setIsLoading(false);
          return;
        }
        const assignments = selectedStudents.map(id => ({
          documentoEstudiante: studentsData.find(s => s.id === id)?.document || '',
          grupoNombre: grupoDestino,
          periodoAcademico: periodo,
        }));
        res = await fetch('/api/admin/matricula?preview=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignments }),
        });
      }
      const result = await res.json();
      if (res.ok && result.success) {
        const dataWithIds = (result.preview || []).map((item: PreviewItem, index: number) => ({
          ...item,
          id: `preview-${index}-${Date.now()}`,
        }));
        setPreviewData(dataWithIds);
        setIsPreview(true);
        sileo.success({ title: 'Vista previa', description: 'Vista previa generada con éxito' });
      } else {
        sileo.error({ title: 'Error', description: result.error || 'Error al generar la vista previa' });
      }
    } catch {
      sileo.error({ title: 'Error', description: 'Ocurrió un error inesperado al procesar la solicitud' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setPreviewData(previewData.filter(item => item.id !== id));
  };

  const handleConfirm = async () => {
    const validData = previewData.filter(item => item.status === 'success');
    if (validData.length === 0) {
      sileo.error({ title: 'Sin datos válidos', description: 'No hay asignaciones válidas para procesar.' });
      return;
    }
    setIsConfirming(true);
    try {
      const assignments = validData.map(item => ({
        documentoEstudiante: item.documentoEstudiante,
        grupoNombre: item.grupoNombre,
        periodoAcademico: item.periodoAcademico,
      }));
      const res = await fetch('/api/admin/matricula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setFinalResults({
          assigned: result.summary.assigned,
          errors: result.summary.errors,
          existing: result.summary.existing,
        });
        sileo.success({ title: 'Éxito', description: 'Estudiantes asignados correctamente' });
        loadEnrolledGroups();
      } else {
        sileo.error({ title: 'Error', description: result.error || 'No se pudo completar la asignación' });
      }
    } catch {
      sileo.error({ title: 'Error', description: 'Ocurrió un error inesperado.' });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRemoveStudentFromGroup = async (
    studentId: string,
    grupoNombre: string,
    periodoAcademico: string
  ) => {
    const key = `${studentId}-${grupoNombre}-${periodoAcademico}`;
    setRemovingStudent(key);
    try {
      const res = await fetch('/api/admin/matricula', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, grupoNombre, periodoAcademico }),
      });
      if (res.ok) {
        sileo.success({ title: 'Estudiante removido', description: `${grupoNombre} actualizado.` });
        loadEnrolledGroups();
      } else {
        sileo.error({ title: 'Error', description: 'No se pudo remover al estudiante' });
      }
    } catch {
      sileo.error({ title: 'Error', description: 'Error inesperado al remover estudiante' });
    } finally {
      setRemovingStudent(null);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setFinalResults(null);
    setSelectedStudents([]);
  };

  const successCount = previewData.filter(item => item.status === 'success' || item.status === 'manual').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;
  const existingCount = previewData.filter(item => item.status === 'existing').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div id="tour-matricula-title">
        <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
          Gestión de Matrículas
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Agrupa y asocia estudiantes a sus cohortes y grupos operativos base.
        </CardDescription>
      </div>

      <Tabs defaultValue="nueva" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="nueva">Nueva Matrícula</TabsTrigger>
          <TabsTrigger value="grupos">
            Grupos Matriculados
            {enrolledGroups.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 text-[10px] px-1.5">
                {enrolledGroups.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Nueva matrícula ── */}
        <TabsContent value="nueva" className="mt-4 flex flex-col gap-6">
          {/* Info banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-primary text-sm">Organización y Matrícula</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Aquí agrupas y matriculas estudiantes por <strong>semestres y salones base</strong> (Ej. Grupo 10A). Esta asociación sirve para organizar la academia.
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex justify-end gap-2" id="tour-mode-toggle">
            <Button
              variant={mode === 'csv' ? 'default' : 'outline'}
              onClick={() => { setMode('csv'); handleCancel(); }}
              className="text-xs"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Carga Masiva (CSV)
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => { setMode('manual'); handleCancel(); }}
              className="text-xs"
            >
              <Plus className="mr-2 h-4 w-4" />
              Asignación Manual
            </Button>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: form */}
            <div className="lg:col-span-1 space-y-6">
              {mode === 'csv' ? (
                <>
                  <Card className="p-0 overflow-hidden border shadow-xs" id="tour-instructions">
                    <div className="border-b px-5 py-4 bg-muted/10">
                      <p className="text-xs font-semibold tracking-heading">Instrucciones</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Sigue estos pasos para la carga masiva.</p>
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold">1. Descarga la plantilla</p>
                        <a href="/formatos/plantilla_asignacion_grupos.csv" download className="block">
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
                            <span className="font-semibold text-foreground">Columnas requeridas:</span>
                          </div>
                          <ul className="space-y-1 ml-5 list-disc text-[10px]">
                            <li><code>documento_estudiante</code></li>
                            <li><code>grupo_destino</code></li>
                            <li><code>periodo_academico</code></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-0 overflow-hidden border shadow-xs" id="tour-upload-panel">
                    <div className="border-b px-5 py-4 bg-muted/10">
                      <p className="text-xs font-semibold tracking-heading">Subir Archivo</p>
                    </div>
                    <div className="p-5">
                      <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={handlePreview}
                          disabled={!file || isLoading || isPreview}
                          className="flex-1 text-xs h-9"
                        >
                          {isLoading && !isPreview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Generar Vista Previa
                        </Button>
                        {(file || isPreview) && (
                          <Button onClick={handleCancel} variant="ghost" className="h-9 w-9 p-0 text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-0 overflow-hidden border shadow-xs" id="tour-upload-panel">
                  <div className="border-b px-5 py-4 bg-muted/10">
                    <p className="text-xs font-semibold">Configuración</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Periodo Académico *</Label>
                      <Select value={periodo} onValueChange={setPeriodo}>
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue placeholder="Selecciona un periodo" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniquePeriods.length > 0 ? (
                            uniquePeriods.map(p => (
                              <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="2025-1" className="text-xs">2025-1</SelectItem>
                              <SelectItem value="2025-2" className="text-xs">2025-2</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Grupo *</Label>
                      <Select
                        value={grupoDestino || undefined}
                        onValueChange={setGrupoDestino}
                        disabled={isLoadingGroups}
                      >
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue placeholder={isLoadingGroups ? 'Cargando...' : 'Selecciona un grupo'} />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueGroupNames.length > 0 ? (
                            uniqueGroupNames.map(grp => (
                              <SelectItem key={grp} value={grp} className="text-xs">{grp}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="-" disabled className="text-xs">No hay grupos creados</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Estudiantes ({selectedStudents.length})</Label>
                      <MultiStudentCombobox
                        selectedStudents={studentsData.filter(s => selectedStudents.includes(s.id))}
                        onStudentsChange={(students) => setSelectedStudents(students.map(s => s.id))}
                        disabled={isLoadingStudents}
                        placeholder="Buscar y seleccionar estudiantes"
                      />
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={handlePreview}
                        disabled={isLoading || !periodo || !grupoDestino || selectedStudents.length === 0}
                        className="w-full text-xs h-9"
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        Agregar a la lista
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right column: preview/results */}
            <div className="lg:col-span-2 space-y-4" id="tour-preview">
              <Card className="p-0 overflow-hidden border shadow-xs">
                <div className="border-b px-5 py-4 bg-muted/10">
                  <p className="text-xs font-semibold tracking-heading">
                    Vista Previa de Asignación {previewData.length > 0 && `(${previewData.length})`}
                  </p>
                </div>
                <div className="p-0">
                  {isLoading && !isPreview ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground animate-pulse">Procesando...</p>
                    </div>
                  ) : finalResults ? (
                    <div className="flex flex-col items-center justify-center min-h-72 text-center p-6">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="sm:text-xl text-lg font-semibold mb-2">¡Asignación Completada!</h3>
                      <div className="space-y-1 mb-6 text-sm text-muted-foreground">
                        <p>{finalResults.assigned} estudiantes asignados exitosamente.</p>
                        {finalResults.existing > 0 && (
                          <p className="text-warning">{finalResults.existing} ya estaban asignados.</p>
                        )}
                        {finalResults.errors > 0 && (
                          <p className="text-destructive">{finalResults.errors} errores omitidos.</p>
                        )}
                      </div>
                      <Button onClick={() => { handleCancel(); setMode('csv'); }} variant="outline">
                        Realizar nueva asignación
                      </Button>
                    </div>
                  ) : previewData.length > 0 ? (
                    <>
                      <div className="bg-card border rounded-md overflow-hidden shadow-sm">
                        <div className="relative overflow-x-auto overflow-y-auto max-h-[32rem]">
                          <Table>
                            <TableHeader className="bg-muted/30 sticky top-0 z-10">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Estudiante</TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Grupo</TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Periodo</TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Estado</TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewData.map((item) => (
                                <TableRow key={item.id} className="hover:bg-muted/50 group">
                                  <TableCell className="text-xs px-4 py-3">
                                    <p className="text-xs font-semibold">{item.nombreEstudiante || 'Desconocido'}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.documentoEstudiante}</p>
                                  </TableCell>
                                  <TableCell className="px-4 py-3 text-xs font-medium">{item.grupoNombre}</TableCell>
                                  <TableCell className="px-4 py-3 text-xs">{item.periodoAcademico}</TableCell>
                                  <TableCell className="text-xs px-4 py-3">
                                    <Badge
                                      variant={
                                        item.status === 'success' || item.status === 'manual' ? 'default' :
                                          item.status === 'existing' ? 'outline' : 'destructive'
                                      }
                                      className={`text-[10px] ${item.status === 'success' || item.status === 'manual' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                                    >
                                      {item.status === 'success' || item.status === 'manual' ? 'Listo' :
                                        item.status === 'existing' ? 'Ya asignado' : 'Error'}
                                    </Badge>
                                    {item.message && <p className="text-[9px] text-muted-foreground mt-1 max-w-[150px] truncate">{item.message}</p>}
                                  </TableCell>
                                  <TableCell className="px-4 py-3 text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      aria-label="Eliminar elemento"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      <div className="border-t px-5 py-4 bg-muted/5 flex items-center justify-between">
                        <div className="flex gap-4">
                          <span className="text-xs font-semibold text-success">{successCount} listos</span>
                          {existingCount > 0 && (
                            <span className="text-xs font-semibold text-warning">{existingCount} existentes</span>
                          )}
                          {errorCount > 0 && (
                            <span className="text-xs font-semibold text-destructive">{errorCount} errores</span>
                          )}
                        </div>
                        <Button
                          onClick={handleConfirm}
                          disabled={isConfirming || successCount === 0}
                          className="h-9 text-xs"
                        >
                          {isConfirming && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                          Confirmar Asignación
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-72 text-center p-6 text-muted-foreground">
                      <UserPlus className="h-10 w-10 mb-4 opacity-20" />
                      <p className="text-sm font-medium text-foreground">Lista vacía</p>
                      <p className="text-xs">Usa el panel izquierdo para cargar estudiantes.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Grupos con estudiantes matriculados ── */}
        <TabsContent value="grupos" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Estudiantes por Grupo</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Estudiantes actualmente asignados a cada grupo y periodo.
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {enrolledGroups.reduce((acc, g) => acc + g.students.length, 0)} estudiantes total
              </Badge>
            </div>

            {isLoadingEnrolled ? (
              <div className="flex items-center justify-center h-32 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Cargando grupos...</span>
              </div>
            ) : enrolledGroups.length === 0 ? (
              <Card className="border shadow-xs">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted/30 p-4 rounded-full mb-3">
                    <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Sin matrículas registradas</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Asigna estudiantes a grupos usando la pestaña &ldquo;Nueva Matrícula&rdquo;.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {enrolledGroups.map(group => (
                  <Card
                    key={`${group.grupoNombre}-${group.periodoAcademico}`}
                    className="overflow-hidden border shadow-xs"
                  >
                    <div className="border-b px-4 py-3 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{group.grupoNombre}</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">Grupo {group.grupoNombre}</p>
                            <p className="text-[10px] text-muted-foreground">{group.periodoAcademico}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] h-5">
                          <Users className="h-2.5 w-2.5 mr-1" />
                          {group.students.length}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-0">
                      <div className="max-h-56 overflow-y-auto divide-y divide-border/60">
                        {group.students.map(student => {
                          const key = `${student.id}-${group.grupoNombre}-${group.periodoAcademico}`;
                          const isRemoving = removingStudent === key;
                          return (
                            <div
                              key={student.id}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {student.name || 'Sin nombre'}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {student.codigoEstudiantil || student.document || '—'}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 ml-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                disabled={isRemoving}
                                aria-label="Quitar de la lista"
                                onClick={() =>
                                  handleRemoveStudentFromGroup(
                                    student.id,
                                    group.grupoNombre,
                                    group.periodoAcademico
                                  )
                                }
                              >
                                {isRemoving ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t px-4 py-2">
                        <Button
                          variant="ghost"
                          className="w-full h-7 text-[10px] text-muted-foreground hover:text-primary gap-1"
                          onClick={() => {
                            setGrupoDestino(group.grupoNombre);
                            setPeriodo(group.periodoAcademico);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          Agregar estudiante
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

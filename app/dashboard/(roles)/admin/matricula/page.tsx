'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { BookOpen, CheckCircle, Download, FileSpreadsheet, Info, Loader2, Plus, Trash2, UserPlus, X } from 'lucide-react';

import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Student {
  id: string;
  name: string | null;
  document: string | null;
  correoInstitucional: string | null;
  codigoEstudiantil: string | null;
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
  const [existingGroups, setExistingGroups] = useState<string[]>([]);

  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<{ assigned: number; errors: number; existing: number } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

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
        setExistingGroups(data.groups || []);
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    };

    loadStudents();
    loadGroups();
  }, []);

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
      let res;

      if (mode === 'csv' && file) {
        const formData = new FormData();
        formData.append('file', file);
        res = await fetch('/api/admin/matricula?preview=true', {
          method: 'POST',
          body: formData,
        });
      } else {
        if (!periodo || !grupoDestino || selectedStudents.length === 0) {
          sileo.error({ title: 'Campos requeridos', description: 'Faltan campos por completar' });
          setIsLoading(false);
          return;
        }

        const assignments = selectedStudents.map(id => {
          const student = studentsData.find(s => s.id === id);
          return {
            documentoEstudiante: student?.document || '',
            grupoNombre: grupoDestino,
            periodoAcademico: periodo
          };
        });

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
      } else {
        sileo.error({ title: 'Error', description: result.error || 'No se pudo completar la asignación' });
      }
    } catch {
      sileo.error({ title: 'Error', description: 'Ocurrió un error inesperado.' });
    } finally {
      setIsConfirming(false);
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
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full space-y-4">
          <div id="tour-matricula-title">
            <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
              Gestión de Matrículas
            </CardTitle>
            <CardDescription className="text-xs">
              Agrupa y asocia estudiantes a sus cohortes y grupos operativos base.
            </CardDescription>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-primary text-sm">Organización y Matrícula</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Aquí agrupas y matriculas estudiantes por <strong>semestres y salones base</strong> (Ej. Grupo 10A). Esta asociación sirve para organizar la academia, simplificando los procesos de reporte y vinculación.
              </p>
            </div>
          </div>
        </CardHeader>
        <div className="flex gap-2 self-start" id="tour-mode-toggle">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {mode === 'csv' ? (
            <>
              <Card className="overflow-hidden border shadow-xs" id="tour-instructions">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    Instrucciones
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Sigue estos pasos para la carga masiva.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
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
                        <li>Asegúrate de no dejar filas vacías.</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border shadow-xs" id="tour-upload-panel">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    Subir Archivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
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
                      <Button onClick={handleCancel} variant="ghost" className="h-9 w-9 p-0 text-red-500">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="overflow-hidden border shadow-xs" id="tour-upload-panel">
              <CardHeader className="border-b px-5 py-4 bg-muted/10">
                <CardTitle className="sm:text-sm text-xs font-semibold">Configuración</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Periodo Académico *</Label>
                  <Input
                    placeholder="Ej. 2025-1"
                    value={periodo}
                    onChange={e => setPeriodo(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Grupo *</Label>
                  <Select value={grupoDestino || undefined} onValueChange={setGrupoDestino}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Selecciona un grupo existente" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingGroups.length > 0 ? (
                        existingGroups.map((grp) => (
                          <SelectItem key={grp} value={grp}>
                            {grp}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="-" disabled>
                          No hay grupos creados
                        </SelectItem>
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
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4" id="tour-preview">
          <Card className="overflow-hidden border shadow-xs">
            <CardHeader className="border-b px-5 py-4 bg-muted/10">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                Vista Previa de Asignación {previewData.length > 0 && `(${previewData.length})`}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading && !isPreview ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground animate-pulse">Procesando...</p>
                </div>
              ) : finalResults ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="sm:text-xl text-lg font-semibold mb-2">¡Asignación Completada!</h3>
                  <div className="space-y-1 mb-6 text-sm text-muted-foreground">
                    <p>{finalResults.assigned} estudiantes asignados exitosamente.</p>
                    {finalResults.existing > 0 && <p className="text-amber-600">{finalResults.existing} ya estaban asignados.</p>}
                    {finalResults.errors > 0 && <p className="text-red-500">{finalResults.errors} errores omitidos.</p>}
                  </div>
                  <Button onClick={() => { handleCancel(); setMode('csv'); }} variant="outline">
                    Realizar nueva asignación
                  </Button>
                </div>
              ) : previewData.length > 0 ? (
                <>
                  <div className="relative overflow-x-auto overflow-y-auto max-h-[500px]">
                    <Table>
                      <TableHeader className="bg-muted/5 sticky top-0 z-10">
                        <TableRow className="border-b">
                          <TableHead className="text-[10px] font-semibold">Estudiante</TableHead>
                          <TableHead className="text-[10px] font-semibold">Grupo</TableHead>
                          <TableHead className="text-[10px] font-semibold">Periodo</TableHead>
                          <TableHead className="text-[10px] font-semibold">Estado</TableHead>
                          <TableHead className="text-[10px] font-semibold text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((item) => (
                          <TableRow key={item.id} className="border-b hover:bg-muted/10">
                            <TableCell className="px-4 py-3">
                              <p className="text-xs font-semibold">{item.nombreEstudiante || 'Desconocido'}</p>
                              <p className="text-[10px] text-muted-foreground">{item.documentoEstudiante}</p>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-xs font-medium">{item.grupoNombre}</TableCell>
                            <TableCell className="px-4 py-3 text-xs">{item.periodoAcademico}</TableCell>
                            <TableCell className="px-4 py-3">
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
                  <div className="border-t px-5 py-4 bg-muted/5 flex items-center justify-between">
                    <div className="flex gap-4">
                      <span className="text-xs font-semibold text-emerald-600">{successCount} listos</span>
                      {existingCount > 0 && <span className="text-xs font-semibold text-amber-600">{existingCount} existentes</span>}
                      {errorCount > 0 && <span className="text-xs font-semibold text-red-600">{errorCount} errores</span>}
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
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 text-muted-foreground">
                  <UserPlus className="h-10 w-10 mb-4 opacity-20" />
                  <p className="text-sm font-medium text-foreground">Lista vacía</p>
                  <p className="text-xs">Usa el panel izquierdo para cargar estudiantes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

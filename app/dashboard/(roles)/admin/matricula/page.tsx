'use client';

import { MultiStudentCombobox } from '@/components/ui/multi-student-combobox';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Subject {
  id: string;
  code: string;
  name: string;
  group?: string;
  studentIds?: string[];
}

interface PreviewItem {
  id: string;
  documentoEstudiante: string;
  nombreEstudiante: string;
  codigoAsignatura: string;
  grupo: string;
  jornada: string;
  estudianteId?: string;
  status: 'success' | 'error' | 'full' | 'existing' | 'manual';
  message: string;
}

interface Student {
  id: string;
  name: string | null;
  document: string | null;
  correoInstitucional: string | null;
  codigoEstudiantil: string | null;
}

export default function MatriculaPage() {
  const [mode, setMode] = useState<'csv' | 'manual'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<{
    enrolled: number;
    existing: number;
    full: number;
    errors: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    subjectId: '',
    selectedStudents: [] as Student[],
  });

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await fetch('/api/admin/subjects');
        const data = await res.json();
        setSubjects(data.data || []);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, []);

  const selectedSubjectData = subjects.find(s => s.id === manualForm.subjectId);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setIsPreview(false);
      setPreviewData([]);
      setFinalResults(null);
    } else {
      setFinalResults(null);
      setIsPreview(false);
      setPreviewData([]);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      sileo.error({
        title: 'Archivo requerido',
        description: 'Por favor, selecciona un archivo .csv para continuar.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/matricula?preview=true', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const dataWithIds = (result.preview || []).map((item: PreviewItem, index: number) => ({
          ...item,
          id: `csv-${index}-${Date.now()}`,
        }));
        setPreviewData(dataWithIds);
        setIsPreview(true);
        sileo.success({
          title: 'Vista previa',
          description: 'Vista previa generada con éxito',
        });
      } else {
        sileo.error({
          title: 'Error',
          description: result.error || 'Error al generar la vista previa',
        });
        handleCancel();
      }
    } catch {
      sileo.error({
        title: 'Error inesperado',
        description: 'Ocurrió un error inesperado al procesar el archivo.',
      });
      handleCancel();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManual = () => {
    if (manualForm.selectedStudents.length === 0 || !manualForm.subjectId) {
      sileo.error({
        title: 'Campos requeridos',
        description: 'Selecciona al menos un estudiante y un grupo.',
      });
      return;
    }

    const sub = subjects.find(s => s.id === manualForm.subjectId);

    const newItems: PreviewItem[] = manualForm.selectedStudents.map(st => ({
      id: `manual-${st.id}-${Date.now()}`,
      documentoEstudiante: st.document || '',
      nombreEstudiante: st.name || '',
      codigoAsignatura: selectedSubjectData?.code || '',
      grupo: selectedSubjectData?.group || 'A',
      jornada: 'DIURNO',
      status: 'manual',
      message: 'Nuevo',
    }));

    setPreviewData([...previewData, ...newItems]);
    setIsPreview(true);
    setManualForm({ ...manualForm, selectedStudents: [] });
    sileo.success({
      title: 'Estudiantes agregados',
      description: `${newItems.length} estudiantes agregados a la lista.`,
    });
  };

  const handleEditItem = (id: string) => {
    // Editing is disabled for multi-select pattern as it's easier to remove and re-add
    sileo.info({
      title: 'Información',
      description: 'Para modificar, elimina al estudiante y agrégalo nuevamente.',
    });
  };

  const handleUpdateItem = () => {
    // Placeholder as editing is disabled
  };

  const handleDeleteItem = (id: string) => {
    setPreviewData(previewData.filter(item => item.id !== id));
  };

  const handleConfirmUpload = async () => {
    const successCount = previewData.filter(item => item.status !== 'error').length;
    if (successCount === 0) {
      sileo.error({
        title: 'Sin datos válidos',
        description: 'No hay matrículas válidas para procesar.',
      });
      return;
    }

    setIsConfirming(true);
    try {
      const formData = new FormData();
      const csvContent = previewData
        .map(item => `${item.documentoEstudiante},${item.codigoAsignatura},${item.grupo}`)
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', blob, 'temp.csv');

      const response = await fetch('/api/admin/matricula', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar la matrícula.');
      }

      sileo.success({
        title: 'Matrícula exitosa',
        description: 'Matrículas procesadas correctamente.',
      });
      setFinalResults({
        enrolled: result.summary?.enrolled || 0,
        existing: result.summary?.existing || 0,
        full: result.summary?.full || 0,
        errors: result.summary?.errors || 0,
      });
      setPreviewData([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      sileo.error({
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setFinalResults(null);
    setEditingId(null);
    setManualForm({ subjectId: manualForm.subjectId, selectedStudents: [] });
  };

  const handleNewUpload = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setFinalResults(null);
    setEditingId(null);
  };

  const successCount = previewData.filter(item => item.status !== 'error').length;
  const existingCount = previewData.filter(item => item.status === 'existing').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full">
          <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
            Matrícula
          </CardTitle>
          <CardDescription className="text-xs">
            Matricula estudiantes en las asignaturas de forma manual o mediante carga masiva.
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2">
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
            onClick={() => {
              setMode('manual');
            }}
            className="text-xs"
          >
            <Plus className="mr-2 h-4 w-4" />
            Matricular Manual
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {mode === 'csv' ? (
            <>
              <Card className="overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-tight text-foreground">
                    1. Instrucciones del Formato
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Sigue estos pasos para la carga masiva.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Plantilla base</p>
                      <a href="/formatos/plantilla_matricula.csv" download className="block">
                        <Button variant="outline" className="w-full justify-start h-9 text-xs">
                          <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                          Descargar Formato CSV
                        </Button>
                      </a>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Requisitos del archivo</p>
                      <div className="rounded-md bg-muted/30 p-3">
                        <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                          <li><span className="font-medium text-foreground">Estudiante</span>: Documento o ID</li>
                          <li><span className="font-medium text-foreground">Asignatura</span>: Código oficial</li>
                          <li><span className="font-medium text-foreground">Grupo</span>: Sección asignada</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-tight text-foreground">
                    2. Subir Archivo
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
                      {isLoading && !isPreview ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Generar Vista Previa
                    </Button>
                    {(file || isPreview) && (
                      <Button
                        onClick={handleCancel}
                        variant="ghost"
                        className="h-9 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="overflow-hidden border shadow-xs">
              <CardHeader className="border-b px-5 py-4 bg-muted/10">
                <CardTitle className="sm:text-sm text-xs font-semibold tracking-tight text-foreground">
                  {editingId ? 'Editar Matrícula' : 'Matrícula Manual'}
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Selecciona el grupo y los estudiantes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Grupo (Asignatura) *</Label>
                  {isLoadingSubjects ? (
                    <div className="h-9 w-full animate-pulse bg-muted rounded-md" />
                  ) : (
                    <Select
                      value={manualForm.subjectId}
                      onValueChange={val => setManualForm({ ...manualForm, subjectId: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Selecciona un grupo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id} className="text-xs">
                            Gr. {sub.group || 'A'} - {sub.code} ({sub.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Estudiantes *</Label>
                  <MultiStudentCombobox
                    selectedStudents={manualForm.selectedStudents}
                    onStudentsChange={students => setManualForm({ ...manualForm, selectedStudents: students })}
                  />
                </div>

                <div className="pt-2">
                  <Button onClick={handleAddManual} className="w-full h-9 text-xs">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar a la Lista
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden border shadow-xs">
            <CardHeader className="border-b px-5 py-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-tight text-foreground">
                    Estudiantes para Matricular ({previewData.length})
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading && !isPreview && !finalResults ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground animate-pulse">Procesando...</p>
                </div>
              ) : finalResults ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center p-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="sm:text-xl text-lg tracking-tight font-semibold">
                      ¡Matrícula Exitosa!
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {finalResults.enrolled} estudiantes matriculados correctamente.
                    </p>
                  </div>
                  <Button onClick={handleNewUpload} variant="outline" className="mt-4 h-9 text-xs">
                    Realizar nueva matrícula
                  </Button>
                </div>
              ) : previewData.length > 0 ? (
                <div className="relative overflow-x-auto overflow-y-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="bg-muted/5 sticky top-0 z-10">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="text-[10px] font-bold px-4 py-3 text-muted-foreground tracking-widest">
                          Estudiante
                        </TableHead>
                        <TableHead className="text-[10px] font-bold px-4 py-3 text-muted-foreground tracking-widest">
                          Asignatura / Grupo
                        </TableHead>
                        <TableHead className="text-[10px] font-bold px-4 py-3 text-muted-foreground tracking-widest">
                          Estado
                        </TableHead>
                        <TableHead className="text-[10px] font-bold px-4 py-3 text-muted-foreground tracking-widest text-right">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-muted/20 transition-colors border-b"
                        >
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-foreground">
                                {item.nombreEstudiante}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {item.documentoEstudiante}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium text-foreground">
                                {item.codigoAsignatura}
                              </span>
                              <Badge variant="secondary" className="w-fit text-[9px] px-1 py-0 h-4 bg-muted/50">
                                Grupo {item.grupo}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge
                              variant={
                                item.status === 'error'
                                  ? 'destructive'
                                  : item.status === 'existing'
                                    ? 'outline'
                                    : 'secondary'
                              }
                              className="text-[9px] px-1.5 py-0 rounded h-5 truncate max-w-[100px]"
                            >
                              {item.status === 'manual'
                                ? 'Manual'
                                : item.status === 'existing'
                                  ? 'Ya existe'
                                  : item.status === 'error'
                                    ? 'Error'
                                    : 'CSV'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit disabled for multi-select pattern as per existing logic */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] py-12 text-center p-6">
                  <div className="bg-muted/30 p-4 rounded-full mb-4">
                    <Users className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Sin estudiantes seleccionados</h4>
                  <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
                    {mode === 'csv'
                      ? 'Sube un archivo CSV de matrículas o utiliza el formulario manual para ver los datos aquí.'
                      : 'Busca y agrega estudiantes usando el formulario lateral.'}
                  </p>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="border-t px-5 py-4 bg-muted/5 flex items-center justify-between gap-4">
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-xs font-semibold text-foreground">Matrículas pendientes</span>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] text-emerald-600 font-medium">{successCount} listos</span>
                      {existingCount > 0 && <span className="text-[10px] text-amber-600 font-medium">{existingCount} existentes</span>}
                      {errorCount > 0 && <span className="text-[10px] text-red-600 font-medium">{errorCount} errores</span>}
                    </div>
                  </div>
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={isConfirming || successCount === 0}
                    className="h-9 px-6 text-xs font-semibold min-w-[150px]"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Matriculando...
                      </>
                    ) : (
                      'Confirmar Matrícula'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

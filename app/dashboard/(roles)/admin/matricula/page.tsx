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
import {
  CheckCircle,
  Download,
  Edit2,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  code: string;
  name: string;
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
  document: string;
  name: string;
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
  const [studentsSearch, setStudentsSearch] = useState<string>('');

  // Manual form state
  const [manualForm, setManualForm] = useState({
    documento: '',
    nombre: '',
    subjectId: '',
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

  useEffect(() => {
    const loadStudents = async () => {
      if (!studentsSearch || studentsSearch.length < 2) {
        setStudents([]);
        return;
      }
      try {
        const res = await fetch(`/api/admin/users?search=${studentsSearch}&role=ESTUDIANTE`);
        const data = await res.json();
        setStudents(data.data || []);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };
    const timer = setTimeout(loadStudents, 300);
    return () => clearTimeout(timer);
  }, [studentsSearch]);

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

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
      toast.error('Por favor, selecciona un archivo .csv para continuar.');
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
        toast.success('Vista previa generada con éxito');
      } else {
        toast.error(result.error || 'Error al generar la vista previa');
        handleCancel();
      }
    } catch {
      toast.error('Ocurrió un error inesperado al procesar el archivo.');
      handleCancel();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManual = () => {
    if (!manualForm.documento || !manualForm.nombre || !manualForm.subjectId) {
      toast.error('El documento, nombre y asignatura son obligatorios.');
      return;
    }

    const sub = subjects.find(s => s.id === manualForm.subjectId);

    const newItem: PreviewItem = {
      id: `manual-${Date.now()}`,
      documentoEstudiante: manualForm.documento,
      nombreEstudiante: manualForm.nombre,
      codigoAsignatura: sub?.code || '',
      grupo: 'A',
      jornada: 'DIURNO',
      status: 'manual',
      message: 'Nuevo',
    };

    setPreviewData([...previewData, newItem]);
    setIsPreview(true);
    setManualForm({ ...manualForm, documento: '', nombre: '' });
    toast.success('Estudiante agregado');
  };

  const handleEditItem = (id: string) => {
    const item = previewData.find(i => i.id === id);
    if (item) {
      const sub = subjects.find(s => s.code === item.codigoAsignatura);
      setManualForm({
        documento: item.documentoEstudiante,
        nombre: item.nombreEstudiante,
        subjectId: sub?.id || '',
      });
      setEditingId(id);
    }
  };

  const handleUpdateItem = () => {
    const sub = subjects.find(s => s.id === manualForm.subjectId);

    setPreviewData(
      previewData.map(item =>
        item.id === editingId
          ? {
            ...item,
            documentoEstudiante: manualForm.documento,
            nombreEstudiante: manualForm.nombre,
            codigoAsignatura: sub?.code || item.codigoAsignatura,
          }
          : item
      )
    );
    setEditingId(null);
    setManualForm({ documento: '', nombre: '', subjectId: manualForm.subjectId });
    toast.success('Estudiante actualizado');
  };

  const handleDeleteItem = (id: string) => {
    setPreviewData(previewData.filter(item => item.id !== id));
  };

  const handleConfirmUpload = async () => {
    const successCount = previewData.filter(item => item.status !== 'error').length;
    if (successCount === 0) {
      toast.error('No hay matrículas válidas para procesar.');
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

      toast.success(`Matrículas procesadas.`);
      setFinalResults({
        enrolled: result.summary?.enrolled || 0,
        existing: result.summary?.existing || 0,
        full: result.summary?.full || 0,
        errors: result.summary?.errors || 0,
      });
      setPreviewData([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      toast.error(errorMessage);
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
    setManualForm({ documento: '', nombre: '', subjectId: manualForm.subjectId });
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
    <main className="space-y-4">
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
          Matrícula
        </CardTitle>
        <CardDescription className="text-xs">
          Matricula estudiantes en las asignaturas.
        </CardDescription>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-2 mb-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {mode === 'csv' ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="sm:text-md text-xs font-semibold">Carga Masiva</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Sube un archivo CSV con los estudiantes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a href="/formatos/plantilla_matricula.csv" download>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Plantilla
                    </Button>
                  </a>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Columnas:</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>Documento</li>
                      <li>Código Asignatura</li>
                      <li>Grupo</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="sm:text-md text-xs font-semibold">Subir Archivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
                  <div className="flex gap-2 mt-4 flex-col">
                    <Button
                      onClick={handlePreview}
                      disabled={!file || isLoading || isPreview}
                      className="w-full text-xs"
                    >
                      {isLoading && !isPreview ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Vista Previa
                    </Button>
                    {(file || isPreview) && (
                      <Button
                        onClick={handleCancel}
                        variant="destructive"
                        className="w-full text-xs"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="sm:text-md text-xs font-semibold">
                  {editingId ? 'Editar Estudiante' : 'Nuevo Estudiante'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Asignatura *</Label>
                  {isLoadingSubjects ? (
                    <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
                  ) : (
                    <Select
                      value={manualForm.subjectId}
                      onValueChange={val => setManualForm({ ...manualForm, subjectId: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una asignatura" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.code} - {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Documento *</Label>
                  <Input
                    value={manualForm.documento}
                    onChange={e => setManualForm({ ...manualForm, documento: e.target.value })}
                    placeholder="Número de documento"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={manualForm.nombre}
                    onChange={e => setManualForm({ ...manualForm, nombre: e.target.value })}
                    placeholder="Nombre del estudiante"
                  />
                </div>
                <div className="flex gap-2">
                  {editingId ? (
                    <>
                      <Button onClick={handleUpdateItem} className="flex-1">
                        Actualizar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          handleCancel();
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleAddManual} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="sm:text-md text-xs font-semibold">
                Estudiantes ({previewData.length})
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Lista de estudiantes para matricular.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && !isPreview && !finalResults ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : finalResults ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <CheckCircle className="h-16 w-16 text-primary" />
                  <div className="space-y-1">
                    <h3 className="sm:text-md text-xs tracking-card font-semibold">
                      Matrícula completada
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {finalResults.enrolled} matriculados, {finalResults.existing} ya existían
                    </p>
                  </div>
                  <Button onClick={handleNewUpload} className="mt-4">
                    Matricular más estudiantes
                  </Button>
                </div>
              ) : previewData.length > 0 ? (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {previewData.map(item => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm">
                              {item.documentoEstudiante} - {item.nombreEstudiante}
                            </h4>
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {item.status === 'manual'
                                ? 'Manual'
                                : item.status === 'existing'
                                  ? 'Ya existe'
                                  : item.status === 'error'
                                    ? 'Error'
                                    : 'CSV'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.codigoAsignatura} - Grupo {item.grupo}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditItem(item.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Agrega estudiantes para matricular.
                  </p>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    {successCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-500/10 text-emerald-600"
                      >
                        {successCount} nuevos
                      </Badge>
                    )}
                    {existingCount > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600">
                        {existingCount} existentes
                      </Badge>
                    )}
                    {errorCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {errorCount} errores
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={isConfirming || successCount === 0}
                    className="px-8"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
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
    </main>
  );
}

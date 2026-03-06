'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Download, FileSpreadsheet, Loader2, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  code: string;
  name: string;
  groups: {
    id: string;
    groupNumber: number;
    jornada: string;
    maxCapacity: number;
    studentIds: string[];
  }[];
}

interface PreviewItem {
  documentoEstudiante: string;
  codigoAsignatura: string;
  grupo: number;
  jornada: string;
  estudianteNombre: string;
  status: 'success' | 'error' | 'full' | 'existing';
  message: string;
}

export default function MatriculaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
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
        setPreviewData(result.previewData || []);
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

  const handleConfirmUpload = async () => {
    if (!file) return;

    const successCount = previewData.filter(item => item.status === 'success').length;
    if (successCount === 0) {
      toast.error('No hay matrículas válidas para procesar.');
      return;
    }

    setIsConfirming(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/matricula', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar la matrícula.');
      }

      toast.success(
        `Matrícula completada. ${result.summary?.enrolled || 0} estudiantes matriculados.`
      );
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
  };

  const handleNewUpload = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setFinalResults(null);
  };

  const successCount = previewData.filter(item => item.status === 'success').length;
  const existingCount = previewData.filter(item => item.status === 'existing').length;
  const fullCount = previewData.filter(item => item.status === 'full').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;

  return (
    <main className="space-y-4">
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
          Matrícula de Estudiantes
        </CardTitle>
        <CardDescription className="text-xs">
          Matricula estudiantes en los grupos de las asignaturas.
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Opciones de Carga
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Descarga la plantilla oficial para el formato correcto.
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
                  <span className="font-medium">Columnas requeridas:</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Documento Estudiante</li>
                  <li>Código Asignatura</li>
                  <li>Grupo (número)</li>
                  <li>Jornada (DIURNO/NOCTURNO)</li>
                </ul>
              </div>

              {selectedSubjectData && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-xs font-medium mb-2">Grupos disponibles:</div>
                  {selectedSubjectData.groups.map(group => (
                    <div key={group.id} className="text-xs text-muted-foreground">
                      Grupo {group.groupNumber} - {group.jornada}({group.studentIds?.length || 0}/
                      {group.maxCapacity})
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Subir Archivo
              </CardTitle>
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
                  <Button onClick={handleCancel} variant="destructive" className="w-full text-xs">
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Previsualización y Confirmación
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Revisa las matrículas antes de confirmar. Si un grupo está lleno, se asignará al
                siguiente.
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
                    <h3 className="sm:text-3xl text-2xl tracking-card font-semibold">
                      Matrícula completada
                    </h3>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {finalResults.enrolled}
                      </div>
                      <div className="text-xs text-muted-foreground">Matriculados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {finalResults.existing}
                      </div>
                      <div className="text-xs text-muted-foreground">Ya inscritos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{finalResults.full}</div>
                      <div className="text-xs text-muted-foreground">Grupos llenos</div>
                    </div>
                  </div>
                  <Button onClick={handleNewUpload} className="mt-4">
                    Matricular más estudiantes
                  </Button>
                </div>
              ) : isPreview && previewData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    {successCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      >
                        {successCount} por matricular
                      </Badge>
                    )}
                    {existingCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs text-amber-600 border-amber-600/20 bg-amber-500/10"
                      >
                        {existingCount} ya inscritos
                      </Badge>
                    )}
                    {fullCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs text-red-600 border-red-600/20 bg-red-500/10"
                      >
                        {fullCount} grupos llenos
                      </Badge>
                    )}
                    {errorCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {errorCount} errores
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {previewData.map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-2xl border transition-all ${
                          item.status === 'error' || item.status === 'full'
                            ? 'border-destructive/20 bg-destructive/5'
                            : item.status === 'existing'
                              ? 'border-amber-500/20 bg-amber-500/5'
                              : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-xs text-foreground">
                                {item.estudianteNombre || item.documentoEstudiante}
                              </h4>
                              {item.status === 'success' && (
                                <Badge className="bg-emerald-500 text-[10px] h-5">Listo</Badge>
                              )}
                              {item.status === 'existing' && (
                                <Badge variant="outline" className="text-[10px] h-5 text-amber-600">
                                  Ya inscrito
                                </Badge>
                              )}
                              {item.status === 'full' && (
                                <Badge variant="destructive" className="text-[10px] h-5">
                                  Grupo lleno
                                </Badge>
                              )}
                              {item.status === 'error' && (
                                <Badge variant="destructive" className="text-[10px] h-5">
                                  Error
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.codigoAsignatura} - Grupo {item.grupo} ({item.jornada})
                            </div>
                            {item.message && (
                              <div
                                className={`text-xs mt-1 ${
                                  item.status === 'error' || item.status === 'full'
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {item.message}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      {successCount} estudiante{successCount !== 1 ? 's' : ''} por matricular
                    </p>
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
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] py-12 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Sube un archivo CSV con los estudiantes a matricular.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

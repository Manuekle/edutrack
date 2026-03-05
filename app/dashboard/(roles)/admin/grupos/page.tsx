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
import { CheckCircle, Download, FileSpreadsheet, Loader2, XCircle, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface ScheduleEntry {
  dia: string;
  horaInicio: string;
  horaFin: string;
  salon: string;
}

interface PreviewItem {
  codigoAsignatura: string;
  grupo: number;
  jornada: string;
  status: 'success' | 'error' | 'existing';
  message: string;
  maxCapacity?: number;
  schedule?: ScheduleEntry[];
}

export default function GruposHorariosPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<{ created: number; errors: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await fetch('/api/admin/subjects?includeGroups=false');
        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, []);

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
    if (!selectedSubject) {
      toast.error('Por favor, selecciona una asignatura.');
      return;
    }
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/admin/subjects/${selectedSubject}/groups?preview=true`, {
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
    if (!file || !selectedSubject) return;

    const successCount = previewData.filter(item => item.status === 'success').length;
    if (successCount === 0) {
      toast.error('No hay grupos válidos para crear.');
      return;
    }

    setIsConfirming(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/admin/subjects/${selectedSubject}/groups`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar la carga.');
      }

      toast.success(`Proceso finalizado. Se crearon ${result.summary?.created || 0} grupos.`);
      setFinalResults({
        created: result.summary?.created || 0,
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
  const errorCount = previewData.filter(item => item.status === 'error').length;

  return (
    <main className="space-y-4">
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
          Grupos y Horarios
        </CardTitle>
        <CardDescription className="text-xs">
          Crea grupos y horarios para las asignaturas existentes.
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Seleccionar Asignatura
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Selecciona la asignatura para crear grupos y horarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={isLoadingSubjects}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

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
              <a href="/formatos/plantilla_grupos_horarios.csv" download>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </a>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Columnas requeridas:</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Código Asignatura</li>
                  <li>Grupo (número)</li>
                  <li>Jornada (DIURNO/NOCTURNO)</li>
                  <li>Cupo Máximo (opcional)</li>
                  <li>Día (Lunes, Martes, etc.)</li>
                  <li>Hora Inicio (HH:MM)</li>
                  <li>Hora Fin (HH:MM)</li>
                  <li>Salón (opcional)</li>
                </ul>
              </div>
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
                  disabled={!file || !selectedSubject || isLoading || isPreview}
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
                Revisa los grupos y horarios antes de confirmar.
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
                      Carga completada
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Se crearon {finalResults.created} grupos con sus horarios.
                    </p>
                  </div>
                  <Button onClick={handleNewUpload} className="mt-4">
                    Cargar otro archivo
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
                        {successCount} nuevos
                      </Badge>
                    )}
                    {existingCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs text-amber-600 border-amber-600/20 bg-amber-500/10"
                      >
                        {existingCount} existentes
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
                          item.status === 'error'
                            ? 'border-destructive/20 bg-destructive/5'
                            : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-xs text-foreground">
                                Grupo {item.grupo} - {item.jornada}
                              </h4>
                              {item.status === 'existing' && (
                                <Badge variant="destructive" className="text-[10px] h-5">
                                  Existe
                                </Badge>
                              )}
                              {item.status === 'success' && (
                                <Badge className="bg-emerald-500 text-[10px] h-5">Nuevo</Badge>
                              )}
                              {item.status === 'error' && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground mb-2">
                              Cupo: {item.maxCapacity || 30}
                            </div>

                            {item.schedule && item.schedule.length > 0 && (
                              <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                {item.schedule.map((slot, i) => (
                                  <div key={i}>
                                    {slot.dia} {slot.horaInicio}-{slot.horaFin} ({slot.salon})
                                  </div>
                                ))}
                              </div>
                            )}

                            {item.status === 'error' && (
                              <div className="text-[10px] text-destructive mt-2 font-medium">
                                Error: {item.message}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Listo para procesar {successCount} grupo{successCount !== 1 ? 's' : ''}
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
                        'Confirmar y Crear'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] py-12 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Selecciona una asignatura y sube un archivo CSV para previsualizar los grupos y
                    horarios.
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

'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Download, FileSpreadsheet, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

// --- Tipos de Datos ---
interface ImportPreviewItem {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditosClase: number;
  programa: string;
  semestreAsignatura: number;
  classCount: number;
  docente?: string;
  salon?: string;
  teacherFound?: boolean;
  status: 'new' | 'existing' | 'error';
  error?: string;
}

interface FinalResult {
  codigoAsignatura: string;
  nombreAsignatura: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
}

export default function CargarAsignaturasPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<FinalResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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
      formData.append('preview', 'true');

      const res = await fetch('/api/admin/subjects/import', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
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

    const newItemsCount = previewData.filter(item => item.status === 'new').length;
    if (newItemsCount === 0) {
      toast.error('No hay asignaturas nuevas válidas para importar.');
      return;
    }

    setIsConfirming(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'false');

      const response = await fetch('/api/admin/subjects/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar la carga.');
      }

      toast.success(`Proceso finalizado. Se procesaron ${result.processed} asignaturas.`);

      // Adaptamos el resultado para mostrarlo
      const mappedResults: FinalResult[] = previewData.map(item => ({
        codigoAsignatura: item.codigoAsignatura,
        nombreAsignatura: item.nombreAsignatura,
        status: item.status === 'new' ? 'created' : 'skipped',
        message: item.status === 'new' ? 'Asignatura creada' : (item.error || 'Omitida por ya existir'),
      }));

      setFinalResults(mappedResults);
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

  const newCount = previewData.filter(item => item.status === 'new').length;
  const existingCount = previewData.filter(item => item.status === 'existing').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;

  return (
    <main className="space-y-4">
      {/* Header */}
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">Cargar Asignaturas</CardTitle>
        <CardDescription className="text-xs">
          Sube un archivo .csv para registrar masivamente asignaturas y sus horarios.
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Opciones de Carga */}
          <Card>
            <CardHeader>
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Opciones de Carga
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Descarga la plantilla oficial para asegurar el formato correcto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="/formatos/plantilla_asignaturas.csv" download>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </a>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span className="font-medium">Requisitos del archivo:</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Formato CSV (.csv)</li>
                  <li>Inclusión de código y nombre</li>
                  <li>Horarios y asignación de docentes</li>
                  <li>Créditos y programas académicos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Subir Archivo */}
          <Card>
            <CardHeader>
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">Subir Archivo</CardTitle>
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

        {/* Previsualización y Confirmación */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Previsualización y Confirmación
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Revisa los datos antes de confirmar la carga. Solo se procesarán las nuevas asignaturas.
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
                    <h3 className="sm:text-3xl text-2xl tracking-card font-semibold">Carga completada</h3>
                    <p className="text-xs text-muted-foreground">
                      Resumen del procesamiento masivo.
                    </p>
                  </div>
                  <div className="w-full max-w-md space-y-2 mt-4">
                    <div className="bg-muted rounded-xl p-4 max-h-[40vh] overflow-y-auto text-left">
                      <ul className="space-y-2 text-xs">
                        {finalResults.map((res, i) => (
                          <li key={i} className="flex items-start gap-2 border-b pb-2 last:border-0 last:pb-0">
                            {res.status === 'created' ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            ) : res.status === 'error' ? (
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium text-foreground">{res.nombreAsignatura} ({res.codigoAsignatura})</p>
                              <p className="text-muted-foreground">{res.message}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Button onClick={() => router.push('/dashboard/admin/asignaturas')} className="mt-4">
                    Volver a la lista
                  </Button>
                </div>
              ) : isPreview && previewData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    {newCount > 0 && <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{newCount} nuevas</Badge>}
                    {existingCount > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-600/20 bg-amber-500/10">{existingCount} existentes</Badge>}
                    {errorCount > 0 && <Badge variant="destructive" className="text-xs">{errorCount} errores</Badge>}
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {previewData.map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-2xl border transition-all ${item.status === 'existing' || item.status === 'error'
                          ? 'border-destructive/20 bg-destructive/5'
                          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-xs text-foreground">
                                {item.nombreAsignatura} ({item.codigoAsignatura})
                              </h4>
                              {item.status === 'existing' && <Badge variant="destructive" className="text-[10px] h-5">Existe</Badge>}
                              {item.status === 'new' && <Badge className="bg-emerald-500 text-[10px] h-5">Nuevo</Badge>}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                              <div>Créditos: {item.creditosClase || 0}</div>
                              <div>Semestre: {item.semestreAsignatura || 1}</div>
                              <div>Clases: {item.classCount}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-2 mt-2">
                              <div className={!item.teacherFound && item.docente ? "text-destructive font-medium" : ""}>
                                Docente: {item.docente || 'Sin asignar'}
                              </div>
                              <div>Salón: {item.salon || 'Por definir'}</div>
                            </div>

                            {!item.teacherFound && item.docente && (
                              <p className="text-[10px] text-destructive mt-1 font-medium italic">
                                Aviso: El docente no existe en el sistema. Se asignará por defecto.
                              </p>
                            )}

                            {item.error && (
                              <div className="text-[10px] text-destructive mt-2 font-medium">
                                Error: {item.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted/30 rounded-2xl p-4 text-[10px] text-muted-foreground space-y-2 border border-dashed">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-3 w-3" />
                      Información Importante
                    </div>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Solo se importarán las asignaturas marcadas como <span className="text-emerald-500 font-bold">Nuevas</span>.</li>
                      <li>Las asignaturas existentes se omiten para evitar duplicados.</li>
                      <li>La importación incluye la creación automática de las clases y horarios detallados.</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Listo para procesar {newCount} asignatura{newCount !== 1 ? 's' : ''}
                    </p>
                    <Button
                      onClick={handleConfirmUpload}
                      disabled={isConfirming || newCount === 0}
                      className="px-8"
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Confirmar e Importar'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] py-12 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Sube un archivo CSV para previsualizar los datos y confirmar la importación masiva de asignaturas.
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

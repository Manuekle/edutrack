'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sileo } from 'sileo';

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
  const [mode, setMode] = useState<'csv' | 'manual'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<FinalResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      handleCancel();
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
      formData.append('preview', 'true');

      const res = await fetch('/api/admin/subjects/import', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setPreviewData(result.previewData || []);
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

  const handleConfirmUpload = async () => {
    if (!file) return;

    const newItemsCount = previewData.filter(item => item.status === 'new').length;
    if (newItemsCount === 0) {
      sileo.error({
        title: 'Sin asignaturas nuevas',
        description: 'No hay asignaturas nuevas válidas para importar.',
      });
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

      sileo.success({
        title: 'Carga exitosa',
        description: `Proceso finalizado. Se procesaron ${result.processed} asignaturas.`,
      });

      const mappedResults: FinalResult[] = previewData.map(item => ({
        codigoAsignatura: item.codigoAsignatura,
        nombreAsignatura: item.nombreAsignatura,
        status: item.status === 'new' ? 'created' : 'skipped',
        message:
          item.status === 'new' ? 'Asignatura creada' : item.error || 'Omitida por ya existir',
      }));

      setFinalResults(mappedResults);
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
  };

  const newCount = previewData.filter(item => item.status === 'new').length;
  const existingCount = previewData.filter(item => item.status === 'existing').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full">
          <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
            Carga de Asignaturas
          </CardTitle>
          <CardDescription className="text-xs">
            Registra asignaturas y sus horarios de forma masiva en el sistema.
          </CardDescription>
        </CardHeader>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lado izquierdo: Opciones y Subida */}
        <div className="lg:col-span-4 space-y-4">
          {mode === 'csv' ? (
            <>
              <Card className="p-0 overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    1. Instrucciones del Formato
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Formato requerido para la carga de asignaturas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">Plantilla base</p>
                      <a href="/formatos/plantilla_asignaturas.csv" download className="block">
                        <Button variant="outline" className="w-full justify-start h-9 text-xs">
                          <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                          Descargar Formato CSV
                        </Button>
                      </a>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">Requisitos del archivo</p>
                      <div className="rounded-md bg-muted/30 p-3">
                        <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                          <li><span className="font-semibold text-foreground">Datos básicos</span>: Código y nombre</li>
                          <li><span className="font-semibold text-foreground">Horarios</span> y asignación de docentes</li>
                          <li><span className="font-semibold text-foreground">Programa</span> académico y créditos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0 overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    2. Subir Archivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold mb-2 block text-foreground">
                        Seleccionar Archivo .CSV
                      </Label>
                      <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handlePreview}
                        disabled={!file || isLoading || isPreview}
                        className="flex-1 h-9 text-xs"
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
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-0 overflow-hidden border shadow-xs">
              <CardHeader className="border-b px-5 py-4 bg-muted/10 text-center">
                <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                  Carga Manual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center space-y-4">
                <div className="bg-amber-500/10 p-4 rounded-full w-fit mx-auto">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  La carga manual de asignaturas estará disponible próximamente.
                  Por ahora, utiliza la carga por archivo CSV.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => setMode('csv')}
                >
                  Cambiar a CSV
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lado derecho: Tabla de vista previa o Resultados */}
        <div className="lg:col-span-8">
          <Card className="p-0 overflow-hidden border shadow-xs">
            <CardHeader className="border-b px-5 py-4 bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                Vista Previa de Asignaturas ({previewData.length})
              </CardTitle>
              <div className="flex gap-2">
                {newCount > 0 && (
                  <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-normal">
                    {newCount} NUEVAS
                  </Badge>
                )}
                {existingCount > 0 && (
                  <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-normal">
                    {existingCount} EXISTENTES
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading && !isPreview && !finalResults ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  <p className="text-[10px] font-semibold text-muted-foreground/60 ">
                    Procesando Archivo...
                  </p>
                </div>
              ) : finalResults ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center px-4">
                  <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="sm:text-xl text-lg tracking-heading font-semibold">
                      ¡Importación completada!
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Resumen del procesamiento masivo realizado con éxito.
                    </p>
                  </div>
                  <div className="w-full max-w-md bg-zinc-50 border rounded-xl overflow-hidden mt-4">
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableBody>
                          {finalResults.map((res, i) => (
                            <TableRow key={i} className="border-zinc-100 last:border-0 hover:bg-transparent">
                              <TableCell className="w-10">
                                {res.status === 'created' ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                )}
                              </TableCell>
                              <TableCell className="text-[11px] font-semibold py-2">
                                {res.nombreAsignatura}
                                <p className="text-[9px] text-muted-foreground font-normal">
                                  {res.codigoAsignatura}
                                </p>
                              </TableCell>
                              <TableCell className="text-[9px] text-right py-2 text-muted-foreground font-semibold uppercase">
                                {res.message}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/admin/asignaturas')}
                    size="sm"
                    className="mt-6 px-8 h-9 text-xs font-semibold"
                  >
                    VOLVER A LA LISTA
                  </Button>
                </div>
              ) : previewData.length > 0 ? (
                <>
                  <div className="bg-card border rounded-md overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[500px]">
                      <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Asignatura
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Detalles
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-center">
                              Estado
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.map((item, index) => (
                            <TableRow
                              key={index}
                              className={`hover:bg-muted/50 group ${item.status === 'existing' ? 'bg-amber-500/5' : ''}`}
                            >
                              <TableCell className="py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold">{item.nombreAsignatura}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Código: {item.codigoAsignatura}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5">
                                <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                                  <span className="font-semibold text-zinc-600">
                                    Docente: {item.docente || 'Sin asignar'}
                                    {!item.teacherFound && item.docente && (
                                      <span className="text-red-500 ml-1 italic text-[9px]">
                                        (No encontrado)
                                      </span>
                                    )}
                                  </span>
                                  <span>Salón: {item.salon || 'N/A'}</span>
                                  <span>Créditos: {item.creditosClase} | Semestre: {item.semestreAsignatura}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 font-normal ${item.status === 'error'
                                    ? 'bg-red-50 text-red-600 border-red-100'
                                    : item.status === 'existing'
                                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }`}
                                >
                                  {item.status === 'new' ? 'NUEVA' : 'EXISTENTE'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/20 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-muted-foreground italic">
                      * Verifica los docentes subrayados antes de confirmar.
                    </p>
                    <Button
                      onClick={handleConfirmUpload}
                      disabled={isConfirming || newCount === 0}
                      className="h-9 px-8 text-xs font-semibold shadow-sm"
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          IMPORTANDO...
                        </>
                      ) : (
                        'CONFIRMAR E IMPORTAR'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground ">
                      Sin datos para mostrar
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 max-w-[200px]">
                      Sube un archivo CSV para previsualizar las asignaturas a importar.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PreviewItem {
  codigoAsignatura: string;
  nombreAsignatura: string;
  programa: string;
  semestre: number;
  creditos: number;
  horas: number;
  temasCount: number;
  status: 'success' | 'error' | 'existing';
  message: string;
}

export default function MicrocurriculoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<{
    created: number;
    existing: number;
    errors: number;
  } | null>(null);
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

      const res = await fetch('/api/admin/microcurriculo?preview=true', {
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
      toast.error('No hay asignaturas válidas para crear.');
      return;
    }

    setIsConfirming(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/microcurriculo', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setFinalResults(result.summary);
        setIsPreview(false);
        toast.success('Microcurrículos creados con éxito');
        setFile(null);
      } else {
        toast.error(result.error || 'Error al subir el archivo');
      }
    } catch {
      toast.error('Ocurrió un error inesperado al procesar el archivo.');
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Carga de Microcurrículos</h1>
        <p className="text-muted-foreground">Sube el archivo CSV con las asignaturas y sus temas</p>
      </div>

      {!finalResults ? (
        <Card>
          <CardHeader>
            <CardTitle>Subir Archivo CSV</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Descarga la plantilla oficial para asegurar el formato correcto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <a href="/formatos/plantilla_microcurriculo.csv" download>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </a>
            </div>

            <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />

            {file && (
              <div className="flex gap-2">
                {!isPreview ? (
                  <Button onClick={handlePreview} disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando Vista Previa...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Generar Vista Previa
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleConfirmUpload} disabled={isConfirming} className="flex-1">
                    {isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmar Carga
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Carga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold">{finalResults.created}</p>
                <p className="text-sm text-green-600">Creadas</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
                <p className="text-2xl font-bold">{finalResults.existing}</p>
                <p className="text-sm text-yellow-600">Existentes</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
                <p className="text-2xl font-bold">{finalResults.errors}</p>
                <p className="text-sm text-red-600">Errores</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setFinalResults(null);
                setFile(null);
              }}
              className="w-full"
            >
              Subir Otro Archivo
            </Button>
          </CardContent>
        </Card>
      )}

      {isPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <CardDescription>{previewData.length} registros encontrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Código</th>
                    <th className="text-left p-2">Nombre</th>
                    <th className="text-left p-2">Programa</th>
                    <th className="text-left p-2">Semestre</th>
                    <th className="text-left p-2">Créditos</th>
                    <th className="text-left p-2">Horas</th>
                    <th className="text-left p-2">Temas</th>
                    <th className="text-left p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.codigoAsignatura}</td>
                      <td className="p-2">{item.nombreAsignatura}</td>
                      <td className="p-2">{item.programa}</td>
                      <td className="p-2">{item.semestre}</td>
                      <td className="p-2">{item.creditos}</td>
                      <td className="p-2">{item.horas}</td>
                      <td className="p-2">
                        <Badge variant="outline">{item.temasCount} temas</Badge>
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={
                            item.status === 'success'
                              ? 'default'
                              : item.status === 'existing'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {item.status === 'success' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {item.status === 'existing' && <AlertCircle className="mr-1 h-3 w-3" />}
                          {item.status === 'error' && <XCircle className="mr-1 h-3 w-3" />}
                          {item.message}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

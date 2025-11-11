'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { UsersPreviewSection, type UserPreviewItem } from '@/components/users/preview-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// --- Tipos de Datos ---
interface FinalResult {
  document: string;
  name: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
}

export default function CargarUsuariosPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<UserPreviewItem[]>([]);
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
      toast.error('Por favor, selecciona un archivo .xlsx o .csv para continuar.');
      return;
    }
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/cargar-usuarios?preview=true', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setPreviewData(result || []);
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
    if (previewData.filter(item => item.status === 'success').length === 0) {
      toast.error('No hay usuarios válidos para crear.');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await fetch('/api/admin/cargar-usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar la carga.');
      }

      toast.success('Proceso de carga finalizado.');
      setFinalResults(result.results || []);
      setPreviewData([]); // Limpiar la previsualización
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

  return (
    <>
      {/* Header */}
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="text-2xl font-semibold tracking-heading">Cargar Usuarios</CardTitle>
        <CardDescription className="text-xs">
          Sube un archivo .xlsx o .csv para cargar masivamente usuarios.
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Download Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Opciones de Carga
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Elige cómo quieres cargar tus usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <a href="/formatos/plantilla_usuarios.xlsx" download>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Plantilla
                  </Button>
                </a>
              </div>

              <div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Formatos soportados:</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Excel (.xlsx) - Formato tradicional</li>
                    <li>CSV (.csv) - Formato de texto plano</li>
                    <li>Compatible con sistemas externos</li>
                    <li>Mapeo flexible de columnas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Subir Archivo (Excel o CSV)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Si ya tienes un archivo Excel (.xlsx) o CSV (.csv) con tus datos, súbelo aquí.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
              <div className="flex gap-2 mt-4 flex-col">
                <Button
                  onClick={handlePreview}
                  disabled={!file || isLoading}
                  className="w-full text-xs"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <></>}
                  Vista Previa
                </Button>
                {isPreview && (
                  <Button onClick={handleCancel} variant="destructive" className="w-full text-xs">
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <UsersPreviewSection
          isLoading={isLoading}
          isPreview={isPreview}
          previewData={previewData}
          finalResults={finalResults}
          onUpload={handleConfirmUpload}
          onNewUpload={handleNewUpload}
          isConfirming={isConfirming}
        />
      </div>
    </>
  );
}

// app/dashboard/(roles)/docente/cargar-asignaturas/page.tsx
'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { PreviewSection, type PreviewItem } from '@/components/subjects/preview-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// Interface for the raw data from the API/Excel file
interface RawApiPreviewItem {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditosClase: number;
  fechaClase: string | number;
  horaInicio: string | number;
  horaFin: string | number;
  temaClase?: string; // Optional
  descripcionClase?: string; // Optional
  semestreAsignatura: number;
  programa: string;
  error?: string;
  isDuplicate?: boolean;
}

export default function UploadSubjectsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [uploadResult, setUploadResult] = useState<{
    processed: number;
    errors: string[];
  } | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    // Reset preview state if file is deselected
    if (!selectedFile) {
      setIsPreview(false);
      setPreviewData([]);
      setUploadResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo .xlsx o .csv para continuar.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('preview', 'true');

    try {
      const response = await fetch('/api/docente/cargar-asignaturas', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener la vista previa');
      }

      const groupedBySubject: Record<string, PreviewItem> = {};

      for (const item of result.previewData as RawApiPreviewItem[]) {
        const subjectCode = item.codigoAsignatura;

        if (!groupedBySubject[subjectCode]) {
          let status: 'success' | 'error' | 'duplicate' = 'success';
          if (item.error) {
            status = 'error';
          } else if (item.isDuplicate) {
            status = 'duplicate';
          }

          groupedBySubject[subjectCode] = {
            codigoAsignatura: subjectCode,
            nombreAsignatura: item.nombreAsignatura ?? '',
            creditosClase: item.creditosClase ?? 0,
            semestreAsignatura: item.semestreAsignatura ?? 0,
            programa: item.programa ?? '',
            status,
            classes: [],
            error: item.error,
          };
        }

        // Add class only if the row itself doesn't have an error about the class fields
        if (!item.error) {
          // Helper function to ensure value is string
          const ensureString = (value: string | number): string => {
            return typeof value === 'number' ? value.toString() : value;
          };

          groupedBySubject[subjectCode].classes.push({
            id: groupedBySubject[subjectCode].classes.length,
            fechaClase: ensureString(item.fechaClase),
            horaInicio: ensureString(item.horaInicio),
            horaFin: ensureString(item.horaFin),
            temaClase: item.temaClase ?? '',
            descripcionClase: item.descripcionClase ?? '',
          });
        }
      }

      setPreviewData(Object.values(groupedBySubject));
      setIsPreview(true);
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file && previewData.length === 0) {
      toast.error('No hay datos para cargar.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();

    // Si hay datos editados en previewData, enviarlos en lugar del archivo
    if (previewData.length > 0) {
      // Convertir previewData al formato que espera el API (similar a GeneratorSubjectData)
      const editedPreviewData = previewData.map(subject => ({
        id: subject.codigoAsignatura,
        codigoAsignatura: subject.codigoAsignatura,
        nombreAsignatura: subject.nombreAsignatura,
        creditosClase: subject.creditosClase,
        programa: subject.programa,
        semestreAsignatura: subject.semestreAsignatura,
        classes: subject.classes.map(cls => ({
          id: String(cls.id),
          fechaClase: cls.fechaClase, // Ya está en formato YYYY-MM-DD
          horaInicio: cls.horaInicio,
          horaFin: cls.horaFin,
          temaClase: cls.temaClase || '',
          descripcionClase: cls.descripcionClase || '',
        })),
      }));

      formData.append('editedPreview', JSON.stringify(editedPreviewData));
    } else if (file) {
      // Si no hay datos editados, usar el archivo original
      formData.append('file', file);
    }

    try {
      const response = await fetch('/api/docente/cargar-asignaturas', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar el archivo');
      }

      setUploadResult({
        processed: result.processed || 0,
        errors: result.errors || [],
      });
      toast.success('Archivo cargado exitosamente!');
      setIsPreview(false);
      setPreviewData([]);
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setUploadResult(null);
  };

  const handleNewUpload = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setUploadResult(null);
  };

  // Helper to normalize date to YYYY-MM-DD format
  // The API already returns dates in YYYY-MM-DD format, but this ensures consistency
  const normalizeDate = (dateString: string): string => {
    if (!dateString) return dateString;

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Try to parse and format (prioritize MM/DD/YYYY as per CSV header)
    try {
      const dateStr = String(dateString).trim();

      // Format MM/DD/YYYY (prioritize this as CSV header indicates MM/DD/YYYY)
      const slashFormat = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (slashFormat) {
        // Assume MM/DD/YYYY format (as per CSV header)
        const [, month, day, year] = slashFormat;
        const monthNum = Number(month);
        const dayNum = Number(day);

        // If month > 12, it's likely DD/MM/YYYY format
        if (monthNum > 12 && dayNum <= 12) {
          // Swap: it's DD/MM/YYYY
          return `${year}-${String(dayNum).padStart(2, '0')}-${String(monthNum).padStart(2, '0')}`;
        }

        // Normal MM/DD/YYYY
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Try parsing as Date (fallback)
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // If parsing fails, return as is
    }

    return dateString;
  };

  const handleUpdateClass = (
    subjectCode: string,
    classId: number,
    updatedClass: Partial<PreviewItem['classes'][0]>
  ) => {
    setPreviewData(prevData =>
      prevData.map(subject => {
        if (subject.codigoAsignatura === subjectCode) {
          return {
            ...subject,
            classes: subject.classes.map(cls => {
              if (cls.id === classId) {
                // Normalize fechaClase if it's being updated
                const normalizedClass = { ...cls, ...updatedClass };
                if (updatedClass.fechaClase) {
                  normalizedClass.fechaClase = normalizeDate(updatedClass.fechaClase);
                }
                return normalizedClass;
              }
              return cls;
            }),
          };
        }
        return subject;
      })
    );
  };

  return (
    <>
      {/* Header */}
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="text-2xl font-semibold tracking-heading">
          Cargar Asignaturas y Clases
        </CardTitle>
        <CardDescription className="text-xs">
          Sube un archivo .xlsx o .csv para cargar masivamente las asignaturas y sus respectivas
          clases, o utiliza nuestro generador integrado.
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Download Template and Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Opciones de Carga
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Elige cómo quieres gestionar tus asignaturas y clases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <a href="/formatos/plantilla_docente_asignaturas_clases.xlsx" download>
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
                    <li>Soporta formato de hora AM/PM en CSV</li>
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

        <PreviewSection
          isLoading={isLoading}
          isPreview={isPreview}
          previewData={previewData}
          uploadResult={uploadResult}
          onUpload={handleUpload}
          onNewUpload={handleNewUpload}
          onUpdateClass={handleUpdateClass}
        />
      </div>
    </>
  );
}

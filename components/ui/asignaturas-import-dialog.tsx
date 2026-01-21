'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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

interface AsignaturasImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
}

export function AsignaturasImportDialog({
  open,
  onOpenChange,
  onImport,
}: AsignaturasImportDialogProps) {
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setProcessingProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('preview', 'true');

      const response = await fetch('/api/admin/subjects/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setPreview(result.previewData);
      setShowPreview(true);
      setProcessingProgress(100);
      
    } catch (error: any) {
        toast.error(error.message || 'Error al procesar el archivo');
        setFile(null);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => file.name.endsWith('.xlsx') || file.name.endsWith('.xls'));

    if (excelFile) {
      handleFileSelect(excelFile);
    }
  };

  const handleConfirmImport = async () => {
     if (!file) return;
     
     setIsProcessing(true);
     try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('preview', 'false');

        const response = await fetch('/api/admin/subjects/import', {
            method: 'POST',
            body: formData,
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        toast.success(`Se procesaron ${result.processed} asignaturas.`);
        if (result.errors && result.errors.length > 0) {
            toast.warning(`Hubo ${result.errors.length} errores. Revisa la consola.`);
            console.error(result.errors);
        }

        onImport();
        handleCancel();
     } catch(e: any) {
         toast.error(e.message);
         setIsProcessing(false);
     }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setPreview([]);
    setProcessingProgress(0);
    setFile(null);
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="sm:text-3xl text-2xl tracking-card">Importar desde Excel</DialogTitle>
          <DialogDescription className="text-xs">
            Importa asignaturas y clases desde un archivo Excel existente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isProcessing ? (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <h3 className="sm:text-3xl text-2xl font-medium mb-2">Procesando archivo...</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Analizando los datos del archivo Excel
                </p>
              </div>
              <Progress value={processingProgress} className="w-full" />
              <p className="text-center text-xs text-muted-foreground">
                {processingProgress}% completado
              </p>
            </div>
          ) : showPreview ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium">Vista Previa de Importación</h3>
                <Badge variant="secondary" className="text-xs font-normal">
                  {preview.length} asignatura{preview.length !== 1 ? 's' : ''} encontrada
                  {preview.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {preview.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      item.status === 'existing' || item.status === 'error'
                        ? 'border-destructive/20 bg-destructive/5'
                        : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h1 className="font-medium text-xs text-foreground">
                            {item.nombreAsignatura} ({item.codigoAsignatura})
                          </h1>
                          {item.status === 'existing' && <Badge variant="destructive" className="text-[10px]">Existe</Badge>}
                          {item.status === 'new' && <Badge className="bg-emerald-500 text-[10px]">Nuevo</Badge>}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mb-2">
                          <div>Créditos: {item.creditosClase || 0}</div>
                          <div>Semestre: {item.semestreAsignatura || 1}</div>
                          <div>Clases: {item.classCount}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t pt-2 mt-2">
                            <div className={!item.teacherFound && item.docente ? "text-destructive font-medium" : ""}>
                                Docente: {item.docente || 'Sin asignar'}
                                {!item.teacherFound && item.docente && " (No encontrado)"}
                            </div>
                            <div>Salón: {item.salon || 'N/A'}</div>
                        </div>

                        {item.error && (
                          <div className="text-xs text-destructive mt-2 font-medium">
                            Error: {item.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/30 rounded p-3 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Información importante:</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Solo se importarán las asignaturas nuevas</li>
                  <li>Las asignaturas existentes se omitirán</li>
                  <li>Si el docente no se encuentra, se asignará al administrador actual</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className={`relative flex flex-col items-center gap-3 cursor-pointer rounded-lg border border-dashed border-muted-foreground/25 bg-background px-6 py-8 text-center transition-colors hover:bg-muted/50 ${
                  dragOver ? 'border-primary bg-primary/5 cursor-grabbing' : ''
                }`}
                onDragOver={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragEnter={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragLeave={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(false);
                }}
                onDragEnd={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(false);
                }}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                  id="excel-import"
                />

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="flex flex-col gap-1 text-center">
                  <div className="flex justify-center gap-1 text-center">
                    <label htmlFor="excel-import" className="flex cursor-pointer text-xs">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => document.getElementById('excel-import')?.click()}
                        className="p-0 h-auto font-normal"
                      >
                        Click para subir
                      </Button>
                    </label>
                    <span className="text-xs text-muted-foreground max-md:hidden">
                      o arrastrar y soltar
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dragOver
                      ? 'Suelta el archivo aquí'
                      : 'Arrastra y suelta tu archivo .xlsx o .xls'}
                  </p>
                </div>
              </div>

              <div className="px-1 text-xs">
                <h4 className="font-medium mb-2">Formato esperado del archivo:</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code>codigoAsignatura</code>, <code>nombreAsignatura</code></li>
                  <li><code>creditosClase</code>, <code>programa</code>, <code>semestreAsignatura</code></li>
                  <li><code>fechaClase (YYYY-MM-DD)</code>, <code>horaInicio (HH:MM)</code>, <code>horaFin</code></li>
                  <li><code>docente</code> (email/doc), <code>salon</code></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          </DialogClose>

          {showPreview && (
            <Button
              onClick={handleConfirmImport}
              disabled={preview.filter(item => item.status === 'new').length === 0}
            >
              Importar {preview.filter(item => item.status === 'new').length} Asignatura
              {preview.filter(item => item.status === 'new').length !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

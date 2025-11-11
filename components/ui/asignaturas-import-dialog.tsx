// components/ui/import-dialog.tsx
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
import * as XLSX from 'xlsx';

interface ClassData {
  id: string;
  fechaClase: string;
  horaInicio: string;
  horaFin: string;
  temaClase: string;
  descripcionClase: string;
}

interface SubjectData {
  id: string;
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditosClase: number;
  programa: string;
  semestreAsignatura: number;
  classes: ClassData[];
}

interface ExcelRowData {
  codigoAsignatura?: string | number;
  nombreAsignatura?: string | number;
  creditosClase?: string | number;
  programa?: string | number;
  semestreAsignatura?: string | number;
  'fechaClase (YYYY-MM-DD)'?: string | number;
  'horaInicio (HH:MM)'?: string | number;
  'horaFin (HH:MM)'?: string | number;
  temaClase?: string | number;
  descripcionClase?: string | number;
}

interface ImportPreviewItem {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditosClase: number;
  programa: string;
  semestreAsignatura: number;
  classCount: number;
  status: 'new' | 'existing' | 'error';
  error?: string;
}

interface AsignaturasImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (subjects: SubjectData[]) => void;
  existingCodes: Set<string>;
}

export function AsignaturasImportDialog({
  open,
  onOpenChange,
  onImport,
  existingCodes,
}: AsignaturasImportDialogProps) {
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [importData, setImportData] = useState<SubjectData[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(10);

    try {
      const buffer = await file.arrayBuffer();
      setProcessingProgress(30);

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet) as ExcelRowData[];
      setProcessingProgress(60);

      const importedSubjects: Record<string, SubjectData> = {};
      const previewItems: ImportPreviewItem[] = [];

      data.forEach((row, index) => {
        const codigo = row.codigoAsignatura?.toString().trim();
        if (!codigo) return;

        if (!importedSubjects[codigo]) {
          const status = existingCodes.has(codigo) ? 'existing' : 'new';

          importedSubjects[codigo] = {
            id: generateId(),
            codigoAsignatura: codigo,
            nombreAsignatura: row.nombreAsignatura?.toString() || '',
            creditosClase: Number(row.creditosClase) || 3,
            programa: row.programa?.toString() || '',
            semestreAsignatura: Number(row.semestreAsignatura) || 1,
            classes: [],
          };

          previewItems.push({
            codigoAsignatura: codigo,
            nombreAsignatura: row.nombreAsignatura?.toString() || '',
            creditosClase: Number(row.creditosClase) || 3,
            programa: row.programa?.toString() || '',
            semestreAsignatura: Number(row.semestreAsignatura) || 1,
            classCount: 0,
            status,
            error: status === 'existing' ? 'Esta asignatura ya existe en tu lista' : undefined,
          });
        }

        // Add class data if present
        const fechaClase = row['fechaClase (YYYY-MM-DD)']?.toString();
        const horaInicio = row['horaInicio (HH:MM)']?.toString();
        const horaFin = row['horaFin (HH:MM)']?.toString();

        if (fechaClase && horaInicio && horaFin) {
          importedSubjects[codigo].classes.push({
            id: generateId(),
            fechaClase,
            horaInicio,
            horaFin,
            temaClase: row.temaClase?.toString() || '',
            descripcionClase: row.descripcionClase?.toString() || '',
          });

          // Update class count in preview
          const previewItem = previewItems.find(item => item.codigoAsignatura === codigo);
          if (previewItem) {
            previewItem.classCount++;
          }
        }
      });

      setProcessingProgress(100);
      setPreview(previewItems);
      setShowPreview(true);
      setImportData(Object.values(importedSubjects));
    } catch (error) {
      toast.error('Error al procesar el archivo Excel');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
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

  const handleConfirmImport = () => {
    const newSubjects = importData.filter(
      (subject: SubjectData) => !existingCodes.has(subject.codigoAsignatura)
    );

    if (newSubjects.length > 0) {
      onImport(newSubjects);
      toast.success(`Se importaron ${newSubjects.length} asignaturas nuevas`);
    } else {
      toast.info('No se encontraron asignaturas nuevas para importar');
    }

    // Reset state
    setShowPreview(false);
    setPreview([]);
    setImportData([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setShowPreview(false);
    setPreview([]);
    setImportData([]);
    setIsProcessing(false);
    setProcessingProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-heading">Importar desde Excel</DialogTitle>
          <DialogDescription className="text-xs">
            Importa asignaturas y clases desde un archivo Excel existente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isProcessing ? (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <h3 className="text-lg font-medium mb-2">Procesando archivo...</h3>
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
                      item.status === 'existing'
                        ? 'border-destructive bg-destructive text-white'
                        : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h1
                            className={`font-medium text-xs ${item.status === 'existing' ? 'text-white' : 'text-black'}`}
                          >
                            {item.nombreAsignatura} ({item.codigoAsignatura})
                          </h1>
                        </div>

                        <div
                          className={`grid grid-cols-3 gap-4 text-xs ${item.status === 'existing' ? 'text-white' : 'text-black'}`}
                        >
                          <div>Créditos: {item.creditosClase}</div>
                          <div>Semestre: {item.semestreAsignatura}</div>
                          <div>Clases: {item.classCount}</div>
                        </div>

                        {item.programa && (
                          <div
                            className={`text-xs ${item.status === 'existing' ? 'text-white' : 'text-black'}`}
                          >
                            Programa: {item.programa}
                          </div>
                        )}

                        {item.error && (
                          <div
                            className={`text-xs ${item.status === 'existing' ? 'text-white' : 'text-black'}`}
                          >
                            {item.error}
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
                  <li>Solo se importarán las asignaturas nuevas (marcadas en verde)</li>
                  <li>Las asignaturas existentes se omitirán para evitar duplicados</li>
                  <li>Todas las clases asociadas serán importadas junto con sus asignaturas</li>
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
                  <li>
                    <code>codigoAsignatura</code> - Código único de la asignatura
                  </li>
                  <li>
                    <code>nombreAsignatura</code> - Nombre completo de la asignatura
                  </li>
                  <li>
                    <code>creditosClase</code> - Número de créditos
                  </li>
                  <li>
                    <code>programa</code> - Programa académico
                  </li>
                  <li>
                    <code>semestreAsignatura</code> - Semestre correspondiente
                  </li>
                  <li>
                    <code>fechaClase (YYYY-MM-DD)</code> - Fecha de cada clase
                  </li>
                  <li>
                    <code>horaInicio (HH:MM)</code> - Hora de inicio
                  </li>
                  <li>
                    <code>horaFin (HH:MM)</code> - Hora de finalización
                  </li>
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

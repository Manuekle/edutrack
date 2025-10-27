// app/dashboard/(roles)/docente/cargar-asignaturas/page.tsx
'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarX, CheckCircle, ChevronDown, Clock, Download, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

// ... [resto de interfaces y funciones helper permanecen igual] ...
// Helper function to format time with AM/PM
function formatTimeWithAmPm(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12AM
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    return timeString;
  }
}

// Helper function to calculate duration between two time strings (format: HH:MM)
function calculateDuration(startTime: string, endTime: string): string {
  try {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    let totalMinutes = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);

    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Handle overnight
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  } catch (error) {
    return '--';
  }
}

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    onOpenAutoFocus?: (e: React.FocusEvent) => void;
  }
}

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

// Interface for a class's data within the component's state
interface ClassDataItem {
  id: number; // Temporary unique ID for React keys
  fechaClase: string;
  horaInicio: string;
  horaFin: string;
  temaClase: string;
  descripcionClase: string;
}

// Interface for a subject, including its classes, for the preview
interface PreviewItem {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditosClase: number;
  semestreAsignatura: number;
  programa: string;
  status: 'success' | 'error' | 'duplicate';
  classes: ClassDataItem[];
  error?: string;
}

// Interface for the data being edited in the dialog
interface EditableClass {
  subjectCodigo: string;
  subjectName: string;
  classId: string;
  fechaClase: string;
  horaInicio: string;
  horaFin: string;
  temaClase: string;
  descripcionClase: string;
}

export default function UploadSubjectsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [uploadResult, setUploadResult] = useState<{
    processed: number;
    errors: string[];
  } | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<EditableClass | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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
      toast.error('Por favor, selecciona un archivo .xlsx para continuar.');
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
    if (!file) {
      toast.error('No hay archivo para cargar.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    // Incluir los cambios editados en la previsualización para que el backend los procese
    if (isPreview && previewData.length > 0) {
      formData.append('editedPreview', JSON.stringify(previewData));
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
    setExpandedSubjects(new Set());
  };

  const handleNewUpload = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setUploadResult(null);
    setExpandedSubjects(new Set());
  };

  const toggleSubjectExpansion = (subjectCode: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectCode)) {
        newSet.delete(subjectCode);
      } else {
        newSet.add(subjectCode);
      }
      return newSet;
    });
  };

  const handleEditClick = (subject: PreviewItem, cls: ClassDataItem) => {
    setStartTime(cls.horaInicio);
    setEndTime(cls.horaFin);
    setEditingClass({
      subjectCodigo: subject.codigoAsignatura,
      subjectName: subject.nombreAsignatura,
      classId: cls.id.toString(),
      fechaClase: cls.fechaClase,
      horaInicio: cls.horaInicio,
      horaFin: cls.horaFin,
      temaClase: cls.temaClase,
      descripcionClase: cls.descripcionClase,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveClass = () => {
    if (!editingClass) return;

    // Update the editing class with the selected times
    const updatedClass = {
      ...editingClass,
      horaInicio: startTime,
      horaFin: endTime,
    };

    // Update the preview data with the edited class
    setPreviewData(prevData =>
      prevData.map(subject => {
        if (subject.codigoAsignatura !== updatedClass.subjectCodigo) return subject;

        return {
          ...subject,
          classes: subject.classes.map(cls => {
            if (cls.id.toString() !== updatedClass.classId) return cls;

            return {
              ...cls,
              fechaClase: updatedClass.fechaClase,
              horaInicio: updatedClass.horaInicio,
              horaFin: updatedClass.horaFin,
              temaClase: updatedClass.temaClase,
              descripcionClase: updatedClass.descripcionClase,
            };
          }),
        };
      })
    );

    setIsEditDialogOpen(false);
    setEditingClass(null);
    toast.success('Clase actualizada correctamente.');
  };

  const handleEditingClassChange = (
    field: keyof EditableClass,
    value: string | Date | undefined
  ) => {
    if (editingClass) {
      let finalValue = value;
      if (field === 'fechaClase' && value instanceof Date) {
        // Formatear la fecha a YYYY-MM-DD en horario local para evitar desfaces por zona horaria
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');
        finalValue = `${y}-${m}-${d}`;
      }
      setEditingClass({ ...editingClass, [field]: finalValue });
    }
  };

  return (
    <main className="space-y-4">
      {/* Header */}
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="text-2xl font-semibold tracking-heading">
          Cargar Asignaturas y Clases
        </CardTitle>
        <CardDescription className="text-xs">
          Sube un archivo .xlsx para cargar masivamente las asignaturas y sus respectivas clases, o
          utiliza nuestro generador integrado.
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
                    <span className="font-medium">Plantilla Excel:</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Formato tradicional de carga masiva</li>
                    <li>Para usuarios con datos existentes</li>
                    <li>Compatible con sistemas externos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Subir Archivo Excel
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Si ya tienes un archivo Excel con tus datos, súbelo aquí.
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

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Previsualización y Confirmación
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Revisa los datos antes de confirmar la carga. Las filas con errores no serán
                procesadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col justify-center h-full">
              {isLoading && !isPreview ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              ) : uploadResult ? (
                <div className="mt-4 bg-card text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                  <h3 className="font-medium text-xl tracking-heading">Carga completada</h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    Se procesaron {uploadResult.processed} asignaturas.
                  </p>

                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="space-y-3 mt-4 text-left">
                      <p className="text-xs font-medium text-red-600">Detalles de errores:</p>
                      <div className="bg-muted/50 rounded-md p-3 max-h-40 overflow-y-auto">
                        <ul className="list-disc list-inside space-y-1 text-xs text-red-500">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleNewUpload} className="mt-6">
                    Cargar otro archivo
                  </Button>
                </div>
              ) : isPreview && previewData.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="rounded-lg border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/60">
                          <TableHead className="text-xs font-normal px-4 py-2">Código</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2">
                            Nombre Asignatura
                          </TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2">Créditos</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2">Estado</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map(subject => (
                          <React.Fragment key={subject.codigoAsignatura}>
                            <TableRow className="hover:bg-muted/50 transition-colors">
                              <TableCell className="text-xs font-normal px-4 py-2">
                                {subject.codigoAsignatura}
                              </TableCell>
                              <TableCell className="text-xs font-normal px-4 py-2">
                                {subject.nombreAsignatura}
                              </TableCell>
                              <TableCell className="text-xs font-normal px-4 py-2">
                                {subject.creditosClase}
                              </TableCell>
                              <TableCell>
                                {subject.status === 'duplicate' ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Código duplicado
                                  </Badge>
                                ) : subject.status === 'error' ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs font-normal text-white"
                                  >
                                    Asignatura existente
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-normal text-green-600"
                                  >
                                    Listo para cargar
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {subject.classes.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSubjectExpansion(subject.codigoAsignatura)}
                                    className="h-8 w-8 p-0 hover:bg-muted"
                                  >
                                    <ChevronDown
                                      className={`h-4 w-4 transition-transform duration-200 ${
                                        expandedSubjects.has(subject.codigoAsignatura)
                                          ? 'rotate-180'
                                          : ''
                                      }`}
                                    />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>

                            {expandedSubjects.has(subject.codigoAsignatura) && (
                              <TableRow className="hover:bg-muted/5 transition-colors">
                                <TableCell colSpan={5} className="p-0">
                                  <div className="px-6 py-4">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <h4 className="font-normal text-xs">Clases Programadas</h4>
                                      </div>
                                      <Badge variant="secondary" className="font-normal">
                                        {subject.classes.length}{' '}
                                        {subject.classes.length === 1 ? 'clase' : 'clases'}
                                      </Badge>
                                    </div>

                                    {subject.classes.length > 0 ? (
                                      <div className="grid gap-3">
                                        {subject.classes.map(cls => (
                                          <div
                                            key={cls.id}
                                            className="group relative bg-card border rounded-lg p-4"
                                          >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
                                                <div className="space-y-1">
                                                  <p className="text-xs text-muted-foreground">
                                                    Fecha
                                                  </p>
                                                  <p className="text-xs ">
                                                    {(() => {
                                                      // Parsear YYYY-MM-DD como fecha local, con fallback a Date nativo si no coincide el formato
                                                      const parts =
                                                        typeof cls.fechaClase === 'string'
                                                          ? cls.fechaClase.split('-')
                                                          : [];
                                                      const y = Number(parts[0]);
                                                      const m = Number(parts[1]);
                                                      const d = Number(parts[2]);
                                                      const date =
                                                        parts.length === 3 &&
                                                        !isNaN(y) &&
                                                        !isNaN(m) &&
                                                        !isNaN(d)
                                                          ? new Date(y, (m || 1) - 1, d || 1)
                                                          : new Date(cls.fechaClase);
                                                      return date.toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                      });
                                                    })()}
                                                  </p>
                                                </div>
                                                <div className="space-y-1">
                                                  <p className="text-xs text-muted-foreground">
                                                    Hora
                                                  </p>
                                                  <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center text-xs font-normal">
                                                      {formatTimeWithAmPm(cls.horaInicio)}
                                                    </span>
                                                    <span className="text-muted-foreground">-</span>
                                                    <span className="inline-flex items-center text-xs font-normal">
                                                      {formatTimeWithAmPm(cls.horaFin)}
                                                    </span>
                                                  </div>
                                                </div>
                                                <div className="space-y-1">
                                                  <p className="text-xs text-muted-foreground">
                                                    Duración
                                                  </p>
                                                  <p className="text-xs">
                                                    {calculateDuration(cls.horaInicio, cls.horaFin)}
                                                  </p>
                                                </div>
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditClick(subject, cls)}
                                                className="w-full sm:w-auto justify-center gap-1.5"
                                              >
                                                Ver detalle
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 text-center hover:border-muted-foreground/30 transition-colors">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                          <CalendarX className="h-10 w-10 text-muted-foreground/50" />
                                          <p className="text-xs font-medium text-muted-foreground">
                                            No hay clases programadas
                                          </p>
                                          <p className="text-xs text-muted-foreground/70 max-w-md">
                                            Las clases aparecerán aquí cuando sean agregadas al
                                            sistema.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={isLoading || previewData.every(s => s.status !== 'success')}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <></>}
                      Confirmar Carga
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="min-h-[400px] sm:h-[calc(75vh-11.5rem)]">
                  <div className="text-center text-xs flex h-full font-normal items-center justify-center text-muted-foreground py-24">
                    <p>
                      Sube un archivo para ver la previsualización aquí, o utiliza el generador
                      integrado.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {editingClass && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-sans text-xl font-semibold tracking-tight">
                Editar Clase
              </DialogTitle>
              <DialogDescription className="font-sans text-xs text-muted-foreground">
                Modifica los detalles de la clase para la asignatura{' '}
                <span className="font-semibold">
                  {editingClass.subjectName} ({editingClass.subjectCodigo})
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-normal">Fecha</Label>
                <DatePicker
                  value={
                    editingClass.fechaClase
                      ? (() => {
                          // Parsear YYYY-MM-DD como fecha local (evitar new Date('YYYY-MM-DD'))
                          const [yy, mm, dd] = editingClass.fechaClase.split('-').map(Number);
                          return new Date(yy, (mm || 1) - 1, dd || 1);
                        })()
                      : undefined
                  }
                  onChange={date => handleEditingClassChange('fechaClase', date)}
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Hora de Inicio */}
                  <div className="space-y-2">
                    <Label className="text-xs text-normal">Hora de inicio</Label>
                    <TimePicker
                      value={startTime || '07:00'}
                      onChange={newValue => {
                        setStartTime(newValue);
                        const [hStr, mStr = '00'] = newValue.split(':');
                        const startHour = Number.parseInt(hStr, 10);
                        const endHourMin = Math.min(startHour + 2, 22);
                        const requiredMinEnd = `${endHourMin.toString().padStart(2, '0')}:${mStr}`;
                        if (!endTime) {
                          setEndTime(requiredMinEnd);
                        } else {
                          const [eh] = endTime.split(':');
                          if (Number.parseInt(eh, 10) < endHourMin) {
                            setEndTime(requiredMinEnd);
                          }
                        }
                      }}
                      className="w-full"
                    />
                    {!startTime && (
                      <span className="text-muted-foreground text-xs">Requerido</span>
                    )}
                  </div>

                  {/* Hora de Fin */}
                  <div className="space-y-2">
                    <Label className="text-xs text-normal">Hora de fin</Label>
                    <TimePicker
                      value={endTime || ''}
                      onChange={newValue => {
                        if (startTime) {
                          const [sh] = startTime.split(':');
                          const endHour = Number.parseInt(newValue.split(':')[0], 10);
                          const startHour = Number.parseInt(sh, 10);
                          if (endHour < startHour + 2) {
                            const adjustedHour = Math.min(startHour + 2, 22);
                            const minutes = newValue.split(':')[1] || '00';
                            setEndTime(`${adjustedHour.toString().padStart(2, '0')}:${minutes}`);
                            return;
                          }
                        }
                        setEndTime(newValue);
                      }}
                      className="w-full"
                    />
                    {!endTime && startTime && (
                      <span className="text-muted-foreground text-xs">Requerido</span>
                    )}
                    {!startTime && (
                      <span className="text-muted-foreground text-xs">
                        Seleccione hora de inicio primero
                      </span>
                    )}
                  </div>
                </div>

                {/* Indicador de Duración */}
                {startTime && endTime && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                    <Clock className="h-4 w-4" />
                    <span>
                      Duración:{' '}
                      {(() => {
                        const start = Number.parseInt(startTime.split(':')[0]);
                        const end = Number.parseInt(endTime.split(':')[0]);
                        const duration = end - start;
                        return `${duration} ${duration === 1 ? 'hora' : 'horas'}`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic-edit" className="text-xs font-normal">
                  Tema de la Clase
                </Label>
                <Input
                  id="topic-edit"
                  value={editingClass.temaClase}
                  onChange={e => handleEditingClassChange('temaClase', e.target.value)}
                  className="text-xs"
                  placeholder="Ej: Introducción a las Derivadas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcionClase" className="text-xs font-normal">
                  Descripción
                </Label>
                <Input
                  id="descripcionClase"
                  value={editingClass.descripcionClase}
                  onChange={e => handleEditingClassChange('descripcionClase', e.target.value)}
                  className="text-xs"
                  placeholder="Ej: Introducción a las Derivadas"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                className="min-w-[120px]"
                disabled={
                  !editingClass.fechaClase || !startTime || !endTime || startTime >= endTime
                }
                onClick={handleSaveClass}
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}

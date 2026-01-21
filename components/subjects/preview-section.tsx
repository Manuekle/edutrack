'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { CheckCircle, Edit2, FileText, Loader2, Save, X } from 'lucide-react';
import { useState } from 'react';

// Helper function to format time with AM/PM
function formatTimeWithAmPm(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12AM
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeString;
  }
}

// Interface for a class's data within the component's state
export interface ClassDataItem {
  id: number; // Temporary unique ID for React keys
  fechaClase: string;
  horaInicio: string;
  horaFin: string;
  temaClase: string;
  descripcionClase: string;
}

// Interface for a subject, including its classes, for the preview
export interface PreviewItem {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditosClase: number;
  semestreAsignatura: number;
  programa: string;
  status: 'success' | 'error' | 'duplicate';
  classes: ClassDataItem[];
  error?: string;
}

interface PreviewSectionProps {
  isLoading: boolean;
  isPreview: boolean;
  previewData: PreviewItem[];
  uploadResult: {
    processed: number;
    errors: string[];
  } | null;
  onUpload: () => void;
  onNewUpload: () => void;
  onUpdateClass?: (
    subjectCode: string,
    classId: number,
    updatedClass: Partial<ClassDataItem>
  ) => void;
}

export function PreviewSection({
  isLoading,
  isPreview,
  previewData,
  uploadResult,
  onUpload,
  onNewUpload,
  onUpdateClass,
}: PreviewSectionProps) {
  const successCount = previewData.filter(s => s.status === 'success').length;
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editedClassData, setEditedClassData] = useState<Partial<ClassDataItem> | null>(null);

  // Helper to create a unique key for a class
  const getClassKey = (subjectCode: string, classId: number) => `${subjectCode}-${classId}`;

  const handleStartEdit = (subject: PreviewItem, cls: ClassDataItem) => {
    const key = getClassKey(subject.codigoAsignatura, cls.id);
    setEditingClass(key);
    setEditedClassData({ ...cls });
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
    setEditedClassData(null);
  };

  const handleSaveEdit = (subjectCode: string, classId: number) => {
    if (editedClassData && onUpdateClass) {
      onUpdateClass(subjectCode, classId, editedClassData);
    }
    setEditingClass(null);
    setEditedClassData(null);
  };

  // Helper to parse date string to Date object (avoiding timezone issues)
  const parseDateString = (dateString: string): Date | undefined => {
    try {
      if (!dateString) return undefined;

      const dateStr = String(dateString).trim();

      // Format YYYY-MM-DD (ISO format)
      const isoFormat = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (isoFormat) {
        const [, year, month, day] = isoFormat;
        // Create date in local time to avoid timezone issues
        return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
      }

      // Format MM/DD/YYYY (US format - common in CSV)
      const usFormat = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (usFormat) {
        const [, month, day, year] = usFormat;
        // Create date in local time to avoid timezone issues
        return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
      }

      // Format DD/MM/YYYY (European format)
      const euFormat = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (euFormat) {
        const [, day, month, year] = euFormat;
        // Create date in local time to avoid timezone issues
        return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
      }

      // Try parsing as Date and extract components to avoid timezone issues
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        // Extract components and create new date in local time
        const year = parsedDate.getFullYear();
        const month = parsedDate.getMonth();
        const day = parsedDate.getDate();

        // If year seems wrong (timezone issue), try UTC
        if (year < 1970 || year > 2100) {
          const utcYear = parsedDate.getUTCFullYear();
          const utcMonth = parsedDate.getUTCMonth();
          const utcDay = parsedDate.getUTCDate();
          if (utcYear >= 1970 && utcYear <= 2100) {
            return new Date(utcYear, utcMonth, utcDay, 0, 0, 0, 0);
          }
        }

        return new Date(year, month, day, 0, 0, 0, 0);
      }

      return undefined;
    } catch {
      return undefined;
    }
  };

  // Helper to format date to YYYY-MM-DD string
  const formatDateToString = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="lg:col-span-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold tracking-card">
            Previsualización y Confirmación
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Revisa los datos antes de confirmar la carga.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !isPreview ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : uploadResult ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-12 w-12 text-primary" />
              <div className="text-center space-y-1">
                <h3 className="text-2xl tracking-card font-semibold">Carga completada</h3>
                <p className="text-xs text-muted-foreground">
                  Se procesaron {uploadResult.processed} asignaturas.
                </p>
              </div>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="w-full max-w-md space-y-2">
                  <p className="text-xs font-medium text-destructive">Errores:</p>
                  <div className="bg-muted rounded-md p-3 max-h-32 overflow-y-auto">
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <Button onClick={onNewUpload} className="mt-2">
                Cargar otro archivo
              </Button>
            </div>
          ) : isPreview && previewData.length > 0 ? (
            <div className="space-y-3">
              {previewData.map(subject => (
                <div
                  key={subject.codigoAsignatura}
                  className="space-y-2 border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{subject.nombreAsignatura}</span>
                        <Badge
                          variant={subject.status === 'success' ? 'outline' : 'destructive'}
                          className="text-xs"
                        >
                          {subject.status === 'success'
                            ? 'Listo'
                            : subject.status === 'duplicate'
                              ? 'Duplicado'
                              : 'Error'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">{subject.codigoAsignatura}</span>
                        <span>•</span>
                        <span>{subject.creditosClase} créditos</span>
                        {subject.classes.length > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              {subject.classes.length}{' '}
                              {subject.classes.length === 1 ? 'clase' : 'clases'}
                            </span>
                          </>
                        )}
                      </div>
                      {subject.error && (
                        <p className="text-xs text-destructive mt-1">{subject.error}</p>
                      )}
                    </div>
                  </div>

                  {/* Classes - Always visible */}
                  {subject.classes.length > 0 && (
                    <div className="pl-3 space-y-1.5">
                      {subject.classes.map(cls => {
                        const classKey = getClassKey(subject.codigoAsignatura, cls.id);
                        const isEditing = editingClass === classKey;
                        const currentData = isEditing && editedClassData ? editedClassData : cls;

                        return (
                          <div
                            key={cls.id}
                            className="flex items-start justify-between gap-3 py-1.5 pl-2 border-l-2"
                          >
                            <div className="grid grid-cols-4 gap-3 flex-1 text-xs">
                              <div className="min-h-[2.25rem]">
                                <p className="text-muted-foreground text-xs mb-0.5">Fecha</p>
                                {isEditing ? (
                                  <div className="[&_input]:h-9 [&_input]:text-xs">
                                    <DatePicker
                                      value={parseDateString(currentData.fechaClase || '')}
                                      onChange={date => {
                                        if (editedClassData) {
                                          setEditedClassData({
                                            ...editedClassData,
                                            fechaClase: formatDateToString(date),
                                          });
                                        }
                                      }}
                                      className="w-full"
                                    />
                                  </div>
                                ) : (
                                  <p className="font-medium min-h-[2.25rem] flex items-center">
                                    {(() => {
                                      const date = parseDateString(cls.fechaClase);
                                      if (!date) return cls.fechaClase;
                                      return date.toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      });
                                    })()}
                                  </p>
                                )}
                              </div>
                              <div className="min-h-[2.25rem]">
                                <p className="text-muted-foreground text-xs mb-0.5">Hora Inicio</p>
                                {isEditing ? (
                                  <div className="[&_input]:h-9 [&_input]:text-xs">
                                    <TimePicker
                                      value={currentData.horaInicio || ''}
                                      onChange={value => {
                                        if (editedClassData) {
                                          setEditedClassData({
                                            ...editedClassData,
                                            horaInicio: value,
                                          });
                                        }
                                      }}
                                      className="w-full"
                                    />
                                  </div>
                                ) : (
                                  <p className="font-medium min-h-[2.25rem] flex items-center">
                                    {formatTimeWithAmPm(cls.horaInicio)}
                                  </p>
                                )}
                              </div>
                              <div className="min-h-[2.25rem]">
                                <p className="text-muted-foreground text-xs mb-0.5">Hora Fin</p>
                                {isEditing ? (
                                  <div className="[&_input]:h-9 [&_input]:text-xs">
                                    <TimePicker
                                      value={currentData.horaFin || ''}
                                      onChange={value => {
                                        if (editedClassData) {
                                          setEditedClassData({
                                            ...editedClassData,
                                            horaFin: value,
                                          });
                                        }
                                      }}
                                      className="w-full"
                                    />
                                  </div>
                                ) : (
                                  <p className="font-medium min-h-[2.25rem] flex items-center">
                                    {formatTimeWithAmPm(cls.horaFin)}
                                  </p>
                                )}
                              </div>
                              <div className="min-h-[2.25rem]">
                                <p className="text-muted-foreground text-xs mb-0.5">Tema</p>
                                {isEditing ? (
                                  <Input
                                    value={currentData.temaClase || ''}
                                    onChange={e => {
                                      if (editedClassData) {
                                        setEditedClassData({
                                          ...editedClassData,
                                          temaClase: e.target.value,
                                        });
                                      }
                                    }}
                                    placeholder="Tema de la clase"
                                    className="w-full text-xs h-9"
                                  />
                                ) : (
                                  <p className="font-medium truncate min-h-[2.25rem] flex items-center">
                                    {cls.temaClase || '-'}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start pt-[1.625rem]">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-8 w-8 p-0 shadow-sm hover:bg-primary/90 transition-colors"
                                    onClick={() => handleSaveEdit(subject.codigoAsignatura, cls.id)}
                                    title="Guardar cambios"
                                  >
                                    <Save
                                      className="h-4 w-4 text-primary-foreground"
                                      strokeWidth={2.5}
                                    />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 border-muted-foreground/20 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-colors"
                                    onClick={handleCancelEdit}
                                    title="Cancelar edición"
                                  >
                                    <X className="h-4 w-4" strokeWidth={2.5} />
                                  </Button>
                                </>
                              ) : (
                                onUpdateClass && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-muted transition-colors"
                                    onClick={() => handleStartEdit(subject, cls)}
                                    title="Editar clase"
                                  >
                                    <Edit2
                                      className="h-4 w-4 text-muted-foreground"
                                      strokeWidth={2}
                                    />
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {subject.classes.length === 0 && (
                    <div className="pl-3 py-2 text-xs text-muted-foreground">
                      Sin clases programadas
                    </div>
                  )}
                </div>
              ))}

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {successCount > 0 &&
                    `${successCount} ${successCount === 1 ? 'asignatura lista' : 'asignaturas listas'}`}
                </p>
                <Button onClick={onUpload} disabled={isLoading || successCount === 0} size="sm">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar Carga'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
              <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-xs text-muted-foreground text-center max-w-md">
                Sube un archivo Excel (.xlsx) o CSV (.csv) para ver la previsualización aquí.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

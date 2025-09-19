// app/dashboard/(roles)/docente/cargar-asignaturas/generador/page.tsx
'use client';

import { AsignaturasImportDialog } from '@/components/ui/asignaturas-import-dialog';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CheckCircle2, Clock, Download, Edit, Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// Interfaces
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

interface EditingClass extends ClassData {
  subjectId: string;
}

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);

// Función para formatear hora a formato AM/PM
const formatTimeToAMPM = (time24: string) => {
  const [hourStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
};

// Generar opciones de hora de 7AM a 10PM
const generateTimeOptions = () => {
  return Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7; // 7AM a 10PM
    const time24 = `${hour.toString().padStart(2, '0')}:00`;
    return {
      value: time24,
      label: formatTimeToAMPM(time24),
    };
  });
};

const timeOptions = generateTimeOptions();

// Function to calculate duration between two times in HH:MM format
function calculateDuration(startTime: string, endTime: string): string {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  let diffHours = endHours - startHours;
  let diffMinutes = endMinutes - startMinutes;

  if (diffMinutes < 0) {
    diffHours--;
    diffMinutes += 60;
  }

  if (diffHours < 0) {
    diffHours += 24;
  }

  const parts = [];
  if (diffHours > 0) {
    parts.push(`${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`);
  }
  if (diffMinutes > 0) {
    parts.push(`${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`);
  }

  if (parts.length === 0) {
    return '0 minutos';
  }

  return parts.join(' ');
}

export default function GeneradorAsignaturasPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [editingClass, setEditingClass] = useState<EditingClass | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Form states
  const [newSubject, setNewSubject] = useState({
    codigoAsignatura: '',
    nombreAsignatura: '',
    creditosClase: 3,
    programa: '',
    semestreAsignatura: 1,
  });

  const [newClass, setNewClass] = useState({
    fechaClase: '',
    horaInicio: '08:00',
    horaFin: '10:00',
    temaClase: '',
    descripcionClase: '',
  });

  // Auto-save functionality
  useEffect(() => {
    const savedData = localStorage.getItem('subject-generator-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setSubjects(parsedData.subjects || []);
        setLastSaved(parsedData.lastSaved ? new Date(parsedData.lastSaved) : null);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (subjects.length > 0) {
      const dataToSave = {
        subjects,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem('subject-generator-data', JSON.stringify(dataToSave));
      setLastSaved(new Date());
    }
  }, [subjects]);

  const handleAddSubject = () => {
    if (!newSubject.codigoAsignatura || !newSubject.nombreAsignatura) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    // Check for duplicate codes
    if (subjects.some(s => s.codigoAsignatura === newSubject.codigoAsignatura)) {
      toast.error('Ya existe una asignatura con este código');
      return;
    }

    const subject: SubjectData = {
      id: generateId(),
      ...newSubject,
      classes: [],
    };

    setSubjects(prev => [...prev, subject]);
    setNewSubject({
      codigoAsignatura: '',
      nombreAsignatura: '',
      creditosClase: 3,
      programa: '',
      semestreAsignatura: 1,
    });
    setIsAddSubjectOpen(false);
    toast.success('Asignatura agregada correctamente');
  };

  const handleAddClass = () => {
    if (!selectedSubjectId || !newClass.fechaClase || !newClass.horaInicio || !newClass.horaFin) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const classData: ClassData = {
      id: generateId(),
      ...newClass,
    };

    setSubjects(prev =>
      prev.map(subject =>
        subject.id === selectedSubjectId
          ? { ...subject, classes: [...subject.classes, classData] }
          : subject
      )
    );

    setNewClass({
      fechaClase: '',
      horaInicio: '08:00',
      horaFin: '10:00',
      temaClase: '',
      descripcionClase: '',
    });
    setIsAddClassOpen(false);
    toast.success('Clase agregada correctamente');
  };

  const handleEditClass = (subjectId: string, classData: ClassData) => {
    setEditingClass({ ...classData, subjectId });
    setIsEditClassOpen(true);
  };

  const handleUpdateClass = () => {
    if (!editingClass) return;

    setSubjects(prev =>
      prev.map(subject =>
        subject.id === editingClass.subjectId
          ? {
              ...subject,
              classes: subject.classes.map(cls =>
                cls.id === editingClass.id
                  ? {
                      ...editingClass,
                      // Asegurarse de que no se incluya subjectId en el objeto de clase final
                      subjectId: undefined,
                    }
                  : cls
              ),
            }
          : subject
      )
    );

    setEditingClass(null);
    setIsEditClassOpen(false);
    setIsEditClassOpen(false);
    toast.success('Clase actualizada correctamente');
  };

  const handleDeleteClass = (subjectId: string, classId: string) => {
    setSubjects(prev =>
      prev.map(subject =>
        subject.id === subjectId
          ? { ...subject, classes: subject.classes.filter(cls => cls.id !== classId) }
          : subject
      )
    );
    toast.success('Clase eliminada correctamente');
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(subject => subject.id !== subjectId));
    toast.success('Asignatura eliminada correctamente');
  };

  const handleExportToExcel = () => {
    if (subjects.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const flatData = subjects.flatMap(subject =>
      subject.classes.map(cls => ({
        codigoAsignatura: subject.codigoAsignatura,
        nombreAsignatura: subject.nombreAsignatura,
        'fechaClase (YYYY-MM-DD)': cls.fechaClase,
        'horaInicio (HH:MM)': cls.horaInicio,
        'horaFin (HH:MM)': cls.horaFin,
        temaClase: cls.temaClase,
        descripcionClase: cls.descripcionClase,
        creditosClase: subject.creditosClase,
        programa: subject.programa,
        semestreAsignatura: subject.semestreAsignatura,
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asignaturas');

    const fileName = `asignaturas_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('Archivo Excel exportado correctamente');
  };

  const handleImportFromExcel = (data: SubjectData[]) => {
    console.log('Datos importados:', data);
    setSubjects(prev => [...prev, ...data]);
    toast.success('Asignaturas importadas correctamente');
  };

  const handleSubmitToSystem = async () => {
    if (subjects.length === 0) {
      toast.error('No hay asignaturas para enviar al sistema');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/docente/cargar-asignaturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editedPreview: JSON.stringify(subjects),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar al sistema');
      }

      toast.success(`Se procesaron ${result.processed} asignaturas correctamente`);

      // Clear local data after successful submission
      localStorage.removeItem('subject-generator-data');
      setSubjects([]);
      setLastSaved(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generador de Asignaturas</h1>
          <p className="text-xs text-muted-foreground">
            Crea y gestiona tus asignaturas directamente desde la plataforma
          </p>
          {lastSaved && (
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Autoguardado: {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="text-xs">
            <Upload className="h-4 w-4 mr-1" />
            Importar Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={subjects.length === 0}
            className="text-xs"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={() => setIsAddSubjectOpen(true)} className="text-xs">
          Agregar Asignatura
        </Button>
      </div>

      {/* Subjects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg tracking-heading">
            Asignaturas Creadas ({subjects.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Gestiona todas las asignaturas y sus clases desde aquí
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xs mb-2">No hay asignaturas</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Comienza agregando una nueva asignatura o importa datos desde Excel
              </p>
              <Button onClick={() => setIsAddSubjectOpen(true)}>Agregar Primera Asignatura</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subjects.map(subject => (
                <div key={subject.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xs font-medium">
                        {subject.nombreAsignatura} ({subject.codigoAsignatura})
                      </h3>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>Créditos: {subject.creditosClase}</span>
                        <span>Programa: {subject.programa}</span>
                        <span>Semestre: {subject.semestreAsignatura}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSubjectId(subject.id);
                          setIsAddClassOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Clase
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {subject.classes.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Clases ({subject.classes.length})
                      </h4>
                      <div className="grid gap-2">
                        {subject.classes.map(cls => (
                          <div key={cls.id} className="bg-muted/30 rounded p-3 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="grid grid-cols-4 gap-4 flex-1">
                                <div>
                                  <span className="text-xs text-muted-foreground">Fecha:</span>
                                  <p>{new Date(cls.fechaClase).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Horario:</span>
                                  <p>
                                    {formatTimeToAMPM(cls.horaInicio)} -{' '}
                                    {formatTimeToAMPM(cls.horaFin)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Tema:</span>
                                  <p>{cls.temaClase || 'Sin tema'}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Duración:</span>
                                  <p>{calculateDuration(cls.horaInicio, cls.horaFin)}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditClass(subject.id, cls)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteClass(subject.id, cls.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-muted-foreground/20 rounded">
                      <p className="text-xs text-muted-foreground">No hay clases programadas</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for adding a new class */}
      <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-semibold text-xl tracking-tight">
              Nueva Clase
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Agrega los detalles de la nueva clase
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col gap-2">
              <Label>Fecha de Clase</Label>
              <DatePicker
                value={
                  newClass.fechaClase ? new Date(newClass.fechaClase.replace(/-/g, '/')) : undefined
                }
                onChange={date =>
                  setNewClass(prev => ({
                    ...prev,
                    fechaClase: date ? date.toISOString().split('T')[0] : '',
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-normal">Hora de inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-xs h-9"
                      type="button"
                    >
                      <Clock className="mr-2 h-4 w-4 opacity-50" />
                      {newClass.horaInicio ? formatTimeToAMPM(newClass.horaInicio) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <div className="max-h-60 overflow-y-auto p-2">
                      {timeOptions.map(time => (
                        <Button
                          key={time.value}
                          variant="ghost"
                          className="font-sans w-full justify-center text-center h-9 px-3 text-xs hover:bg-accent rounded-sm"
                          onClick={() => {
                            const startHour = parseInt(time.value.split(':')[0]);
                            const defaultEndHour =
                              (startHour + 1).toString().padStart(2, '0') + ':00';
                            setNewClass(prev => ({
                              ...prev,
                              horaInicio: time.value,
                              horaFin:
                                !prev.horaFin || prev.horaFin <= time.value
                                  ? defaultEndHour
                                  : prev.horaFin,
                            }));
                          }}
                          type="button"
                        >
                          {time.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-normal">Hora de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-xs h-9"
                      type="button"
                      disabled={!newClass.horaInicio}
                    >
                      <Clock className="mr-2 h-4 w-4 opacity-50" />
                      {newClass.horaFin ? formatTimeToAMPM(newClass.horaFin) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <div className="max-h-60 overflow-y-auto p-2">
                      {timeOptions
                        .filter(time => !newClass.horaInicio || time.value > newClass.horaInicio)
                        .map(time => (
                          <Button
                            key={time.value}
                            variant="ghost"
                            className="font-sans w-full justify-center text-center h-9 px-3 text-xs hover:bg-accent rounded-sm"
                            onClick={() => {
                              setNewClass(prev => ({ ...prev, horaFin: time.value }));
                            }}
                            type="button"
                          >
                            {time.label}
                          </Button>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {newClass.horaInicio && newClass.horaFin && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                <Clock className="h-4 w-4" />
                <span>Duración: {calculateDuration(newClass.horaInicio, newClass.horaFin)}</span>
              </div>
            )}
            {newClass.horaInicio && newClass.horaFin && newClass.horaFin <= newClass.horaInicio && (
              <p className="text-sm text-destructive">
                La hora de fin debe ser posterior a la hora de inicio.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label>Tema de la Clase</Label>
              <Input
                value={newClass.temaClase}
                onChange={e => setNewClass(prev => ({ ...prev, temaClase: e.target.value }))}
                placeholder="Ej: Introducción a las Derivadas"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Descripción</Label>
              <Textarea
                value={newClass.descripcionClase}
                className="resize-none"
                onChange={e => setNewClass(prev => ({ ...prev, descripcionClase: e.target.value }))}
                placeholder="Descripción detallada de la clase..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddClass} disabled={!selectedSubjectId}>
              Agregar Clase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Button */}
      {subjects.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitToSystem}
            disabled={isSaving}
            variant="default"
            className="text-xs"
          >
            {isSaving ? (
              <>Enviando al Sistema...</>
            ) : (
              <>Enviar al Sistema ({subjects.length} asignaturas)</>
            )}
          </Button>
        </div>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
        <DialogContent className="sm:max-w-[500px] font-sans">
          <DialogHeader>
            <DialogTitle className="font-semibold text-xl tracking-card">
              Agregar Nueva Asignatura
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Completa la información básica de la asignatura
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label>Código de Asignatura</Label>
              <Input
                value={newSubject.codigoAsignatura}
                onChange={e =>
                  setNewSubject(prev => ({ ...prev, codigoAsignatura: e.target.value }))
                }
                placeholder="Ej: MAT101"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Nombre de Asignatura</Label>
              <Input
                value={newSubject.nombreAsignatura}
                onChange={e =>
                  setNewSubject(prev => ({ ...prev, nombreAsignatura: e.target.value }))
                }
                placeholder="Ej: Cálculo Diferencial"
              />
            </div>
            <div className="flex flex-row gap-2">
              <div className="flex flex-col gap-2 w-1/2">
                <Label>Créditos</Label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={newSubject.creditosClase}
                  onChange={e =>
                    setNewSubject(prev => ({ ...prev, creditosClase: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2 w-1/2">
                <Label>Semestre</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={newSubject.semestreAsignatura}
                  onChange={e =>
                    setNewSubject(prev => ({
                      ...prev,
                      semestreAsignatura: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Programa</Label>
              <Input
                value={newSubject.programa}
                onChange={e => setNewSubject(prev => ({ ...prev, programa: e.target.value }))}
                placeholder="Ej: Ingeniería de Sistemas"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddSubject}>Agregar Asignatura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingClass && (
        <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-foreground font-semibold text-xl tracking-tight">
                Editar Clase
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Modifica los detalles de la clase
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex flex-col gap-2">
                <Label>Fecha de Clase</Label>
                <DatePicker
                  value={
                    editingClass.fechaClase
                      ? new Date(editingClass.fechaClase.replace(/-/g, '/'))
                      : undefined
                  }
                  onChange={date =>
                    setEditingClass(prev =>
                      prev
                        ? {
                            ...prev,
                            fechaClase: date ? date.toISOString().split('T')[0] : '',
                          }
                        : null
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-normal">Hora de inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-xs h-9"
                        type="button"
                      >
                        <Clock className="mr-2 h-4 w-4 opacity-50" />
                        {editingClass?.horaInicio
                          ? formatTimeToAMPM(editingClass.horaInicio)
                          : 'Seleccionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0" align="start">
                      <div className="max-h-60 overflow-y-auto p-2">
                        {timeOptions.map(time => (
                          <Button
                            key={time.value}
                            variant="ghost"
                            className="font-sans w-full justify-center text-center h-9 px-3 text-xs hover:bg-accent rounded-sm"
                            onClick={() => {
                              const startHour = parseInt(time.value.split(':')[0]);
                              const defaultEndHour =
                                (startHour + 1).toString().padStart(2, '0') + ':00';
                              setEditingClass(prev =>
                                prev
                                  ? {
                                      ...prev,
                                      horaInicio: time.value,
                                      horaFin:
                                        !prev.horaFin || prev.horaFin <= time.value
                                          ? defaultEndHour
                                          : prev.horaFin,
                                    }
                                  : null
                              );
                            }}
                            type="button"
                          >
                            {time.label}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-normal">Hora de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-xs h-9"
                        type="button"
                        disabled={!editingClass?.horaInicio}
                      >
                        <Clock className="mr-2 h-4 w-4 opacity-50" />
                        {editingClass?.horaFin
                          ? formatTimeToAMPM(editingClass.horaFin)
                          : 'Seleccionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0" align="start">
                      <div className="max-h-60 overflow-y-auto p-2">
                        {timeOptions
                          .filter(
                            time =>
                              !editingClass?.horaInicio || time.value > editingClass.horaInicio
                          )
                          .map(time => (
                            <Button
                              key={time.value}
                              variant="ghost"
                              className="font-sans w-full justify-center text-center h-9 px-3 text-xs hover:bg-accent rounded-sm"
                              onClick={() => {
                                setEditingClass(prev =>
                                  prev ? { ...prev, horaFin: time.value } : null
                                );
                              }}
                              type="button"
                            >
                              {time.label}
                            </Button>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {editingClass?.horaInicio && editingClass?.horaFin && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                  <Clock className="h-4 w-4" />
                  <span>
                    Duración: {calculateDuration(editingClass.horaInicio, editingClass.horaFin)}
                  </span>
                </div>
              )}
              {editingClass?.horaInicio &&
                editingClass?.horaFin &&
                editingClass.horaFin <= editingClass.horaInicio && (
                  <p className="text-sm text-destructive mt-2">
                    La hora de fin debe ser posterior a la hora de inicio.
                  </p>
                )}
              <div className="flex flex-col gap-2">
                <Input
                  value={editingClass.temaClase}
                  onChange={e =>
                    setEditingClass(prev => (prev ? { ...prev, temaClase: e.target.value } : null))
                  }
                  placeholder="Ej: Introducción a las Derivadas"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Descripción</Label>
                <Textarea
                  value={editingClass.descripcionClase}
                  className="resize-none"
                  onChange={e =>
                    setEditingClass(prev =>
                      prev ? { ...prev, descripcionClase: e.target.value } : null
                    )
                  }
                  placeholder="Descripción detallada de la clase..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleUpdateClass}>Actualizar Clase</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Import Dialog */}
      <AsignaturasImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImportFromExcel}
        existingCodes={new Set(subjects.map(s => s.codigoAsignatura))}
      />
    </main>
  );
}

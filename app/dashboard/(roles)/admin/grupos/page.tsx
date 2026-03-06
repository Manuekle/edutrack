'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Calendar,
  CheckCircle,
  Download,
  Edit2,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface ScheduleEntry {
  dia: string;
  horaInicio: string;
  horaFin: string;
  salon: string;
}

interface PreviewItem {
  id: string;
  codigoAsignatura: string;
  grupo: string;
  jornada: string;
  dia?: string;
  status: 'success' | 'error' | 'existing' | 'manual';
  message: string;
  maxCapacity?: number;
  schedule?: ScheduleEntry[];
}

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const JORNADAS = ['DIURNO', 'NOCTURNO'];

export default function GruposHorariosPage() {
  const [mode, setMode] = useState<'csv' | 'manual'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<{ created: number; errors: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    grupo: 'A',
    jornada: 'DIURNO',
    capacidad: '30',
    dia: 'LUNES',
    horaInicio: '07:00',
    horaFin: '09:00',
    salon: '',
  });

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await fetch('/api/admin/subjects');
        const data = await res.json();
        setSubjects(data.data || []);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, []);

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
      sileo.error({
        title: 'Archivo requerido',
        description: 'Por favor, selecciona un archivo .csv para continuar.',
      });
      return;
    }
    if (!selectedSubject) {
      sileo.error({
        title: 'Campo requerido',
        description: 'Por favor, selecciona una asignatura.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/admin/subjects/${selectedSubject}/groups?preview=true`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const dataWithIds = (result.previewData || []).map((item: PreviewItem, index: number) => ({
          ...item,
          id: `csv-${index}-${Date.now()}`,
        }));
        setPreviewData(dataWithIds);
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

  const handleAddManual = () => {
    if (!selectedSubject) {
      sileo.error({
        title: 'Campo requerido',
        description: 'Selecciona una asignatura.',
      });
      return;
    }

    const subject = subjects.find(s => s.id === selectedSubject);

    const newItem: PreviewItem = {
      id: `manual-${Date.now()}`,
      codigoAsignatura: subject?.code || '',
      grupo: manualForm.grupo,
      jornada: manualForm.jornada,
      status: 'manual',
      message: 'Nuevo',
      maxCapacity: parseInt(manualForm.capacidad) || 30,
      schedule: manualForm.dia
        ? [
          {
            dia: manualForm.dia,
            horaInicio: manualForm.horaInicio,
            horaFin: manualForm.horaFin,
            salon: manualForm.salon || 'Por asignar',
          },
        ]
        : undefined,
    };

    setPreviewData([...previewData, newItem]);
    setIsPreview(true);
    sileo.success({
      title: 'Grupo agregado',
      description: 'El grupo ha sido añadido a la lista.',
    });
  };

  const handleEditItem = (id: string) => {
    // Editing disabled as per original logic for multi-select pattern
    sileo.info({
      title: 'Información',
      description: 'Para modificar, elimina el grupo y agrégalo nuevamente.',
    });
    const item = previewData.find(i => i.id === id);
    if (item) {
      setManualForm({
        grupo: item.grupo,
        jornada: item.jornada,
        capacidad: (item.maxCapacity || 30).toString(),
        dia: item.schedule?.[0]?.dia || 'LUNES',
        horaInicio: item.schedule?.[0]?.horaInicio || '07:00',
        horaFin: item.schedule?.[0]?.horaFin || '09:00',
        salon: item.schedule?.[0]?.salon || '',
      });
      setEditingId(id);
    }
  };

  const handleUpdateItem = () => {
    if (!editingId) return;
    const subject = subjects.find(s => s.id === selectedSubject);

    setPreviewData(
      previewData.map(item =>
        item.id === editingId
          ? {
            ...item,
            grupo: manualForm.grupo,
            jornada: manualForm.jornada,
            maxCapacity: parseInt(manualForm.capacidad) || 30,
            schedule: manualForm.dia
              ? [
                {
                  dia: manualForm.dia,
                  horaInicio: manualForm.horaInicio,
                  horaFin: manualForm.horaFin,
                  salon: manualForm.salon || 'Por asignar',
                },
              ]
              : undefined,
          }
          : item
      )
    );
    setEditingId(null);
    setManualForm({
      grupo: 'A',
      jornada: 'DIURNO',
      capacidad: '30',
      dia: 'LUNES',
      horaInicio: '07:00',
      horaFin: '09:00',
      salon: '',
    });
    sileo.success({
      title: 'Grupo actualizado',
      description: 'El grupo ha sido actualizado.',
    });
  };

  const handleDeleteItem = (id: string) => {
    setPreviewData(previewData.filter(item => item.id !== id));
  };

  const handleConfirmUpload = async () => {
    const successCount = previewData.filter(item => item.status !== 'error').length;
    if (successCount === 0) {
      sileo.error({
        title: 'Sin datos válidos',
        description: 'No hay grupos válidos para procesar.',
      });
      return;
    }

    if (!selectedSubject) {
      sileo.error({
        title: 'Campo requerido',
        description: 'Selecciona una asignatura.',
      });
      return;
    }

    setIsConfirming(true);
    try {
      const formData = new FormData();
      const csvContent = previewData
        .map(
          item =>
            `${item.grupo},${item.jornada},${item.dia || ''},${item.schedule?.[0]?.horaInicio || ''},${item.schedule?.[0]?.horaFin || ''},${item.schedule?.[0]?.salon || ''}`
        )
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', blob, 'temp.csv');

      const response = await fetch(`/api/admin/subjects/${selectedSubject}/groups`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar la carga.');
      }

      sileo.success({
        title: 'Carga exitosa',
        description: 'Grupos procesados exitosamente.',
      });
      setFinalResults({
        created: result.summary?.created || 0,
        errors: result.summary?.errors || 0,
      });
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
    setEditingId(null);
    setManualForm({
      grupo: 'A',
      jornada: 'DIURNO',
      capacidad: '30',
      dia: 'LUNES',
      horaInicio: '07:00',
      horaFin: '09:00',
      salon: '',
    });
  };

  const handleNewUpload = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setFinalResults(null);
    setEditingId(null);
  };

  const successCount = previewData.filter(item => item.status !== 'error').length;
  const existingCount = previewData.filter(item => item.status === 'existing').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full">
          <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
            Grupos y Horarios
          </CardTitle>
          <CardDescription className="text-xs">
            Crea grupos y horarios para las asignaturas de forma manual o masiva.
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2">
          <Button
            variant={mode === 'csv' ? 'default' : 'outline'}
            onClick={() => {
              setMode('csv');
              handleCancel();
            }}
            className="text-xs"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Carga Masiva (CSV)
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => setMode('manual')}
            className="text-xs"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Manual
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Select Subject - Standard Card */}
          <Card className="overflow-hidden border shadow-xs">
            <CardHeader className="border-b px-5 py-4 bg-muted/10">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                Asignatura Destino
              </CardTitle>
              <CardDescription className="text-[11px] mt-0.5">
                Selecciona la asignatura a la que se cargarán los grupos.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={isLoadingSubjects}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecciona una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id} className="text-xs">
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {mode === 'csv' ? (
            <>
              <Card className="overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    1. Instrucciones del Formato
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Sigue estos pasos para la carga masiva.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">Plantilla base</p>
                      <a href="/formatos/plantilla_grupos_horarios.csv" download className="block">
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
                          <li><span className="font-semibold text-foreground">Estructura</span>: Grupo, Jornada</li>
                          <li><span className="font-semibold text-foreground">Horario</span>: Día, Inicio, Fin</li>
                          <li><span className="font-semibold text-foreground">Ubicación</span>: Salón asignado</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    2. Subir Archivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handlePreview}
                      disabled={!file || !selectedSubject || isLoading || isPreview}
                      className="flex-1 text-xs h-9"
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
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="overflow-hidden border shadow-xs">
              <CardHeader className="border-b px-5 py-4 bg-muted/10">
                <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                  {editingId ? 'Editar Grupo' : 'Nuevo Grupo Manual'}
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Completa los detalles del grupo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Grupo</Label>
                    <Input
                      className="h-9 text-xs"
                      value={manualForm.grupo}
                      onChange={e => setManualForm({ ...manualForm, grupo: e.target.value })}
                      placeholder="Ej: A"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Capacidad</Label>
                    <Input
                      type="number"
                      className="h-9 text-xs"
                      value={manualForm.capacidad}
                      onChange={e => setManualForm({ ...manualForm, capacidad: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Jornada</Label>
                  <Select
                    value={manualForm.jornada}
                    onValueChange={v => setManualForm({ ...manualForm, jornada: v })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JORNADAS.map(j => (
                        <SelectItem key={j} value={j} className="text-xs">
                          {j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Salón</Label>
                  <Input
                    className="h-9 text-xs"
                    value={manualForm.salon}
                    onChange={e => setManualForm({ ...manualForm, salon: e.target.value })}
                    placeholder="Ej: Lab 201"
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t">
                  <Label className="text-xs font-semibold">Horario Primera Franja</Label>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="col-span-2">
                      <Select
                        value={manualForm.dia}
                        onValueChange={v => setManualForm({ ...manualForm, dia: v })}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Día" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAS.map(d => (
                            <SelectItem key={d} value={d} className="text-xs">
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Inicio</Label>
                      <TimePicker
                        value={manualForm.horaInicio}
                        onChange={v => setManualForm({ ...manualForm, horaInicio: v })}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Fin</Label>
                      <TimePicker
                        value={manualForm.horaFin}
                        onChange={v => setManualForm({ ...manualForm, horaFin: v })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {editingId ? (
                    <>
                      <Button onClick={handleUpdateItem} className="flex-1 h-9 text-xs">
                        Guardar Cambios
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setEditingId(null);
                          handleCancel();
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleAddManual} className="w-full h-9 text-xs">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar a la Lista
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden border shadow-xs">
            <CardHeader className="border-b px-5 py-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    Grupos para Cargar ({previewData.length})
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    {selectedSubjectData
                      ? `Destino: ${selectedSubjectData.code} - ${selectedSubjectData.name}`
                      : 'Selecciona una asignatura para continuar'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading && !isPreview ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground animate-pulse">Procesando...</p>
                </div>
              ) : finalResults ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center p-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="sm:text-xl text-lg tracking-heading font-semibold">
                      ¡Carga Exitosa!
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Se han creado {finalResults.created} grupos correctamente.
                    </p>
                  </div>
                  <Button onClick={handleNewUpload} variant="outline" className="mt-4 h-9 text-xs">
                    Realizar nueva carga
                  </Button>
                </div>
              ) : previewData.length > 0 ? (
                <div className="relative overflow-x-auto overflow-y-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="bg-muted/5 sticky top-0 z-10">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="text-[10px] font-semibold px-4 py-3 text-muted-foreground ">
                          Grupo
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold px-4 py-3 text-muted-foreground ">
                          Jornada / Cupo
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold px-4 py-3 text-muted-foreground ">
                          Horario Principal
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold px-4 py-3 text-muted-foreground  text-right">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-muted/20 transition-colors border-b"
                        >
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-md bg-muted/60 flex items-center justify-center font-semibold text-xs">
                                {item.grupo}
                              </div>
                              <Badge variant="outline" className="text-[9px] h-5 bg-background">
                                {item.status === 'manual' ? 'Manual' : 'CSV'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold text-foreground">
                                {item.jornada}
                              </span>
                              <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                                <Users className="h-2.5 w-2.5" />
                                Cupos: {item.maxCapacity || 30}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {item.schedule && item.schedule.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-foreground">
                                  {item.schedule[0].dia}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {item.schedule[0].horaInicio} - {item.schedule[0].horaFin} ({item.schedule[0].salon})
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Sin horario asignado
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                onClick={() => handleEditItem(item.id)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] py-12 text-center p-6">
                  <div className="bg-muted/30 p-4 rounded-full mb-4">
                    <Calendar className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Sin grupos para cargar</h4>
                  <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
                    {mode === 'csv'
                      ? 'Sube un archivo CSV de grupos o utiliza el formulario manual para ver los datos aquí.'
                      : 'Agrega grupos usando el formulario lateral para ver el resumen.'}
                  </p>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="border-t px-5 py-4 bg-muted/5 flex items-center justify-between gap-4">
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-xs font-semibold text-foreground">Resumen</span>
                    <span className="text-[11px] text-muted-foreground">
                      {successCount} grupo{successCount !== 1 ? 's' : ''} listo{successCount !== 1 ? 's' : ''} para crear
                    </span>
                  </div>
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={isConfirming || successCount === 0 || !selectedSubject}
                    className="h-9 px-6 text-xs font-semibold min-w-[150px]"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Confirmar y Crear'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

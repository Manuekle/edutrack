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
import { TimePicker } from '@/components/ui/time-picker';
import {
  Calendar,
  CheckCircle,
  Download,
  Edit2,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
      toast.error('Por favor, selecciona un archivo .csv para continuar.');
      return;
    }
    if (!selectedSubject) {
      toast.error('Por favor, selecciona una asignatura.');
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

  const handleAddManual = () => {
    if (!selectedSubject) {
      toast.error('Por favor, selecciona una asignatura.');
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
    toast.success('Grupo agregado');
  };

  const handleEditItem = (id: string) => {
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
    toast.success('Grupo actualizado');
  };

  const handleDeleteItem = (id: string) => {
    setPreviewData(previewData.filter(item => item.id !== id));
  };

  const handleConfirmUpload = async () => {
    const successCount = previewData.filter(item => item.status !== 'error').length;
    if (successCount === 0) {
      toast.error('No hay grupos válidos para crear.');
      return;
    }

    if (!selectedSubject) {
      toast.error('Selecciona una asignatura.');
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

      toast.success(`Se crearon ${result.summary?.created || 0} grupos.`);
      setFinalResults({
        created: result.summary?.created || 0,
        errors: result.summary?.errors || 0,
      });
      setPreviewData([]);
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
    <main className="space-y-4">
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
          Grupos y Horarios
        </CardTitle>
        <CardDescription className="text-xs">
          Crea grupos y horarios para las asignaturas.
        </CardDescription>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-2 mb-4">
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
          onClick={() => {
            setMode('manual');
          }}
          className="text-xs"
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Manual
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Select Subject */}
          <Card>
            <CardHeader>
              <CardTitle className="sm:text-md text-xs font-semibold">
                Seleccionar Asignatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={isLoadingSubjects}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {mode === 'csv' ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="sm:text-md text-xs font-semibold">Carga Masiva</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Sube un archivo CSV con los grupos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a href="/formatos/plantilla_grupos_horarios.csv" download>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Plantilla
                    </Button>
                  </a>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Columnas:</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>Grupo</li>
                      <li>Jornada (DIURNO/NOCTURNO)</li>
                      <li>Día</li>
                      <li>Hora Inicio</li>
                      <li>Hora Fin</li>
                      <li>Salón</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="sm:text-md text-xs font-semibold">Subir Archivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
                  <div className="flex gap-2 mt-4 flex-col">
                    <Button
                      onClick={handlePreview}
                      disabled={!file || !selectedSubject || isLoading || isPreview}
                      className="w-full text-xs"
                    >
                      {isLoading && !isPreview ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Vista Previa
                    </Button>
                    {(file || isPreview) && (
                      <Button
                        onClick={handleCancel}
                        variant="destructive"
                        className="w-full text-xs"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="sm:text-md text-xs font-semibold">
                  {editingId ? 'Editar Grupo' : 'Nuevo Grupo'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Grupo</Label>
                    <Input
                      value={manualForm.grupo}
                      onChange={e => setManualForm({ ...manualForm, grupo: e.target.value })}
                      placeholder="A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jornada</Label>
                    <Select
                      value={manualForm.jornada}
                      onValueChange={v => setManualForm({ ...manualForm, jornada: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JORNADAS.map(j => (
                          <SelectItem key={j} value={j}>
                            {j}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    value={manualForm.capacidad}
                    onChange={e => setManualForm({ ...manualForm, capacidad: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Día</Label>
                  <Select
                    value={manualForm.dia}
                    onValueChange={v => setManualForm({ ...manualForm, dia: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAS.map(d => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Hora Inicio</Label>
                    <TimePicker
                      value={manualForm.horaInicio}
                      onChange={v => setManualForm({ ...manualForm, horaInicio: v })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fin</Label>
                    <TimePicker
                      value={manualForm.horaFin}
                      onChange={v => setManualForm({ ...manualForm, horaFin: v })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Salón</Label>
                  <Input
                    value={manualForm.salon}
                    onChange={e => setManualForm({ ...manualForm, salon: e.target.value })}
                    placeholder="Por asignar"
                  />
                </div>
                <div className="flex gap-2">
                  {editingId ? (
                    <>
                      <Button onClick={handleUpdateItem} className="flex-1">
                        Actualizar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          handleCancel();
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleAddManual} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="sm:text-md text-xs font-semibold">
                Grupos ({previewData.length})
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {selectedSubjectData
                  ? `Asignatura: ${selectedSubjectData.code} - ${selectedSubjectData.name}`
                  : 'Selecciona una asignatura'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && !isPreview && !finalResults ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : finalResults ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <CheckCircle className="h-16 w-16 text-primary" />
                  <div className="space-y-1">
                    <h3 className="sm:text-md text-xs tracking-card font-semibold">
                      Carga completada
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Se crearon {finalResults.created} grupos.
                    </p>
                  </div>
                  <Button onClick={handleNewUpload} className="mt-4">
                    Crear más grupos
                  </Button>
                </div>
              ) : previewData.length > 0 ? (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {previewData.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm">
                              Grupo {item.grupo} - {item.jornada}
                            </h4>
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {item.status === 'manual'
                                ? 'Manual'
                                : item.status === 'existing'
                                  ? 'Existe'
                                  : 'CSV'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Cupo: {item.maxCapacity || 30}
                          </div>
                          {item.schedule && item.schedule.length > 0 && (
                            <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                              {item.schedule.map((slot, i) => (
                                <div key={i}>
                                  {slot.dia} {slot.horaInicio}-{slot.horaFin} ({slot.salon})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditItem(item.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Selecciona una asignatura y agrega grupos.
                  </p>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    {successCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-500/10 text-emerald-600"
                      >
                        {successCount} nuevos
                      </Badge>
                    )}
                    {existingCount > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600">
                        {existingCount} existentes
                      </Badge>
                    )}
                    {errorCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {errorCount} errores
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={isConfirming || successCount === 0 || !selectedSubject}
                    className="px-8"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
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
    </main>
  );
}

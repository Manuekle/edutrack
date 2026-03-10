'use client';

import React from 'react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimePicker } from '@/components/ui/time-picker';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Download,
  Edit2,
  FileSpreadsheet,
  Loader2,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Subject {
  id: string;
  code: string;
  name: string;
  periodoAcademico?: string | null;
}

interface Docente {
  id: string;
  name: string | null;
  document: string | null;
}

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
}

interface CreatedGroup {
  id: string;
  code: string;
  name: string;
  group: string | null;
  jornada: string | null;
  periodoAcademico: string | null;
  program: string | null;
  teachers: { id: string; name: string | null }[];
  _count: { classes: number };
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
  const [selectedDocente, setSelectedDocente] = useState<string>('');
  const [periodo, setPeriodo] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [createdGroups, setCreatedGroups] = useState<CreatedGroup[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingCreatedGroups, setIsLoadingCreatedGroups] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [finalResults, setFinalResults] = useState<{ created: number; errors: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingDocentes, setIsLoadingDocentes] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  // For editing rows in the created groups table
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupForm, setEditGroupForm] = useState<{ group: string; jornada: string; periodoAcademico: string }>({ group: '', jornada: '', periodoAcademico: '' });
  const [isSavingGroup, setIsSavingGroup] = useState(false);

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

  const loadCreatedGroups = async () => {
    try {
      const res = await fetch('/api/admin/grupos');
      const data = await res.json();
      setCreatedGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading created groups:', error);
    } finally {
      setIsLoadingCreatedGroups(false);
    }
  };

  const handleSaveGroupEdit = async () => {
    if (!editingGroupId) return;
    setIsSavingGroup(true);
    try {
      const res = await fetch(`/api/admin/subjects/${editingGroupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGroupForm),
      });
      if (res.ok) {
        sileo.success({ title: 'Grupo actualizado', description: 'Los cambios se guardaron correctamente.' });
        setEditingGroupId(null);
        loadCreatedGroups();
      } else {
        const data = await res.json();
        sileo.error({ title: 'Error', description: data.message || 'No se pudo guardar.' });
      }
    } catch {
      sileo.error({ title: 'Error', description: 'Error inesperado al guardar.' });
    } finally {
      setIsSavingGroup(false);
    }
  };

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await fetch('/api/admin/subjects?limit=200');
        const data = await res.json();
        setSubjects(data.data || []);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    const loadDocentes = async () => {
      try {
        const res = await fetch('/api/admin/users?role=DOCENTE&limit=200');
        const data = await res.json();
        setDocentes(data.data || []);
      } catch (error) {
        console.error('Error loading docentes:', error);
      } finally {
        setIsLoadingDocentes(false);
      }
    };

    const loadRooms = async () => {
      try {
        const res = await fetch('/api/admin/rooms');
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading rooms:', error);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    loadSubjects();
    loadDocentes();
    loadRooms();
    loadCreatedGroups();
  }, []);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setIsPreview(false);
      setPreviewData([]);
      setFinalResults(null);
      setConflicts([]);
    } else {
      setFinalResults(null);
      setIsPreview(false);
      setPreviewData([]);
      setConflicts([]);
    }
  };

  const buildFormData = (csvFile: Blob, filename = 'temp.csv') => {
    const formData = new FormData();
    formData.append('file', csvFile, filename);
    if (selectedDocente) formData.append('docenteId', selectedDocente);
    if (periodo) formData.append('periodoAcademico', periodo);
    return formData;
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
      const formData = buildFormData(file, file.name);

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
        setConflicts(result.conflicts || []);
        setIsPreview(true);
        if ((result.conflicts || []).length > 0) {
          sileo.warning({
            title: 'Vista previa con conflictos',
            description: `Se detectaron ${result.conflicts.length} conflicto(s) de horario. Revísalos antes de confirmar.`,
          });
        } else {
          sileo.success({
            title: 'Vista previa',
            description: 'Vista previa generada con éxito',
          });
        }
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
      setMode('manual');
    }
  };

  const handleUpdateItem = () => {
    if (!editingId) return;

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
      const csvContent = previewData
        .map(
          item =>
            `${item.grupo},${item.jornada},${item.schedule?.[0]?.dia || ''},${item.schedule?.[0]?.horaInicio || ''},${item.schedule?.[0]?.horaFin || ''},${item.schedule?.[0]?.salon || ''}`
        )
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const formData = buildFormData(blob);

      const response = await fetch(`/api/admin/subjects/${selectedSubject}/groups`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.conflicts && result.conflicts.length > 0) {
          setConflicts(result.conflicts);
          sileo.error({
            title: 'Conflictos de horario',
            description: result.error,
          });
        } else {
          throw new Error(result.error || 'Error al confirmar la carga.');
        }
        return;
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
      setConflicts([]);
      // Reload the groups table
      loadCreatedGroups();
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
    setConflicts([]);
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
    setConflicts([]);
    setEditingId(null);
  };

  const successCount = previewData.filter(item => item.status !== 'error').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
  const selectedDocenteData = docentes.find(d => d.id === selectedDocente);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <CardHeader className="p-0" id="tour-grupos-title">
        <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
          Grupos y Horarios
        </CardTitle>
        <CardDescription className="text-xs">
          Crea grupos y horarios para las asignaturas de forma manual o masiva.
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue="crear" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="crear" id="tour-grupos-mode">
            Crear Grupos
          </TabsTrigger>
          <TabsTrigger value="lista">
            Lista de Grupos {createdGroups.length > 0 && `(${createdGroups.length})`}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Crear grupos ── */}
        <TabsContent value="crear" className="mt-4">
          <div className="flex justify-end gap-2 mb-4" id="tour-grupos-mode-buttons">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              {/* Config común: Asignatura + Docente + Periodo */}
              <Card className="p-0 overflow-hidden border shadow-xs" id="tour-grupos-config">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    Configuración del Grupo
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Asignatura, docente y periodo académico.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Asignatura */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Asignatura *</Label>
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
                  </div>

                  {/* Docente */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Docente</Label>
                    <Select
                      value={selectedDocente}
                      onValueChange={setSelectedDocente}
                      disabled={isLoadingDocentes}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Selecciona un docente (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {docentes.map(d => (
                          <SelectItem key={d.id} value={d.id} className="text-xs">
                            {d.name || 'Sin nombre'}{d.document ? ` · ${d.document}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Periodo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Periodo Académico</Label>
                    <Select
                      value={periodo}
                      onValueChange={setPeriodo}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Selecciona un periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          new Set(
                            subjects
                              .map(s => s.periodoAcademico)
                              .filter((p): p is string => Boolean(p))
                          )
                        )
                          .sort()
                          .reverse()
                          .map(p => (
                            <SelectItem key={p} value={p} className="text-xs">
                              {p}
                            </SelectItem>
                          ))}
                        {/* Allow free-form if no periods exist */}
                        {subjects.filter(s => s.periodoAcademico).length === 0 && (
                          <SelectItem value="2025-1" className="text-xs">2025-1</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {mode === 'csv' ? (
                <>
                  <Card className="p-0 overflow-hidden border shadow-xs" id="tour-grupos-instructions">
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
                          <div className="rounded-xl bg-muted/30 p-3">
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

                  <Card className="p-0 overflow-hidden border shadow-xs" id="tour-grupos-upload">
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
                            className="h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="p-0 overflow-hidden border shadow-xs" id="tour-grupos-manual">
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
                      <Select
                        value={manualForm.salon}
                        onValueChange={v => setManualForm({ ...manualForm, salon: v })}
                        disabled={isLoadingRooms}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder={isLoadingRooms ? 'Cargando...' : 'Selecciona un salón'} />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map(room => (
                            <SelectItem key={room.id} value={room.name} className="text-xs">
                              {room.name}{room.capacity ? ` · Cap. ${room.capacity}` : ''}
                            </SelectItem>
                          ))}
                          {rooms.length === 0 && !isLoadingRooms && (
                            <SelectItem value="Por asignar" className="text-xs">Por asignar</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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

            <div className="lg:col-span-2 space-y-4">
              {/* Panel de conflictos */}
              {conflicts.length > 0 && (
                <Card className="overflow-hidden border border-warning/40 shadow-xs bg-warning/5">
                  <CardHeader className="border-b border-warning/40 px-5 py-3 bg-warning/10">
                    <CardTitle className="text-xs font-semibold text-warning flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Conflictos de Horario Detectados ({conflicts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ul className="space-y-1.5">
                      {conflicts.map((c, i) => (
                        <li key={i} className="text-[11px] text-warning">{c}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card className="p-0 overflow-hidden border shadow-xs" id="tour-grupos-preview">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                        Grupos para Cargar ({previewData.length})
                      </CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">
                        {selectedSubjectData
                          ? `${selectedSubjectData.code} - ${selectedSubjectData.name}`
                          : 'Selecciona una asignatura para continuar'}
                        {selectedDocenteData && (
                          <span className="ml-2 text-primary font-medium">· {selectedDocenteData.name}</span>
                        )}
                        {periodo && (
                          <span className="ml-2 text-muted-foreground">· Periodo {periodo}</span>
                        )}
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
                    <div className="flex flex-col items-center justify-center min-h-96 space-y-4 text-center p-6">
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
                    <div className="bg-card border rounded-md overflow-hidden shadow-sm">
                      <div className="relative overflow-x-auto overflow-y-auto max-h-[36rem]">
                        <Table>
                          <TableHeader className="bg-muted/30 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                Grupo
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                Jornada / Cupo
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                Horario Principal
                              </TableHead>
                              <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                                Acciones
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.map((item) => (
                              <TableRow
                                key={item.id}
                                className="hover:bg-muted/50 group"
                              >
                                <TableCell className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center font-semibold text-xs">
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
                                      aria-label="Editar grupo"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                      onClick={() => handleDeleteItem(item.id)}
                                      aria-label="Eliminar grupo"
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
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-72 py-12 text-center p-6">
                      <div className="bg-muted/30 p-4 rounded-full mb-4">
                        <Calendar className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Sin grupos para cargar</h4>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
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
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-[10px] text-success font-semibold">{successCount} listos</span>
                          {errorCount > 0 && <span className="text-[10px] text-destructive font-semibold">{errorCount} errores</span>}
                          {conflicts.length > 0 && <span className="text-[10px] text-warning font-semibold">{conflicts.length} conflictos</span>}
                        </div>
                      </div>
                      <Button
                        onClick={handleConfirmUpload}
                        disabled={isConfirming || successCount === 0 || !selectedSubject || conflicts.length > 0}
                        className="h-9 px-6 text-xs min-w-[150px]"
                      >
                        {isConfirming ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Procesando...
                          </>
                        ) : conflicts.length > 0 ? (
                          'Resuelve los conflictos'
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
        </TabsContent>

        {/* ── Tab 2: Lista de grupos ── */}
        <TabsContent value="lista" className="mt-4">

          {/* Tabla de Grupos Creados */}
          <Card className="p-0 overflow-hidden border shadow-xs">
            <CardHeader className="border-b px-5 py-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    Grupos Creados ({createdGroups.length})
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Asignaturas con grupo y horario asignado en el sistema.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCreatedGroups ? (
                <div className="flex items-center justify-center h-32 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Cargando grupos...</span>
                </div>
              ) : createdGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted/30 p-4 rounded-full mb-3">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground">No hay grupos creados aún.</p>
                </div>
              ) : (
                <div className="bg-card border rounded-md overflow-hidden shadow-sm">
                  <div className="relative overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Código</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Asignatura</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Grupo</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Jornada</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Periodo</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Docente(s)</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">Clases</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {createdGroups.map(grp => {
                          const isEditing = editingGroupId === grp.id;
                          return (
                            <React.Fragment key={grp.id}>
                              <TableRow className={`hover:bg-muted/50 group ${isEditing ? 'bg-primary/5' : ''}`}>
                                <TableCell className="px-4 py-3">
                                  <Badge variant="outline" className="text-[10px] font-mono h-5">{grp.code}</Badge>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <span className="text-xs font-medium text-foreground">{grp.name}</span>
                                  {grp.program && <span className="block text-[10px] text-muted-foreground">{grp.program}</span>}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-xs text-primary">
                                    {grp.group}
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <Badge variant="secondary" className="text-[10px] h-5">{grp.jornada || '—'}</Badge>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <span className="text-xs text-muted-foreground">{grp.periodoAcademico || '—'}</span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <span className="text-xs text-muted-foreground">
                                    {grp.teachers.length > 0
                                      ? grp.teachers.map(t => t.name).join(', ')
                                      : <span className="italic">Sin asignar</span>}
                                  </span>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right">
                                  <span className="text-xs font-semibold text-foreground">{grp._count.classes}</span>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right">
                                  {isEditing ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-primary hover:bg-primary/10"
                                        onClick={handleSaveGroupEdit}
                                        disabled={isSavingGroup}
                                        aria-label="Guardar cambios del grupo"
                                      >
                                        {isSavingGroup ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => setEditingGroupId(null)}
                                        aria-label="Cancelar edición"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                      aria-label="Editar grupo"
                                      onClick={() => {
                                        setEditingGroupId(grp.id);
                                        setEditGroupForm({
                                          group: grp.group || '',
                                          jornada: grp.jornada || 'DIURNO',
                                          periodoAcademico: grp.periodoAcademico || '',
                                        });
                                      }}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                              {isEditing && (
                                <TableRow key={`${grp.id}-edit`} className="bg-primary/5 border-b">
                                  <TableCell colSpan={8} className="px-4 py-3">
                                    <div className="flex flex-wrap items-end gap-3">
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold">Grupo</Label>
                                        <Input
                                          className="h-8 text-xs w-20"
                                          value={editGroupForm.group}
                                          onChange={e => setEditGroupForm({ ...editGroupForm, group: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold">Jornada</Label>
                                        <Select
                                          value={editGroupForm.jornada}
                                          onValueChange={v => setEditGroupForm({ ...editGroupForm, jornada: v })}
                                        >
                                          <SelectTrigger className="h-8 text-xs w-28">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {JORNADAS.map(j => (
                                              <SelectItem key={j} value={j} className="text-xs">{j}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold">Periodo</Label>
                                        <Input
                                          className="h-8 text-xs w-24"
                                          value={editGroupForm.periodoAcademico}
                                          onChange={e => setEditGroupForm({ ...editGroupForm, periodoAcademico: e.target.value })}
                                          placeholder="Ej: 2025-1"
                                        />
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

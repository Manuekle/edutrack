'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  XCircle,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PreviewItem {
  id: string;
  codigoAsignatura: string;
  nombreAsignatura: string;
  programa: string;
  semestre: number;
  creditos: number;
  horas: number;
  temas: string;
  temasCount: number;
  status: 'success' | 'error' | 'existing' | 'manual';
  message: string;
}

const PROGRAMAS = [
  'Ingenieria de Sistemas',
  'Ingenieria Industrial',
  'Ingenieria Electronica',
  'Administracion de Empresas',
  'Contaduria Publica',
  'Derecho',
  'Psicologia',
  'Comunicacion Social',
  'Economia',
  'Otro',
];

export default function MicrocurriculoPage() {
  const [mode, setMode] = useState<'csv' | 'manual'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<{ created: number; errors: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    codigo: '',
    nombre: '',
    programa: PROGRAMAS[0],
    semestre: '1',
    creditos: '3',
    horas: '4',
    temas: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

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
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/microcurriculo?preview=true', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const dataWithIds = (result.previewData || []).map((item: PreviewItem, index: number) => ({
          ...item,
          id: `csv-${index}-${Date.now()}`,
          temas: '',
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
    if (!manualForm.codigo || !manualForm.nombre) {
      toast.error('El código y nombre son obligatorios.');
      return;
    }

    const newItem: PreviewItem = {
      id: `manual-${Date.now()}`,
      codigoAsignatura: manualForm.codigo,
      nombreAsignatura: manualForm.nombre,
      programa: manualForm.programa,
      semestre: parseInt(manualForm.semestre) || 1,
      creditos: parseInt(manualForm.creditos) || 3,
      horas: parseInt(manualForm.horas) || 4,
      temas: manualForm.temas,
      temasCount: manualForm.temas ? manualForm.temas.split(';').filter(t => t.trim()).length : 0,
      status: 'manual',
      message: 'Nuevo',
    };

    setPreviewData([...previewData, newItem]);
    setIsPreview(true);
    setManualForm({
      codigo: '',
      nombre: '',
      programa: PROGRAMAS[0],
      semestre: '1',
      creditos: '3',
      horas: '4',
      temas: '',
    });
    toast.success('Asignatura agregada');
  };

  const handleEditItem = (id: string) => {
    const item = previewData.find(i => i.id === id);
    if (item) {
      setManualForm({
        codigo: item.codigoAsignatura,
        nombre: item.nombreAsignatura,
        programa: item.programa,
        semestre: item.semestre.toString(),
        creditos: item.creditos.toString(),
        horas: item.horas.toString(),
        temas: item.temas,
      });
      setEditingId(id);
    }
  };

  const handleUpdateItem = () => {
    if (!editingId) return;
    if (!manualForm.codigo || !manualForm.nombre) {
      toast.error('El código y nombre son obligatorios.');
      return;
    }

    setPreviewData(
      previewData.map(item =>
        item.id === editingId
          ? {
              ...item,
              codigoAsignatura: manualForm.codigo,
              nombreAsignatura: manualForm.nombre,
              programa: manualForm.programa,
              semestre: parseInt(manualForm.semestre) || 1,
              creditos: parseInt(manualForm.creditos) || 3,
              horas: parseInt(manualForm.horas) || 4,
              temas: manualForm.temas,
              temasCount: manualForm.temas
                ? manualForm.temas.split(';').filter(t => t.trim()).length
                : 0,
            }
          : item
      )
    );
    setEditingId(null);
    setManualForm({
      codigo: '',
      nombre: '',
      programa: PROGRAMAS[0],
      semestre: '1',
      creditos: '3',
      horas: '4',
      temas: '',
    });
    toast.success('Asignatura actualizada');
  };

  const handleDeleteItem = (id: string) => {
    setPreviewData(previewData.filter(item => item.id !== id));
  };

  const handleConfirmUpload = async () => {
    const successCount = previewData.filter(item => item.status !== 'error').length;
    if (successCount === 0) {
      toast.error('No hay asignaturas válidas para crear.');
      return;
    }

    setIsConfirming(true);
    try {
      // Enviar cada asignatura manualmente
      let created = 0;
      let errors = 0;

      for (const item of previewData) {
        const formData = new FormData();
        const csvContent = `${item.codigoAsignatura},${item.nombreAsignatura},${item.programa},${item.semestre},${item.creditos},${item.horas},${item.temas}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', blob, 'temp.csv');

        const res = await fetch('/api/admin/microcurriculo', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          created++;
        } else {
          errors++;
        }
      }

      toast.success(`Proceso finalizado. Se crearon ${created} asignaturas.`);
      setFinalResults({ created, errors });
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
      codigo: '',
      nombre: '',
      programa: PROGRAMAS[0],
      semestre: '1',
      creditos: '3',
      horas: '4',
      temas: '',
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
  const errorCount = previewData.filter(item => item.status === 'error').length;

  return (
    <main className="space-y-4">
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
          Carga de Microcurrículos
        </CardTitle>
        <CardDescription className="text-xs">
          Carga las asignaturas con sus temas de forma manual o masiva.
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
          {mode === 'csv' ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="sm:text-xl text-lg font-semibold tracking-card">
                    Carga Masiva
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Sube un archivo CSV con las asignaturas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a href="/formatos/plantilla_microcurriculo.csv" download>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Plantilla
                    </Button>
                  </a>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">Columnas:</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>Código Asignatura</li>
                      <li>Nombre Asignatura</li>
                      <li>Programa</li>
                      <li>Semestre</li>
                      <li>Créditos</li>
                      <li>Horas</li>
                      <li>Temas (separados por ;)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="sm:text-xl text-lg font-semibold tracking-card">
                    Subir Archivo CSV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
                  <div className="flex gap-2 mt-4 flex-col">
                    <Button
                      onClick={handlePreview}
                      disabled={!file || isLoading || isPreview}
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
                <CardTitle className="sm:text-xl text-lg font-semibold tracking-card">
                  {editingId ? 'Editar Asignatura' : 'Nueva Asignatura'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Ingresa los datos de la asignatura.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={manualForm.codigo}
                    onChange={e => setManualForm({ ...manualForm, codigo: e.target.value })}
                    placeholder="Ej: 718004"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={manualForm.nombre}
                    onChange={e => setManualForm({ ...manualForm, nombre: e.target.value })}
                    placeholder="Ej: Electiva Profesional III"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="programa">Programa</Label>
                  <select
                    id="programa"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={manualForm.programa}
                    onChange={e => setManualForm({ ...manualForm, programa: e.target.value })}
                  >
                    {PROGRAMAS.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="semestre">Semestre</Label>
                    <Input
                      id="semestre"
                      type="number"
                      value={manualForm.semestre}
                      onChange={e => setManualForm({ ...manualForm, semestre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditos">Créditos</Label>
                    <Input
                      id="creditos"
                      type="number"
                      value={manualForm.creditos}
                      onChange={e => setManualForm({ ...manualForm, creditos: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horas">Horas</Label>
                    <Input
                      id="horas"
                      type="number"
                      value={manualForm.horas}
                      onChange={e => setManualForm({ ...manualForm, horas: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temas">Temas (separados por ;)</Label>
                  <Textarea
                    id="temas"
                    value={manualForm.temas}
                    onChange={e => setManualForm({ ...manualForm, temas: e.target.value })}
                    placeholder="Tema 1; Tema 2; Tema 3"
                    rows={3}
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
              <CardTitle className="sm:text-2xl text-xl font-semibold tracking-card">
                Asignaturas ({previewData.length})
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Revisa y editable las asignaturas antes de confirmar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && !isPreview ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : finalResults ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <CheckCircle className="h-16 w-16 text-primary" />
                  <div className="space-y-1">
                    <h3 className="sm:text-2xl text-xl tracking-card font-semibold">
                      Carga completada
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Se crearon {finalResults.created} asignaturas.
                    </p>
                  </div>
                  <Button onClick={handleNewUpload} className="mt-4">
                    Cargar más asignaturas
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
                            <h4 className="font-semibold text-sm text-foreground">
                              {item.codigoAsignatura} - {item.nombreAsignatura}
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
                            {item.programa} | Sem: {item.semestre} | Créd: {item.creditos} | Hs:{' '}
                            {item.horas}
                          </div>
                          {item.temasCount > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              {item.temasCount} temas
                            </Badge>
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
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {mode === 'csv'
                      ? 'Sube un archivo CSV o agrega asignaturas manualmente.'
                      : 'Agrega las asignaturas usando el formulario.'}
                  </p>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    {successCount} asignatura{successCount !== 1 ? 's' : ''} lista
                    {successCount !== 1 ? 's' : ''}
                  </p>
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={isConfirming || successCount === 0}
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

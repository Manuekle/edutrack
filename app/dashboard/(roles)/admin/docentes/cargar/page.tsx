'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle,
  Download,
  Edit2,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { sileo } from 'sileo';

interface PreviewItem {
  id: string;
  document: string;
  name: string;
  email: string;
  phone: string;
  status: 'success' | 'error' | 'existing' | 'manual';
  message: string;
}

export default function CargarDocentesPage() {
  const [mode, setMode] = useState<'csv' | 'manual'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<PreviewItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    documento: '',
    nombre: '',
    correo: '',
    telefono: '',
  });

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      handleCancel();
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
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/cargar-usuarios?preview=true&forceRole=DOCENTE', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        const dataWithIds = (result || []).map((item: PreviewItem, index: number) => ({
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
    if (!manualForm.documento || !manualForm.nombre) {
      sileo.error({
        title: 'Campos requeridos',
        description: 'El documento y nombre son obligatorios.',
      });
      return;
    }

    const newItem: PreviewItem = {
      id: `manual-${Date.now()}`,
      document: manualForm.documento,
      name: manualForm.nombre,
      email: manualForm.correo || `${manualForm.documento}@correo.edu.co`,
      phone: manualForm.telefono || '',
      status: 'manual',
      message: 'Nuevo',
    };

    setPreviewData([...previewData, newItem]);
    setIsPreview(true);
    setManualForm({ documento: '', nombre: '', correo: '', telefono: '' });
    sileo.success({
      title: 'Docente agregado',
      description: 'El docente ha sido añadido a la lista.',
    });
  };

  const handleEditItem = (id: string) => {
    const item = previewData.find(i => i.id === id);
    if (item) {
      setManualForm({
        documento: item.document,
        nombre: item.name,
        correo: item.email,
        telefono: item.phone || '',
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
            document: manualForm.documento,
            name: manualForm.nombre,
            email: manualForm.correo || `${manualForm.documento}@correo.edu.co`,
            phone: manualForm.telefono,
          }
          : item
      )
    );
    setEditingId(null);
    setManualForm({ documento: '', nombre: '', correo: '', telefono: '' });
    sileo.success({
      title: 'Actualizado',
      description: 'Docente actualizado correctamente.',
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
        description: 'No hay docentes válidos para crear.',
      });
      return;
    }

    setIsConfirming(true);
    try {
      const response = await fetch('/api/admin/cargar-usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewData, forceRole: 'DOCENTE' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar la carga.');
      }
      sileo.success({
        title: 'Carga exitosa',
        description: 'Docentes creados exitosamente.',
      });
      setFinalResults(result.results || []);
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
    setManualForm({ documento: '', nombre: '', correo: '', telefono: '' });
  };

  const handleNewUpload = () => {
    handleCancel();
  };

  const successCount = previewData.filter(item => item.status !== 'error').length;
  const existingCount = previewData.filter(item => item.status === 'existing').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full">
          <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
            Carga de Docentes
          </CardTitle>
          <CardDescription className="text-xs">
            Agrega docentes de forma manual o masiva al sistema.
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2">
          <Button
            variant={mode === 'csv' ? 'default' : 'outline'}
            onClick={() => {
              setMode('csv');
              handleCancel();
            }}
            className="text-xs h-9 px-4 font-medium"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Carga Masiva (CSV)
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => setMode('manual')}
            className="text-xs h-9 px-4 font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Manual
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-4">
          {mode === 'csv' ? (
            <>
              <Card className="overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-tight text-foreground">
                    1. Instrucciones del Formato
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Formato requerido para la carga de docentes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Plantilla base</p>
                      <a href="/formatos/plantilla_docentes.csv" download className="block">
                        <Button variant="outline" className="w-full justify-start h-9 text-xs">
                          <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                          Descargar Formato CSV
                        </Button>
                      </a>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Columnas requeridas</p>
                      <div className="rounded-md bg-muted/30 p-3">
                        <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                          <li><span className="font-medium text-foreground">Documento</span> (ID principal)</li>
                          <li><span className="font-medium text-foreground">Nombre</span> y <span className="font-medium text-foreground">Apellido</span></li>
                          <li><span className="font-medium text-foreground">Correo</span> electrónico institucional</li>
                          <li><span className="font-medium text-foreground">Teléfono</span> de contacto</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-tight text-foreground">
                    2. Subir Archivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium mb-2 block text-foreground">
                        Seleccionar Archivo .CSV
                      </Label>
                      <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handlePreview}
                        disabled={!file || isLoading || isPreview}
                        className="flex-1 h-9 text-xs"
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
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="overflow-hidden border shadow-xs">
              <CardHeader className="border-b px-5 py-4 bg-muted/10">
                <CardTitle className="sm:text-sm text-xs font-semibold tracking-tight text-foreground">
                  {editingId ? 'Editar Docente' : 'Nuevo Docente'}
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Ingresa la información básica del docente.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="documento" className="text-xs font-medium text-foreground">
                    Documento *
                  </Label>
                  <Input
                    id="documento"
                    value={manualForm.documento}
                    onChange={e => setManualForm({ ...manualForm, documento: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="12345678"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className="text-xs font-medium text-foreground">
                    Nombre Completo *
                  </Label>
                  <Input
                    id="nombre"
                    value={manualForm.nombre}
                    onChange={e => setManualForm({ ...manualForm, nombre: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="correo" className="text-xs font-medium text-foreground">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="correo"
                    value={manualForm.correo}
                    onChange={e => setManualForm({ ...manualForm, correo: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="ejemplo@correo.edu.co"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="text-xs font-medium text-foreground">
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    value={manualForm.telefono}
                    onChange={e => setManualForm({ ...manualForm, telefono: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="3001234567"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  {editingId ? (
                    <>
                      <Button onClick={handleUpdateItem} className="flex-1 h-9 text-xs">
                        Actualizar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setManualForm({
                            documento: '',
                            nombre: '',
                            correo: '',
                            telefono: '',
                          });
                        }}
                        className="h-9 text-xs"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleAddManual} className="w-full h-9 text-xs">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar a la lista
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-8">
          <Card className="overflow-hidden border shadow-xs">
            <CardHeader className="border-b px-5 py-4 bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-tight text-foreground">
                Vista Previa de Docentes ({previewData.length})
              </CardTitle>
              <div className="flex gap-2">
                {successCount > 0 && (
                  <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-normal">
                    {successCount} VÁLIDOS
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-[9px] font-normal">
                    {errorCount} ERRORES
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading && !isPreview && !finalResults ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  <p className="text-[10px] font-bold text-muted-foreground/60 tracking-widest">
                    Procesando Archivo...
                  </p>
                </div>
              ) : finalResults ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center p-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="sm:text-xl text-lg tracking-tight font-semibold">
                      ¡Carga Exitosa!
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Se han procesado correctamente los docentes en el sistema.
                    </p>
                  </div>
                  <Button onClick={handleNewUpload} variant="outline" className="mt-4 h-9 text-xs">
                    Realizar nueva carga
                  </Button>
                </div>
              ) : previewData.length > 0 ? (
                <>
                  <div className="overflow-x-auto max-h-[500px]">
                    <Table>
                      <TableHeader className="bg-muted/5 sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="text-[10px] font-bold px-4 py-3 text-muted-foreground tracking-widest">
                            Docente
                          </TableHead>
                          <TableHead className="text-[10px] font-bold px-4 py-3 text-muted-foreground tracking-widest text-center">
                            Documento
                          </TableHead>
                          <TableHead className="text-[10px] font-bold px-4 py-3 text-muted-foreground tracking-widest text-center">
                            Estado
                          </TableHead>
                          <TableHead className="text-[10px] font-bold px-4 py-3 text-muted-foreground tracking-widest text-right">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map(item => (
                          <TableRow
                            key={item.id}
                            className="group hover:bg-zinc-50 border-zinc-100 dark:border-zinc-800"
                          >
                            <TableCell className="py-2.5">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {item.email}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5 text-center">
                              <span className="text-xs font-medium">{item.document}</span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 font-normal ${item.status === 'error'
                                  ? 'bg-red-50 text-red-600 border-red-100'
                                  : item.status === 'existing'
                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  }`}
                              >
                                {item.status === 'manual'
                                  ? 'Manual'
                                  : item.status === 'existing'
                                    ? 'Existente'
                                    : item.status === 'error'
                                      ? 'Error'
                                      : 'Nuevo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground"
                                  onClick={() => handleEditItem(item.id)}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
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
                  <div className="p-4 bg-muted/20 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-muted-foreground italic">
                      * Verifica que los datos coincidan con la base de datos oficial.
                    </p>
                    <Button
                      onClick={handleConfirmUpload}
                      disabled={isConfirming || successCount === 0}
                      className="h-9 px-8 text-xs font-bold shadow-sm"
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          PROCESANDO...
                        </>
                      ) : (
                        'CONFIRMAR Y CREAR'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                    <UserCheck className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider">
                      Sin datos para mostrar
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 max-w-[200px]">
                      Agrega docentes manualmente o sube un archivo CSV para comenzar.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  );
}

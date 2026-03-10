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
  X
} from 'lucide-react';
import { useState } from 'react';
import { sileo } from 'sileo';

interface PreviewItem {
  id: string;
  document: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  status: 'success' | 'error' | 'existing' | 'manual';
  message: string;
}

export default function CargarEstudiantesPage() {
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
    codigo: '',
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

      const res = await fetch('/api/admin/cargar-usuarios?preview=true&forceRole=ESTUDIANTE', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        const apiItems = (result || []) as Array<{
          data: { name: string; document: string; correoPersonal: string; correoInstitucional?: string };
          status: 'success' | 'warning' | 'error';
          message: string;
        }>;
        const dataWithIds: PreviewItem[] = apiItems.map((item, index) => ({
          id: `csv-${index}-${Date.now()}`,
          document: item.data?.document ?? '',
          name: item.data?.name ?? '',
          email: item.data?.correoInstitucional || item.data?.correoPersonal ?? '',
          phone: '',
          code: '',
          status: item.status === 'warning' ? 'existing' : item.status,
          message: item.message ?? '',
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
      email: manualForm.correo || `${manualForm.codigo || manualForm.documento}@est.fup.edu.co`,
      phone: manualForm.telefono || '',
      code: manualForm.codigo || '',
      status: 'manual',
      message: 'Nuevo',
    };

    setPreviewData([...previewData, newItem]);
    setIsPreview(true);
    setManualForm({ documento: '', nombre: '', correo: '', telefono: '', codigo: '' });
    sileo.success({
      title: 'Estudiante agregado',
      description: 'El estudiante ha sido añadido a la lista.',
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
        codigo: item.code || '',
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
            email:
              manualForm.correo || `${manualForm.codigo || manualForm.documento}@est.fup.edu.co`,
            phone: manualForm.telefono,
            code: manualForm.codigo,
          }
          : item
      )
    );
    setEditingId(null);
    setManualForm({ documento: '', nombre: '', correo: '', telefono: '', codigo: '' });
    sileo.success({
      title: 'Actualizado',
      description: 'Estudiante actualizado correctamente.',
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
        description: 'No hay estudiantes válidos para crear.',
      });
      return;
    }

    setIsConfirming(true);
    try {
      const payload = previewData.map(item => ({
        data: {
          name: item.name,
          document: item.document,
          correoPersonal: item.email,
          correoInstitucional: item.email,
          role: 'ESTUDIANTE',
        },
        status: item.status === 'manual' ? 'success' : item.status === 'existing' ? 'warning' : item.status,
        message: item.message,
      }));
      const response = await fetch('/api/admin/cargar-usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewData: payload, forceRole: 'ESTUDIANTE' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar la carga.');
      }

      sileo.success({
        title: 'Carga exitosa',
        description: 'Estudiantes creados exitosamente.',
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
    setManualForm({ documento: '', nombre: '', correo: '', telefono: '', codigo: '' });
  };

  const handleNewUpload = () => {
    handleCancel();
  };

  const successCount = previewData.filter(item => item.status !== 'error').length;
  const hasValidData = previewData.some(
    item => item.status !== 'error' && (item.name?.trim() && item.document?.trim())
  );
  const existingCount = previewData.filter(item => item.status === 'existing').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full" id="tour-cargar-estudiantes-title">
          <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
            Carga de Estudiantes
          </CardTitle>
          <CardDescription className="text-xs">
            Agrega estudiantes de forma manual o masiva al sistema.
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2" id="tour-cargar-estudiantes-mode">
          <Button
            variant={mode === 'csv' ? 'default' : 'outline'}
            onClick={() => {
              setMode('csv');
              handleCancel();
            }}
            className="text-xs h-9 px-4"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Carga Masiva (CSV)
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => setMode('manual')}
            className="text-xs h-9 px-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Manual
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lado izquierdo: Formulario de carga */}
        <div className="lg:col-span-4 space-y-4">
          {mode === 'csv' ? (
            <>
              <Card className="p-0 overflow-hidden border shadow-xs" id="tour-cargar-estudiantes-instructions">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    1. Instrucciones del Formato
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Formato requerido para la carga de estudiantes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">Plantilla base</p>
                      <a href="/formatos/plantilla_estudiantes.csv" download className="block">
                        <Button variant="outline" className="w-full justify-start h-9 text-xs">
                          <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                          Descargar Formato CSV
                        </Button>
                      </a>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">Columnas requeridas</p>
                      <div className="rounded-md bg-muted/30 p-3">
                        <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                          <li><span className="font-semibold text-foreground">Documento</span> / <span className="font-semibold text-foreground">Código</span></li>
                          <li><span className="font-semibold text-foreground">Nombre</span> y <span className="font-semibold text-foreground">Apellido</span></li>
                          <li><span className="font-semibold text-foreground">Correo</span> institucional</li>
                          <li><span className="font-semibold text-foreground">Teléfono</span> de contacto</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0 overflow-hidden border shadow-xs" id="tour-cargar-estudiantes-upload">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    2. Subir Archivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold mb-2 block text-foreground">
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
            <Card className="p-0 overflow-hidden border shadow-xs" id="tour-cargar-estudiantes-manual">
              <CardHeader className="border-b px-5 py-4 bg-muted/10">
                <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                  {editingId ? 'Editar Estudiante' : 'Nuevo Estudiante'}
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Ingresa la información básica del estudiante.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="documento" className="text-xs font-semibold text-foreground">
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
                    <Label htmlFor="codigo" className="text-xs font-semibold text-foreground">
                      Código
                    </Label>
                    <Input
                      id="codigo"
                      value={manualForm.codigo}
                      onChange={e => setManualForm({ ...manualForm, codigo: e.target.value })}
                      className="h-9 text-xs"
                      placeholder="701234"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className="text-xs font-semibold text-foreground">
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
                  <Label htmlFor="correo" className="text-xs font-semibold text-foreground">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="correo"
                    value={manualForm.correo}
                    onChange={e => setManualForm({ ...manualForm, correo: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="ejemplo@est.fup.edu.co"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="text-xs font-semibold text-foreground">
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
                            codigo: '',
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

        {/* Lado derecho: Tabla de vista previa */}
        <div className="lg:col-span-8">
          <Card className="p-0 overflow-hidden border shadow-xs" id="tour-cargar-estudiantes-preview">
            <CardHeader className="border-b px-5 py-4 bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                Vista Previa de Estudiantes ({previewData.length})
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
                  <p className="text-[10px] font-semibold text-muted-foreground/60 ">
                    Procesando Archivo...
                  </p>
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
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Se han procesado correctamente los estudiantes en el sistema.
                    </p>
                  </div>
                  <Button onClick={handleNewUpload} variant="outline" className="mt-4 h-9 text-xs">
                    Realizar nueva carga
                  </Button>
                </div>
              ) : previewData.length > 0 ? (
                <>
                  <div className="bg-card border rounded-md overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[500px]">
                      <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Estudiante
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Documento / Código
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-center">
                              Estado
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.map(item => (
                            <TableRow
                              key={item.id}
                              className="hover:bg-muted/50 group"
                            >
                              <TableCell className="py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold">{item.name}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {item.email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold">{item.document}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {item.code || '-'}
                                  </span>
                                </div>
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
                  </div>
                  <div className="p-4 bg-muted/20 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-muted-foreground italic">
                      * Verifica que los datos coincidan con la base de datos oficial.
                    </p>
                    <Button
                      onClick={handleConfirmUpload}
                      disabled={isConfirming || successCount === 0 || !hasValidData}
                      className="h-9 px-8 text-xs shadow-sm"
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
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                    <UserCheck className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Sin datos para mostrar
                    </p>
                    <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
                      Agrega estudiantes manualmente o sube un archivo CSV para comenzar.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

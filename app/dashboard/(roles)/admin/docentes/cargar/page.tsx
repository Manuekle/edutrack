'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { sileo } from 'sileo';
import { z } from 'zod';

const manualDocenteSchema = z.object({
  documento: z.string().min(1, 'El documento es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  correo: z.string().email('Correo no válido').optional().or(z.literal('')),
  telefono: z.string().optional(),
});

type ManualDocenteForm = z.infer<typeof manualDocenteSchema>;

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

  const manualForm = useForm<ManualDocenteForm>({
    resolver: zodResolver(manualDocenteSchema),
    defaultValues: { documento: '', nombre: '', correo: '', telefono: '' },
  });
  const { setValue: setManualFormValue, reset: resetManualForm } = manualForm;

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
        const apiItems = (result || []) as Array<{
          data: { name: string; document: string; correoPersonal: string; correoInstitucional?: string };
          status: 'success' | 'warning' | 'error';
          message: string;
        }>;
        const dataWithIds: PreviewItem[] = apiItems.map((item, index) => ({
          id: `csv-${index}-${Date.now()}`,
          document: item.data?.document ?? '',
          name: item.data?.name ?? '',
          email: (item.data?.correoInstitucional || item.data?.correoPersonal) ?? '',
          phone: '',
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

  const onAddManual = (data: ManualDocenteForm) => {
    const newItem: PreviewItem = {
      id: `manual-${Date.now()}`,
      document: data.documento,
      name: data.nombre,
      email: data.correo || `${data.documento}@correo.edu.co`,
      phone: data.telefono || '',
      status: 'manual',
      message: 'Nuevo',
    };
    setPreviewData(prev => [...prev, newItem]);
    setIsPreview(true);
    resetManualForm();
    sileo.success({
      title: 'Docente agregado',
      description: 'El docente ha sido añadido a la lista.',
    });
  };

  const handleEditItem = (id: string) => {
    const item = previewData.find(i => i.id === id);
    if (item) {
      setManualFormValue('documento', item.document);
      setManualFormValue('nombre', item.name);
      setManualFormValue('correo', item.email || '');
      setManualFormValue('telefono', item.phone || '');
      setEditingId(id);
      setMode('manual');
    }
  };

  const onUpdateItem = (data: ManualDocenteForm) => {
    if (!editingId) return;
    setPreviewData(prev =>
      prev.map(item =>
        item.id === editingId
          ? {
            ...item,
            document: data.documento,
            name: data.nombre,
            email: data.correo || `${data.documento}@correo.edu.co`,
            phone: data.telefono || '',
          }
          : item
      )
    );
    setEditingId(null);
    resetManualForm();
    sileo.success({
      title: 'Actualizado',
      description: 'Docente actualizado correctamente.',
    });
  };
  useEffect(() => {
    if (editingId) {
      const item = previewData.find(p => p.id === editingId);
      if (item) {
        setManualFormValue('documento', item.document);
        setManualFormValue('nombre', item.name);
        setManualFormValue('correo', item.email || '');
        setManualFormValue('telefono', item.phone || '');
      }
    }
  }, [editingId, previewData, setManualFormValue]);

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
      const payload = previewData.map(item => ({
        data: {
          name: item.name,
          document: item.document,
          correoPersonal: item.email,
          correoInstitucional: item.email,
          role: 'DOCENTE',
        },
        status: item.status === 'manual' ? 'success' : item.status === 'existing' ? 'warning' : item.status,
        message: item.message,
      }));
      const response = await fetch('/api/admin/cargar-usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewData: payload, forceRole: 'DOCENTE' }),
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
    resetManualForm();
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
        <CardHeader className="p-0 w-full" id="tour-cargar-docentes-title">
          <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
            Carga de Docentes
          </CardTitle>
          <CardDescription className="text-xs">
            Agrega docentes de forma manual o masiva al sistema.
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2" id="tour-cargar-docentes-mode">
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
        <div className="lg:col-span-4 space-y-4">
          {mode === 'csv' ? (
            <>
              <Card className="p-0 overflow-hidden border shadow-xs" id="tour-cargar-docentes-instructions">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    1. Instrucciones del Formato
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Formato requerido para la carga de docentes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">Plantilla base</p>
                      <a href="/formatos/plantilla_docentes.csv" download className="block">
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
                          <li><span className="font-semibold text-foreground">Documento</span> (ID principal)</li>
                          <li><span className="font-semibold text-foreground">Nombre</span> y <span className="font-semibold text-foreground">Apellido</span></li>
                          <li><span className="font-semibold text-foreground">Correo</span> electrónico institucional</li>
                          <li><span className="font-semibold text-foreground">Teléfono</span> de contacto</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0 overflow-hidden border shadow-xs" id="tour-cargar-docentes-upload">
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
                          className="h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
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
            <Card className="p-0 overflow-hidden border shadow-xs" id="tour-cargar-docentes-manual">
              <CardHeader className="border-b px-5 py-4 bg-muted/10">
                <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                  {editingId ? 'Editar Docente' : 'Nuevo Docente'}
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Ingresa la información básica del docente.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <Form {...manualForm}>
                  <form
                    onSubmit={manualForm.handleSubmit(editingId ? onUpdateItem : onAddManual)}
                    className="space-y-4"
                  >
                    <FormField
                      control={manualForm.control}
                      name="documento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Documento *
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 text-xs"
                              placeholder="12345678"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={manualForm.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Nombre Completo *
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 text-xs"
                              placeholder="Juan Pérez"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={manualForm.control}
                      name="correo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Correo Electrónico
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 text-xs"
                              placeholder="ejemplo@correo.edu.co"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={manualForm.control}
                      name="telefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Teléfono
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 text-xs"
                              placeholder="3001234567"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-3">
                      {editingId ? (
                        <>
                          <Button type="submit" className="flex-1 h-9 text-xs">
                            Actualizar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              resetManualForm();
                            }}
                            className="h-9 text-xs"
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button type="submit" className="w-full h-9 text-xs">
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar a la lista
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-8">
          <Card className="p-0 overflow-hidden border shadow-xs" id="tour-cargar-docentes-preview">
            <CardHeader className="border-b px-5 py-4 bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                Vista Previa de Docentes ({previewData.length})
              </CardTitle>
              <div className="flex gap-2">
                {successCount > 0 && (
                  <Badge variant="successSoft" className="text-[9px] font-normal">
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
                <div className="flex flex-col items-center justify-center min-h-96 space-y-4 text-center p-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="sm:text-xl text-lg tracking-heading font-semibold">
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
                  <div className="bg-card border rounded-md overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[32rem]">
                      <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                              Docente
                            </TableHead>
                            <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-center">
                              Documento
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
                              <TableCell className="py-2.5 text-center">
                                <span className="text-xs font-semibold">{item.document}</span>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 font-normal ${item.status === 'error'
                                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                                    : item.status === 'existing'
                                      ? 'bg-warning/10 text-warning border-warning/20'
                                      : 'bg-success/10 text-success border-success/20'
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
                                    aria-label="Editar docente"
                                    onClick={() => handleEditItem(item.id)}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    aria-label="Eliminar docente"
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
                  <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
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
                          PROCESANDO...
                        </>
                      ) : (
                        'Confirmar y Crear'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                    <UserCheck className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Sin datos para mostrar
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
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

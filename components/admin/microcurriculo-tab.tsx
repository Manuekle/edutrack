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
import {
  BookOpen,
  CheckCircle,
  Download,
  Edit2,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { useState } from 'react';
import { sileo } from 'sileo';

interface PreviewItem {
  id: string;
  codigoAsignatura: string;
  nombreAsignatura: string;
  programa: string;
  semestre: number;
  creditos: number;
  horas: number;
  temas: string[];
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

export function MicrocurriculoTab() {
  const [mode, setMode] = useState<'csv' | 'manual'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [finalResults, setFinalResults] = useState<{ created: number; errors: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [manualForm, setManualForm] = useState<{
    codigo: string;
    nombre: string;
    programa: string;
    semestre: string;
    creditos: string;
    horas: string;
    temas: string[];
  }>({
    codigo: '',
    nombre: '',
    programa: PROGRAMAS[0],
    semestre: '1',
    creditos: '3',
    horas: '4',
    temas: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTema, setNewTema] = useState('');

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
      sileo.error({ title: 'Archivo requerido', description: 'Por favor, selecciona un archivo .csv para continuar.' });
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/microcurriculo?preview=true', { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok && result.success) {
        const dataWithIds = (result.previewData || []).map((item: PreviewItem, index: number) => ({
          ...item,
          id: `csv-${index}-${Date.now()}`,
          temas: item.temas || [],
        }));
        setPreviewData(dataWithIds);
        setIsPreview(true);
        sileo.success({ title: 'Vista previa', description: 'Vista previa generada con éxito' });
      } else {
        sileo.error({ title: 'Error de previsualización', description: result.error || 'Error al generar la vista previa' });
        handleCancel();
      }
    } catch {
      sileo.error({ title: 'Error inesperado', description: 'Ocurrió un error inesperado al procesar el archivo.' });
      handleCancel();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManual = () => {
    if (!manualForm.codigo || !manualForm.nombre) {
      sileo.error({ title: 'Campos requeridos', description: 'El código y nombre son obligatorios.' });
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
      temasCount: manualForm.temas.length,
      status: 'manual',
      message: 'Nuevo',
    };
    setPreviewData([...previewData, newItem]);
    setIsPreview(true);
    setManualForm({ codigo: '', nombre: '', programa: PROGRAMAS[0], semestre: '1', creditos: '3', horas: '4', temas: [] });
    sileo.success({ title: 'Agregado', description: 'Asignatura agregada a la lista' });
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
        temas: item.temas || [],
      });
      setEditingId(id);
      setMode('manual');
    }
  };

  const handleUpdateItem = () => {
    if (!editingId) return;
    if (!manualForm.codigo || !manualForm.nombre) {
      sileo.error({ title: 'Campos requeridos', description: 'El código y nombre son obligatorios.' });
      return;
    }
    setPreviewData(previewData.map(item =>
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
          temasCount: manualForm.temas.length,
        }
        : item
    ));
    setEditingId(null);
    setMode('csv');
    setManualForm({ codigo: '', nombre: '', programa: PROGRAMAS[0], semestre: '1', creditos: '3', horas: '4', temas: [] });
    sileo.success({ title: 'Actualizado', description: 'Asignatura actualizada' });
  };

  const handleDeleteItem = (id: string) => {
    setPreviewData(previewData.filter(item => item.id !== id));
  };

  const handleConfirmUpload = async () => {
    const successCount = previewData.filter(item => item.status !== 'error').length;
    if (successCount === 0) {
      sileo.error({ title: 'Sin datos válidos', description: 'No hay asignaturas válidas para crear.' });
      return;
    }
    setIsConfirming(true);
    try {
      const validItems = previewData.filter(item => item.status !== 'error');
      const res = await fetch('/api/admin/microcurriculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: validItems }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const totalProcessed = (result.summary?.created || 0) + (result.summary?.updatedCount || 0);
        sileo.success({ title: 'Carga completada', description: `Proceso finalizado. Se procesaron ${totalProcessed} asignaturas.` });
        setFinalResults({ created: totalProcessed, errors: result.summary?.errors || 0 });
        setPreviewData([]);
      } else {
        sileo.error({ title: 'Error de carga', description: result.error || 'Ocurrió un error en la carga.' });
      }
    } catch (error) {
      sileo.error({ title: 'Error de red', description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleAddTema = (e?: React.FormEvent) => {
    e?.preventDefault();
    const tema = newTema.trim();
    if (tema && !manualForm.temas.includes(tema)) {
      setManualForm({ ...manualForm, temas: [...manualForm.temas, tema] });
      setNewTema('');
    }
  };

  const handleRemoveTema = (temaToRemove: string) => {
    setManualForm({ ...manualForm, temas: manualForm.temas.filter(t => t !== temaToRemove) });
  };

  const handleCancel = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setFinalResults(null);
    setEditingId(null);
    setManualForm({ codigo: '', nombre: '', programa: PROGRAMAS[0], semestre: '1', creditos: '3', horas: '4', temas: [] });
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
    <div className="flex flex-col gap-6">
      <div className="flex justify-end gap-2">
        <Button
          variant={mode === 'csv' ? 'default' : 'outline'}
          onClick={() => { setMode('csv'); handleCancel(); }}
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
          {mode === 'csv' ? (
            <>
              <Card className="p-0 overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    Instrucciones
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Sigue estos pasos para la carga masiva.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold">1. Descarga la plantilla</p>
                    <a href="/formatos/plantilla_microcurriculo.csv" download>
                      <Button variant="outline" className="w-full justify-start h-9 text-xs">
                        <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                        Descargar Plantilla CSV
                      </Button>
                    </a>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold">2. Completa los datos</p>
                    <div className="rounded-md bg-muted/30 p-3 space-y-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3" />
                        <span className="font-semibold text-foreground">Columnas requeridas:</span>
                      </div>
                      <ul className="space-y-1 ml-5 list-disc text-[10px]">
                        <li>Código, Nombre, Programa</li>
                        <li>Semestre, Créditos, Horas</li>
                        <li>Temas (Separados por ;)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0 overflow-hidden border shadow-xs">
                <CardHeader className="border-b px-5 py-4 bg-muted/10">
                  <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                    Subir Archivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
                  <div className="flex gap-2 mt-4 flex-col">
                    <Button
                      onClick={handlePreview}
                      disabled={!file || isLoading || isPreview}
                      className="w-full text-xs h-9"
                    >
                      {isLoading && !isPreview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generar Vista Previa
                    </Button>
                    {(file || isPreview) && (
                      <Button onClick={handleCancel} variant="ghost" className="w-full text-xs h-9 text-muted-foreground hover:text-destructive">
                        Limpiar todo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-0 overflow-hidden border shadow-xs">
              <CardHeader className="border-b px-5 py-4 bg-muted/10">
                <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                  {editingId ? 'Editar Asignatura' : 'Nueva Asignatura'}
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Ingresa los detalles manualmente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="micro-codigo" className="text-xs font-semibold">Código</Label>
                    <Input id="micro-codigo" className="h-9 text-xs" value={manualForm.codigo}
                      onChange={e => setManualForm({ ...manualForm, codigo: e.target.value })} placeholder="Ej: 718004" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="micro-semestre" className="text-xs font-semibold">Semestre</Label>
                    <Input id="micro-semestre" type="number" className="h-9 text-xs" value={manualForm.semestre}
                      onChange={e => setManualForm({ ...manualForm, semestre: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="micro-nombre" className="text-xs font-semibold">Nombre de la Asignatura</Label>
                  <Input id="micro-nombre" className="h-9 text-xs" value={manualForm.nombre}
                    onChange={e => setManualForm({ ...manualForm, nombre: e.target.value })} placeholder="Ej: Matemáticas I" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="micro-programa" className="text-xs font-semibold">Programa Académico</Label>
                  <Select value={manualForm.programa} onValueChange={value => setManualForm({ ...manualForm, programa: value })}>
                    <SelectTrigger id="micro-programa" className="h-9 text-xs">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAMAS.map(p => (
                        <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="micro-creditos" className="text-xs font-semibold">Créditos</Label>
                    <Input id="micro-creditos" type="number" className="h-9 text-xs" value={manualForm.creditos}
                      onChange={e => setManualForm({ ...manualForm, creditos: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="micro-horas" className="text-xs font-semibold">Horas Semanales</Label>
                    <Input id="micro-horas" type="number" className="h-9 text-xs" value={manualForm.horas}
                      onChange={e => setManualForm({ ...manualForm, horas: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs font-semibold text-foreground">Gestión de Temas</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Agrega un tema y pulsa Enter..." className="h-9 text-xs" value={newTema}
                      onChange={e => setNewTema(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTema())} />
                    <Button type="button" variant="secondary" size="sm" className="h-9 px-3" onClick={() => handleAddTema()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 min-h-16 p-2.5 rounded-xl bg-muted/20 border border-dashed border-muted-foreground/20 content-start">
                    {manualForm.temas.length > 0 ? (
                      manualForm.temas.map(t => (
                        <Badge key={t} variant="secondary"
                          className="pl-2 pr-1 py-0.5 text-[10px] bg-background border border-muted-foreground/10 hover:bg-muted/50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs">
                          {t}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 rounded-full bg-muted-foreground/20 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveTema(t)}
                            aria-label="Quitar tema"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </Badge>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full opacity-40">
                        <span className="text-[10px] italic">No hay temas agregados todavía</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {editingId ? (
                    <>
                      <Button onClick={handleUpdateItem} className="flex-1 h-9 text-xs">Guardar Cambios</Button>
                      <Button variant="ghost" className="h-9 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => { setEditingId(null); setMode('csv'); handleCancel(); }}>
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
          <Card className="p-0 overflow-hidden border shadow-xs">
            <CardHeader className="border-b px-5 py-4 bg-muted/10">
              <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                Asignaturas para Cargar ({previewData.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading && !isPreview ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground animate-pulse">Procesando archivo...</p>
                </div>
              ) : finalResults ? (
                <div className="flex flex-col items-center justify-center min-h-96 space-y-4 text-center p-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="sm:text-xl text-lg tracking-heading font-semibold">¡Carga Exitosa!</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Se han procesado correctamente {finalResults.created} asignaturas en el sistema.
                    </p>
                  </div>
                  <Button onClick={handleNewUpload} variant="outline" className="mt-4 h-9 text-xs">
                    Realizar nueva carga
                  </Button>
                </div>
              ) : previewData.length > 0 ? (
                <div className="bg-card border rounded-md overflow-hidden shadow-sm">
                  <div className="relative overflow-x-auto overflow-y-auto max-h-[600px]">
                    <Table>
                      <TableHeader className="bg-muted/30 sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Asignatura</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground hidden sm:table-cell">Información</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Temas</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/50 group">
                            <TableCell className="text-xs px-4 py-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-foreground">{item.nombreAsignatura}</span>
                                  {item.status === 'existing' && (
                                    <Badge variant="warningSoft" className="text-[9px] px-1.5 py-0 h-4 font-normal">Actualización</Badge>
                                  )}
                                  {item.status === 'error' && (
                                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 font-normal">Error</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="font-mono text-[9px] px-1.5 py-0 rounded bg-muted/50 text-muted-foreground">{item.codigoAsignatura}</Badge>
                                  <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{item.programa || 'Sin programa'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs px-4 py-3 hidden sm:table-cell">
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Sem:</span> {item.semestre}°</span>
                                <span className="text-[11px] text-muted-foreground">
                                  <span className="font-semibold text-foreground">Cred:</span> {item.creditos}
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30 mx-1 inline-block" />
                                  <span className="font-semibold text-foreground">Horas:</span> {item.horas}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs px-4 py-3">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {item.temas && item.temas.length > 0 ? (
                                  <>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-muted-foreground/20 font-normal">{item.temas[0]}</Badge>
                                    {item.temas.length > 1 && (
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-muted-foreground/20 font-normal bg-muted/10">+{item.temas.length - 1} más</Badge>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">Sin temas</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                  onClick={() => handleEditItem(item.id)}
                                  aria-label="Editar elemento">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                  onClick={() => handleDeleteItem(item.id)}
                                  aria-label="Eliminar elemento">
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
                    <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Sin información para cargar</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {mode === 'csv'
                      ? 'Sube un archivo CSV o utiliza la carga manual para ver los datos aquí.'
                      : 'Agrega asignaturas usando el formulario lateral para ver el resumen.'}
                  </p>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="border-t px-5 py-4 bg-muted/5 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Resumen de carga</span>
                    <span className="text-[11px] text-muted-foreground">
                      {successCount} asignatura{successCount !== 1 ? 's' : ''} lista{successCount !== 1 ? 's' : ''} para importar/actualizar
                      {errorCount > 0 && ` · ${errorCount} con errores`}
                    </span>
                  </div>
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={isConfirming || successCount === 0}
                    className="h-9 px-6 text-xs min-w-[150px]"
                  >
                    {isConfirming ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Procesando...</> : 'Confirmar y Crear'}
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

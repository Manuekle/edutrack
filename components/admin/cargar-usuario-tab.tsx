'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Role } from '@prisma/client';
import { BookOpen, CheckCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { sileo } from 'sileo';

interface UserPreview {
  name: string;
  document: string;
  email: string;
  subjectCode: string;
  groupCode: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

interface CargarUsuarioTabProps {
  type: Role;
}

export function CargarUsuarioTab({ type: role }: CargarUsuarioTabProps) {
  const title = role === 'DOCENTE' ? 'Cargar Docentes' : 'Cargar Estudiantes';
  const description = role === 'DOCENTE'
    ? 'Carga un archivo CSV con la lista de docentes para vincularlos a asignaturas y grupos.'
    : 'Carga un archivo CSV con la lista de estudiantes para matricularlos en asignaturas y grupos.';

  const templateHref =
    role === 'DOCENTE' ? '/formatos/plantilla_docentes.csv' : '/formatos/plantilla_estudiantes.csv';

  const [file, setFile] = useState<File | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<UserPreview[]>([]);
  const [finalResults, setFinalResults] = useState<{ created: number; mapped: number } | null>(null);

  const handlePreview = async () => {
    if (!file) return;

    setIsPreviewing(true);
    setFinalResults(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'true');

      const response = await fetch(`/api/admin/users/bulk?forceRole=${role}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        sileo.error({ title: 'Error', description: errorData.error || 'Error al procesar el archivo' });
        return;
      }

      const data = await response.json();
      setPreviewData(data.previewData || []);
    } catch (error) {
      sileo.error({ title: 'Error', description: 'No se pudo procesar el archivo para vista previa.' });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!file || previewData.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'false');

      const response = await fetch(`/api/admin/users/bulk?forceRole=${role}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        sileo.error({ title: 'Error', description: errorData.error || 'Error al cargar usuarios' });
        return;
      }

      const result = await response.json();
      sileo.success({
        title: 'Carga completada',
        description: `${result.summary.created} nuevos creados, ${result.summary.mapped} vinculados satisfactoriamente.`,
      });
      setFinalResults({
        created: result.summary.created || 0,
        mapped: result.summary.mapped || 0,
      });
      setPreviewData([]);
    } catch (error) {
      sileo.error({ title: 'Error', description: 'Error al confirmar la carga de usuarios.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewData([]);
    setFinalResults(null);
  };

  const handleNewUpload = () => {
    setFile(null);
    setPreviewData([]);
    setFinalResults(null);
  };

  const validCount = previewData.filter(
    (p) => p.status === 'success' || p.status === 'warning'
  ).length;
  const errorCount = previewData.filter((p) => p.status === 'error').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6">
        <Card className="p-0 overflow-hidden border shadow-xs">
          <CardHeader className="border-b px-5 py-4 bg-muted/10">
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
              Instrucciones
            </CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              Sigue estos pasos para la carga masiva.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold">1. Descarga la plantilla</p>
              <a href={templateHref} download>
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
                  <li>nombre</li>
                  <li>documento</li>
                  <li>correo</li>
                  <li>asignatura (código existente)</li>
                  <li>grupo (código existente)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-0 overflow-hidden border shadow-xs">
          <CardHeader className="border-b px-5 py-4 bg-muted/10">
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
              Subir Archivo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <SubjectFileUpload onFileSelect={setFile} file={file} />
            <div className="flex gap-2 mt-4 flex-col">
              <Button
                onClick={handlePreview}
                disabled={!file || isPreviewing || previewData.length > 0}
                className="w-full text-xs h-9"
              >
                {isPreviewing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Generar Vista Previa
              </Button>
              {(file || previewData.length > 0) && (
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  className="w-full text-xs h-9 text-muted-foreground hover:text-destructive"
                >
                  Limpiar todo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="p-0 overflow-hidden border shadow-xs">
          <CardHeader className="border-b px-5 py-4 bg-muted/10">
            <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
              Usuarios para Cargar ({previewData.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isPreviewing ? (
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
                  <h3 className="sm:text-xl text-lg tracking-card font-semibold">
                    ¡Carga Exitosa!
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Se han procesado correctamente {finalResults.created} usuarios nuevos y
                    vinculado {finalResults.mapped} registros en el sistema.
                  </p>
                </div>
                <Button onClick={handleNewUpload} variant="outline" className="mt-4 h-9 text-xs">
                  Realizar nueva carga
                </Button>
              </div>
            ) : previewData.length > 0 ? (
              <div className="bg-card rounded-none overflow-hidden">
                <div className="relative overflow-x-auto overflow-y-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0 z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground w-10">
                          Estado
                        </TableHead>
                        <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                          Usuario
                        </TableHead>
                        <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground hidden sm:table-cell">
                          Asignación
                        </TableHead>
                        <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                          Mensaje
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/50 group">
                          <TableCell className="text-xs px-4 py-3">
                            {row.status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : row.status === 'warning' ? (
                              <Badge
                                variant="outline"
                                className="text-[8px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5 py-0 h-4"
                              >
                                Vínculo
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-[8px] px-1.5 py-0 h-4 font-normal"
                              >
                                Error
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-foreground truncate max-w-[150px]">
                                {row.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono mt-1">
                                {row.document}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs px-4 py-3 hidden sm:table-cell">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] text-muted-foreground">
                                <span className="font-semibold text-foreground">Asig:</span>{' '}
                                <span className="font-mono">{row.subjectCode}</span>
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                <span className="font-semibold text-foreground">Grp:</span>{' '}
                                <span className="font-mono">{row.groupCode}</span>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className="text-[10px] px-4 py-3 text-muted-foreground truncate max-w-[200px]"
                            title={row.message}
                          >
                            {row.message}
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
                  <Upload className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h4 className="text-[17px] font-semibold tracking-card text-foreground mb-1">
                  Sin información para cargar
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Sube un archivo CSV para ver los datos aquí.
                </p>
              </div>
            )}

            {previewData.length > 0 && !finalResults && (
              <div className="border-t px-5 py-4 bg-muted/5 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">Resumen de carga</span>
                  <span className="text-[11px] text-muted-foreground">
                    {validCount} usuario{validCount !== 1 ? 's' : ''} listo
                    {validCount !== 1 ? 's' : ''} para importar/vincular
                    {errorCount > 0 && ` · ${errorCount} con errores`}
                  </span>
                </div>
                <Button
                  onClick={handleConfirmUpload}
                  disabled={isUploading || validCount === 0}
                  className="h-9 px-6 text-xs min-w-[150px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar y Cargar'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

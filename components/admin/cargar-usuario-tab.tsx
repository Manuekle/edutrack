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
import { CheckCircle2, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { sileo } from 'sileo';
import { Role } from '@prisma/client';

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

  const [file, setFile] = useState<File | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<UserPreview[]>([]);

  const handlePreview = async () => {
    if (!file) return;

    setIsPreviewing(true);
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
         sileo.error({ description: errorData.error || 'Error al procesar el archivo' });
         return;
      }

      const data = await response.json();
      setPreviewData(data.previewData || []);
    } catch (error) {
      sileo.error({ description: 'No se pudo procesar el archivo para vista previa.' });
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
         sileo.error({ description: errorData.error || 'Error al cargar usuarios' });
         return;
      }

      const result = await response.json();
      sileo.success({
        description: `Carga completada: ${result.summary.created} nuevos creados, ${result.summary.mapped} vinculados satisfactoriamente.`,
      });
      setFile(null);
      setPreviewData([]);
    } catch (error) {
      sileo.error({ description: 'Error al confirmar la carga de usuarios.' });
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = previewData.filter(p => p.status === 'success' || p.status === 'warning').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Instructions and Upload */}
      <div className="space-y-6">
        <Card className="border shadow-xs">
          <CardHeader className="bg-muted/5 border-b py-4">
            <CardTitle className="text-sm font-semibold tracking-card">
              {title}
            </CardTitle>
            <CardDescription className="text-[11px]">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold">Columnas requeridas:</p>
              <ul className="text-[10px] text-muted-foreground list-disc ml-4 space-y-1">
                <li><strong>nombre</strong></li>
                <li><strong>documento</strong></li>
                <li><strong>correo</strong></li>
                <li><strong>asignatura</strong> (código existente)</li>
                <li><strong>grupo</strong> (código existente)</li>
              </ul>
            </div>
            
            <SubjectFileUpload onFileSelect={setFile} file={file} />

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handlePreview}
                disabled={!file || isPreviewing || previewData.length > 0}
                className="h-9 text-xs"
              >
                {isPreviewing ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-3.5 w-3.5" />
                )}
                Previsualizar
              </Button>
              {previewData.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                  }}
                  className="h-9 text-xs text-muted-foreground"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Preview Table */}
      <div className="lg:col-span-2">
        <Card className="border shadow-xs h-full">
          <CardHeader className="bg-muted/5 border-b py-4">
            <CardTitle className="text-sm font-semibold tracking-card uppercase flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Vista Previa ({previewData.length} registros)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[calc(100%-60px)]">
            {previewData.length > 0 ? (
              <>
                <div className="flex-1 overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-bold px-4 py-2 w-10">Estado</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold px-4 py-2">Usuario</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold px-4 py-2">Asignación</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold px-4 py-2">Mensaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          <TableCell className="px-4 py-2">
                            {row.status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : row.status === 'warning' ? (
                              <Badge variant="outline" className="text-[8px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-1 py-0 h-4">
                                Vínculo
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4 rounded">
                                Error
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-xs font-medium truncate max-w-[150px]">
                            <p>{row.name}</p>
                            <p className="text-[9px] text-muted-foreground font-normal font-mono">{row.document}</p>
                          </TableCell>
                          <TableCell className="px-4 py-2 text-[10px] truncate max-w-[150px]">
                            <p>Asignatura: <span className="font-mono">{row.subjectCode}</span></p>
                            <p>Grupo: <span className="font-mono">{row.groupCode}</span></p>
                          </TableCell>
                          <TableCell className="px-4 py-2 text-[10px] text-muted-foreground truncate max-w-[200px]" title={row.message}>
                            {row.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 bg-muted/5 border-t flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{validCount}</span> listos para importar/vincular
                  </div>
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={isUploading || validCount === 0}
                    className="h-9 px-6 text-xs font-semibold"
                  >
                    {isUploading ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Confirmar Carga'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="bg-muted/30 p-4 rounded-full mb-3">
                  <Upload className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                  Sube un archivo para ver los datos aquí antes de procesarlos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

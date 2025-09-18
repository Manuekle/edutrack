'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Report {
  id: string;
  subjectId: string;
  subject: {
    name: string;
    code: string;
  };
  status: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'FALLIDO';
  format: 'PDF' | 'CSV';
  fileUrl: string | null;
  fileName: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

const ReportStatusBadge = ({ status }: { status: Report['status'] }) => {
  const statusConfig = {
    PENDIENTE: {
      text: 'Pendiente',
      icon: <Clock className="h-3.5 w-3.5 mr-1.5" />,
      variant: 'outline' as const,
    },
    EN_PROCESO: {
      text: 'Procesando',
      icon: <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />,
      variant: 'outline' as const,
    },
    COMPLETADO: {
      text: 'Completado',
      icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" />,
      variant: 'outline' as const,
    },
    FALLIDO: {
      text: 'Fallido',
      icon: <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-destructive" />,
      variant: 'outline' as const,
    },
  };

  const { text, icon, variant } = statusConfig[status] || statusConfig.PENDIENTE;

  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      <span className="text-xs font-normal">{text}</span>
    </Badge>
  );
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/docente/reportes');
      if (!response.ok) {
        throw new Error('No se pudo cargar el historial de reportes.');
      }
      const data = await response.json();
      setReports(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los reportes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling para actualizar el estado de los reportes en proceso
  useEffect(() => {
    const hasPendingReports = reports.some(
      r => r.status === 'PENDIENTE' || r.status === 'EN_PROCESO'
    );
    if (!hasPendingReports) return;

    const interval = setInterval(() => {
      fetchReports();
    }, 5000); // Refresca cada 5 segundos

    return () => clearInterval(interval);
  }, [reports, fetchReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownload = async (report: Report) => {
    if (!report.fileUrl || !report.fileName) {
      toast.error('La URL o el nombre del archivo no están disponibles.');
      return;
    }

    setDownloadingReportId(report.id);
    toast.info('Iniciando la descarga...');

    try {
      const response = await fetch(report.fileUrl);
      if (!response.ok) {
        throw new Error(`Error al descargar el archivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Descarga completada.');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ocurrió un error al descargar el reporte';
      toast.error(errorMessage);
    } finally {
      setDownloadingReportId(null);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CardHeader className="p-0 w-full">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Reportes de Asistencia
          </CardTitle>
          <CardDescription className="text-xs">
            Revisa el historial de reportes generados para todas tus asignaturas
          </CardDescription>
        </CardHeader>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="text-xs tracking-tight font-normal px-4 py-2">
                Asignatura
              </TableHead>
              <TableHead className="text-xs tracking-tight font-normal px-4 py-2">Fecha</TableHead>
              <TableHead className="text-xs tracking-tight font-normal px-4 py-2">Estado</TableHead>
              <TableHead className="text-xs tracking-tight font-normal px-4 py-2 text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-56 text-center">
                  <div className="flex flex-col items-center justify-center py-6">
                    <p className="text-xs">No hay reportes generados</p>
                    <p className="text-xs text-muted-foreground">
                      Los reportes que generes aparecerán aquí
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map(report => (
                <TableRow key={report.id} className="group">
                  <TableCell className="px-4 py-2 text-xs">
                    <div className="font-medium">
                      {report.subject?.name || 'Asignatura no disponible'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {report.subject?.code || 'Código no disponible'}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    <div className="text-xs">
                      {format(new Date(report.createdAt), 'PPP', { locale: es })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(report.createdAt), 'h:mm a', { locale: es }).toUpperCase()}
                    </div>
                  </TableCell>

                  <TableCell className="py-2 text-xs">
                    <ReportStatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {report.status === 'COMPLETADO' && report.fileUrl ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleDownload(report)}
                        disabled={downloadingReportId === report.id}
                      >
                        {downloadingReportId === report.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          'Descargar'
                        )}
                      </Button>
                    ) : report.status === 'FALLIDO' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center text-xs text-destructive">
                            No se pudo generar el reporte
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[200px] text-xs">
                            {report.error || 'Error desconocido al generar el reporte'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {report.status === 'EN_PROCESO' ? 'En progreso...' : 'Pendiente'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

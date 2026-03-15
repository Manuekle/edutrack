'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, CheckCircle, Clock, Download, FileText, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { sileo } from 'sileo';

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
      sileo.error({ title: errorMessage });
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
      sileo.error({ title: 'La URL o el nombre del archivo no están disponibles.' });
      return;
    }

    setDownloadingReportId(report.id);
    sileo.info({ title: 'Iniciando la descarga...' });

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

      sileo.success({ title: 'Descarga completada.' });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ocurrió un error al descargar el reporte';
      sileo.error({ title: errorMessage });
    } finally {
      setDownloadingReportId(null);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <Alert variant="destructive" className="max-w-md rounded-2xl border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-card text-foreground">Mis Reportes</h1>
          <p className="text-muted-foreground sm:text-sm text-xs max-w-xl">
            Historial de reportes de asistencia — solicítalos desde el detalle de una asignatura y
            descárgalos aquí cuando estén listos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
            <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileText className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="sm:text-[15px] text-xs font-semibold text-foreground tracking-card">
              Aún no has solicitado reportes
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Ve al detalle de una asignatura y usa el botón «Generar Reporte» para comenzar.
            </p>
          </div>
        ) : (
          reports.map(report => (
            <Card
              key={report.id}
              className="hover:shadow-md transition-all duration-300 border-border/50 group overflow-hidden"
            >
              <CardHeader className="pb-3 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-[10px] py-0">
                        {report.subject?.code}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] py-0">
                        {report.format}
                      </Badge>
                    </div>
                    <CardTitle className="text-xs truncate group-hover:text-primary transition-colors">
                      {report.subject?.name}
                    </CardTitle>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/40 transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(report.createdAt), 'PPP', { locale: es })}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium pl-4.5">
                      {format(new Date(report.createdAt), 'h:mm a', { locale: es }).toUpperCase()}
                    </div>
                  </div>
                  <ReportStatusBadge status={report.status} />
                </div>

                <div className="pt-2 border-t border-border/40 flex justify-end">
                  {report.status === 'COMPLETADO' && report.fileUrl ? (
                    <Button
                      variant="outline"
                      size="default"
                      className="h-8 rounded-xl bg-primary/5 hover:bg-primary hover:text-white border-primary/20 transition-all gap-2 text-xs font-semibold"
                      onClick={() => handleDownload(report)}
                      disabled={downloadingReportId === report.id}
                    >
                      {downloadingReportId === report.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" /> Descargando
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3" /> Descargar
                        </>
                      )}
                    </Button>
                  ) : report.status === 'FALLIDO' ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help text-destructive text-[11px] font-semibold bg-destructive/5 px-2 py-1 rounded-lg">
                          <AlertCircle className="h-3 w-3" />
                          Error en generación
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl border-border bg-popover/95 backdrop-blur-sm">
                        <p className="max-w-[180px] text-[10px]">
                          {report.error || 'Ocurrió un error inesperado al generar el archivo.'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground animate-pulse px-2 py-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {report.status === 'EN_PROCESO' ? 'Generando archivo...' : 'En cola...'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

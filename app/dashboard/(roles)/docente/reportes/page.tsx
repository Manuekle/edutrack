'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
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
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="p-0 pb-6 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full">
            <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
              Mis Reportes
            </CardTitle>
            <CardDescription className="text-xs">
              Historial de reportes de asistencia — solicítalos desde el detalle de una asignatura y
              descárgalos aquí cuando estén listos
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1">
            <div className="divide-y divide-border/40">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                    <AlertCircle className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[15px] font-semibold text-foreground tracking-card">
                      Aún no has solicitado reportes
                    </p>
                    <p className="text-[13px] text-muted-foreground mx-auto max-w-sm">
                      Ve al detalle de una asignatura y usa el botón «Generar Reporte» para
                      solicitarlo
                    </p>
                  </div>
                </div>
              ) : (
                reports.map(report => (
                  <div
                    key={report.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 hover:bg-muted/50 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex flex-col min-w-0 gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-foreground tracking-card truncate">
                            {report.subject?.name || 'Asignatura no disponible'}
                          </span>
                          <ReportStatusBadge status={report.status} />
                        </div>
                        <div className="flex items-center gap-2 text-[13px] text-muted-foreground font-medium">
                          <span className="font-mono text-[11px] font-bold tracking-card uppercase bg-background px-1.5 py-0.5 rounded-md text-muted-foreground">
                            {report.subject?.code || 'Código no disponible'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>{format(new Date(report.createdAt), 'PPP', { locale: es })}</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>
                            {format(new Date(report.createdAt), 'h:mm a', {
                              locale: es,
                            }).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end shrink-0 sm:pl-0 pl-14 items-center gap-2">
                      {report.status === 'COMPLETADO' && report.fileUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-full text-primary hover:text-primary hover:bg-primary/10 text-[13px] font-semibold"
                          onClick={() => handleDownload(report)}
                          disabled={downloadingReportId === report.id}
                        >
                          {downloadingReportId === report.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Descargando...
                            </>
                          ) : (
                            'Descargar'
                          )}
                        </Button>
                      ) : report.status === 'FALLIDO' ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center text-[13px] font-medium text-destructive px-3 py-1 rounded-full bg-destructive/10">
                              Error al generar
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="rounded-xl border-border">
                            <p className="max-w-[200px] text-xs">
                              {report.error || 'Error desconocido al generar el reporte'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-[13px] font-medium text-muted-foreground px-3">
                          {report.status === 'EN_PROCESO' ? 'Procesando...' : 'Pendiente'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { TablePagination } from '@/components/shared/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bookmark, CalendarDays, History, RefreshCw, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

type EnrichedAttendance = {
  id: string;
  createdAt: string;
  status: string;
  class: {
    topic: string | null;
    date: string;
    subject: {
      name: string;
    };
  };
};

const ITEMS_PER_PAGE = 10;

const STATUS_STYLE: Record<string, string> = {
  PRESENT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  ABSENT: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  LATE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  JUSTIFIED: 'bg-primary/10 text-primary',
};

const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Tardanza',
  JUSTIFIED: 'Justificado',
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? 'bg-muted text-muted-foreground';
  const label = STATUS_LABEL[status] ?? status;
  return (
    <Badge
      className={`${style} text-[10px] uppercase font-medium tracking-wider px-2 py-0.5 rounded-full`}
    >
      {label}
    </Badge>
  );
}

export default function HistorialAsistenciasPage() {
  const { status: sessionStatus } = useSession();
  const [attendances, setAttendances] = useState<EnrichedAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = attendances.length;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedAttendances = attendances.slice(startIndex, endIndex);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [totalItems]);

  const fetchAttendances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/estudiante/historial');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudieron cargar las asistencias.');
      }
      const responseData = await response.json();
      setAttendances(responseData.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchAttendances();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
      setError('Debes iniciar sesión para ver tu historial.');
    }
  }, [sessionStatus, fetchAttendances]);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-card text-foreground">
          Mi Historial de Asistencia
        </h1>
        <p className="text-muted-foreground sm:text-sm text-xs mt-1">
          Registro de tus asistencias durante el período académico actual.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5 shadow-none">
          <div className="p-5 flex gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-destructive">
                  Error al cargar el historial
                </h3>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={fetchAttendances}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Reintentar
              </Button>
            </div>
          </div>
        </Card>
      ) : attendances.length === 0 ? (
        <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-border/40">
          <div className="h-14 w-14 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4 shadow-xs">
            <History className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-foreground tracking-card">
            Sin historial disponible
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            No se han encontrado asistencias registradas para este periodo académico.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="divide-y divide-border/30">
            {paginatedAttendances.map(attendance => (
              <div
                key={attendance.id}
                className="px-5 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex bg-primary/10 h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Bookmark className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {attendance.class.subject.name}
                    </p>
                    <StatusBadge status={attendance.status} />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                    <span className="truncate">
                      {attendance.class.topic || 'Clase general'}
                    </span>
                    <span className="hidden sm:block text-border/60">·</span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {attendance.class.date
                        ? format(new Date(attendance.class.date), 'PPP', { locale: es })
                        : 'Sin fecha'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {attendances.length > ITEMS_PER_PAGE && (
            <div className="px-5 py-3 border-t border-border/30 bg-muted/10">
              <TablePagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

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

// Tipo de dato para la asistencia, ahora enriquecido
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

export default function HistorialAsistenciasPage() {
  const { status: sessionStatus } = useSession();
  const [attendances, setAttendances] = useState<EnrichedAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination values
  const totalItems = attendances.length;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedAttendances = attendances.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Reset to first page when attendances change
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-card text-foreground">
          Mi Historial de Asistencia
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro de tus asistencias durante el período académico actual.
        </p>
      </div>

      <div className="space-y-4">
        {error ? (
          <div className="rounded-2xl bg-destructive/10 p-5 border border-destructive/20 shadow-sm">
            <div className="flex">
              <div className="shrink-0">
                <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-[15px] font-medium text-destructive">
                  Error al cargar el historial
                </h3>
                <div className="mt-2 text-[14px] text-destructive/90">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
                    onClick={fetchAttendances}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reintentar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : attendances.length === 0 ? (

          <div className="col-span-full py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
            <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center mx-auto mb-4 shadow-sm">
              <History className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-[15px] font-semibold text-foreground tracking-card">
              Sin historial disponible
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              No se han encontrado asistencias registradas para este periodo académico en tu perfil de
              estudiante.
            </p>
          </div>
        ) : (
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
            <div className="divide-y divide-border/50">
              {paginatedAttendances.map(attendance => (
                <div
                  key={attendance.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex bg-blue-500/10 h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                    <Bookmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-[16px] font-semibold text-foreground truncate">
                        {attendance.class.subject.name}
                      </p>
                      {attendance.status === 'PRESENT' ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-medium tracking-card px-1.5 py-0"
                        >
                          Presente
                        </Badge>
                      ) : attendance.status === 'ABSENT' ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 text-[10px] uppercase font-medium tracking-card px-1.5 py-0"
                        >
                          Ausente
                        </Badge>
                      ) : attendance.status === 'LATE' ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] uppercase font-medium tracking-card px-1.5 py-0"
                        >
                          Tardanza
                        </Badge>
                      ) : attendance.status === 'JUSTIFIED' ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px] uppercase font-medium tracking-card px-1.5 py-0"
                        >
                          Justificado
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground border-border/40 text-[10px] uppercase font-medium tracking-card px-1.5 py-0"
                        >
                          {attendance.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[13px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <span className="truncate">
                          {attendance.class.topic || 'Clase general'}
                        </span>
                      </div>
                      <div className="hidden sm:block text-border/60">•</div>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {format(new Date(attendance.class.date), 'PPPP', { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {attendances.length > 0 && (
              <div className="p-4 border-t border-border/50 bg-muted/10">
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
    </div>
  );
}

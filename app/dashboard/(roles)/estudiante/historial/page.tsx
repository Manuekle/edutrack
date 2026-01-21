'use client';

import { TablePagination } from '@/components/shared/table-pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RefreshCw, XCircle } from 'lucide-react';
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

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const fetchAttendances = async () => {
        try {
          // Llamada al nuevo endpoint específico para el historial del estudiante
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
      };

      fetchAttendances();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
      setError('Debes iniciar sesión para ver tu historial.');
    }
  }, [sessionStatus]);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div className="pb-4">
        <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
          Historial de Asistencias
        </CardTitle>
        <CardDescription className="text-xs">Listado de tus asistencias</CardDescription>
      </div>
      <CardContent className="p-0">
        {error ? (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-normal text-red-800 dark:text-red-200">
                  Error al cargar el historial
                </h3>
                <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      setError(null);
                      const fetchAttendances = async () => {
                        try {
                          // Llamada al nuevo endpoint específico para el historial del estudiante
                          const response = await fetch('/api/estudiante/historial');
                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(
                              errorData.message || 'No se pudieron cargar las asistencias.'
                            );
                          }
                          const responseData = await response.json();
                          setAttendances(responseData.data || []);
                        } catch (error: unknown) {
                          const errorMessage =
                            error instanceof Error
                              ? error.message
                              : 'Error al cargar el historial de asistencias';
                          setError(errorMessage);
                        } finally {
                          setIsLoading(false);
                        }
                      };

                      fetchAttendances();
                    }}
                    className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-xs font-normal text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : attendances.length === 0 ? (
          <Alert>
            <AlertDescription>No tienes asistencias registradas.</AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-md overflow-x-auto border-gray-200 dark:border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="text-xs font-normal px-4 py-2">Asignatura</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Tema</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Fecha</TableHead>
                  <TableHead className="text-xs font-normal text-right px-4 py-2">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAttendances.map(attendance => (
                  <TableRow key={attendance.id}>
                    <TableCell className="text-xs px-4 py-2">
                      {attendance.class.subject.name}
                    </TableCell>
                    <TableCell className="text-xs px-4 py-2">
                      <div
                        className="max-w-xs truncate text-gray-900 dark:text-white"
                        title={attendance.class.topic || 'Clase general'}
                      >
                        {attendance.class.topic || 'Clase general'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs px-4 py-2">
                      <div className="flex flex-col">
                        <span>
                          {format(new Date(attendance.class.date), 'PPP', {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right px-4 py-2">
                      <Badge variant="outline" className="lowercase font-normal">
                        {attendance.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            <div>
              <TablePagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}

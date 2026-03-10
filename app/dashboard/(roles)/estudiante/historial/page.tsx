'use client';

import { TablePagination } from '@/components/shared/table-pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
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
        <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
          Historial de Asistencias
        </CardTitle>
        <CardDescription className="text-xs">Listado de tus asistencias</CardDescription>
      </div>
      <Card className="p-0">
        <CardContent className="p-0">
          {error ? (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xs font-normal text-destructive">
                    Error al cargar el historial
                  </h3>
                  <div className="mt-2 text-xs text-destructive/90">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 text-destructive hover:bg-destructive/10 focus-visible:ring-destructive"
                      onClick={() => {
                        setIsLoading(true);
                        setError(null);
                        const fetchAttendances = async () => {
                          try {
                            const response = await fetch('/api/estudiante/historial');
                            if (!response.ok) {
                              const errorData = await response.json();
                              throw new Error(
                                errorData.message || 'No se pudieron cargar las asistencias.'
                              );
                            }
                            const responseData = await response.json();
                            setAttendances(responseData.data || []);
                          } catch (err: unknown) {
                            const errorMessage =
                              err instanceof Error
                                ? err.message
                                : 'Error al cargar el historial de asistencias';
                            setError(errorMessage);
                          } finally {
                            setIsLoading(false);
                          }
                        };
                        fetchAttendances();
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reintentar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : attendances.length === 0 ? (
            <div className="p-4">
              <Alert>
                <AlertDescription>No tienes asistencias registradas.</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="bg-card border rounded-md overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Asignatura</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Tema</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Fecha</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAttendances.map(attendance => (
                    <TableRow key={attendance.id} className="hover:bg-muted/50 group">
                      <TableCell className="text-xs px-4 py-3">
                        {attendance.class.subject.name}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div
                          className="max-w-xs truncate"
                          title={attendance.class.topic || 'Clase general'}
                        >
                          {attendance.class.topic || 'Clase general'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex flex-col">
                          <span>
                            {format(new Date(attendance.class.date), 'PPP', { locale: es })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-right px-4 py-3">
                        <Badge variant="outline" className="lowercase font-normal">
                          {attendance.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {attendances.length > 0 && (
          <div className="p-4 border-t">
            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

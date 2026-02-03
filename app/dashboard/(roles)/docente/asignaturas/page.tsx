'use client';

import { TablePagination } from '@/components/shared/table-pagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCurrentPeriod, useTeacherSubjects } from '@/hooks/use-teacher-subjects';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SubjectsPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod());

  // Use React Query hook
  const { filteredSubjects, availablePeriods, isLoading, error } = useTeacherSubjects({
    period: selectedPeriod,
    enabled: true,
  });

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Reset to first page when period changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod]);

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="pb-4 col-span-1 w-full">
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Mis Asignaturas
              </CardTitle>
              <CardDescription className="text-xs">
                Listado de asignaturas por período académico
              </CardDescription>
            </div>
            <div className="justify-end col-span-1 w-full items-center flex gap-2">
              <label
                htmlFor="period-select"
                className="text-xs text-muted-foreground whitespace-nowrap"
              >
                Período:
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id="period-select" className="text-xs w-[180px]">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map(period => (
                    <SelectItem key={period} value={period} className="text-xs font-sans">
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-4 mb-4 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error instanceof Error ? error.message : 'Ocurrió un error al cargar las asignaturas'}
            </div>
          )}
          <div className="border rounded-md bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="text-xs font-normal px-4 py-2">Nombre</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Código</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Programa</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Semestre</TableHead>
                  <TableHead className="text-xs font-normal text-right px-4 py-2">
                    Créditos
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : filteredSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center">
                        <h3 className="text-xs font-normal">No hay asignaturas disponibles</h3>
                        <div className="text-xs text-muted-foreground">
                          No se encontraron asignaturas para el período seleccionado
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubjects
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(subject => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-normal whitespace-nowrap px-4 py-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/dashboard/docente/asignaturas/${subject.id}`}
                                  className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                                  aria-label={`Ver detalles de la asignatura ${subject.name}`}
                                >
                                  {subject.name}
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ir a mi clase</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-xs font-mono">{subject.code}</TableCell>
                        <TableCell className="px-4 py-2 text-xs">{subject.program || 'N/A'}</TableCell>
                        <TableCell className="px-4 py-2 text-xs">{subject.semester || 'N/A'}</TableCell>
                        <TableCell className="px-4 py-2 text-right text-xs">
                          {subject.credits || '0'}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
            {filteredSubjects.length > 0 && (
              <div className="border-t">
                <TablePagination
                  currentPage={currentPage}
                  totalItems={filteredSubjects.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

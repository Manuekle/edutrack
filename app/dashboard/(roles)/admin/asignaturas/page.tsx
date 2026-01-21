'use client';

import { CreateSubjectModal } from '@/components/modals/create-subject-modal';
import { TablePagination } from '@/components/shared/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSubjects } from '@/hooks/use-subjects';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const ITEMS_PER_PAGE = [5, 10, 20, 50, 100] as const;

export default function GestionAsignaturasPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Usar React Query para obtener asignaturas
  const { subjects, pagination, isLoading, refetch } = useSubjects({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    enabled: true,
  });

  const handleSubjectCreated = () => {
    // Invalidar la query para refrescar los datos
    queryClient.invalidateQueries({ queryKey: ['subjects'] });
    setCurrentPage(1);
  };

  // Resetear a la primera página cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full">
          <CardTitle className="text-2xl font-semibold tracking-card">
            Gestión de Asignaturas
          </CardTitle>
          <CardDescription className="text-xs">
            Administra las asignaturas y sus docentes en el sistema
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2">
          <Button variant="default" onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <span>Nueva Asignatura</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b px-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold tracking-card">
                Lista de Asignaturas
              </CardTitle>
              <CardDescription className="text-xs">
                {pagination?.total || 0} asignatura
                {pagination?.total !== 1 ? 's' : ''} encontrada
                {pagination?.total !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o docente..."
                className="pl-9 w-full md:w-[300px] text-xs"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 pb-5 border-b">
            <div className="flex items-center gap-2 p-0">
              <p className="text-xs text-muted-foreground whitespace-nowrap">Mostrar</p>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={value => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE.map(pageSize => (
                    <SelectItem
                      key={pageSize}
                      value={pageSize.toString()}
                      className="text-xs font-semibold text-muted-foreground font-sans"
                    >
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground whitespace-nowrap">por página</p>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-md hidden sm:block">
              Página <span className="font-normal">{currentPage}</span> de{' '}
              <span className="font-normal">{pagination?.totalPages || 1}</span>
            </div>
          </div>

          <div className="relative overflow-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-normal px-4 py-2">Asignatura</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Código</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Docente</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Programa</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2 text-center">
                    Semestre
                  </TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2 text-center">
                    Créditos
                  </TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2 text-center">
                    Estudiantes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {searchTerm ? (
                        <div className="flex flex-col items-center justify-center py-6">
                          <Search className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No se encontraron asignaturas que coincidan con "{searchTerm}"
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                          <p className="text-xs text-muted-foreground">
                            No hay asignaturas registradas
                          </p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map(subject => (
                    <TableRow key={subject.id} className="hover:bg-muted/50 group">
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-normal text-foreground">{subject.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {subject.classCount} clase{subject.classCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {subject.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="truncate max-w-[150px]"
                            title={subject.teacher?.name || ''}
                          >
                            {subject.teacher?.name || 'Sin docente'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <span className="text-muted-foreground">
                          {subject.program || 'No especificado'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 text-center">
                        {subject.semester || '-'}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 text-center">
                        {subject.credits || '-'}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{subject.studentCount}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t">
            <TablePagination
              currentPage={currentPage}
              totalItems={pagination?.total || 0}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>

      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubjectCreated={handleSubjectCreated}
      />
    </div>
  );
}

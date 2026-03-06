'use client';

import { BulkEnrollModal } from '@/components/modals/bulk-enroll-modal';
import { TablePagination } from '@/components/shared/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Search, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = [5, 10, 20, 50, 100] as const;

export default function GestionAsignaturasPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isBulkEnrollModalOpen, setIsBulkEnrollModalOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Usar React Query para obtener asignaturas
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  // Memoize debounced values
  const debouncedFilters = useMemo(
    () => ({
      search: debouncedSearch,
      program: selectedProgram || undefined,
      semester:
        selectedSemester !== 'all' && selectedSemester
          ? isNaN(parseInt(selectedSemester))
            ? undefined
            : parseInt(selectedSemester)
          : undefined,
    }),
    [debouncedSearch, selectedProgram, selectedSemester]
  );

  // Usar React Query para obtener asignaturas
  const { subjects, pagination, isLoading, refetch, deleteSubject, isDeleting } = useSubjects({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedFilters.search,
    program: debouncedFilters.program,
    semester: debouncedFilters.semester,
    enabled: true,
  });

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedSubjects);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedSubjects(newSelection);
  };

  const toggleAll = () => {
    if (selectedSubjects.size === subjects.length && subjects.length > 0) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(subjects.map(s => s.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (
      confirm(
        `¿Estás seguro de eliminar ${selectedSubjects.size} asignatura(s)? Esta acción no se puede deshacer.`
      )
    ) {
      selectedSubjects.forEach(id => deleteSubject(id));
      setSelectedSubjects(new Set());
    }
  };

  const handleBulkEnroll = () => {
    setIsBulkEnrollModalOpen(true);
  };

  const handleBulkEnrollSuccess = () => {
    setSelectedSubjects(new Set());
    queryClient.invalidateQueries({ queryKey: ['subjects'] });
  };



  // Resetear a la primera página cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full">
          <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
            Gestión de Asignaturas
          </CardTitle>
          <CardDescription className="text-xs">
            Administra las asignaturas y sus docentes en el sistema
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2">
          {selectedSubjects.size > 0 && (
            <div className="flex bg-destructive/10 rounded-md border border-destructive/20 overflow-hidden">
              <Button
                variant="ghost"
                className="rounded-none h-9 text-xs text-destructive hover:bg-destructive hover:text-white"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Eliminar {selectedSubjects.size} asignaturas
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card className="overflow-hidden border shadow-xs">
        <CardHeader className="border-b px-5 py-4 bg-muted/10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="sm:text-sm text-xs font-semibold tracking-heading text-foreground">
                  Lista de Asignaturas
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {pagination?.total || 0} asignatura{pagination?.total !== 1 ? 's' : ''} encontrada{pagination?.total !== 1 ? 's' : ''}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full md:w-[250px]">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-9 h-9 text-xs bg-background"
                    name="search"
                    autoComplete="off"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Input
                    placeholder="Programa..."
                    className="w-full md:w-[150px] h-9 text-xs bg-background"
                    name="program"
                    autoComplete="off"
                    value={selectedProgram}
                    onChange={e => setSelectedProgram(e.target.value)}
                  />
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger className="w-full md:w-[130px] h-9 text-xs bg-background">
                      <SelectValue placeholder="Semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {[...Array(10)].map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">
                          {i + 1}° Semestre
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {selectedSubjects.size > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                <Button variant="secondary" size="sm" onClick={handleBulkEnroll} className="text-xs h-8">
                  Matricular en {selectedSubjects.size} asignatura(s)
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="gap-1.5 text-xs h-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader className="bg-background">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-[40px] px-4 py-3">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={subjects.length > 0 && selectedSubjects.size === subjects.length}
                        onCheckedChange={toggleAll}
                        className="rounded-[4px]"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold px-4 py-3 text-muted-foreground ">
                    Asignatura
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold px-4 py-3 text-muted-foreground  hidden sm:table-cell">
                    Código & Grupo
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold px-4 py-3 text-muted-foreground  hidden md:table-cell">
                    Docente(s)
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold px-4 py-3 text-muted-foreground  hidden lg:table-cell">
                    Programa
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold px-4 py-3 text-muted-foreground text-center  hidden sm:table-cell">
                    Semestre / Créditos
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold px-4 py-3 text-muted-foreground text-center ">
                    Estudiantes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index} className="border-b">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <Skeleton className="h-4 w-4 rounded-[4px]" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 justify-center">
                          <Skeleton className="h-4 w-[120px]" />
                          <Skeleton className="h-3 w-[60px]" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-[60px] rounded-md" />
                          <Skeleton className="h-5 w-[40px] rounded-md" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden md:table-cell">
                        <Skeleton className="h-4 w-[140px]" />
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden lg:table-cell">
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex flex-col items-center gap-1.5 justify-center">
                          <Skeleton className="h-3 w-[50px]" />
                          <Skeleton className="h-3 w-[60px]" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Skeleton className="h-6 w-[40px] rounded-md mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
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
                    <TableRow
                      key={subject.id}
                      className="hover:bg-muted/50 group transition-colors"
                    >
                      <TableCell className="px-4">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedSubjects.has(subject.id)}
                            onCheckedChange={() => toggleSelection(subject.id)}
                            className="rounded-[4px]"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col justify-center">
                          <span className="font-semibold text-foreground text-xs">
                            {subject.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            {subject.classCount} clase{subject.classCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0.5 font-normal rounded-md bg-muted/60 text-muted-foreground">
                            {subject.code}
                          </Badge>
                          {subject.group && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-normal rounded-md border-muted/50 text-muted-foreground">
                              Gr. {subject.group}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden md:table-cell">
                        <span
                          className="text-xs text-muted-foreground truncate max-w-[150px] inline-block"
                          title={subject.teachers?.map(t => t.name).join(', ') || ''}
                        >
                          {subject.teachers && subject.teachers.length > 0
                            ? subject.teachers.map(t => t.name || 'Sin nombre').join(', ')
                            : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground font-semibold">
                          {subject.program || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center hidden sm:table-cell">
                        <div className="flex flex-col items-center justify-center text-[11px]">
                          <span className="text-foreground">{subject.semester ? `${subject.semester}° Sem` : '—'}</span>
                          <span className="text-muted-foreground">{subject.credits ? `${subject.credits} Créditos` : '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5 bg-muted/30 w-fit mx-auto px-2 py-1 rounded-md">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] font-semibold text-foreground">{subject.studentCount}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t px-4 py-3 bg-muted/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Mostrar</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={value => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[65px] text-[11px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE.map(pageSize => (
                    <SelectItem
                      key={pageSize}
                      value={pageSize.toString()}
                      className="text-[11px]"
                    >
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalItems={pagination?.total || 0}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>



      <BulkEnrollModal
        isOpen={isBulkEnrollModalOpen}
        onClose={() => setIsBulkEnrollModalOpen(false)}
        selectedSubjectIds={selectedSubjects}
        onSuccess={handleBulkEnrollSuccess}
      />
    </div>
  );
}

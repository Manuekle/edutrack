'use client';

import { MicrocurriculoTab } from '@/components/admin/microcurriculo-tab';
import { EditSubjectModal } from '@/components/modals/edit-subject-modal';
import { TablePagination } from '@/components/shared/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubjects } from '@/hooks/use-subjects';
import { useQueryClient } from '@tanstack/react-query';
import { Edit2, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = [5, 10, 20, 50, 100] as const;

export default function GestionAsignaturasPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Usar React Query para obtener asignaturas
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSubjectForStudents, setSelectedSubjectForStudents] = useState<{
    name: string;
    students:
    | {
      id: string;
      name: string | null;
      correoInstitucional: string | null;
      codigoEstudiantil: string | null;
    }[]
    | undefined;
  } | null>(null);
  const [subjectToEdit, setSubjectToEdit] = useState<typeof subjects[0] | null>(null);

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
      {/* Page header */}
      <div id="tour-asignaturas-title">
        <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
          Gestión de Asignaturas
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Administra las asignaturas y sus microcurrículos
        </CardDescription>
      </div>

      <Tabs defaultValue="asignaturas" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="asignaturas">Asignaturas</TabsTrigger>
          <TabsTrigger value="microcurriculo">Microcurrículos</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Lista de asignaturas ── */}
        <TabsContent value="asignaturas" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className='space-y-4'>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2" id="tour-asignaturas-filters">
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
                        <SelectTrigger className="w-full md:w-32 h-9 text-xs bg-background">
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
                  <div className="flex flex-wrap gap-2 pt-2 border-t mt-2" id="tour-asignaturas-selection">
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

              <div className="p-0" id="tour-asignaturas-table">
                <div className="bg-card border rounded-md overflow-hidden shadow-sm">
                  <div className="relative overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[40px] text-xs font-normal px-4 py-2">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={subjects.length > 0 && selectedSubjects.size === subjects.length}
                                onCheckedChange={toggleAll}
                                className="rounded-sm"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                            Asignatura
                          </TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground hidden sm:table-cell">
                            Código & Grupo
                          </TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground hidden md:table-cell">
                            Docente
                          </TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground hidden lg:table-cell">
                            Programa
                          </TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-center hidden sm:table-cell">
                            Semestre / Créditos
                          </TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-center">
                            Estudiantes
                          </TableHead>
                          <TableHead className="w-[50px] text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          Array.from({ length: itemsPerPage }).map((_, index) => (
                            <TableRow key={index} className="hover:bg-muted/50 group">
                              <TableCell className="px-4 py-3">
                                <div className="flex items-center justify-center">
                                  <Skeleton className="h-4 w-4 rounded-sm" />
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
                                  <Skeleton className="h-5 w-[60px] rounded-full" />
                                  <Skeleton className="h-5 w-[40px] rounded-full" />
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
                                <Skeleton className="h-6 w-[40px] rounded-full mx-auto" />
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right">
                                <Skeleton className="h-8 w-8 ml-auto" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : subjects.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">
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
                                    className="rounded-sm"
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
                                  <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0.5 font-normal bg-muted/60 text-muted-foreground">
                                    {subject.code}
                                  </Badge>
                                  {subject.group && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-normal border-muted/50 text-muted-foreground">
                                      Gr. {subject.group}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3 hidden md:table-cell">
                                <span
                                  className="text-xs text-muted-foreground truncate max-w-[150px] inline-block"
                                  title={subject.teachers?.[0]?.name ?? undefined}
                                >
                                  {subject.teachers?.length ? (subject.teachers[0]?.name ?? 'Sin nombre') : '—'}
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
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedSubjectForStudents({
                                      name: subject.name,
                                      students: subject.students,
                                    })
                                  }
                                  className="flex items-center justify-center gap-1.5 bg-muted/30 w-fit mx-auto px-2 py-1 rounded-full hover:bg-muted transition-colors"
                                >
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[11px] font-semibold text-foreground">
                                    {subject.studentCount}
                                  </span>
                                </button>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => setSubjectToEdit(subject)}
                                  aria-label="Editar asignatura"
                                  title="Editar grupo, programa y docente"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="py-3  flex flex-col sm:flex-row items-center justify-between gap-4">
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
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Microcurrículos ── */}
        <TabsContent value="microcurriculo" className="mt-4">
          <MicrocurriculoTab />
        </TabsContent>
      </Tabs>

      <EditSubjectModal
        subject={subjectToEdit}
        isOpen={!!subjectToEdit}
        onClose={() => setSubjectToEdit(null)}
        onSubjectUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['subjects'] });
          setSubjectToEdit(null);
        }}
      />

      <Dialog
        open={!!selectedSubjectForStudents}
        onOpenChange={open => {
          if (!open) setSelectedSubjectForStudents(null);
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Estudiantes de {selectedSubjectForStudents?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedSubjectForStudents?.students && selectedSubjectForStudents.students.length > 0 ? (
            <div className="max-h-80 overflow-y-auto mt-2 rounded-xl bg-muted/30 p-2 space-y-1">
              {selectedSubjectForStudents.students.map(student => (
                <div
                  key={student.id}
                  className="flex flex-col rounded-lg bg-background px-3 py-2 text-xs border border-border/50"
                >
                  <span className="font-medium text-foreground">
                    {student.name || 'Sin nombre'}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {student.codigoEstudiantil || student.correoInstitucional || 'Sin identificador'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2 rounded-xl bg-muted/30 p-4 text-center">
              No hay estudiantes matriculados en esta asignatura.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

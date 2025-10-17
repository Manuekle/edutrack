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
import { BookOpen, GraduationCap, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = [5, 10, 20, 50, 100] as const;

interface Teacher {
  id: string;
  name: string;
  correoInstitucional: string;
  codigoDocente: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  program?: string | null;
  semester?: number | null;
  credits?: number | null;
  teacherId: string;
  teacher: Teacher;
  studentCount: number;
  classCount: number;
}

export default function GestionAsignaturasPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const handleSubjectCreated = (newSubject: Subject) => {
    setSubjects(currentSubjects => [newSubject, ...currentSubjects]);
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/admin/subjects');
        if (!response.ok) {
          throw new Error('Error al obtener las asignaturas');
        }
        const data = await response.json();
        setSubjects(data);
      } catch {
        toast.error('Error al cargar las asignaturas');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      subject =>
        subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjects, searchTerm]);

  // Calcular datos de paginación
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubjects = filteredSubjects.slice(startIndex, startIndex + itemsPerPage);

  // Resetear a la primera página cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full">
          <CardTitle className="text-2xl font-semibold tracking-tight">
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
              <CardTitle className="text-lg font-semibold tracking-card">
                Lista de Asignaturas
              </CardTitle>
              <CardDescription className="text-xs">
                {filteredSubjects.length} asignatura
                {filteredSubjects.length !== 1 ? 's' : ''} encontrada
                {filteredSubjects.length !== 1 ? 's' : ''}
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
              <span className="font-normal">{totalPages || 1}</span>
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
                {loading ? (
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
                ) : filteredSubjects.length === 0 ? (
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
                  paginatedSubjects.map(subject => (
                    <TableRow key={subject.id} className="hover:bg-muted/50 group">
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          </div>
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
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[150px]" title={subject.teacher.name}>
                            {subject.teacher.name}
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

          <div className="px-4 py-3 border-t">
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredSubjects.length}
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

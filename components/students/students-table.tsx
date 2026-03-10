'use client';

import { CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { TablePagination } from '../shared/table-pagination';
import { StudentTableRow } from './student-table-row';
import { UnenrollDialog } from './unenroll-dialog';

export interface Student {
  id: string;
  name: string | null;
  correoInstitucional: string | null;
  correoPersonal: string | null;
  document?: string | null;
  telefono?: string | null;
}

interface StudentsTableProps {
  students: Student[];
  isLoading: boolean;
  currentStudentForUnenroll: { id: string; name: string } | null;
  unenrollReason: string;
  setUnenrollReason: (reason: string) => void;
  setCurrentStudentForUnenroll: (student: { id: string; name: string } | null) => void;
  handleUnenrollRequest: (studentId: string, reason: string) => Promise<void>;
  isSubmitting: boolean;
}

export const StudentsTable: React.FC<StudentsTableProps> = ({
  students: allStudents,
  isLoading,
  currentStudentForUnenroll,
  unenrollReason,
  setUnenrollReason,
  setCurrentStudentForUnenroll,
  handleUnenrollRequest,
  isSubmitting,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const itemsPerPage = 5;

  const totalItems = allStudents.length;
  const currentStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [allStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [allStudents]);

  const handleUnenrollClick = (student: { id: string; name: string }) => {
    setCurrentStudentForUnenroll(student);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setUnenrollReason('');
    setCurrentStudentForUnenroll(null);
  };

  const handleConfirmUnenroll = async () => {
    if (currentStudentForUnenroll && unenrollReason.trim()) {
      await handleUnenrollRequest(currentStudentForUnenroll.id, unenrollReason);
      handleDialogClose();
    }
  };

  return (
    <>
      <div>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="sm:text-lg text-xs font-semibold tracking-card">
              Gestión de Estudiantes
            </CardTitle>
            <CardDescription className="text-xs">
              Gestiona los estudiantes matriculados en esta asignatura.
            </CardDescription>
          </div>
        </div>
        <div className='mt-4'>
          {isLoading ? (
            <div className="bg-card border rounded-lg overflow-hidden shadow-sm" role="status" aria-label="Cargando estudiantes">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Nombre</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Documento</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Correo Institucional</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Correo Personal</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Teléfono</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-4 py-3 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : allStudents.length > 0 ? (
            <div className="bg-card border rounded-md overflow-hidden shadow-sm">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                        Nombre
                      </TableHead>
                      <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                        Documento
                      </TableHead>
                      <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                        Correo Institucional
                      </TableHead>
                      <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                        Correo Personal
                      </TableHead>
                      <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                        Teléfono
                      </TableHead>
                      <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentStudents.map(student => (
                      <StudentTableRow
                        key={student.id}
                        student={student}
                        onUnenrollClick={handleUnenrollClick}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Dialog>
              <TablePagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                className="border-t"
              />
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No hay estudiantes matriculados"
              description="Los estudiantes matriculados en esta asignatura aparecerán aquí."
            />
          )}
        </div>
      </div>

      <UnenrollDialog
        isOpen={isDialogOpen}
        studentName={currentStudentForUnenroll?.name || null}
        reason={unenrollReason}
        isSubmitting={isSubmitting}
        onReasonChange={setUnenrollReason}
        onClose={handleDialogClose}
        onConfirm={handleConfirmUnenroll}
      />
    </>
  );
};

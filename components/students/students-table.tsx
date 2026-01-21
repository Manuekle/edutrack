'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Loading } from '@/components/ui/loading';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
              Gestión de Estudiantes
            </CardTitle>
            <CardDescription className="text-xs">
              Gestiona los estudiantes matriculados en esta asignatura.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading className="h-8 w-8" />
            </div>
          ) : allStudents.length > 0 ? (
            <div className="rounded-md border">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead className="text-xs tracking-card font-normal px-4 py-2">
                        Nombre
                      </TableHead>
                      <TableHead className="text-xs tracking-card font-normal px-4 py-2">
                        Documento
                      </TableHead>
                      <TableHead className="text-xs tracking-card font-normal px-4 py-2">
                        Correo Institucional
                      </TableHead>
                      <TableHead className="text-xs tracking-card font-normal px-4 py-2">
                        Correo Personal
                      </TableHead>
                      <TableHead className="text-xs tracking-card font-normal px-4 py-2">
                        Teléfono
                      </TableHead>
                      <TableHead className="text-xs tracking-card font-normal text-right px-4 py-2">
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
            <p className="text-xs text-muted-foreground text-center py-12 h-52 flex items-center justify-center">
              No hay estudiantes matriculados en esta asignatura.
            </p>
          )}
        </CardContent>
      </Card>

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

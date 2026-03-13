'use client';

import { CardDescription, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { TablePagination } from '../shared/table-pagination';
import { StudentTableRow } from './student-table-row';

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
}

export const StudentsTable: React.FC<StudentsTableProps> = ({
  students: allStudents,
  isLoading,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalItems = allStudents.length;
  const currentStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [allStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [allStudents]);

  return (
    <>
      <div>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="sm:text-lg text-xs font-semibold tracking-card">
              Gestión de Estudiantes
            </CardTitle>
            <CardDescription className="text-xs">
              Listado de estudiantes matriculados en esta sección.
            </CardDescription>
          </div>
        </div>
        <div className="mt-4">
          {isLoading ? (
            <div
              className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1"
              role="status"
              aria-label="Cargando estudiantes"
            >
              <div className="divide-y divide-border/40">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between gap-4 py-4 px-5">
                    <div className="flex items-center gap-3 w-full">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex flex-col gap-1.5 w-full">
                        <Skeleton className="h-4 w-36" />
                        <div className="flex gap-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : allStudents.length > 0 ? (
            <div className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1 relative">
              <div className="divide-y divide-border/40">
                {currentStudents.map(student => (
                  <StudentTableRow
                    key={student.id}
                    student={student}
                  />
                ))}
              </div>
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
              description="Los estudiantes matriculados en este grupo aparecerán aquí."
            />
          )}
        </div>
      </div>
    </>
  );
};

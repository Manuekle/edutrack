'use client';

import { CardDescription, CardTitle } from '@/components/ui/card';
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
import { CalendarRange } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { TablePagination } from '../shared/table-pagination';
import { CancelClassDialog } from './cancel-class-dialog';
import { calculateClassStatus, type DateUtils } from './class-status-calculator';
import { ClassTableRow } from './class-table-row';

export interface ClassWithStatus {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  topic?: string;
  description?: string;
  classroom?: string;
  status: string;
  cancellationReason?: string | null;
}

interface ClassesTableProps {
  classes: ClassWithStatus[];
  isLoading: boolean;
  subjectId?: string;
  handleCancel: (cls: ClassWithStatus) => void;
  handleMarkAsDone: (classId: string) => void;
  classStatusMap: Record<string, { label: string; color: string }>;
  dateUtils: DateUtils;
}

interface ClassesTableDialogProps {
  isCancelDialogOpen: boolean;
  classToCancel: ClassWithStatus | null;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  onCancelDialogOpenChange: (open: boolean) => void;
  onConfirmCancel: () => void;
  isSubmitting: boolean;
  formatClassDate: (cls: ClassWithStatus) => string;
}

export const ClassesTable: React.FC<ClassesTableProps & ClassesTableDialogProps> = ({
  classes: allClasses,
  isLoading,
  subjectId,
  handleCancel,
  handleMarkAsDone,
  classStatusMap,
  dateUtils,
  isCancelDialogOpen,
  classToCancel,
  cancelReason,
  setCancelReason,
  onCancelDialogOpenChange,
  onConfirmCancel,
  isSubmitting,
  formatClassDate,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalItems = allClasses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allClasses.slice(startIndex, startIndex + itemsPerPage);
  }, [allClasses, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [allClasses, currentPage, totalPages]);

  return (
    <>
      <div>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="sm:text-lg text-xs font-semibold tracking-card">
              Gestión de Clases
            </CardTitle>
            <CardDescription className="text-xs">
              Gestiona las sesiones de clase para esta asignatura.
            </CardDescription>
          </div>
        </div>
        <div className='mt-4'>
          {isLoading ? (
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm" role="status" aria-label="Cargando clases">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Fecha y Hora</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Salón</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Tema</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-center">Estado</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="px-4 py-3 flex justify-center"><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                      <TableCell className="px-4 py-3 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : allClasses.length > 0 ? (
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Fecha y Hora</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Salón</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Tema</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-center">
                      Estado
                    </TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map(cls => {
                    const statusInfo = calculateClassStatus(cls, dateUtils);
                    // Asegurar que visualStatus esté en el classStatusMap
                    const statusKey = statusInfo.visualStatus as keyof typeof classStatusMap;
                    const statusConfig = classStatusMap[statusKey] || classStatusMap.PROGRAMADA;

                    return (
                      <ClassTableRow
                        key={cls.id}
                        cls={cls}
                        subjectId={subjectId}
                        statusInfo={statusInfo}
                        statusLabel={statusConfig.label}
                        statusColor={statusConfig.color}
                        dateUtils={dateUtils}
                        onCancel={() => handleCancel(cls)}
                        onMarkAsDone={() => handleMarkAsDone(cls.id)}
                      />
                    );
                  })}
                </TableBody>
              </Table>
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
              icon={CalendarRange}
              title="Aún no hay clases programadas"
              description="Las clases de esta asignatura aparecerán aquí."
            />
          )}
        </div>
      </div>

      <CancelClassDialog
        isOpen={isCancelDialogOpen}
        classTopic={classToCancel?.topic || 'tema por definir'}
        classDate={classToCancel ? formatClassDate(classToCancel) : ''}
        cancelReason={cancelReason}
        isSubmitting={isSubmitting}
        onReasonChange={setCancelReason}
        onOpenChange={onCancelDialogOpenChange}
        onConfirm={onConfirmCancel}
      />
    </>
  );
};

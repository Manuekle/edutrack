'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">Gestión de Clases</CardTitle>
            <CardDescription className="text-xs">
              Gestiona las sesiones de clase para esta asignatura.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8" role="status" aria-label="Cargando clases">
              <Loading className="h-8 w-8" />
            </div>
          ) : allClasses.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="text-xs font-normal px-4 py-2">Fecha y Hora</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Salón</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Tema</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2 text-center">Estado</TableHead>
                  <TableHead className="text-xs font-normal text-right px-4 py-2 pr-6">
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
            <p className="text-xs text-muted-foreground text-center py-12">
              Aún no hay clases programadas para esta asignatura.
            </p>
          )}
        </CardContent>
      </Card>

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

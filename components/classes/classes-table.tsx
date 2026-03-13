'use client';

import { CardDescription, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
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
        <div className="mt-4">
          {isLoading ? (
            <div
              className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1"
              role="status"
              aria-label="Cargando clases"
            >
              <div className="divide-y divide-border/40">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between gap-4 py-4 px-5">
                    <div className="flex flex-col gap-1.5 w-full">
                      <Skeleton className="h-4 w-40" />
                      <div className="flex gap-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : allClasses.length > 0 ? (
            <div className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1 relative">
              <div className="divide-y divide-border/40">
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
              </div>
              <TablePagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                className="border-t border-border/40 mt-1"
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

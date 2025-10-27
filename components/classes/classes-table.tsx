"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { TablePagination } from "../shared/table-pagination"
import { CancelClassDialog } from "./cancel-class-dialog"
import { calculateClassStatus, type DateUtils } from "./class-status-calculator"
import { ClassTableRow } from "./class-table-row"
import { EditClassDialog } from "./edit-class-dialog"

export interface ClassWithStatus {
  id: string
  date: string
  startTime?: string
  endTime?: string
  topic?: string
  description?: string
  status: string
  cancellationReason?: string | null
}

interface ClassesTableProps {
  classes: ClassWithStatus[]
  isLoading: boolean
  subjectId?: string
  handleEdit: (cls: ClassWithStatus) => void
  handleCancel: (cls: ClassWithStatus) => void
  handleMarkAsDone: (classId: string) => void
  classStatusMap: Record<string, { label: string; color: string }>
  dateUtils: DateUtils
}

interface ClassesTableDialogProps {
  isCancelDialogOpen: boolean
  classToCancel: ClassWithStatus | null
  cancelReason: string
  setCancelReason: (reason: string) => void
  onCancelDialogOpenChange: (open: boolean) => void
  onConfirmCancel: () => void
  isEditDialogOpen: boolean
  classDate: Date | undefined
  setClassDate: (d: Date | undefined) => void
  startTime: string
  setStartTime: (v: string) => void
  endTime: string
  setEndTime: (v: string) => void
  classTopic: string
  setClassTopic: (v: string) => void
  classDescription: string
  setClassDescription: (v: string) => void
  isSubmitting: boolean
  onEditDialogOpenChange: (open: boolean) => void
  onSubmitEdit: (e: React.FormEvent) => void
  resetEditForm: () => void
  formatClassDate: (cls: ClassWithStatus) => string
}

export const ClassesTable: React.FC<ClassesTableProps & ClassesTableDialogProps> = ({
  classes: allClasses,
  isLoading,
  subjectId,
  handleEdit,
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
  isEditDialogOpen,
  classDate,
  setClassDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  classTopic,
  setClassTopic,
  classDescription,
  setClassDescription,
  isSubmitting,
  onEditDialogOpenChange,
  onSubmitEdit,
  resetEditForm,
  formatClassDate,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const totalItems = allClasses.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return allClasses.slice(startIndex, startIndex + itemsPerPage)
  }, [allClasses, currentPage])

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    } else if (totalPages === 0) {
      setCurrentPage(1)
    }
  }, [allClasses, currentPage, totalPages])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold tracking-heading">Gestión de Clases</CardTitle>
            <CardDescription className="text-xs">Gestiona las sesiones de clase para esta asignatura.</CardDescription>
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
                    <TableHead className="text-xs font-normal px-4 py-2">Fecha</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2">Tema</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2">Estado</TableHead>
                    <TableHead className="text-xs font-normal text-right px-4 py-2">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map(cls => {
                    const statusInfo = calculateClassStatus(cls, dateUtils)
                    const statusConfig = classStatusMap[statusInfo.visualStatus] || {
                      label: statusInfo.visualStatus === 'FINALIZADA' ? 'Finalizada' : 'Desconocido',
                      color:
                        statusInfo.visualStatus === 'FINALIZADA'
                          ? 'text-xs font-normal text-gray-600 dark:text-gray-400'
                          : 'text-xs font-normal',
                    }

                    return (
                      <ClassTableRow
                        key={cls.id}
                        cls={cls}
                        subjectId={subjectId}
                        statusInfo={statusInfo}
                        statusLabel={statusConfig.label}
                        statusColor={statusConfig.color}
                        dateUtils={dateUtils}
                        onEdit={() => handleEdit(cls)}
                        onCancel={() => handleCancel(cls)}
                        onMarkAsDone={() => handleMarkAsDone(cls.id)}
                      />
                    )
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

      <EditClassDialog
        isOpen={isEditDialogOpen}
        classDate={classDate}
        startTime={startTime}
        endTime={endTime}
        classTopic={classTopic}
        classDescription={classDescription}
        isSubmitting={isSubmitting}
        onDateChange={setClassDate}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onTopicChange={setClassTopic}
        onDescriptionChange={setClassDescription}
        onOpenChange={onEditDialogOpenChange}
        onSubmit={onSubmitEdit}
        onReset={resetEditForm}
      />
    </>
  )
}

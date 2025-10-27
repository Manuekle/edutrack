'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { TimePicker } from '@/components/ui/time-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Ban, Clock, Edit, MoreHorizontal, Ligature as Signature, UserCheck } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { TablePagination } from '../shared/table-pagination';

export interface ClassWithStatus {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  topic?: string;
  description?: string;
  status: string;
  cancellationReason?: string | null;
}

interface ClassesTableProps {
  classes: ClassWithStatus[];
  isLoading: boolean;
  handleEdit: (cls: ClassWithStatus) => void;
  handleCancel: (cls: ClassWithStatus) => void;
  handleMarkAsDone: (classId: string) => void;
  classStatusMap: Record<string, { label: string; color: string }>;
  dateUtils: {
    getTodayWithoutTime: () => Date;
    createLocalDate: (dateString: string) => Date;
    isSameDay: (date1: Date, date2: Date) => boolean;
    formatDisplayDate: (date: Date) => string;
  };
}

interface ClassesTableDialogProps {
  // Cancel dialog
  isCancelDialogOpen: boolean;
  classToCancel: ClassWithStatus | null;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  onCancelDialogOpenChange: (open: boolean) => void;
  onConfirmCancel: () => void;
  // Edit dialog
  isEditDialogOpen: boolean;
  classDate: Date | undefined;
  setClassDate: (d: Date | undefined) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  classTopic: string;
  setClassTopic: (v: string) => void;
  classDescription: string;
  setClassDescription: (v: string) => void;
  isSubmitting: boolean;
  onEditDialogOpenChange: (open: boolean) => void;
  onSubmitEdit: (e: React.FormEvent) => void;
  resetEditForm: () => void;
  formatClassDate: (cls: ClassWithStatus) => string;
}

export const ClassesTable: React.FC<ClassesTableProps & ClassesTableDialogProps> = ({
  classes: allClasses,
  isLoading,
  handleEdit,
  handleCancel,
  handleMarkAsDone,
  classStatusMap,
  dateUtils,
  // Dialog props
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pagination
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


  const calculateDuration = (start: string, end: string): number => {
    const [sh, sm] = (start || '').trim().split(':');
    const [eh, em] = (end || '').trim().split(':');
    const startHour = Number(sh);
    const startMin = Number(sm ?? 0);
    const endHour = Number(eh);
    const endMin = Number(em ?? 0);
    const sH = Number.isNaN(startHour) ? 0 : startHour;
    const sM = Number.isNaN(startMin) ? 0 : startMin;
    const eH = Number.isNaN(endHour) ? 0 : endHour;
    const eM = Number.isNaN(endMin) ? 0 : endMin;
    const startMinutes = sH * 60 + sM;
    const endMinutes = eH * 60 + eM;
    const diff = Math.max(0, endMinutes - startMinutes);
    return diff / 60;
  };

  const isFormValid = useMemo(() => {
    if (!classDate || !startTime || !endTime) return false;

    const duration = calculateDuration(startTime, endTime);
    return duration >= 2; // Minimum 2 hours
  }, [classDate, startTime, endTime]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Gestión de Clases
            </CardTitle>
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
                    <TableHead className="text-xs font-normal px-4 py-2">Fecha</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2">Tema</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2">Estado</TableHead>
                    <TableHead className="text-xs font-normal text-right px-4 py-2">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map(cls => {
                    // Lógica de fechas y estado visual
                    const today = dateUtils.getTodayWithoutTime();
                    const now = new Date();
                    const classDate = dateUtils.createLocalDate(cls.date);
                    const classDateOnly = new Date(classDate);
                    classDateOnly.setHours(0, 0, 0, 0);
                    const classStartTime = cls.startTime ? new Date(cls.startTime) : null;
                    const classEndTime = cls.endTime ? new Date(cls.endTime) : null;
                    const isToday = dateUtils.isSameDay(classDateOnly, today);
                    const isFuture = classDateOnly > today;
                    const isPast = classDateOnly < today;
                    const isWithinClassTime =
                      isToday &&
                      classStartTime &&
                      classEndTime &&
                      now >= classStartTime &&
                      now <= classEndTime;
                    const isScheduledForToday = isToday && classStartTime && now < classStartTime;
                    const isTodayFinished = isToday && classEndTime && now > classEndTime;
                    let visualStatus: string = cls.status;
                    if (cls.status === 'PROGRAMADA') {
                      if (isWithinClassTime) {
                        visualStatus = 'EN_CURSO';
                      } else if (isTodayFinished || isPast) {
                        visualStatus = 'FINALIZADA';
                      }
                    }
                    const statusInfo = classStatusMap[visualStatus] || {
                      label: visualStatus === 'FINALIZADA' ? 'Finalizada' : 'Desconocido',
                      color:
                        visualStatus === 'FINALIZADA'
                          ? 'text-xs font-normal text-gray-600 dark:text-gray-400'
                          : 'text-xs font-normal',
                    };
                    const isProgramada = cls.status === 'PROGRAMADA';
                    const isEnCurso = visualStatus === 'EN_CURSO';
                    const canEdit = isProgramada && (isFuture || isScheduledForToday);
                    const canCancel = isProgramada && (isFuture || isScheduledForToday);
                    const canMarkAsDone = (isProgramada || isEnCurso) && (isToday || isPast);
                    const canTakeAttendance =
                      (isWithinClassTime || isScheduledForToday || isTodayFinished || isPast) &&
                      (isProgramada || isEnCurso) &&
                      cls.status !== 'REALIZADA' &&
                      cls.status !== 'CANCELADA';
                    return (
                      <TableRow
                        key={cls.id}
                        className={
                          cls.status === 'CANCELADA' ? 'opacity-70 bg-gray-50 dark:bg-zinc-900' : ''
                        }
                        data-state={cls.status === 'CANCELADA' ? 'cancelled' : undefined}
                      >
                        <TableCell className="text-xs px-4 py-2">
                          <div className="flex flex-col">
                            <span>{dateUtils.formatDisplayDate(classDate)}</span>
                            {cls.startTime && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(cls.startTime).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                                {cls.endTime
                                  ? ` - ${new Date(cls.endTime).toLocaleTimeString('es-ES', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true,
                                    })}`
                                  : ''}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs px-4 py-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {canTakeAttendance ? (
                                  <Link
                                    href={`/dashboard/docente/asignaturas/${cls.id}/clase/${cls.id}/asistencia`}
                                    className="hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                                    aria-label={`Registrar asistencia para ${cls.topic || 'Sin tema'}`}
                                  >
                                    {cls.topic || 'Sin tema'}
                                  </Link>
                                ) : (
                                  <span>{cls.topic || 'N/A'}</span>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-center">
                                  {cls.status === 'CANCELADA'
                                    ? `Clase cancelada${cls.cancellationReason ? `: ${cls.cancellationReason}` : ''}`
                                    : cls.status === 'REALIZADA'
                                      ? 'Clase ya finalizada'
                                      : canTakeAttendance
                                        ? 'Registrar asistencia'
                                        : isToday
                                          ? 'Disponible hoy'
                                          : isFuture
                                            ? `Disponible en ${Math.ceil((classDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} días`
                                            : 'Clase pasada sin registro'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className={cn('font-light text-xs dark:text-white', statusInfo.color)}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-2 font-sans">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                aria-label={`Acciones para clase ${cls.topic || 'sin tema'}`}
                              >
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[180px]">
                              <DropdownMenuLabel className="font-sans font-medium">
                                Acciones
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                asChild
                                disabled={!canTakeAttendance}
                                className={
                                  !canTakeAttendance
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }
                              >
                                <Link
                                  href={`/dashboard/docente/asignaturas/${cls.id}/clase/${cls.id}/asistencia`}
                                  className="flex items-center w-full"
                                  onClick={e => !canTakeAttendance && e.preventDefault()}
                                  aria-disabled={!canTakeAttendance}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                                  <span>Asistencia</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canEdit}
                                onSelect={() => {
                                  if (canEdit) setTimeout(() => handleEdit(cls), 0);
                                }}
                                className={
                                  !canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }
                                aria-disabled={!canEdit}
                              >
                                <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={!canCancel}
                                onSelect={() => {
                                  if (canCancel) setTimeout(() => handleCancel(cls), 0);
                                }}
                                className={
                                  !canCancel
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'text-destructive cursor-pointer'
                                }
                                aria-disabled={!canCancel}
                              >
                                <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
                                <span>Cancelar Clase</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canMarkAsDone}
                                onSelect={() => {
                                  if (canMarkAsDone) setTimeout(() => handleMarkAsDone(cls.id), 0);
                                }}
                                className={
                                  !canMarkAsDone
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }
                                aria-disabled={!canMarkAsDone}
                              >
                                <Signature className="mr-2 h-4 w-4" aria-hidden="true" />
                                <span>Firmar Clase</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
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

      <Dialog open={isCancelDialogOpen} onOpenChange={onCancelDialogOpenChange}>
        <DialogContent onCloseAutoFocus={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-sans text-xl font-semibold tracking-tight">
              Cancelar Clase
            </DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Estás a punto de cancelar la clase de{' '}
              <strong>{classToCancel?.topic || 'tema por definir'}</strong> del{' '}
              <strong>{classToCancel ? formatClassDate(classToCancel) : ''}</strong>. Se enviará una
              notificación a todos los estudiantes matriculados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 font-sans">
            <Label htmlFor="cancel-reason" className="font-sans font-semibold">
              Motivo de la cancelación
            </Label>
            <p className="text-xs text-muted-foreground">
              Este motivo se enviará a los estudiantes.
            </p>
            <Textarea
              id="cancel-reason"
              placeholder="Ej: calamidad doméstica, problemas de salud, etc."
              value={cancelReason}
              className="resize-none h-24"
              onChange={e => setCancelReason(e.target.value)}
              aria-required={true}
              aria-describedby="cancel-reason-description"
            />
            <span id="cancel-reason-description" className="sr-only">
              Ingrese el motivo de la cancelación que se enviará a los estudiantes
            </span>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              disabled={!cancelReason.trim() || isSubmitting}
              onClick={onConfirmCancel}
              className="bg-rose-600 text-white hover:bg-rose-700 font-sans"
              aria-label="Confirmar cancelación de clase"
            >
              {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE EDICIÓN DE CLASE */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={open => {
          onEditDialogOpenChange(open);
          if (!open) {
            resetEditForm();
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[500px] font-sans"
          onCloseAutoFocus={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground font-semibold text-xl tracking-tight">
              Editar Clase
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Modifica los detalles de la clase. Haz clic en Guardar Cambios cuando hayas terminado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmitEdit} className="font-sans">
            <div className="space-y-6 py-4">
              {/* Selector de Fecha */}
              <div className="space-y-2">
                <Label htmlFor="class-date" className="text-xs font-normal">
                  Fecha
                </Label>
                <DatePicker
                  value={classDate}
                  onChange={setClassDate}
                  aria-required={true}
                  aria-label="Seleccionar fecha de la clase"
                />
              </div>

              {/* Selector de Horario */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Hora de Inicio */}
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-xs text-normal">
                      Hora de inicio
                    </Label>
                    <TimePicker
                      id="start-time"
                      value={startTime || '07:00'}
                      onChange={newValue => {
                        setStartTime(newValue);
                        const [hStr, mStr = '00'] = newValue.split(':');
                        const startHour = Number.parseInt(hStr, 10);
                        const endHourMin = Math.min(startHour + 2, 22);
                        const requiredMinEnd = `${endHourMin.toString().padStart(2, '0')}:${mStr}`;
                        if (!endTime) {
                          setEndTime(requiredMinEnd);
                        } else {
                          const [eh, em = '00'] = endTime.split(':');
                          const endHour = Number.parseInt(eh, 10);
                          const endMin = Number.parseInt(em, 10);
                          const startMin = Number.parseInt(mStr, 10);
                          const startTotalMin = startHour * 60 + startMin;
                          const endTotalMin = endHour * 60 + endMin;
                          if (endTotalMin - startTotalMin < 120) {
                            setEndTime(requiredMinEnd);
                          }
                        }
                      }}
                      className="w-full"
                      aria-required={true}
                      aria-label="Seleccionar hora de inicio"
                    />
                    {!startTime && (
                      <p className="text-muted-foreground text-xs" role="alert" aria-live="polite">
                        Requerido
                      </p>
                    )}
                  </div>

                  {/* Hora de Fin */}
                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="text-xs text-normal">
                      Hora de fin
                    </Label>
                    <TimePicker
                      id="end-time"
                      value={endTime || ''}
                      onChange={newValue => {
                        if (startTime) {
                          const [sh, sm = '00'] = startTime.split(':');
                          const [eh, em = '00'] = newValue.split(':');
                          const startHour = Number.parseInt(sh, 10);
                          const startMin = Number.parseInt(sm, 10);
                          const endHour = Number.parseInt(eh, 10);
                          const endMin = Number.parseInt(em, 10);

                          const startTotalMin = startHour * 60 + startMin;
                          const endTotalMin = endHour * 60 + endMin;

                          if (endTotalMin - startTotalMin < 120) {
                            const adjustedTotalMin = Math.min(startTotalMin + 120, 22 * 60);
                            const adjustedHour = Math.floor(adjustedTotalMin / 60);
                            const adjustedMin = adjustedTotalMin % 60;
                            const adjustedTime = `${adjustedHour.toString().padStart(2, '0')}:${adjustedMin.toString().padStart(2, '0')}`;
                            setEndTime(adjustedTime);
                            return;
                          }
                        }
                        setEndTime(newValue);
                      }}
                      className="w-full"
                      disabled={!startTime}
                      aria-required={true}
                      aria-label="Seleccionar hora de fin"
                      aria-disabled={!startTime}
                    />
                    {!endTime && startTime && (
                      <p className="text-muted-foreground text-xs" role="alert" aria-live="polite">
                        Requerido
                      </p>
                    )}
                    {!startTime && (
                      <p className="text-muted-foreground text-xs">
                        Seleccione hora de inicio primero
                      </p>
                    )}
                  </div>
                </div>

                {/* Indicador de Duración */}
                {startTime && endTime && (
                  <div
                    className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3"
                    role="status"
                    aria-live="polite"
                  >
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <span>
                      Duración:{' '}
                      {(() => {
                        const duration = calculateDuration(startTime, endTime);
                        const hours = Math.floor(duration);
                        const minutes = Math.round((duration - hours) * 60);
                        return minutes > 0
                          ? `${hours} ${hours === 1 ? 'hora' : 'horas'} y ${minutes} minutos`
                          : `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Campo de Tema */}
              <div className="space-y-2">
                <Label htmlFor="topic-edit" className="text-xs font-normal">
                  Tema de la Clase
                </Label>
                <Input
                  id="topic-edit"
                  value={classTopic}
                  onChange={e => setClassTopic(e.target.value)}
                  className="text-xs"
                  placeholder="Ej: Introducción a las Derivadas"
                  aria-label="Tema de la clase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcionClase" className="text-xs font-normal">
                  Descripción
                </Label>
                <Input
                  id="descripcionClase"
                  value={classDescription}
                  onChange={e => setClassDescription(e.target.value)}
                  className="text-xs"
                  placeholder="Ej: Descripción detallada de la clase"
                  aria-label="Descripción de la clase"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="min-w-[120px]"
                aria-label="Guardar cambios de la clase"
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
                      aria-hidden="true"
                    />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

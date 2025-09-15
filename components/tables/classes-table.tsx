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

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Ban, Clock, Edit, MoreHorizontal, Signature, UserCheck } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
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
  isDatePickerOpen: boolean;
  setIsDatePickerOpen: (open: boolean) => void;
  isStartTimePickerOpen: boolean;
  setIsStartTimePickerOpen: (open: boolean) => void;
  isEndTimePickerOpen: boolean;
  setIsEndTimePickerOpen: (open: boolean) => void;
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
  setIsDatePickerOpen,
  isStartTimePickerOpen,
  setIsStartTimePickerOpen,
  isEndTimePickerOpen,
  setIsEndTimePickerOpen,
  resetEditForm,
  formatClassDate,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pagination
  const totalItems = allClasses.length;
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allClasses.slice(startIndex, startIndex + itemsPerPage);
  }, [allClasses, currentPage, itemsPerPage]);

  // Reset to first page when classes change
  useEffect(() => {
    setCurrentPage(1);
  }, [allClasses]);

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
            <div className="flex justify-center py-8">
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
                                {new Date(cls.startTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                                {cls.endTime
                                  ? ` - ${new Date(cls.endTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true,
                                    })}`
                                  : ''}
                              </span>
                            )}
                            {/* {cls.status === 'CANCELADA' && cls.cancellationReason && (
                              <span className="text-xs text-amber-600 mt-1 dark:text-amber-400">
                                Motivo: {cls.cancellationReason}
                              </span>
                            )} */}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs px-4 py-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {canTakeAttendance ? (
                                  <Link
                                    href={`/dashboard/docente/asignaturas/${cls.id}/clase/${cls.id}/asistencia`}
                                    className="hover:underline"
                                  >
                                    {cls.topic || 'Sin tema'}
                                  </Link>
                                ) : (
                                  <span className="cursor-default">{cls.topic || 'N/A'}</span>
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
                              <Button variant="ghost" className="h-8 w-8 p-0">
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
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  <span>Asistencia</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={e => {
                                  e.preventDefault();
                                  if (canEdit) handleEdit(cls);
                                }}
                                className={
                                  !canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={e => {
                                  e.preventDefault();
                                  if (canCancel) handleCancel(cls);
                                }}
                                className={
                                  !canCancel
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'text-destructive cursor-pointer'
                                }
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                <span>Cancelar Clase</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={e => {
                                  e.preventDefault();
                                  if (canMarkAsDone) handleMarkAsDone(cls.id);
                                }}
                                className={
                                  !canMarkAsDone
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }
                              >
                                <Signature className="mr-2 h-4 w-4" />
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
        <DialogContent>
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
            />
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
            setIsDatePickerOpen(false);
            setIsStartTimePickerOpen(false);
            setIsEndTimePickerOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] font-sans">
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
                <Label className="text-xs font-normal">Fecha</Label>
                <DatePicker value={classDate} onChange={setClassDate} />
              </div>

              {/* Selector de Horario */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Hora de Inicio */}
                  <div className="space-y-2">
                    <Label className="text-xs text-normal">Hora de inicio</Label>
                    <Popover open={isStartTimePickerOpen} onOpenChange={setIsStartTimePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-xs"
                          type="button"
                        >
                          <Clock className="mr-2 h-4 w-4 opacity-50" />
                          {startTime
                            ? (() => {
                                const hour = Number.parseInt(startTime.split(':')[0]);
                                const period = hour >= 12 ? 'PM' : 'AM';
                                const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                                return `${displayHour}:00 ${period}`;
                              })()
                            : 'Seleccionar'}
                          {!startTime && <span className="text-muted-foreground">Requerido</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-48 p-0"
                        align="start"
                        onOpenAutoFocus={e => e.preventDefault()}
                      >
                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-2">
                          {Array.from({ length: 16 }, (_, i) => {
                            const hour = i + 7; // 7AM a 10PM
                            const time24 = `${hour.toString().padStart(2, '0')}:00`;
                            const period = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                            const timeDisplay = `${displayHour}:00 ${period}`;

                            return (
                              <Button
                                key={time24}
                                variant="ghost"
                                className="font-sans w-full justify-center text-center h-9 px-3 text-xs hover:bg-accent rounded-sm"
                                onClick={() => {
                                  setStartTime(time24);
                                  setIsStartTimePickerOpen(false); // Cerrar popover
                                  // Auto-ajustar hora de fin si es necesaria
                                  const startHour = Number.parseInt(time24.split(':')[0]);
                                  const endHour = Math.min(startHour + 2, 22); // Mínimo 2 horas, máximo 10PM
                                  const newEndTime = `${endHour.toString().padStart(2, '0')}:00`;
                                  if (
                                    !endTime ||
                                    endTime <= time24 ||
                                    Number.parseInt(endTime.split(':')[0]) - startHour < 2
                                  ) {
                                    setEndTime(newEndTime);
                                  }
                                }}
                                type="button"
                              >
                                {timeDisplay}
                              </Button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Hora de Fin */}
                  <div className="space-y-2">
                    <Label className="text-xs text-normal">Hora de fin</Label>
                    <Popover open={isEndTimePickerOpen} onOpenChange={setIsEndTimePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-xs"
                          type="button"
                          disabled={!startTime}
                        >
                          <Clock className="mr-2 h-4 w-4 opacity-50" />
                          {endTime
                            ? (() => {
                                const hour = Number.parseInt(endTime.split(':')[0]);
                                const period = hour >= 12 ? 'PM' : 'AM';
                                const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                                return `${displayHour}:00 ${period}`;
                              })()
                            : 'Seleccionar'}
                          {!endTime && startTime && (
                            <span className="text-muted-foreground ml-2">Requerido</span>
                          )}
                          {!startTime && (
                            <span className="text-muted-foreground ml-2">
                              Seleccione hora de inicio primero
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-48 p-0"
                        align="start"
                        onOpenAutoFocus={e => e.preventDefault()}
                      >
                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-2">
                          {startTime &&
                            Array.from({ length: 16 }, (_, i) => {
                              const hour = i + 7; // 7AM a 10PM
                              const time24 = `${hour.toString().padStart(2, '0')}:00`;
                              const period = hour >= 12 ? 'PM' : 'AM';
                              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                              const timeDisplay = `${displayHour}:00 ${period}`;
                              const startHour = Number.parseInt(startTime.split(':')[0]);
                              const currentHour = Number.parseInt(time24.split(':')[0]);

                              // Solo mostrar horas que sean al menos 2 horas después del inicio
                              if (currentHour < startHour + 2) return null;

                              return (
                                <Button
                                  key={time24}
                                  variant="ghost"
                                  className="font-sans w-full justify-center text-center h-9 px-3 text-xs hover:bg-accent rounded-sm"
                                  onClick={() => {
                                    setEndTime(time24);
                                    setIsEndTimePickerOpen(false);
                                  }}
                                  type="button"
                                >
                                  {timeDisplay}
                                </Button>
                              );
                            }).filter(Boolean)}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Indicador de Duración */}
                {startTime && endTime && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                    <Clock className="h-4 w-4" />
                    <span>
                      Duración:{' '}
                      {(() => {
                        const start = Number.parseInt(startTime.split(':')[0]);
                        const end = Number.parseInt(endTime.split(':')[0]);
                        const duration = end - start;
                        return `${duration} ${duration === 1 ? 'hora' : 'horas'}`;
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
                disabled={
                  isSubmitting || !classDate || !startTime || !endTime || startTime >= endTime
                }
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Actualizando...
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

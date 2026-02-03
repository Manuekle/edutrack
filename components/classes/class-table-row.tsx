'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Ban, MoreHorizontal, Signature, UserCheck } from 'lucide-react';
import Link from 'next/link';
import type { ClassStatusInfo } from './class-status-calculator';
import type { ClassWithStatus } from './classes-table';

interface ClassTableRowProps {
  cls: ClassWithStatus;
  subjectId?: string;
  statusInfo: ClassStatusInfo;
  statusLabel: string;
  statusColor: string;
  dateUtils: {
    formatDisplayDate: (date: Date) => string;
    createLocalDate: (dateString: string) => Date;
  };
  onCancel: () => void;
  onMarkAsDone: () => void;
}

/**
 * Formats a time string (HH:MM) to a localized time format
 */
function formatTimeString(timeString: string): string {
  if (!timeString || typeof timeString !== 'string') return '';

  const parts = timeString.split(':');
  if (parts.length < 2) return timeString;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return timeString;

  const date = new Date(2000, 0, 1, hours, minutes, 0, 0);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function ClassTableRow({
  cls,
  subjectId,
  statusInfo,
  statusLabel,
  statusColor,
  dateUtils,
  onCancel,
  onMarkAsDone,
}: ClassTableRowProps) {
  const classDate = dateUtils.createLocalDate(cls.date);
  const { canCancel, canMarkAsDone, canTakeAttendance, isToday, isFuture } = statusInfo;

  const getTooltipMessage = () => {
    if (cls.status === 'CANCELADA') {
      return `Clase cancelada${cls.cancellationReason ? `: ${cls.cancellationReason}` : ''}`;
    }
    if (cls.status === 'REALIZADA') {
      return 'Clase ya finalizada';
    }
    if (canTakeAttendance) {
      return 'Registrar asistencia';
    }
    if (isToday) {
      return 'Disponible hoy';
    }
    if (isFuture) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const classDayOnly = new Date(classDate);
      classDayOnly.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil(
        (classDayOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return `Disponible en ${daysUntil} días`;
    }
    return 'Clase pasada sin registro';
  };

  return (
    <TableRow
      className={cls.status === 'CANCELADA' ? 'opacity-70 bg-gray-50 dark:bg-zinc-900' : ''}
      data-state={cls.status === 'CANCELADA' ? 'cancelled' : undefined}
    >
      <TableCell className="text-xs px-4 py-2">
        <div className="flex flex-col">
          <span>{dateUtils.formatDisplayDate(classDate)}</span>
          {cls.startTime && (
            <span className="text-xs text-muted-foreground">
              {formatTimeString(cls.startTime)}
              {cls.endTime ? ` - ${formatTimeString(cls.endTime)}` : ''}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-xs px-4 py-2 font-sans">
        {cls.classroom || 'N/A'}
      </TableCell>
      <TableCell className="text-xs px-4 py-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {canTakeAttendance ? (
                <Link
                  href={`/dashboard/docente/asignaturas/${subjectId}/clase/${cls.id}/asistencia`}
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
              <p className="text-center">{getTooltipMessage()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="px-4 py-2 text-center">
        <Badge variant="outline" className={cn('font-light text-xs dark:text-white', statusColor)}>
          {statusLabel}
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
            <DropdownMenuLabel className="font-sans font-medium">Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              asChild
              disabled={!canTakeAttendance}
              className={!canTakeAttendance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            >
              <Link
                href={`/dashboard/docente/asignaturas/${subjectId}/clase/${cls.id}/asistencia`}
                className="flex items-center w-full"
                onClick={e => !canTakeAttendance && e.preventDefault()}
                aria-disabled={!canTakeAttendance}
              >
                <UserCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Asistencia</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!canCancel}
              onSelect={e => {
                e.preventDefault();
                if (canCancel) onCancel();
              }}
              className={
                !canCancel ? 'opacity-50 cursor-not-allowed' : 'text-destructive cursor-pointer'
              }
              aria-disabled={!canCancel}
            >
              <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Cancelar Clase</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canMarkAsDone}
              onSelect={e => {
                e.preventDefault();
                if (canMarkAsDone) onMarkAsDone();
              }}
              className={!canMarkAsDone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
}

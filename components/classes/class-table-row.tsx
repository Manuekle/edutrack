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
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 hover:bg-muted/50 dark:hover:bg-white/[0.02] transition-colors group',
        cls.status === 'CANCELADA' && 'opacity-70 bg-muted/20'
      )}
      data-state={cls.status === 'CANCELADA' ? 'cancelled' : undefined}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {canTakeAttendance ? (
                    <Link
                      href={`/dashboard/docente/grupos/${subjectId}/clase/${cls.id}/asistencia`}
                      className="text-[15px] font-semibold text-foreground tracking-card hover:text-primary transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                      aria-label={`Registrar asistencia para ${cls.topic || 'Sin tema'}`}
                    >
                      {cls.topic || 'Sin tema'}
                    </Link>
                  ) : (
                    <span className="text-[15px] font-semibold text-foreground tracking-card truncate">
                      {cls.topic || 'Sin tema evaluado'}
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-center">{getTooltipMessage()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Badge
              variant="outline"
              className={cn(
                'font-medium text-[10px] uppercase tracking-card px-2 py-0 h-5',
                statusColor
              )}
            >
              {statusLabel}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {dateUtils.formatDisplayDate(classDate)}
            </span>
            {cls.startTime && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>
                  {formatTimeString(cls.startTime)}
                  {cls.endTime ? ` - ${formatTimeString(cls.endTime)}` : ''}
                </span>
              </>
            )}
            {cls.classroom && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="font-sans">Salón {cls.classroom}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end shrink-0 sm:pl-0 pl-14">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full text-muted-foreground/50 hover:text-foreground shrink-0 transition-colors"
              aria-label={`Acciones para clase ${cls.topic || 'sin tema'}`}
            >
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44 rounded-xl">
            <DropdownMenuLabel className="font-sans font-semibold text-xs">
              Acciones
            </DropdownMenuLabel>
            <DropdownMenuItem
              asChild
              disabled={!canTakeAttendance}
              className={cn(
                'rounded-lg cursor-pointer text-[13px]',
                !canTakeAttendance && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Link
                href={`/dashboard/docente/grupos/${subjectId}/clase/${cls.id}/asistencia`}
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
              className={cn(
                'rounded-lg text-[13px]',
                !canCancel
                  ? 'opacity-50 cursor-not-allowed'
                  : 'text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-500/10 cursor-pointer'
              )}
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
              className={cn(
                'rounded-lg text-[13px] cursor-pointer',
                !canMarkAsDone && 'opacity-50 cursor-not-allowed'
              )}
              aria-disabled={!canMarkAsDone}
            >
              <Signature className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Firmar Clase</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

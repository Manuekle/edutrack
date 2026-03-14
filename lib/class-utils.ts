import type { ClassStatus as PrismaClassStatus } from '@prisma/client';

export type ClassStatus = PrismaClassStatus | 'SIGNED' | 'CANCELADA' | 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELLED';

export const classStatusMap = {
  SCHEDULED: {
    label: 'Programada',
    color: 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  },
  PROGRAMADA: {
    label: 'Programada',
    color: 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  },
  EN_CURSO: {
    label: 'En curso',
    color: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 bg-blue-500/5',
  },
  SIGNED: {
    label: 'Firmada',
    color: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-500/5',
  },
  COMPLETED: {
    label: 'Firmada',
    color: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-500/5',
  },
  FINALIZADA: {
    label: 'Finalizada',
    color: 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 bg-gray-500/5',
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 bg-rose-500/5',
  },
  CANCELLED: {
    label: 'Cancelada',
    color: 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 bg-rose-500/5',
  },
} as const;

export const getCurrentPeriod = (): number => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return currentMonth <= 6 ? 1 : 2; // Jan-Jun: Period 1, Jul-Dec: Period 2
};

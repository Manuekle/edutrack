import type { ClassStatus as PrismaClassStatus } from '@prisma/client';

export type ClassStatus = PrismaClassStatus;

export const classStatusMap = {
  PROGRAMADA: {
    label: 'Programada',
    color: 'text-xs font-normal',
  },
  EN_CURSO: {
    label: 'En curso',
    color: 'text-xs font-normal text-blue-600 dark:text-blue-400',
  },
  REALIZADA: {
    label: 'Realizada',
    color: 'text-xs font-normal text-green-600 dark:text-green-400',
  },
  FINALIZADA: {
    label: 'Finalizada',
    color: 'text-xs font-normal text-gray-600 dark:text-gray-400',
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'text-xs font-normal text-amber-600 dark:text-amber-400',
  },
} as const;

export const getCurrentPeriod = (): number => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return currentMonth <= 6 ? 1 : 2; // Jan-Jun: Period 1, Jul-Dec: Period 2
};

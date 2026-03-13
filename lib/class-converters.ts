import type { ClassStatus } from '@/lib/class-utils';
import type { LocalClassWithStatus, TableClassWithStatus } from '@/types/class';

const formatDatePart = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  if (typeof date === 'string') {
    // Si ya tiene como string ISO, extraer la parte de la fecha directamente antes de cualquier conversión a Date local
    const parts = date.split('T');
    if (parts[0]) return parts[0];
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const formatTimePart = (date: string | Date | null | undefined): string | undefined => {
  if (!date) return undefined;
  if (typeof date === 'string') {
    if (date.includes('T')) {
      const timePart = date.split('T')[1];
      if (timePart) {
        const parts = timePart.split(':');
        if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
      }
    } else if (date.includes(':')) {
      // Si ya es un string tipo HH:MM, devolverlo directamente
      const parts = date.split(':');
      if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

export const toTableClass = (cls: LocalClassWithStatus): TableClassWithStatus => ({
  ...cls,
  date: formatDatePart(cls.date),
  startTime: formatTimePart(cls.startTime),
  endTime: formatTimePart(cls.endTime),
  topic: cls.topic ?? undefined,
  description: cls.description ?? undefined,
  status: String(cls.status),
  cancellationReason: cls.cancellationReason ?? undefined,
});

export const toLocalClass = (cls: TableClassWithStatus): LocalClassWithStatus => ({
  ...cls,
  date: cls.date,
  startTime: cls.startTime ?? null,
  endTime: cls.endTime ?? null,
  topic: cls.topic ?? null,
  description: cls.description ?? null,
  status: cls.status as ClassStatus,
  cancellationReason: cls.cancellationReason ?? null,
});

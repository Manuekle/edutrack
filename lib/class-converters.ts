import type { ClassStatus } from '@/lib/class-utils';
import type { LocalClassWithStatus, TableClassWithStatus } from '@/types/class';

const formatDatePart = (date: string | Date): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTimePart = (date: string | Date | null | undefined): string | undefined => {
  if (!date) return undefined;
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

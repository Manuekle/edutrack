import type { ClassWithStatus } from './classes-table';

export interface DateUtils {
  getTodayWithoutTime: () => Date;
  createLocalDate: (dateString: string) => Date;
  isSameDay: (date1: Date, date2: Date) => boolean;
  formatDisplayDate: (date: Date) => string;
}

export interface ClassStatusInfo {
  visualStatus: string;
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
  isWithinClassTime: boolean;
  isScheduledForToday: boolean;
  isTodayFinished: boolean;
  canEdit: boolean;
  canCancel: boolean;
  canMarkAsDone: boolean;
  canTakeAttendance: boolean;
}

/**
 * Calculates the visual status and permissions for a class
 */
export function calculateClassStatus(cls: ClassWithStatus, dateUtils: DateUtils): ClassStatusInfo {
  const today = dateUtils.getTodayWithoutTime();
  const now = new Date();
  const classDate = dateUtils.createLocalDate(cls.date);
  const classDateOnly = new Date(classDate);
  classDateOnly.setHours(0, 0, 0, 0);

  const combineDateTime = (date: Date, timeStr: string | undefined): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  };

  const classStartTime = combineDateTime(classDateOnly, cls.startTime);
  const classEndTime = combineDateTime(classDateOnly, cls.endTime);

  const isToday = dateUtils.isSameDay(classDateOnly, today);
  const isFuture = classDateOnly > today;
  const isPast = classDateOnly < today;

  const isWithinClassTime = !!(
    isToday &&
    classStartTime &&
    classEndTime &&
    now >= classStartTime &&
    now <= classEndTime
  );

  const tenMinutesInMs = 10 * 60 * 1000;
  const isWithinEarlyBuffer = !!(
    isToday &&
    classStartTime &&
    now >= new Date(classStartTime.getTime() - tenMinutesInMs) &&
    now < classStartTime
  );

  const isScheduledForToday = !!(isToday && classStartTime && now < new Date(classStartTime.getTime() - tenMinutesInMs));
  const isTodayFinished = !!(isToday && classEndTime && now > classEndTime);

  let visualStatus: string = cls.status;
  if (cls.status === 'PROGRAMADA') {
    if (isWithinClassTime || isWithinEarlyBuffer) {
      visualStatus = 'EN_CURSO';
    } else if (isTodayFinished || isPast) {
      visualStatus = 'FINALIZADA';
    }
  }

  const isProgramada = cls.status === 'PROGRAMADA';
  const isEnCurso = visualStatus === 'EN_CURSO';

  const canEdit = !!(isProgramada && (isFuture || isScheduledForToday));
  const canCancel = !!(isProgramada && (isFuture || isScheduledForToday));
  const canMarkAsDone = !!((isProgramada || isEnCurso) && (isToday || isPast));
  const canTakeAttendance = !!(
    (isWithinClassTime || isWithinEarlyBuffer || isTodayFinished || isPast) &&
    (isProgramada || isEnCurso) &&
    cls.status !== 'REALIZADA' &&
    cls.status !== 'CANCELADA'
  );

  return {
    visualStatus,
    isToday,
    isFuture,
    isPast,
    isWithinClassTime,
    isScheduledForToday,
    isTodayFinished,
    canEdit,
    canCancel,
    canMarkAsDone,
    canTakeAttendance,
  };
}

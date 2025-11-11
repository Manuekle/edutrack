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

  const classStartTime = cls.startTime ? new Date(cls.startTime) : null;
  const classEndTime = cls.endTime ? new Date(cls.endTime) : null;

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

  const isScheduledForToday = !!(isToday && classStartTime && now < classStartTime);
  const isTodayFinished = !!(isToday && classEndTime && now > classEndTime);

  let visualStatus: string = cls.status;
  if (cls.status === 'PROGRAMADA') {
    if (isWithinClassTime) {
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
    (isWithinClassTime || isScheduledForToday || isTodayFinished || isPast) &&
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

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

  const isScheduledForToday = !!(
    isToday &&
    classStartTime &&
    now < new Date(classStartTime.getTime() - tenMinutesInMs)
  );
  const isTodayFinished = !!(isToday && classEndTime && now > classEndTime);

  let visualStatus: string = cls.status;
  if (cls.status === 'PROGRAMADA' || cls.status === 'SCHEDULED') {
    if (isWithinClassTime || isWithinEarlyBuffer) {
      visualStatus = 'EN_CURSO';
    } else if (isTodayFinished || isPast) {
      visualStatus = 'FINALIZADA';
    }
  }

  const isProgramada = cls.status === 'PROGRAMADA' || cls.status === 'SCHEDULED';
  const isEnCurso = visualStatus === 'EN_CURSO';
  const isFinalizada = visualStatus === 'FINALIZADA' || cls.status === 'SIGNED' || cls.status === 'COMPLETED';

  // canEdit: Always true for scheduled future classes, or today's classes
  const canEdit = !!(isProgramada && (isFuture || isToday));
  
  // canCancel: Only for scheduled classes in the future or today
  const canCancel = !!(isProgramada && (isFuture || isToday));
  
  // canMarkAsDone: True if it's not cancelled and not already completed/signed, and it's today or past
  const canMarkAsDone = !!(
    cls.status !== 'CANCELADA' && 
    cls.status !== 'CANCELLED' && 
    cls.status !== 'SIGNED' &&
    cls.status !== 'COMPLETED' &&
    (isToday || isPast)
  );

  // canTakeAttendance: More permissive - allow for any non-cancelled class that is today or past
  // (Teachers often need to take attendance after the class finishes, but NOT after signing)
  const canTakeAttendance = !!(
    cls.status !== 'CANCELADA' && 
    cls.status !== 'CANCELLED' && 
    cls.status !== 'SIGNED' &&
    cls.status !== 'COMPLETED' &&
    (isToday || isPast)
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

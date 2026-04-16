'use client';

import { CalendarEvent, CustomCalendar } from '@/components/calendar/custom-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface HorarioClase {
  groupId: string;
  groupCode: string;
  subjectName: string;
  subjectCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string | null;
  academicPeriod: string;
  teacherName: string | null;
}

const DIA_MAP: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
  // Fallback español
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 7,
};

export default function MiHorarioPage() {
  const [horarios, setHorarios] = useState<HorarioClase[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<string>('week');

  useEffect(() => {
    fetch('/api/docente/horario')
      .then(r => r.json())
      .then(d => setHorarios(d.horarios ?? []))
      .finally(() => setLoading(false));
  }, []);

  const calendarEvents = useMemo(() => {
    const rangeStart = startOfMonth(subMonths(currentDate, 3));
    const rangeEnd = endOfMonth(addMonths(currentDate, 3));
    const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    const events: CalendarEvent[] = [];

    horarios.forEach(h => {
      const targetDow = DIA_MAP[h.dayOfWeek];
      if (!h.startTime || !h.endTime || !targetDow) return;

      const [startH, startM] = h.startTime.split(':').map(Number);
      const [endH, endM] = h.endTime.split(':').map(Number);

      allDays.forEach(day => {
        const dow = day.getDay() === 0 ? 7 : day.getDay();
        if (dow !== targetDow) return;

        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startH, startM);
        const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endH, endM);

        events.push({
          id: `${h.groupId}-${day.toISOString()}`,
          title: h.subjectName,
          subject: h.subjectName,
          start,
          end,
          room: h.roomName || 'Aula por asignar',
          teacher: h.teacherName || 'Sin docente',
          reason: h.groupCode,
          type: 'CLASE',
        });
      });
    });

    return events;
  }, [horarios, currentDate]);

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    if (action === 'TODAY') {
      setCurrentDate(new Date());
    } else if (action === 'PREV') {
      if (currentView === 'month') setCurrentDate(subMonths(currentDate, 1));
      else if (currentView === 'week') setCurrentDate(subDays(currentDate, 7));
      else setCurrentDate(subDays(currentDate, 1));
    } else if (action === 'NEXT') {
      if (currentView === 'month') setCurrentDate(addMonths(currentDate, 1));
      else if (currentView === 'week') setCurrentDate(addDays(currentDate, 7));
      else setCurrentDate(addDays(currentDate, 1));
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-card text-foreground">Mi Horario</h1>
          <p className="text-muted-foreground sm:text-sm text-xs max-w-md">
            Consulta tu programación académica semanal y aulas asignadas.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {/* Calendar nav skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
            <Skeleton className="h-6 w-40 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16 rounded-xl" />
              <Skeleton className="h-9 w-16 rounded-xl" />
              <Skeleton className="h-9 w-16 rounded-xl" />
            </div>
          </div>
          {/* Calendar grid skeleton */}
          <div className="rounded-3xl bg-muted/20 dark:bg-white/[0.02] overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-7 border-b border-border/30">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="py-3 flex justify-center">
                  <Skeleton className="h-4 w-8 rounded" />
                </div>
              ))}
            </div>
            {/* Time slots */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map(row => (
              <div key={row} className="grid grid-cols-7 border-b border-border/20 min-h-[56px]">
                {[1, 2, 3, 4, 5, 6, 7].map(col => (
                  <div key={col} className="border-r border-border/20 p-1">
                    {row === 3 && col === 2 && (
                      <Skeleton className="h-10 w-full rounded-lg" />
                    )}
                    {row === 5 && col === 4 && (
                      <Skeleton className="h-10 w-full rounded-lg" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : horarios.length === 0 ? (
        <div className="col-span-full py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
          <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CalendarDays className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="sm:text-[15px] text-xs font-semibold text-foreground tracking-card">
            Sin programación disponible
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            No se han encontrado clases registradas para este periodo académico en tu perfil
            docente.
          </p>
        </div>
      ) : (
        <CustomCalendar
          date={currentDate}
          view={currentView}
          events={calendarEvents}
          onNavigate={handleNavigate}
          onView={setCurrentView}
          label="Horario Académico"
        />
      )}
    </div>
  );
}

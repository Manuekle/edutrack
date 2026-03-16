'use client';

import { CalendarEvent, CustomCalendar } from '@/components/calendar/custom-calendar';
import { LoadingPage } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, startOfMonth, subDays, subMonths } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface HorarioGrupo {
  groupId: string;
  groupCode: string;
  subjectName: string;
  subjectCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string | null;
  teacherName: string | null;
  academicPeriod: string;
}

const DIA_MAP: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 7,
};

export default function AdminHorariosPage() {
  const [horarios, setHorarios] = useState<HorarioGrupo[]>([]);
  const [periodos, setPeriodos] = useState<string[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<string>('week');

  // Initial load: get all periods
  useEffect(() => {
    fetch('/api/admin/horarios')
      .then(r => r.json())
      .then(d => {
        setPeriodos(d.periodos ?? []);
        setHorarios(d.horarios ?? []);
        if (d.periodos?.length > 0) setSelectedPeriodo(d.periodos[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Re-fetch when period filter changes
  useEffect(() => {
    if (!selectedPeriodo) return;
    setLoading(true);
    fetch(`/api/admin/horarios?periodo=${encodeURIComponent(selectedPeriodo)}`)
      .then(r => r.json())
      .then(d => setHorarios(d.horarios ?? []))
      .finally(() => setLoading(false));
  }, [selectedPeriodo]);

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
          room: h.roomName || 'Sala por asignar',
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
      if (currentView === 'month') setCurrentDate(d => subMonths(d, 1));
      else if (currentView === 'week') setCurrentDate(d => subDays(d, 7));
      else setCurrentDate(d => subDays(d, 1));
    } else {
      if (currentView === 'month') setCurrentDate(d => addMonths(d, 1));
      else if (currentView === 'week') setCurrentDate(d => addDays(d, 7));
      else setCurrentDate(d => addDays(d, 1));
    }
  };

  const uniqueSubjects = new Set(horarios.map(h => h.subjectCode)).size;
  const totalGrupos = horarios.length;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-card text-foreground">Horarios</h1>
          <p className="text-muted-foreground sm:text-sm text-xs max-w-md">
            Visualiza el calendario de clases por periodo académico y grupo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedPeriodo && (
            <span className="text-xs font-semibold text-muted-foreground bg-muted/30 border rounded-full px-3 py-1.5">
              {totalGrupos} grupos · {uniqueSubjects} asignaturas
            </span>
          )}
          {periodos.length > 0 && (
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger className="w-40 h-9 rounded-full text-xs font-semibold">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                {periodos.map(p => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : horarios.length === 0 ? (
        <div className="col-span-full py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
          <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CalendarDays className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="sm:text-[15px] text-xs font-semibold text-foreground tracking-card">
            Sin horarios disponibles
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            No se encontraron grupos con horario asignado para este periodo.
          </p>
        </div>
      ) : (
        <CustomCalendar
          date={currentDate}
          view={currentView}
          events={calendarEvents}
          onNavigate={handleNavigate}
          onView={setCurrentView}
          label={`Horarios — ${selectedPeriodo}`}
        />
      )}
    </div>
  );
}

'use client';

import { CalendarEvent, CustomCalendar } from '@/components/calendar/custom-calendar';
import { LoadingPage } from '@/components/ui/loading';
import { addDays, addMonths, startOfWeek, subDays, subMonths } from 'date-fns';
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
  SUNDAY: 0,
  // Fallback español
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 0,
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
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
    const events: CalendarEvent[] = [];

    horarios.forEach((h, idx) => {
      const dayOffset = (DIA_MAP[h.dayOfWeek] || 1) - 1; // 0 for Monday
      const eventDate = addDays(monday, dayOffset);

      if (!h.startTime || !h.endTime) return;

      const [startH, startM] = h.startTime.split(':').map(Number);
      const [endH, endM] = h.endTime.split(':').map(Number);

      // Create dates in local timezone to avoid offset issues
      const year = eventDate.getFullYear();
      const month = eventDate.getMonth();
      const day = eventDate.getDate();
      const start = new Date(year, month, day, startH, startM);
      const end = new Date(year, month, day, endH, endM);

      events.push({
        id: `${h.groupId}-${idx}`,
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
        <LoadingPage />
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

'use client';

import { CalendarEvent, CustomCalendar } from '@/components/calendar/custom-calendar';
import { LoadingPage } from '@/components/ui/loading';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, startOfMonth, subDays, subMonths } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface HorarioItem {
  grupoId: string;
  grupoCodigo: string;
  subjectName: string;
  subjectCode: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  salaName: string | null;
  docenteName: string | null;
  periodoAcademico: string;
}

const DIA_MAP: Record<string, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 7,
};

export default function HorarioEstudiantePage() {
  const [horarios, setHorarios] = useState<HorarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<string>('week');

  useEffect(() => {
    fetch('/api/estudiante/horario')
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
      const targetDow = DIA_MAP[h.diaSemana];
      if (!h.horaInicio || !h.horaFin || !targetDow) return;

      const [startH, startM] = h.horaInicio.split(':').map(Number);
      const [endH, endM] = h.horaFin.split(':').map(Number);

      allDays.forEach(day => {
        const dow = day.getDay() === 0 ? 7 : day.getDay();
        if (dow !== targetDow) return;

        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startH, startM);
        const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endH, endM);

        events.push({
          id: `${h.grupoId}-${day.toISOString()}`,
          title: h.subjectName,
          subject: h.subjectName,
          start,
          end,
          room: h.salaName || 'Sala por asignar',
          teacher: h.docenteName || 'Docente por asignar',
          reason: `Grupo ${h.grupoCodigo}`,
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-card text-foreground">Mi Horario</h1>
          <p className="text-muted-foreground sm:text-sm text-xs max-w-md">
            Consulta tu programación académica semanal y salones asignados.
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
            No se han encontrado clases registradas para este periodo académico en tu perfil de
            estudiante.
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

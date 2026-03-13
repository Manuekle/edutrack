'use client';

import { CalendarEvent, CustomCalendar } from '@/components/calendar/custom-calendar';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { addDays, addMonths, setHours, setMinutes, startOfWeek, subDays, subMonths } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface HorarioClase {
  grupoId: string;
  grupoCodigo: string;
  subjectName: string;
  subjectCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string | null;
  academicPeriod: string;
}

const DIA_MAP: Record<string, number> = {
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
      // @ts-ignore - The API returns dayOfWeek but the interface was mapped to diaSemana
      const day = h.dayOfWeek || h.diaSemana;
      // @ts-ignore
      const startT = h.startTime || h.horaInicio;
      // @ts-ignore
      const endT = h.endTime || h.horaFin;
      // @ts-ignore
      const room = h.roomName || h.salaName;
      
      const dayOffset = (DIA_MAP[day] || 1) - 1; // 0 for Monday
      const eventDate = addDays(monday, dayOffset);

      if (!startT || !endT) return;

      const [startH, startM] = startT.split(':').map(Number);
      const [endH, endM] = endT.split(':').map(Number);

      const start = setMinutes(setHours(eventDate, startH), startM);
      const end = setMinutes(setHours(eventDate, endH), endM);

      events.push({
        id: `${h.grupoId}-${idx}`,
        title: h.subjectName,
        subject: h.subjectName,
        start,
        end,
        room: room || 'Aula por asignar',
        reason: `${h.grupoCodigo}`,
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
          <h1 className="text-2xl font-semibold tracking-card text-foreground">
            Mi Horario
          </h1>
          <p className="text-muted-foreground text-sm max-w-md">
            Consulta tu programación académica semanal y aulas asignadas.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : horarios.length === 0 ? (
        <Card className="border shadow-none rounded-3xl overflow-hidden bg-muted/20">
          <CardContent className="py-24 text-center flex flex-col items-center justify-center">
            <div className="bg-background p-6 rounded-full shadow-lg mb-6 ring-1 ring-border/50">
              <CalendarDays className="h-12 w-12 text-primary/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Sin programación disponible</h3>
            <p className="text-muted-foreground mt-2 max-w-xs">
              No se han encontrado clases registradas para este periodo académico en tu perfil docente.
            </p>
          </CardContent>
        </Card>
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

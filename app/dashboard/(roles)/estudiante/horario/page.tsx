'use client';

import { CalendarEvent, CustomCalendar } from '@/components/calendar/custom-calendar';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { addDays, setHours, setMinutes, startOfWeek } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { addMonths, subDays, subMonths } from 'date-fns';

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
  DOMINGO: 0,
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
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
    const events: CalendarEvent[] = [];

    horarios.forEach((h, idx) => {
      const dayOffset = (DIA_MAP[h.diaSemana] ?? 1) - 1; // 0 for Monday
      const eventDate = addDays(monday, dayOffset);

      if (!h.horaInicio || !h.horaFin) return;

      const [startH, startM] = h.horaInicio.split(':').map(Number);
      const [endH, endM] = h.horaFin.split(':').map(Number);

      const start = setMinutes(setHours(eventDate, startH), startM);
      const end = setMinutes(setHours(eventDate, endH), endM);

      events.push({
        id: `${h.grupoId}-${idx}`,
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
          <p className="text-muted-foreground text-sm max-w-md">
            Consulta tu programación académica semanal y salones asignados.
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
              No se han encontrado clases registradas para este periodo académico en tu perfil de
              estudiante.
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

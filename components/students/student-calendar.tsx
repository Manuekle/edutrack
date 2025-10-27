'use client';

import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuración del localizador para date-fns en español
const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Definimos un tipo extendido para nuestros eventos
export interface CalendarEvent extends BigCalendarEvent {
  type: 'class' | 'exam' | 'assignment' | 'other';
  description?: string;
  subject?: string;
  location?: string;
  allDay?: boolean;
  resource?: Record<string, unknown>; // Para datos adicionales
}

interface StudentCalendarProps {
  events: CalendarEvent[];
}

const StudentCalendar = ({ events }: StudentCalendarProps) => {
  return (
    // El contenedor necesita una altura definida para que el calendario se muestre
    <div className="h-[600px] bg-white p-4 rounded-lg shadow">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture="es" // Usar la cultura en español
        messages={{
          next: 'Siguiente',
          previous: 'Anterior',
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          agenda: 'Agenda',
          date: 'Fecha',
          time: 'Hora',
          event: 'Evento',
          noEventsInRange: 'No hay eventos en este rango.',
          showMore: total => `+ Ver más (${total})`,
        }}
      />
    </div>
  );
};

export default StudentCalendar;

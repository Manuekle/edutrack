'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInMinutes,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import React, { useState } from 'react';

// --- CUSTOM CALENDAR COMPONENTS ---

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  room?: string;
  teacher?: string;
  reason?: string;
  subject?: string;
  type?: 'CLASE' | 'EXAMEN' | 'EVENTO';
}

const MonthView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: es });
  const endDate = endOfWeek(monthEnd, { locale: es });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div
      className="grid grid-cols-7 border-t border-l rounded-3xl overflow-hidden bg-background"
      role="grid"
      aria-label="Calendario mensual"
    >
      {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => (
        <div
          key={day}
          role="columnheader"
          className="py-4 text-center text-xs font-semibold tracking-card text-muted-foreground border-r border-b bg-muted/5"
        >
          {day}
        </div>
      ))}
      {calendarDays.map((day, i) => {
        const dayEvents = events.filter(e => isSameDay(e.start, day));

        return (
          <div
            key={day.toISOString()}
            role="gridcell"
            aria-current={isToday(day) ? 'date' : undefined}
            className={cn(
              'min-h-32 p-2 border-r border-b transition-colors relative',
              !isSameMonth(day, monthStart) && 'bg-muted/5 opacity-40',
              isToday(day) && 'bg-primary/5'
            )}
          >
            <span
              className={cn(
                'text-xs font-semibold mb-2 w-7 h-7 flex items-center justify-center rounded-full',
                isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground/60'
              )}
            >
              {format(day, 'd')}
            </span>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event, idx) => (
                <div
                  key={event.id || `${day.toISOString()}-${idx}`}
                  tabIndex={0}
                  aria-label={`Evento: ${event.subject || event.room}`}
                  className="text-xs p-1.5 rounded-lg bg-primary/10 text-primary font-semibold truncate border border-primary/20 shadow-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  {event.subject || event.room}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <p
                  className="text-xs font-semibold text-muted-foreground pl-1 mt-1 tracking-card"
                  aria-label={`Hay ${dayEvents.length - 3} eventos más este día`}
                >
                  + {dayEvents.length - 3} más
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const WEEK_START_HOUR = 7;

const formatEventTime = (date: Date) => {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const WeekView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const start = startOfWeek(date, { locale: es });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = Array.from({ length: 22 - WEEK_START_HOUR }, (_, i) => WEEK_START_HOUR + i);

  return (
    <div className="flex flex-col border rounded-3xl overflow-hidden bg-background">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-muted/10 border-b">
        <div className="p-3 border-r" />
        {weekDays.map(day => (
          <div key={day.toISOString()} className="py-3 px-1 text-center border-r last:border-r-0">
            <p className="text-[11px] font-semibold tracking-card text-muted-foreground mb-1 uppercase">
              {format(day, 'EEE', { locale: es })}
            </p>
            <p
              aria-current={isToday(day) ? 'date' : undefined}
              className={cn(
                'text-base font-semibold h-8 w-8 mx-auto flex items-center justify-center rounded-full',
                isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'
              )}
            >
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>
      {/* Scrollable time grid */}
      <div className="max-h-[36rem] overflow-auto" tabIndex={0} aria-label="Cuadrícula semanal de eventos">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {/* Hour labels column */}
          <div className="row-span-full">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-16 px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground/60 border-r border-b"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {/* Day columns with relative positioning for events */}
          {weekDays.map((day, dayIdx) => (
            <div
              key={day.toISOString()}
              className="relative border-r last:border-r-0"
              style={{ height: `${hours.length * 4}rem` }}
            >
              {/* Hour grid lines */}
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b" />
              ))}
              {/* Events */}
              {events
                .filter(e => isSameDay(e.start, day))
                .map((event, idx) => {
                  const startOfEventDay = startOfDay(event.start);
                  const startMinutes = differenceInMinutes(event.start, startOfEventDay);
                  const durationMinutes = Math.max(differenceInMinutes(event.end, event.start), 30);

                  const topRem = ((startMinutes - WEEK_START_HOUR * 60) / 60) * 4;
                  const heightRem = (durationMinutes / 60) * 4;

                  return (
                    <div
                      key={event.id || `${day.toISOString()}-${idx}`}
                      tabIndex={0}
                      aria-label={`${event.subject || event.title} de ${formatEventTime(event.start)} a ${formatEventTime(event.end)}`}
                      className="absolute left-0.5 right-0.5 p-2 rounded-lg bg-gradient-to-br from-primary/90 to-primary/70 text-white border border-primary/30 z-10 overflow-hidden shadow-lg shadow-primary/20 focus:ring-2 focus:ring-offset-1 focus:ring-primary outline-none"
                      style={{ top: `${topRem}rem`, height: `${heightRem}rem` }}
                    >
                      <p className="text-[11px] font-bold truncate leading-tight">
                        {event.subject || event.title}
                      </p>
                      {heightRem >= 2.5 && (
                        <p className="text-[10px] font-medium opacity-90 truncate mt-0.5 flex items-center gap-1">
                          <User className="h-3 w-3" aria-hidden="true" />
                          {event.teacher || event.reason || 'Sin docente'}
                        </p>
                      )}
                      {heightRem >= 3.5 && (
                        <p className="text-[10px] opacity-80 truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {event.room || 'Salón por asignar'}
                        </p>
                      )}
                      {heightRem >= 4.3 && (
                        <p className="text-[9px] opacity-70 truncate mt-0.5">
                          {formatEventTime(event.start)} - {formatEventTime(event.end)}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DayView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const hours = eachHourOfInterval({
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 7, 0),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 22, 0),
  });

  return (
    <div className="border rounded-3xl overflow-hidden bg-background shadow-xl shadow-black/5">
      <div className="p-10 bg-muted/5 border-b text-center">
        <p className="text-xs font-semibold tracking-card text-primary/60 mb-2">
          {format(date, 'EEEE', { locale: es })}
        </p>
        <h2 className="text-4xl font-semibold tracking-card">
          {format(date, "d 'de' MMMM", { locale: es })}
        </h2>
      </div>
      <div className="grid grid-cols-[100px_1fr] divide-x" tabIndex={0} aria-label="Agenda diaria">
        {hours.map(hour => {
          const hourEvents = events.filter(e => {
            const eventHour = e.start.getHours();
            const hourHour = hour.getHours();
            return isSameDay(e.start, date) && eventHour === hourHour;
          });

          return (
            <React.Fragment key={hour.toISOString()}>
              <div className="h-24 p-6 text-right text-xs font-semibold text-muted-foreground/40 border-b bg-muted/5">
                {format(hour, 'HH:mm')}
              </div>
              <div className="h-24 p-4 border-b relative">
                {hourEvents.map((event, idx) => {
                  const startMins = event.start.getMinutes();
                  const durationMins = Math.max(differenceInMinutes(event.end, event.start), 30);

                  const topRem = (startMins / 60) * 6;
                  const heightRem = (durationMins / 60) * 6;

                  return (
                    <div
                      key={event.id || `${hour.toISOString()}-${idx}`}
                      tabIndex={0}
                      aria-label={`${event.subject || event.room} de ${formatEventTime(event.start)} a ${formatEventTime(event.end)}`}
                      className="absolute inset-x-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 shadow-xl shadow-primary/25 flex flex-col z-10 focus:ring-2 focus:ring-white outline-none"
                      style={{
                        top: `calc(${topRem}rem + 0.5rem)`,
                        height: `calc(${heightRem}rem - 1rem)`
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold tracking-card line-clamp-1">
                          {event.subject || event.room}
                        </p>
                        <Clock className="h-4 w-4 opacity-70 shrink-0" aria-hidden="true" />
                      </div>
                      <div className="flex items-center gap-3 text-xs opacity-90">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" aria-hidden="true" />
                          {event.teacher || event.reason || 'Sin docente'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {event.room || 'Salón por asignar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const AgendaView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="space-y-8 p-4" role="list" aria-label="Agenda de próximos eventos">
      {sortedEvents.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
            <Clock className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
          </div>
          <p className="text-[15px] font-semibold tracking-card text-foreground/60">
            Sin programaciones para este período
          </p>
        </div>
      ) : (
        sortedEvents.map((event, idx) => (
          <div key={event.id || `agenda-${idx}`} role="listitem" className="group relative flex gap-8 pl-8">
            <div className="absolute left-0 top-0 bottom-[-32px] w-px bg-muted group-last:bg-transparent" />
            <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />

            <div className="w-40 shrink-0">
              <p className="text-xs font-semibold tracking-card text-primary mb-1">
                {formatEventTime(event.start)}
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                {format(event.start, 'dd MMM yyyy', { locale: es })}
              </p>
            </div>

            <div
              className="flex-1 bg-card border rounded-3xl p-6 transition-all duration-300 hover:shadow-md focus-within:ring-2 focus-within:ring-primary outline-none"
              tabIndex={0}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h4 className="text-md font-bold tracking-card">{event.subject || event.room}</h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" aria-hidden="true" />
                      {event.teacher || 'Sin docente'}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {event.room || 'Salón por asignar'}
                    </span>
                  </div>
                </div>
                <Badge className="rounded-full px-3 py-1 font-semibold text-xs tracking-card bg-primary text-primary-foreground border-none shadow-none">
                  {formatEventTime(event.start)} - {formatEventTime(event.end)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Grupo: {event.reason || 'Sin grupo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(event.start, 'EEEE d', { locale: es })}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export const CustomCalendar = ({
  date: initialDate = new Date(),
  view: initialView = 'month',
  events,
  onNavigate,
  onView,
  label = 'Agenda Institucional',
}: {
  date?: Date;
  view?: string;
  events: CalendarEvent[];
  onNavigate?: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView?: (view: string) => void;
  label?: string;
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Estado interno: el calendario se controla a sí mismo
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [currentView, setCurrentView] = useState<string>(initialView);

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    setCurrentDate(prev => {
      if (action === 'TODAY') return new Date();
      if (currentView === 'month') return action === 'PREV' ? subMonths(prev, 1) : addMonths(prev, 1);
      if (currentView === 'week') return action === 'PREV' ? subWeeks(prev, 1) : addWeeks(prev, 1);
      if (currentView === 'day') return action === 'PREV' ? subDays(prev, 1) : addDays(prev, 1);
      return prev;
    });
    // Notifica al padre si quiere escuchar
    onNavigate?.(action);
  };

  const handleView = (v: string) => {
    setCurrentView(v);
    onView?.(v);
  };

  const getLabel = () => {
    if (currentView === 'month') return format(currentDate, 'MMMM yyyy', { locale: es });
    if (currentView === 'week') return `Semana ${format(currentDate, 'w')} - ${format(currentDate, 'yyyy')}`;
    if (currentView === 'day') return format(currentDate, "d 'de' MMMM", { locale: es });
    return label;
  };

  const getNavLabel = (dir: 'PREV' | 'NEXT') => {
    const isPrev = dir === 'PREV';
    if (currentView === 'month') return isPrev ? 'Mes anterior' : 'Mes siguiente';
    if (currentView === 'week') return isPrev ? 'Semana anterior' : 'Semana siguiente';
    if (currentView === 'day') return isPrev ? 'Día anterior' : 'Día siguiente';
    return isPrev ? 'Anterior' : 'Siguiente';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="w-9 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all"
            aria-label={getNavLabel('PREV')}
            onClick={() => handleNavigate('PREV')}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-full px-6 text-xs bg-background tracking-card font-semibold"
            aria-label="Ir a la fecha de hoy"
            onClick={() => handleNavigate('TODAY')}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-9 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all"
            aria-label={getNavLabel('NEXT')}
            onClick={() => handleNavigate('NEXT')}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Button>

          <h2 aria-live="polite" className="text-sm md:text-base tracking-card font-semibold ml-6 text-foreground/90 truncate capitalize">
            {getLabel()}
          </h2>
        </div>

        <div
          className="flex items-center p-1.5 gap-1.5 bg-muted/20 rounded-full border border-border overflow-x-auto no-scrollbar"
          role="group"
          aria-label="Vistas del calendario"
        >
          {[
            { id: 'month', label: 'Mes' },
            { id: 'week', label: 'Semana' },
            { id: 'day', label: 'Día' },
            { id: 'agenda', label: 'Agenda' },
          ].map(v => (
            <Button
              key={v.id}
              variant="ghost"
              size="default"
              aria-pressed={currentView === v.id}
              className={cn(
                'rounded-full px-6 text-xs font-semibold transition-all shrink-0',
                currentView === v.id
                  ? 'bg-primary text-primary-foreground hover:bg-primary dark:hover:text-primary-foreground hover:text-white/90'
                  : 'text-muted-foreground/60 hover:bg-muted/30 hover:text-foreground'
              )}
              onClick={() => handleView(v.id)}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="transition-colors duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + currentDate.toISOString()}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
          >
            {currentView === 'month' && <MonthView date={currentDate} events={events} />}
            {currentView === 'week' && <WeekView date={currentDate} events={events} />}
            {currentView === 'day' && <DayView date={currentDate} events={events} />}
            {currentView === 'agenda' && <AgendaView date={currentDate} events={events} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
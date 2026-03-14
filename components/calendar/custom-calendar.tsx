'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  addDays,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react';
import React from 'react';

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
    <div className="grid grid-cols-7 border-t border-l rounded-3xl overflow-hidden bg-background">
      {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => (
        <div
          key={day}
          className="py-4 text-center text-xs font-semibold tracking-card text-muted-foreground border-r border-b bg-muted/5"
        >
          {day}
        </div>
      ))}
      {calendarDays.map((day, i) => (
        <div
          key={day.toISOString()}
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
            {events
              .filter(e => isSameDay(e.start, day))
              .slice(0, 3)
              .map((event, idx) => (
                <div
                  key={event.id || `${day.toISOString()}-${idx}`}
                  className="text-xs p-1.5 rounded-lg bg-primary/10 text-primary font-semibold truncate border border-primary/20 shadow-sm"
                >
                  {event.subject || event.room}
                </div>
              ))}
            {events.filter(e => isSameDay(e.start, day)).length > 3 && (
              <p className="text-xs font-semibold text-muted-foreground pl-1 mt-1 tracking-card">
                + {events.filter(e => isSameDay(e.start, day)).length - 3} más
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const HOUR_HEIGHT = 64; // h-16 = 4rem = 64px
const WEEK_START_HOUR = 7;

const WeekView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const start = startOfWeek(date, { locale: es });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const totalHours = 22 - WEEK_START_HOUR; // 7am to 10pm
  const hours = eachHourOfInterval({
    start: new Date(2024, 0, 1, WEEK_START_HOUR, 0),
    end: new Date(2024, 0, 1, 22, 0),
  });

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
      <div className="max-h-[36rem] overflow-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {/* Hour labels column */}
          <div className="row-span-full">
            {hours.map(hour => (
              <div
                key={hour.toISOString()}
                className="h-16 px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground/60 border-r border-b"
              >
                {format(hour, 'h a')}
              </div>
            ))}
          </div>
          {/* Day columns with relative positioning for events */}
          {weekDays.map((day, dayIdx) => (
            <div
              key={day.toISOString()}
              className="relative border-r last:border-r-0"
              style={{ height: `${totalHours * HOUR_HEIGHT}px` }}
            >
              {/* Hour grid lines */}
              {hours.map(hour => (
                <div
                  key={hour.toISOString()}
                  className="h-16 border-b"
                />
              ))}
              {/* Events */}
              {events
                .filter(e => isSameDay(e.start, day))
                .map((event, idx) => {
                  const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
                  const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
                  const durationMinutes = Math.max(endMinutes - startMinutes, 30);
                  const topPx = ((startMinutes - WEEK_START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const heightPx = (durationMinutes / 60) * HOUR_HEIGHT;

                  return (
                    <div
                      key={event.id || `${day.toISOString()}-${idx}`}
                      className="absolute left-0.5 right-0.5 p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 z-10 overflow-hidden"
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    >
                      <p className="text-[11px] font-semibold truncate leading-tight">
                        {event.subject || event.title}
                      </p>
                      {heightPx >= 48 && (
                        <p className="text-[10px] font-medium opacity-70 truncate mt-0.5">
                          {event.reason || event.room}
                        </p>
                      )}
                      {heightPx >= 64 && (
                        <p className="text-[10px] opacity-50 truncate mt-0.5">
                          {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
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
    start: new Date(2024, 0, 1, 7, 0),
    end: new Date(2024, 0, 1, 22, 0),
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
      <div className="grid grid-cols-[100px_1fr] divide-x">
        {hours.map(hour => (
          <React.Fragment key={hour.toISOString()}>
            <div className="h-24 p-6 text-right text-xs font-semibold text-muted-foreground/40 border-b bg-muted/5">
              {format(hour, 'hh:mm a')}
            </div>
            <div className="h-24 p-4 border-b relative">
              {events
                .filter(e => isSameDay(e.start, date) && format(e.start, 'H') === format(hour, 'H'))
                .map((event, idx) => (
                  <div
                    key={event.id || `${hour.toISOString()}-${idx}`}
                    className="absolute inset-x-4 inset-y-2 rounded-2xl bg-primary text-primary-foreground p-4 shadow-xl shadow-primary/20 flex flex-col justify-center"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold tracking-card">{event.subject || event.room}</p>
                      <Clock className="h-4 w-4 opacity-50" />
                    </div>
                    <p className="text-xs font-semibold mt-1">{event.teacher || event.reason}</p>
                    <p className="text-xs opacity-70 mt-1 line-clamp-1">{event.reason || event.room}</p>
                  </div>
                ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const AgendaView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="space-y-8 p-4">
      {sortedEvents.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
            <Clock className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-[15px] font-semibold tracking-card text-foreground/60">
            Sin programaciones para este período
          </p>
        </div>
      ) : (
        sortedEvents.map((event, idx) => (
          <div key={event.id || `agenda-${idx}`} className="group relative flex gap-8 pl-8">
            {/* Timeline Line */}
            <div className="absolute left-0 top-0 bottom-[-32px] w-px bg-muted group-last:bg-transparent" />

            {/* Dot */}
            <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />

            <div className="w-40 shrink-0">
              <p className="text-xs font-semibold tracking-card text-primary mb-1">
                {format(event.start, 'hh:mm a')}
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                {format(event.start, 'dd MMM yyyy', { locale: es })}
              </p>
            </div>

            <div className="flex-1 bg-card border rounded-3xl p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h4 className="text-md font-semibold tracking-card">{event.subject || event.room}</h4>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {event.teacher || event.room}
                    </span>
                  </div>
                </div>
                <Badge className="rounded-full px-3 py-1 font-semibold text-xs tracking-card bg-primary/5 text-primary border-none shadow-none hover:bg-primary/10 hover:text-primary">
                  {format(event.start, 'hh:mm a')} - {format(event.end, 'hh:mm a')}
                </Badge>
              </div>
              {event.reason && (
                <p className="text-xs font-normal text-muted-foreground/80 leading-relaxed italic">
                  "{event.reason}"
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export const CustomCalendar = ({
  date,
  view,
  events,
  onNavigate,
  onView,
  label = 'Agenda Institucional',
}: {
  date: Date;
  view: string;
  events: CalendarEvent[];
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: string) => void;
  label?: string;
}) => {
  const shouldReduceMotion = useReducedMotion();

  const getLabel = () => {
    if (view === 'month') return format(date, 'MMMM yyyy', { locale: es });
    if (view === 'week') return `Semana ${format(date, 'w')} - ${format(date, 'yyyy')}`;
    if (view === 'day') return format(date, "d 'de' MMMM", { locale: es });
    return label;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className=" w-9 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all"
            aria-label="Mes anterior"
            onClick={() => onNavigate('PREV')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-full px-6 text-xs bg-background tracking-card font-semibold"
            onClick={() => onNavigate('TODAY')}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            className=" w-9 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all"
            aria-label="Mes siguiente"
            onClick={() => onNavigate('NEXT')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <h2 className="text-sm md:text-base tracking-card font-semibold ml-6 text-foreground/90 truncate capitalize">
            {getLabel()}
          </h2>
        </div>

        <div className="flex items-center p-1.5 gap-1.5 bg-muted/20 rounded-full border border-border overflow-x-auto no-scrollbar">
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
              className={cn(
                'rounded-full px-6 text-xs font-semibold transition-all shrink-0',
                view === v.id
                  ? 'bg-primary text-primary-foreground hover:bg-primary dark:hover:text-primary-foreground hover:text-white/90'
                  : 'text-muted-foreground/60 hover:bg-muted/30 hover:text-foreground'
              )}
              onClick={() => onView(v.id)}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="transition-colors duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + date.toISOString()}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
          >
            {view === 'month' && <MonthView date={date} events={events} />}
            {view === 'week' && <WeekView date={date} events={events} />}
            {view === 'day' && <DayView date={date} events={events} />}
            {view === 'agenda' && <AgendaView date={date} events={events} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { BookingStatus, Room, RoomType } from '@prisma/client';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfMonth,
  endOfWeek, format, isSameDay,
  isSameMonth,
  isToday, startOfMonth, startOfWeek, subDays,
  subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Computer,
  Edit2,
  Eye,
  FileText,
  Layout,
  Mic2,
  MoreHorizontal,
  Search,
  Trash2,
  User,
  Users
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

// --- CUSTOM CALENDAR COMPONENTS ---

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  room: string;
  teacher: string;
  reason: string;
}

const MonthView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: es });
  const endDate = endOfWeek(monthEnd, { locale: es });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="grid grid-cols-7 border-t border-l rounded-3xl overflow-hidden bg-background">
      {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day) => (
        <div key={day} className="py-4 text-center text-xs font-semibold uppercase tracking-card text-muted-foreground border-r border-b bg-muted/5">
          {day}
        </div>
      ))}
      {calendarDays.map((day, i) => (
        <div
          key={day.toISOString()}
          className={cn(
            "min-h-[120px] p-2 border-r border-b transition-colors relative",
            !isSameMonth(day, monthStart) && "bg-muted/5 opacity-40",
            isToday(day) && "bg-primary/5"
          )}
        >
          <span className={cn(
            "text-xs font-semibold mb-2 w-7 h-7 flex items-center justify-center rounded-full",
            isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground/60"
          )}>
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
                  {event.room} — {event.teacher}
                </div>
              ))}
            {events.filter(e => isSameDay(e.start, day)).length > 3 && (
              <p className="text-xs font-semibold text-muted-foreground pl-1 mt-1 uppercase tracking-card">
                + {events.filter(e => isSameDay(e.start, day)).length - 3} más
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const WeekView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const start = startOfWeek(date, { locale: es });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = eachHourOfInterval({
    start: new Date(2024, 0, 1, 7, 0),
    end: new Date(2024, 0, 1, 22, 0)
  });

  return (
    <div className="flex flex-col border rounded-3xl overflow-hidden bg-background">
      <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-muted/10 border-b">
        <div className="p-4 border-r" />
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-4 text-center border-r last:border-r-0">
            <p className="text-xs font-semibold uppercase tracking-card text-muted-foreground mb-1">
              {format(day, 'EEE', { locale: es })}
            </p>
            <p className={cn(
              "text-lg font-semibold h-9 w-9 mx-auto flex items-center justify-center rounded-full",
              isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
            )}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>
      <div className="max-height-[600px] overflow-auto">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] relative">
          {hours.map(hour => (
            <React.Fragment key={hour.toISOString()}>
              <div className="h-16 p-2 text-right text-xs font-semibold text-muted-foreground/60 border-r border-b">
                {format(hour, 'HH:mm')}
              </div>
              {weekDays.map(day => (
                <div key={`${day.toISOString()}-${hour.toISOString()}`} className="h-16 border-r border-b last:border-r-0 relative group">
                  {events
                    .filter(e => isSameDay(e.start, day) && format(e.start, 'H') === format(hour, 'H'))
                    .map((event, idx) => (
                      <div
                        key={event.id || `${day.toISOString()}-${hour.toISOString()}-${idx}`}
                        className="absolute inset-x-1 top-1 p-2 rounded-xl bg-primary/10 text-primary border border-primary/30 z-10 shadow-lg"
                      >
                        <p className="text-xs font-semibold uppercase truncate leading-none mb-1">{event.room}</p>
                        <p className="text-xs font-semibold opacity-70 truncate">{event.teacher}</p>
                      </div>
                    ))}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const DayView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const hours = eachHourOfInterval({
    start: new Date(2024, 0, 1, 7, 0),
    end: new Date(2024, 0, 1, 22, 0)
  });

  return (
    <div className="border rounded-3xl overflow-hidden bg-background shadow-xl shadow-black/5">
      <div className="p-10 bg-muted/5 border-b text-center">
        <p className="text-xs font-semibold uppercase tracking-card text-primary/60 mb-2">
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
              {format(hour, 'HH:mm')}
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
                      <p className="text-xs font-semibold uppercase tracking-card">{event.room}</p>
                      <Clock className="h-4 w-4 opacity-50" />
                    </div>
                    <p className="text-xs font-semibold mt-1">{event.teacher}</p>
                    <p className="text-xs opacity-70 mt-1 line-clamp-1">{event.reason}</p>
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
          <p className="text-xs font-medium tracking-card text-foreground/60">Sin programaciones</p>
        </div>
      ) : (
        sortedEvents.map((event, idx) => (
          <div key={event.id || `agenda-${idx}`} className="group relative flex gap-8 pl-8">
            {/* Timeline Line */}
            <div className="absolute left-0 top-0 bottom-[-32px] w-px bg-muted group-last:bg-transparent" />

            {/* Dot */}
            <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />

            <div className="w-40 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-card text-primary mb-1">
                {format(event.start, 'HH:mm')}
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                {format(event.start, 'dd MMM yyyy', { locale: es })}
              </p>
            </div>

            <div className="flex-1 bg-card border rounded-4xl p-6 shadow-sm group-hover:shadow-xl group-hover:shadow-primary/5 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-semibold tracking-card">{event.room}</h4>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">{event.teacher}</span>
                  </div>
                </div>
                <Badge className="rounded-full px-3 py-1 font-semibold text-xs uppercase tracking-card bg-primary/5 text-primary border-none shadow-none">
                  {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                </Badge>
              </div>
              <p className="text-xs font-medium text-muted-foreground/80 italic leading-relaxed">
                "{event.reason}"
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const CustomCalendar = ({
  date,
  view,
  events,
  onNavigate,
  onView
}: {
  date: Date;
  view: string;
  events: CalendarEvent[];
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: string) => void;
}) => {

  const getLabel = () => {
    if (view === 'month') return format(date, 'MMMM yyyy', { locale: es });
    if (view === 'week') return `Semana ${format(date, 'w')} - ${format(date, 'yyyy')}`;
    if (view === 'day') return format(date, "d 'de' MMMM", { locale: es });
    return 'Agenda Institucional';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={() => onNavigate('PREV')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-full px-6 text-xs bg-background tracking-card"
            onClick={() => onNavigate('TODAY')}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={() => onNavigate('NEXT')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <h2 className="text-xs md:text-md tracking-card font-medium ml-6 text-foreground/90 truncate capitalize">
            {getLabel()}
          </h2>
        </div>

        <div className="flex items-center p-1 gap-2 bg-muted/20 rounded-full border border-muted/50 overflow-x-auto no-scrollbar">
          {[
            { id: 'month', label: 'Mes' },
            { id: 'week', label: 'Semana' },
            { id: 'day', label: 'Día' },
            { id: 'agenda', label: 'Agenda' }
          ].map((v) => (
            <Button
              key={v.id}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full px-7 text-xs font-normal transition-all shrink-0",
                view === v.id
                  ? "bg-primary text-primary-foreground hover:bg-primary dark:hover:text-primary-foreground hover:text-white/90"
                  : "text-muted-foreground/60 hover:bg-muted/20 hover:text-foreground"
              )}
              onClick={() => onView(v.id)}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + date.toISOString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
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

export default function AdminSalasPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'SALON' as RoomType,
    capacity: '',
    description: '',
  });

  // Managed state for the institutional calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<string>('month');

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/admin/rooms');
      const data = await response.json();
      if (response.ok) {
        setRooms(data);
      }
    } catch (error) {
      toast.error('Error al cargar salas');
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await fetch('/api/rooms/bookings');
      const data = await response.json();
      if (response.ok) {
        setBookings(data);
        const approved = data.filter((b: any) => b.status === 'APROBADO');
        const formatted = approved.map((b: any) => ({
          id: b.id,
          title: `${b.room.name} - ${b.teacher.name}`,
          start: new Date(b.startTime),
          end: new Date(b.endTime),
          room: b.room.name,
          teacher: b.teacher.name,
          reason: b.reason
        }));
        setCalendarEvents(formatted);
      }
    } catch (error) {
      toast.error('Error al cargar solicitudes');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchRooms(), fetchAllBookings()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      const response = await fetch(`/api/admin/rooms/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewComment }),
      });

      if (response.ok) {
        toast.success(`Reserva ${status.toLowerCase()} exitosamente`);
        setIsReviewDialogOpen(false);
        setReviewComment('');
        setSelectedBooking(null);
        fetchAllBookings();
      } else {
        toast.error('Error al actualizar estado');
      }
    } catch (error) {
      toast.error('Error de red');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Sala creada exitosamente');
        setIsDialogOpen(false);
        setFormData({ name: '', type: 'SALON', capacity: '', description: '' });
        fetchRooms();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear sala');
      }
    } catch (error) {
      toast.error('Error de red');
    }
  };

  const getTypeIcon = (type: RoomType) => {
    switch (type) {
      case 'SALA_COMPUTO': return <Computer className="h-4 w-4" />;
      case 'SALON': return <Building2 className="h-4 w-4" />;
      case 'AUDITORIO': return <Mic2 className="h-4 w-4" />;
      default: return <Layout className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: RoomType) => {
    switch (type) {
      case 'SALA_COMPUTO': return 'Sala de Cómputo';
      case 'SALON': return 'Salón de Clase';
      case 'AUDITORIO': return 'Auditorio';
      default: return type;
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTypeLabel(room.type).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Tabs defaultValue="list" className="flex flex-col gap-8 h-full">
      {/* Header Consistent with Users Module but with cleaner spacing */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-card text-foreground/90">Gestión de Salas</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Administración centralizada de espacios físicos y programación institucional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TabsList className="flex items-center p-1 gap-2 bg-muted/20 rounded-full border border-muted/50 overflow-x-auto no-scrollbar h-auto backdrop-blur-sm">
            <TabsTrigger
              value="list"
              className="rounded-full px-7 text-xs font-normal transition-all shrink-0 data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:hover:bg-primary text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground border-none"
            >
              Espacios
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="rounded-full px-7 text-xs font-normal transition-all shrink-0 data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:hover:bg-primary text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground border-none"
            >
              Horarios
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-full px-7 text-xs font-normal transition-all shrink-0 data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:hover:bg-primary text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground border-none relative"
            >
              Solicitudes
              {bookings.filter(b => b.status === 'PENDIENTE').length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground border border-background">
                  {bookings.filter(b => b.status === 'PENDIENTE').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-6 shadow-lg shadow-primary/20 gap-2">
                <span>Nueva Sala</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-4xl border-none shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6 p-2">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold">Nueva Sala</DialogTitle>
                  <DialogDescription>Configura los detalles del nuevo espacio institucional.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold  tracking-card text-muted-foreground ml-1">Identificación</Label>
                    <Input
                      className="rounded-xl bg-muted/30 border-none h-11"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Laboratorio 401"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold  tracking-card text-muted-foreground ml-1">Tipo</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: RoomType) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger className="rounded-xl bg-muted/30 border-none h-11">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="SALON">Clase</SelectItem>
                          <SelectItem value="SALA_COMPUTO">Cómputo</SelectItem>
                          <SelectItem value="AUDITORIO">Auditorio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold  tracking-card text-muted-foreground ml-1">Capacidad</Label>
                      <Input
                        className="rounded-xl bg-muted/30 border-none h-11"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold  tracking-card text-muted-foreground ml-1">Descripción</Label>
                    <Textarea
                      className="rounded-xl bg-muted/30 border-none min-h-[100px] resize-none pt-4"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detalles adicionales..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-12 rounded-xl font-semibold">Crear Espacio</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1">
        {/* TAB: LISTADO DE SALAS */}
        <TabsContent value="list" className="m-0 focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between gap-4 px-1">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Buscar por nombre o tipo..."
                  className="pl-10 h-11 bg-muted/20 border-none rounded-2xl focus-visible:ring-1"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center rounded-[3rem] border border-dashed">
                <AlertCircle className="h-14 w-14 text-muted-foreground/20 mb-6" />
                <h3 className="text-xs font-medium text-foreground/80">Sin resultados</h3>
                <p className="text-muted-foreground text-xs mt-2 max-w-xs mx-auto">
                  No encontramos salas que coincidan con tu búsqueda actual.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRooms.map((room, idx) => (
                  <motion.div
                    key={room.id || `room-${idx}`}
                    whileHover={{ y: -4 }}
                    className="group relative bg-card border border-muted/50 rounded-4xl p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className={cn(
                        "p-3 rounded-2xl transition-colors",
                        room.type === 'SALON' ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" :
                          room.type === 'SALA_COMPUTO' ? "bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400" :
                            "bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      )}>
                        {getTypeIcon(room.type)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl min-w-[160px]">
                          <DropdownMenuItem className="rounded-xl py-2.5 gap-3 cursor-pointer">
                            <Edit2 className="h-4 w-4" />
                            <span className="font-medium text-xs">Editar Sala</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl py-2.5 gap-3 text-destructive cursor-pointer hover:bg-destructive/5 transition-colors">
                            <Trash2 className="h-4 w-4" />
                            <span className="font-medium text-xs">Remover</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-1 mb-8">
                      <h3 className="text-xl font-semibold tracking-card text-foreground/90">{room.name}</h3>
                      <p className="text-xs text-muted-foreground font-semibold  tracking-card">{getTypeLabel(room.type)}</p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 opacity-40" />
                        <span className="text-xs font-semibold">{room.capacity || '—'}</span>
                      </div>
                      <Button variant="secondary" size="sm" className="rounded-full h-9 px-5 gap-2 font-semibold text-xs" asChild>
                        <Link href={`/dashboard/admin/salas/${room.id}`}>
                          Ver Horario
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* TAB: CRONOGRAMA (SIDEBAR + MAIN) */}
        <TabsContent value="schedule" className="m-0 focus-visible:outline-none h-full">

          {/* Panel Principal Full Width */}
          <div className="w-full h-full  flex flex-col">

            <CustomCalendar
              date={currentDate}
              view={currentView}
              events={calendarEvents}
              onNavigate={(action) => {
                if (action === 'PREV') {
                  if (currentView === 'month') setCurrentDate(subMonths(currentDate, 1));
                  else if (currentView === 'week') setCurrentDate(subDays(currentDate, 7));
                  else setCurrentDate(subDays(currentDate, 1));
                }
                if (action === 'NEXT') {
                  if (currentView === 'month') setCurrentDate(addMonths(currentDate, 1));
                  else if (currentView === 'week') setCurrentDate(addDays(currentDate, 7));
                  else setCurrentDate(addDays(currentDate, 1));
                }
                if (action === 'TODAY') setCurrentDate(new Date());
              }}
              onView={(v) => setCurrentView(v)}
            />

          </div>

        </TabsContent>

        {/* TAB: SOLICITUDES */}
        <TabsContent value="requests" className="m-0 focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="bg-card border rounded-4xl overflow-hidden shadow-sm"
          >
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="py-6 px-8 text-xs font-semibold  tracking-card text-muted-foreground/70">Solicitante</TableHead>
                  <TableHead className="py-6 px-6 text-xs font-semibold  tracking-card text-muted-foreground/70">Espacio</TableHead>
                  <TableHead className="py-6 px-6 text-xs font-semibold  tracking-card text-muted-foreground/70">Programación</TableHead>
                  <TableHead className="py-6 px-6 text-xs font-semibold  tracking-card text-muted-foreground/70 text-center">Estado</TableHead>
                  <TableHead className="py-6 px-8 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow className="border-none">
                    <TableCell colSpan={5} className="py-40 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <FileText className="h-16 w-16" />
                        <p className="font-semibold text-lg">Bandeja vacía</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking, idx) => (
                    <TableRow key={booking.id || `booking-${idx}`} className="group border-b border-muted/30 hover:bg-primary/5 transition-colors last:border-0">
                      <TableCell className="py-7 px-8">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center font-semibold text-primary border border-primary/5">
                            {booking.teacher.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-xs tracking-card">{booking.teacher.name}</p>
                            <p className="text-xs text-muted-foreground font-semibold  tracking-card">{booking.teacher.role || 'DOCENTE'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-7 px-6">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary/40" />
                          <span className="font-semibold text-xs">{booking.room.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-7 px-6">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold flex items-center gap-2">
                            <CalendarIcon className="h-3.5 w-3.5 opacity-30" />
                            {format(new Date(booking.startTime), "EEEE dd 'de' MMMM", { locale: es })}
                          </p>
                          <p className="text-xs text-muted-foreground font-semibold  tracking-card flex items-center gap-2 pl-5">
                            <Clock className="h-3 w-3 opacity-30" />
                            {format(new Date(booking.startTime), "HH:mm")} — {format(new Date(booking.endTime), "HH:mm")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-7 px-6">
                        <div className="flex justify-center">
                          <Badge
                            className={cn(
                              "text-xs font-semibold px-4 py-1.5 border-none rounded-full  tracking-card",
                              booking.status === 'APROBADO' ? "bg-emerald-500/10 text-emerald-600" :
                                booking.status === 'RECHAZADO' ? "bg-rose-500/10 text-rose-600" :
                                  "bg-amber-500/10 text-amber-600"
                            )}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-7 px-8 text-right">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>
      </div>

      {/* Audit Dialog Rediseñado */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-4xl border-none shadow-2xl bg-card">
          {selectedBooking && (
            <div className="flex flex-col lg:flex-row min-h-[500px]">
              {/* Lado Izquierdo: Resumen Visual */}
              <div className="w-full lg:w-1/3 bg-muted/30 p-10 flex flex-col justify-between border-r">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="p-4 bg-primary rounded-3xl w-fit text-primary-foreground shadow-xl shadow-primary/20">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold tracking-card">{selectedBooking.room.name}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Espacio Solicitado</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold  tracking-card text-muted-foreground/60">Docente</p>
                      <p className="font-semibold text-lg">{selectedBooking.teacher.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold  tracking-card text-muted-foreground/60">Fecha</p>
                      <p className="font-semibold">{format(new Date(selectedBooking.startTime), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold  tracking-card text-muted-foreground/60">Horario</p>
                      <p className="font-semibold">{format(new Date(selectedBooking.startTime), "HH:mm")} - {format(new Date(selectedBooking.endTime), "HH:mm")}</p>
                    </div>
                  </div>
                </div>

                <Badge variant="outline" className="w-fit rounded-full px-4 py-1.5 font-semibold  text-xs tracking-card border">
                  {selectedBooking.status}
                </Badge>
              </div>

              {/* Lado Derecho: Detalles y Firma */}
              <div className="flex-1 p-10 flex flex-col">
                <div className="flex-1 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold  tracking-card text-muted-foreground/70 ml-1">Motivo Institucional</Label>
                    <p className="text-xs p-5 rounded-3xl bg-muted/20 border border-dashed font-medium italic leading-relaxed text-foreground/80">
                      "{selectedBooking.reason}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-semibold  tracking-card text-muted-foreground/70 ml-1">Firma del Responsable</Label>
                    <div className="bg-white dark:bg-muted/20 rounded-4xl p-4 border border-muted/50 flex items-center justify-center h-40 shadow-inner overflow-hidden">
                      <img
                        src={selectedBooking.signatureUrl}
                        alt="Firma Digital"
                        className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal dark:invert dark:opacity-80 transition-all duration-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold  tracking-card text-muted-foreground/70 ml-1">Notas Administrativas</Label>
                    <Textarea
                      placeholder="Escribe comentarios internos sobre esta reserva..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="bg-muted/10 border-none rounded-2xl min-h-[80px] focus-visible:ring-1 p-4"
                    />
                  </div>
                </div>

                <div className="pt-8 flex gap-3">
                  {selectedBooking?.status === 'PENDIENTE' ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedBooking.id, 'RECHAZADO')}
                        className="flex-1 rounded-2xl h-14 font-semibold text-xs tracking-card border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                      >
                        Rechazar
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedBooking.id, 'APROBADO')}
                        className="flex-2 rounded-2xl h-14 font-semibold  text-xs tracking-card shadow-xl shadow-primary/20"
                      >
                        Aprobar Reserva
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" onClick={() => setIsReviewDialogOpen(false)} className="w-full rounded-2xl h-14 font-semibold  text-xs tracking-card">
                      Cerrar Detalle
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <style jsx global>{`
         .no-scrollbar::-webkit-scrollbar {
           display: none;
         }
         .no-scrollbar {
           -ms-overflow-style: none;
           scrollbar-width: none;
         }
       `}</style>
    </Tabs>
  );
}

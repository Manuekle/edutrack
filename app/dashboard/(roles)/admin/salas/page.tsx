'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Computer,
  Edit2,
  Eye,
  Layout,
  Mic2,
  MoreHorizontal,
  Search,
  Trash2,
  User,
  Users
} from 'lucide-react';
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
                {format(hour, 'hh:mm a')}
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
                {format(event.start, 'hh:mm a')}
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                {format(event.start, 'dd MMM yyyy', { locale: es })}
              </p>
            </div>

            <div className="flex-1 bg-card border rounded-4xl p-6 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h4 className="text-md font-semibold tracking-card">{event.room}</h4>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">{event.teacher}</span>
                  </div>
                </div>
                <Badge className="rounded-full px-3 py-1 font-semibold text-xs uppercase tracking-card bg-primary/5 text-primary border-none shadow-none hover:bg-primary/10 hover:text-primary">
                  {format(event.start, 'hh:mm a')} - {format(event.end, 'hh:mm a')}
                </Badge>
              </div>
              <p className="text-xs font-normal text-muted-foreground/80 leading-relaxed">
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
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Managed state for the institutional calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<string>('month');

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/admin/rooms');
      const data = await response.json();
      if (response.ok && data.length > 0) {
        setRooms(data);
      } else {
        // Mock data fallback if API is empty
        setRooms([
          { id: '1', name: 'Laboratorio de Cómputo 101', type: 'SALA_COMPUTO', capacity: '30', description: 'Equipado con i9 y 32GB RAM' },
          { id: '2', name: 'Auditorio Central', type: 'AUDITORIO', capacity: '150', description: 'Sistema de sonido envolvente' },
          { id: '3', name: 'Aula Magna 402', type: 'SALON', capacity: '45', description: 'Proyector 4K y aire acondicionado' },
          { id: '4', name: 'Sala de Juntas B', type: 'SALON', capacity: '12', description: 'Ideal para sesiones privadas' },
          { id: '5', name: 'Lab. Química Avanzada', type: 'SALA_COMPUTO', capacity: '20', description: 'Simuladores de alta precisión' },
        ]);
      }
    } catch (error) {
      toast.error('Error al cargar salas');
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await fetch('/api/rooms/bookings');
      const data = await response.json();

      let finalData = data;
      if (!response.ok || data.length === 0) {
        // Mock data fallback
        finalData = [
          {
            id: 'b1',
            room: { name: 'Laboratorio de Cómputo 101' },
            teacher: { name: 'Prof. Carlos Méndez' },
            startTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
            endTime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
            status: 'APROBADO',
            reason: 'Clase Práctica de Programación Funcional',
            signatureUrl: 'https://i.postimg.cc/85z1Xz6p/signature-mock.png'
          },
          {
            id: 'b2',
            room: { name: 'Auditorio Central' },
            teacher: { name: 'Dra. Elena Rivas' },
            startTime: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
            endTime: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
            status: 'PENDIENTE',
            reason: 'Conferencia sobre Inteligencia Artificial',
            signatureUrl: 'https://i.postimg.cc/85z1Xz6p/signature-mock.png'
          },
          {
            id: 'b3',
            room: { name: 'Aula Magna 402' },
            teacher: { name: 'Mtro. Roberto Solis' },
            startTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            endTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            status: 'APROBADO',
            reason: 'Examen Parcial de Cálculo Multivariable',
            signatureUrl: 'https://i.postimg.cc/85z1Xz6p/signature-mock.png'
          }
        ];
      }

      setBookings(finalData);
      const approved = finalData.filter((b: any) => b.status === 'APROBADO');
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

  const handleEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity || '',
      description: room.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/rooms/${roomToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Sala eliminada exitosamente');
        setIsDeleteDialogOpen(false);
        setRoomToDelete(null);
        fetchRooms();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar sala');
      }
    } catch (error) {
      toast.error('Error de red');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRoomId ? `/api/admin/rooms/${editingRoomId}` : '/api/admin/rooms';
      const method = editingRoomId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingRoomId ? 'Sala actualizada exitosamente' : 'Sala creada exitosamente');
        setIsDialogOpen(false);
        setEditingRoomId(null);
        setFormData({ name: '', type: 'SALON', capacity: '', description: '' });
        fetchRooms();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al procesar solicitud');
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
                <span>
                  {bookings.filter(b => b.status === 'PENDIENTE').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-full px-6 shadow-lg shadow-primary/20 gap-2"
                onClick={() => {
                  setEditingRoomId(null);
                  setFormData({ name: '', type: 'SALON', capacity: '', description: '' });
                }}
              >
                <span>Nueva Sala</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-4xl border-none shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6 p-2">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold">
                    {editingRoomId ? 'Editar Sala' : 'Nueva Sala'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRoomId ? 'Actualiza los detalles del espacio institucional.' : 'Configura los detalles del nuevo espacio institucional.'}
                  </DialogDescription>
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
                  <Button type="submit" className="w-full h-12 rounded-xl font-semibold">
                    {editingRoomId ? 'Guardar Cambios' : 'Crear Espacio'}
                  </Button>
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
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
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
              <div className="bg-card border rounded-md overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-normal px-4 py-2">Nombre del Espacio</TableHead>
                      <TableHead className="text-xs font-normal px-4 py-2">Tipo</TableHead>
                      <TableHead className="text-xs font-normal px-4 py-2">Capacidad</TableHead>
                      <TableHead className="text-xs font-normal px-4 py-2">Descripción</TableHead>
                      <TableHead className="text-xs font-normal text-right px-4 py-2">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRooms.map((room, idx) => (
                      <TableRow key={room.id || `room-${idx}`} className="hover:bg-muted/50 group">
                        <TableCell className="text-xs px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg transition-colors",
                              room.type === 'SALON' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                room.type === 'SALA_COMPUTO' ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                                  "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            )}>
                              {getTypeIcon(room.type)}
                            </div>
                            <span className="font-normal text-foreground">{room.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs px-4 py-3">
                          <Badge variant="outline" className="text-xs font-normal">
                            {getTypeLabel(room.type).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs px-4 py-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 opacity-40" />
                            <span>{room.capacity || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs px-4 py-3">
                          <span className="text-muted-foreground truncate max-w-[200px]" title={room.description || ''}>
                            {room.description || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs px-4 py-3">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2"
                                  onClick={() => handleEditRoom(room)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                  <span className="text-xs font-sans">Editar Sala</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 text-red-600"
                                  onClick={() => {
                                    setRoomToDelete(room);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="text-xs font-sans">Remover</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
            className="bg-card border rounded-md overflow-hidden shadow-sm"
          >
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-normal px-4 py-2">Solicitante</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Espacio</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Programación</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2 text-center">Estado</TableHead>
                  <TableHead className="text-xs font-normal text-right px-4 py-2">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-6">
                        <p className="text-xs text-muted-foreground">No hay solicitudes registradas</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking, idx) => (
                    <TableRow key={booking.id || `booking-${idx}`} className="hover:bg-muted/50 group">
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-normal text-primary">
                            {booking.teacher.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-normal text-foreground">{booking.teacher.name}</p>
                            <p className="text-[10px] text-muted-foreground">{booking.teacher.role || 'DOCENTE'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                          <span className="font-normal">{booking.room.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="font-normal">{format(new Date(booking.startTime), "d 'de' MMM", { locale: es })}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(booking.startTime), 'hh:mm a')} - {format(new Date(booking.endTime), 'hh:mm a')}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex justify-center lowercase">
                          <Badge variant="outline" className="font-normal text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                booking.status === 'APROBADO' ? "bg-green-500" :
                                  booking.status === 'PENDIENTE' ? "bg-amber-500" : "bg-red-500"
                              )}></span>
                              {booking.status.toLowerCase()}
                            </span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
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
          <DialogHeader className="sr-only">
            <DialogTitle>Detalle de Reserva</DialogTitle>
            <DialogDescription>Revisa los detalles de la solicitud de espacio institucional.</DialogDescription>
          </DialogHeader>
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
                      <h3 className="text-2xl sm:text-3xl font-semibold tracking-card">{selectedBooking.room.name}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Espacio Solicitado</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold  tracking-card text-muted-foreground/60">Docente</p>
                      <p className="font-medium text-xs">{selectedBooking.teacher.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold  tracking-card text-muted-foreground/60">Fecha</p>
                      <p className="font-medium text-xs">{format(new Date(selectedBooking.startTime), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold  tracking-card text-muted-foreground/60">Horario</p>
                      <p className="font-medium text-xs">{format(new Date(selectedBooking.startTime), "hh:mm a")} - {format(new Date(selectedBooking.endTime), "hh:mm a")}</p>
                    </div>
                  </div>
                </div>

                <Badge variant="outline" className="w-fit rounded-full px-4 py-1.5 font-normal text-xs tracking-card border">
                  <span className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      selectedBooking.status === 'APROBADO' ? "bg-green-500" :
                        selectedBooking.status === 'PENDIENTE' ? "bg-amber-500" : "bg-red-500"
                    )}></span>
                    {selectedBooking.status.toLowerCase()}
                  </span>
                </Badge>
              </div>

              {/* Lado Derecho: Detalles y Firma */}
              <div className="flex-1 py-10 px-4 flex flex-col">
                <div className="flex-1 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold  tracking-card text-muted-foreground/70">Motivo Institucional</Label>
                    <p className="text-xs text-foreground/80">
                      "{selectedBooking.reason}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-semibold  tracking-card text-muted-foreground/70">Firma del Responsable</Label>
                    <div className="bg-white dark:bg-muted/20 rounded-4xl p-4 border border-muted/50 flex items-center justify-center h-40 shadow-inner overflow-hidden">
                      <img
                        src={selectedBooking.signatureUrl}
                        alt="Firma Digital"
                        className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal dark:invert dark:opacity-80 transition-all duration-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold  tracking-card text-muted-foreground/70">Notas Administrativas</Label>
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
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedBooking.id, 'RECHAZADO')}
                        className="flex-1 text-xs"
                      >
                        Rechazar
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedBooking.id, 'APROBADO')}
                        className="flex-2 text-xs"
                      >
                        Aprobar Reserva
                      </Button>
                    </>
                  ) : (
                    <Button variant="default" onClick={() => setIsReviewDialogOpen(false)} className="w-full text-xs">
                      Cerrar Detalle
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-4xl border-none shadow-2xl bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-semibold tracking-card">¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Esta acción eliminará permanentemente la sala <strong>{roomToDelete?.name}</strong>.
              Esto podría afectar a las solicitudes y programaciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl h-11 text-xs font-semibold tracking-card">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="rounded-xl h-11 text-xs font-semibold tracking-card bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar sala'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

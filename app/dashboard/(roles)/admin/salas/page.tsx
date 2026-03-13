'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
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
  DropdownMenuTrigger,
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
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Room, RoomType } from '@prisma/client';
import {
  addDays,
  addMonths,
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
  subDays,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Computer,
  Download,
  Edit2,
  Layout,
  Loader2,
  Mic2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { sileo } from 'sileo';

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
                  {event.room} — {event.teacher}
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

const WeekView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
  const start = startOfWeek(date, { locale: es });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = eachHourOfInterval({
    start: new Date(2024, 0, 1, 7, 0),
    end: new Date(2024, 0, 1, 22, 0),
  });

  return (
    <div className="flex flex-col border rounded-3xl overflow-hidden bg-background">
      <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-muted/10 border-b">
        <div className="p-4 border-r" />
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-4 text-center border-r last:border-r-0">
            <p className="text-xs font-semibold tracking-card text-muted-foreground mb-1">
              {format(day, 'EEE', { locale: es })}
            </p>
            <p
              className={cn(
                'text-lg font-semibold h-9 w-9 mx-auto flex items-center justify-center rounded-full',
                isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'
              )}
            >
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>
      <div className="max-h-[36rem] overflow-auto">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] relative">
          {hours.map(hour => (
            <React.Fragment key={hour.toISOString()}>
              <div className="h-16 p-2 text-right text-xs font-semibold text-muted-foreground/60 border-r border-b">
                {format(hour, 'hh:mm a')}
              </div>
              {weekDays.map(day => (
                <div
                  key={`${day.toISOString()}-${hour.toISOString()}`}
                  className="h-16 border-r border-b last:border-r-0 relative group"
                >
                  {events
                    .filter(
                      e => isSameDay(e.start, day) && format(e.start, 'H') === format(hour, 'H')
                    )
                    .map((event, idx) => (
                      <div
                        key={event.id || `${day.toISOString()}-${hour.toISOString()}-${idx}`}
                        className="absolute inset-x-1 top-1 p-2 rounded-xl bg-primary/10 text-primary border border-primary/30 z-10 shadow-lg"
                      >
                        <p className="text-xs font-semibold truncate leading-none mb-1">
                          {event.room}
                        </p>
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
                      <p className="text-xs font-semibold tracking-card">{event.room}</p>
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
          <p className="text-xs font-semibold tracking-card text-foreground/60">
            Sin programaciones
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

            <div className="flex-1 bg-card border rounded-4xl p-6 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h4 className="text-md font-semibold tracking-card">{event.room}</h4>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {event.teacher}
                    </span>
                  </div>
                </div>
                <Badge className="rounded-full px-3 py-1 font-semibold text-xs tracking-card bg-primary/5 text-primary border-none shadow-none hover:bg-primary/10 hover:text-primary">
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
  onView,
}: {
  date: Date;
  view: string;
  events: CalendarEvent[];
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: string) => void;
}) => {
  const shouldReduceMotion = useReducedMotion();

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
            aria-label="Mes anterior"
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
            aria-label="Mes siguiente"
            onClick={() => onNavigate('NEXT')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <h2 className="text-xs md:text-md tracking-card font-semibold ml-6 text-foreground/90 truncate capitalize">
            {getLabel()}
          </h2>
        </div>

        <div className="flex items-center p-2 gap-2 bg-muted/20 rounded-full border border-border overflow-x-auto no-scrollbar">
          {[
            { id: 'month', label: 'Mes' },
            { id: 'week', label: 'Semana' },
            { id: 'day', label: 'Día' },
            { id: 'agenda', label: 'Agenda' },
          ].map(v => (
            <Button
              key={v.id}
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-full px-7 text-xs font-normal transition-all shrink-0',
                view === v.id
                  ? 'bg-primary text-primary-foreground hover:bg-primary dark:hover:text-primary-foreground hover:text-white/90'
                  : 'text-muted-foreground/60 hover:bg-muted/20 hover:text-foreground'
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

export default function AdminSalasPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  // CSV Upload State (carga masiva inline en pestaña Espacios)
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreviewData, setUploadPreviewData] = useState<any[]>([]);
  const [isUploadPreview, setIsUploadPreview] = useState(false);

  // Managed state for the institutional calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<string>('month');

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/admin/rooms');
      const data = await response.json();
      setRooms(response.ok ? data : []);
    } catch (error) {
      sileo.error({ title: 'Error al cargar salas' });
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await fetch('/api/rooms/bookings');
      const data = await response.json();

      const finalData = response.ok ? data : [];
      setBookings(finalData);
      const approved = finalData.filter((b: any) => b.status === 'APROBADO');
      const formatted = approved.map((b: any) => ({
        id: b.id,
        title: `${b.room.name} - ${b.teacher.name}`,
        start: new Date(b.startTime),
        end: new Date(b.endTime),
        room: b.room.name,
        teacher: b.teacher.name,
        reason: b.reason,
      }));
      setCalendarEvents(formatted);
    } catch (error) {
      sileo.error({ title: 'Error al cargar solicitudes' });
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

  const handleEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity?.toString() || '',
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
        sileo.success({ title: 'Sala eliminada exitosamente' });
        setIsDeleteDialogOpen(false);
        setRoomToDelete(null);
        fetchRooms();
      } else {
        const error = await response.json();
        sileo.error({ title: error.error || 'Error al eliminar sala' });
      }
    } catch (error) {
      sileo.error({ title: 'Error de red' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadPreview = async () => {
    if (!uploadFile) {
      sileo.error({ title: 'Selecciona un archivo primero' });
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('preview', 'true');
      const response = await fetch('/api/admin/salas/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUploadPreviewData(data.previewData || []);
        setIsUploadPreview(true);
      } else {
        sileo.error({ title: data.error || 'Error al procesar archivo' });
      }
    } catch (e) {
      sileo.error({ title: 'Error de red' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadConfirm = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const response = await fetch('/api/admin/salas/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        sileo.success({
          title: `Se procesaron ${data.created} salas. Hubo ${data.errors} repetidas.`,
        });
        setUploadFile(null);
        setIsUploadPreview(false);
        setUploadPreviewData([]);
        fetchRooms();
      } else {
        sileo.error({ title: data.error || 'Error al procesar archivo' });
      }
    } catch (e) {
      sileo.error({ title: 'Error de red' });
    } finally {
      setIsUploading(false);
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
        sileo.success({
          title: editingRoomId ? 'Sala actualizada exitosamente' : 'Sala creada exitosamente',
        });
        setIsDialogOpen(false);
        setEditingRoomId(null);
        setFormData({ name: '', type: 'SALON', capacity: '', description: '' });
        fetchRooms();
      } else {
        const error = await response.json();
        sileo.error({ title: error.error || 'Error al procesar solicitud' });
      }
    } catch (error) {
      sileo.error({ title: 'Error de red' });
    }
  };

  const getTypeIcon = (type: RoomType) => {
    switch (type) {
      case 'SALA_COMPUTO':
        return <Computer className="h-4 w-4" />;
      case 'SALON':
        return <Building2 className="h-4 w-4" />;
      case 'AUDITORIO':
        return <Mic2 className="h-4 w-4" />;
      default:
        return <Layout className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: RoomType) => {
    switch (type) {
      case 'SALA_COMPUTO':
        return 'Sala de Cómputo';
      case 'SALON':
        return 'Salón de Clase';
      case 'AUDITORIO':
        return 'Auditorio';
      default:
        return type;
    }
  };

  const filteredRooms = rooms.filter(
    room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTypeLabel(room.type).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Tabs defaultValue="list" className="flex flex-col gap-8 h-full">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        id="tour-salas-title"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
            Gestión de Salas
          </h1>
          <p className="text-muted-foreground text-[15px] mt-1 max-w-2xl">
            Administración de espacios físicos. La asignación a grupos se hace en Planeador →
            Asignación.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TabsList
            className="flex items-center p-1 gap-1 bg-muted/30 rounded-full border border-muted/50 h-auto"
            id="tour-salas-tabs"
          >
            <TabsTrigger
              value="list"
              className="rounded-full px-5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground"
            >
              Espacios
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="rounded-full px-5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground"
            >
              Horarios
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2" id="tour-salas-actions">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="rounded-full px-5 gap-2 shadow-sm"
                  onClick={() => {
                    setEditingRoomId(null);
                    setFormData({ name: '', type: 'SALON', capacity: '', description: '' });
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Nueva Sala</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-2xl border border-border">
                <form onSubmit={handleSubmit} className="space-y-6 p-2">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                      {editingRoomId ? 'Editar Sala' : 'Nueva Sala'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingRoomId
                        ? 'Actualiza los detalles del espacio institucional.'
                        : 'Configura los detalles del nuevo espacio institucional.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold tracking-card text-muted-foreground ml-1">
                        Identificación
                      </Label>
                      <Input
                        className="rounded-xl bg-muted/30 border-none h-11"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Laboratorio 401"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold tracking-card text-muted-foreground ml-1">
                          Tipo
                        </Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: RoomType) =>
                            setFormData({ ...formData, type: value })
                          }
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
                        <Label className="text-xs font-semibold tracking-card text-muted-foreground ml-1">
                          Capacidad
                        </Label>
                        <Input
                          className="rounded-xl bg-muted/30 border-none h-11"
                          type="number"
                          value={formData.capacity}
                          onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold tracking-card text-muted-foreground ml-1">
                        Descripción
                      </Label>
                      <Textarea
                        className="rounded-xl bg-muted/30 border-none min-h-24 resize-none pt-4"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" variant="default" className="w-full">
                      {editingRoomId ? 'Guardar Cambios' : 'Crear Espacio'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* TAB: ESPACIOS (Carga masiva + Listado) */}
        <TabsContent value="list" className="m-0 focus-visible:outline-none">
          <Tabs defaultValue="listado" className="space-y-6">
            <TabsList className="mb-4 flex items-center p-1 gap-2 bg-muted/20 rounded-full border border-muted/50">
              <TabsTrigger
                value="carga"
                className="rounded-full px-6 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Carga masiva
              </TabsTrigger>
              <TabsTrigger
                value="listado"
                className="rounded-full px-6 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Listado de espacios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="carga" className="m-0 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="bg-card border rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold tracking-card text-foreground">
                      Cómo funciona la carga masiva
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      1. Descarga la plantilla CSV de salas.
                    </p>
                    <a href="/formatos/plantilla_salas.csv" download>
                      <Button variant="outline" className="w-full justify-start h-9 text-xs">
                        <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                        Descargar plantilla de salas
                      </Button>
                    </a>
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-foreground">
                        Columnas esperadas:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[10px] text-muted-foreground">
                        <li>name (identificación del espacio)</li>
                        <li>type (SALON, SALA_COMPUTO, AUDITORIO)</li>
                        <li>capacity (opcional)</li>
                      </ul>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      2. Completa el archivo y súbelo para generar una vista previa y validar los
                      datos antes de importarlos.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-card border rounded-xl p-5 space-y-4">
                    <p className="text-xs font-semibold tracking-card text-foreground">
                      Subir archivo CSV
                    </p>
                    <SubjectFileUpload
                      onFileSelect={f => {
                        setUploadFile(f);
                        setIsUploadPreview(false);
                        setUploadPreviewData([]);
                      }}
                      file={uploadFile}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        className="flex-1 text-xs h-9"
                        variant="outline"
                        onClick={handleUploadPreview}
                        disabled={!uploadFile || isUploading || isUploadPreview}
                      >
                        {isUploading && !isUploadPreview ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando vista previa...
                          </>
                        ) : (
                          'Vista previa'
                        )}
                      </Button>
                      {(uploadFile || isUploadPreview) && (
                        <Button
                          onClick={() => {
                            setUploadFile(null);
                            setIsUploadPreview(false);
                            setUploadPreviewData([]);
                          }}
                          variant="ghost"
                          className="h-9 px-3 text-[11px] text-muted-foreground"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      También puedes crear salas individuales con el botón Nueva Sala en el listado.
                    </p>
                  </div>

                  <div className="bg-card border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b flex items-center justify-between">
                      <p className="text-xs font-semibold tracking-card text-foreground">
                        Salas para cargar ({uploadPreviewData.length})
                      </p>
                      <Badge variant="outline" className="text-[10px] bg-muted/30">
                        {uploadPreviewData.length} registros
                      </Badge>
                    </div>
                    <div className="p-0">
                      {uploadPreviewData.length === 0 ? (
                        <div className="py-10 text-center text-[11px] text-muted-foreground">
                          Sube un archivo y genera la vista previa para ver aquí las salas a
                          importar.
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-auto">
                          <Table>
                            <TableHeader className="bg-muted/30">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                  Identificación
                                </TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                  Tipo
                                </TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                  Capacidad
                                </TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                                  Estado
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {uploadPreviewData.map(row => (
                                <TableRow key={row.name} className="hover:bg-muted/50 group">
                                  <TableCell className="text-xs px-4 py-3 font-medium">
                                    {row.name}
                                  </TableCell>
                                  <TableCell className="text-xs px-4 py-3">{row.type}</TableCell>
                                  <TableCell className="text-xs px-4 py-3">
                                    {row.capacity}
                                  </TableCell>
                                  <TableCell className="text-xs px-4 py-3 text-right">
                                    <Badge
                                      variant={row.status === 'success' ? 'default' : 'secondary'}
                                      className={cn(
                                        'text-[10px]',
                                        row.status === 'success'
                                          ? 'bg-success text-success-foreground hover:bg-success/90'
                                          : 'bg-warning/10 text-warning hover:bg-warning/20'
                                      )}
                                    >
                                      {row.status === 'success' ? 'Válido' : 'Existente'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                    {uploadPreviewData.length > 0 && (
                      <div className="px-5 py-3 border-t flex justify-end">
                        <Button
                          onClick={handleUploadConfirm}
                          disabled={
                            !isUploadPreview || isUploading || uploadPreviewData.length === 0
                          }
                          className="px-6 h-9 text-xs"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            'Confirmar e importar'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="listado" className="m-0">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-4 px-1">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      placeholder="Buscar por nombre o tipo..."
                      className="pl-10 bg-muted/20 rounded-full focus-visible:ring-1"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Mini Stats */}
                {!loading && filteredRooms.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-1">
                    {[
                      {
                        label: 'Salones',
                        count: rooms.filter(r => r.type === 'SALON').length,
                        icon: Building2,
                        bg: 'bg-blue-500/10',
                        text: 'text-blue-600 dark:text-blue-400',
                      },
                      {
                        label: 'Cómputo',
                        count: rooms.filter(r => r.type === 'SALA_COMPUTO').length,
                        icon: Computer,
                        bg: 'bg-orange-500/10',
                        text: 'text-orange-600 dark:text-orange-400',
                      },
                      {
                        label: 'Auditorios',
                        count: rooms.filter(r => r.type === 'AUDITORIO').length,
                        icon: Mic2,
                        bg: 'bg-purple-500/10',
                        text: 'text-purple-600 dark:text-purple-400',
                      },
                    ].map(({ label, count, icon: Icon, bg, text }) => (
                      <Card
                        key={label}
                        className="border-border/50 shadow-sm overflow-hidden bg-muted/30 p-0"
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg} ${text} shrink-0`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold tracking-tight text-foreground">
                              {count}
                            </p>
                            <p className="text-[12px] text-muted-foreground">{label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed">
                    <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                      <Layout className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-[17px] font-semibold text-foreground">Sin resultados</p>
                    <p className="text-muted-foreground text-[14px] mt-2 max-w-xs">
                      {searchTerm
                        ? 'No encontramos salas que coincidan con tu búsqueda.'
                        : 'Aún no has creado ningún espacio. Usa el botón Nueva Sala.'}
                    </p>
                  </div>
                ) : (
                  <Card className="border-border/50 shadow-sm overflow-hidden bg-card p-0">
                    <div className="divide-y divide-border/40">
                      {filteredRooms.map((room, idx) => (
                        <div
                          key={room.id || `room-${idx}`}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group"
                        >
                          {/* Left: Icon */}
                          <div
                            className={cn(
                              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                              room.type === 'SALON'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : room.type === 'SALA_COMPUTO'
                                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            )}
                          >
                            {getTypeIcon(room.type)}
                          </div>

                          {/* Center: Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {room.isActive === false && (
                                <div
                                  className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0"
                                  title="Inactivo"
                                />
                              )}
                              <p className="text-[15px] font-medium text-foreground truncate">
                                {room.name}
                              </p>
                            </div>
                            <p className="text-[12px] text-muted-foreground truncate">
                              {getTypeLabel(room.type)}{' '}
                              {room.description && `• ${room.description}`}
                            </p>
                          </div>

                          {/* Right: Metadata & Actions */}
                          <div className="flex items-center gap-4">
                            {room.capacity && (
                              <div className="flex items-center gap-1.2 text-[12px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full shrink-0">
                                <Users className="h-3 w-3 opacity-60" />
                                <span>{room.capacity}</span>
                              </div>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-foreground transition-colors"
                                >
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl shadow-xl border-border/50 backdrop-blur-md"
                              >
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 py-2.5 rounded-lg"
                                  onClick={() => handleEditRoom(room)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                  <span className="text-xs">Editar detalles</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 py-2.5 rounded-lg text-destructive focus:bg-destructive/10"
                                  onClick={() => {
                                    setRoomToDelete(room);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="text-xs font-medium">Eliminar espacio</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* TAB: CRONOGRAMA (SIDEBAR + MAIN) */}
        <TabsContent value="schedule" className="m-0 focus-visible:outline-none h-full">
          {/* Panel Principal Full Width */}
          <div className="w-full h-full  flex flex-col">
            <CustomCalendar
              date={currentDate}
              view={currentView}
              events={calendarEvents}
              onNavigate={action => {
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
              onView={v => setCurrentView(v)}
            />
          </div>
        </TabsContent>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-semibold tracking-card">
              ¿Estás completamente seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Esta acción eliminará permanentemente la sala <strong>{roomToDelete?.name}</strong>.
              Esto podría afectar a las solicitudes y programaciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl h-11 text-xs font-semibold tracking-card">
              Cancelar
            </AlertDialogCancel>
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

'use client';

import { EventType, SubjectEvent, getErrorMessage } from '@/types';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { DialogDescription } from '@radix-ui/react-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Edit, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loading } from './ui/loading';

interface EventsCardProps {
  subjectId: string;
}

export function EventsCard({ subjectId }: EventsCardProps) {
  // State for Events
  const [events, setEvents] = useState<SubjectEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SubjectEvent | null>(null);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<SubjectEvent | null>(null);
  // Form state for create/edit
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [eventType, setEventType] = useState<EventType | ''>('');
  const [isEventDatePickerOpen, setIsEventDatePickerOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch(`/api/docente/eventos?subjectId=${subjectId}`);
      if (!response.ok) {
        throw new Error('Error al cargar los eventos');
      }
      const data = await response.json();
      setEvents(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingEvents(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (subjectId) {
      fetchEvents();
    }
  }, [subjectId, fetchEvents]);

  const resetEventForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventDate(new Date());
    setEventType('');
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventType) {
      toast.error('Título, fecha y tipo son requeridos.');
      return;
    }
    const toastId = toast.loading('Creando evento...');
    try {
      const response = await fetch('/api/docente/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          date: eventDate.toISOString(),
          type: eventType,
          subjectId: subjectId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el evento');
      }
      const createdEventResp = await response.json();
      setEvents(prevEvents => [...prevEvents, createdEventResp.data]);
      toast.success('Evento creado con éxito', { id: toastId });
      setIsCreateEventDialogOpen(false);
      resetEventForm();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error), {
        id: toastId,
      });
    }
  };

  const openEditEventDialog = (event: SubjectEvent) => {
    setCurrentEvent(event);
    setEventTitle(event.title);
    setEventDescription(event.description || '');
    setEventDate(new Date(event.date));
    setEventType(event.type);
    setIsEditEventDialogOpen(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEvent) return;

    if (!eventTitle || !eventDate || !eventType) {
      toast.error('Título, fecha y tipo son requeridos.');
      return;
    }
    const toastId = toast.loading('Actualizando evento...');
    try {
      const response = await fetch(`/api/docente/eventos/${currentEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          date: eventDate.toISOString(),
          type: eventType,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el evento');
      }
      const updatedEventResp = await response.json();
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === currentEvent.id ? updatedEventResp.data : event))
      );
      toast.success('Evento actualizado con éxito', { id: toastId });
      setIsEditEventDialogOpen(false);
      resetEventForm();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error), {
        id: toastId,
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId) return;
    const toastId = toast.loading('Eliminando evento...');
    try {
      const response = await fetch(`/api/docente/eventos/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el evento');
      }
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      toast.success('Evento eliminado con éxito', { id: toastId });
      setEventToDelete(null); // Cerrar diálogo
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error), {
        id: toastId,
      });
      setEventToDelete(null); // Cerrar diálogo en caso de error
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <CardTitle className="text-xl font-semibold tracking-heading font-sans">
                Eventos Especiales
              </CardTitle>
              <CardDescription className="text-xs font-sans">
                Gestiona exámenes, entregas y anuncios importantes.
              </CardDescription>
            </div>
            <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={resetEventForm}>
                  Crear Evento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-sans font-semibold text-xl tracking-tight">
                    Crear Nuevo Evento
                  </DialogTitle>
                  <DialogDescription className="text-xs font-sans text-muted-foreground">
                    Gestiona exámenes, entregas y anuncios importantes.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4 font-sans">
                  <div className="space-y-2">
                    <Label className="text-xs" htmlFor="event-title">
                      Título
                    </Label>
                    <Input
                      id="event-title"
                      value={eventTitle}
                      placeholder="Título del evento"
                      className="text-xs"
                      onChange={e => setEventTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs" htmlFor="event-desc">
                      Descripción (Opcional)
                    </Label>
                    <Textarea
                      id="event-desc"
                      value={eventDescription}
                      placeholder="Descripción del evento"
                      className="resize-none text-xs"
                      onChange={e => setEventDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row w-full gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Fecha</Label>
                      <Popover open={isEventDatePickerOpen} onOpenChange={setIsEventDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal text-xs',
                              !eventDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventDate ? (
                              format(eventDate, 'PPP', { locale: es })
                            ) : (
                              <span>Elige una fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={eventDate}
                            onSelect={setEventDate}
                            onDayClick={() => setIsEventDatePickerOpen(false)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo de Evento</Label>
                      <Select
                        value={eventType}
                        onValueChange={value => setEventType(value as EventType)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem className="font-sans text-xs" value="EXAMEN">
                            Examen
                          </SelectItem>
                          <SelectItem className="font-sans text-xs" value="TRABAJO">
                            Tarea
                          </SelectItem>
                          <SelectItem className="font-sans text-xs" value="LIMITE">
                            Fecha límite
                          </SelectItem>
                          <SelectItem className="font-sans text-xs" value="ANUNCIO">
                            Anuncio
                          </SelectItem>
                          <SelectItem className="font-sans text-xs" value="INFO">
                            Informativo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit">Crear Evento</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingEvents ? (
            <Loading />
          ) : events.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="text-xs font-normal px-4 py-2">Título</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2">Fecha</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2">Tipo</TableHead>
                    <TableHead className="text-xs font-normal text-right px-4 py-2">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="font-normal px-4 py-2">{event.title}</TableCell>
                      <TableCell className="px-4 py-2">
                        {format(new Date(event.date), 'PPP', { locale: es })}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge variant="outline" className="text-xs font-normal font-sans">
                          {event.type === 'EXAMEN' && 'Examen'}
                          {event.type === 'TRABAJO' && 'Tarea'}
                          {event.type === 'LIMITE' && 'Fecha límite'}
                          {event.type === 'ANUNCIO' && 'Anuncio'}
                          {event.type === 'INFO' && 'Informativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-sans">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-zinc-600 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                          onClick={() => openEditEventDialog(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog
                          open={eventToDelete?.id === event.id}
                          onOpenChange={isOpen => !isOpen && setEventToDelete(null)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-zinc-600 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                              onClick={() => setEventToDelete(event)}
                            >
                              <Trash2 className="h-4 w-4 " />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-sans text-xl font-semibold tracking-tight">
                                ¿Estás seguro?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="font-sans text-xs text-muted-foreground">
                                Esta acción no se puede deshacer. Se eliminará el evento
                                permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                className="font-sans"
                                onClick={() => setEventToDelete(null)}
                              >
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-rose-600 text-white hover:bg-rose-700 font-sans"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-xs text-muted-foreground">No hay eventos especiales creados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventDialogOpen} onOpenChange={setIsEditEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans text-xl font-semibold tracking-tight">
              Editar Evento
            </DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Modifica los detalles del evento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateEvent} className="space-y-4 font-sans">
            <div className="space-y-2">
              <Label htmlFor="edit-event-title">Título</Label>
              <Input
                id="edit-event-title"
                value={eventTitle}
                className="text-xs"
                onChange={e => setEventTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-desc">Descripción (Opcional)</Label>
              <Textarea
                id="edit-event-desc"
                value={eventDescription}
                className="font-sans resize-none"
                onChange={e => setEventDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !eventDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventDate ? (
                        format(eventDate, 'PPP', { locale: es })
                      ) : (
                        <span>Elige una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={setEventDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 ">
                <Label>Tipo de Evento</Label>
                <Select value={eventType} onValueChange={value => setEventType(value as EventType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="font-sans" value="EXAMEN">
                      Examen
                    </SelectItem>
                    <SelectItem className="font-sans" value="TRABAJO">
                      Tarea
                    </SelectItem>
                    <SelectItem className="font-sans" value="LIMITE">
                      Fecha límite
                    </SelectItem>
                    <SelectItem className="font-sans" value="ANUNCIO">
                      Anuncio
                    </SelectItem>
                    <SelectItem className="font-sans" value="INFO">
                      Informativo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

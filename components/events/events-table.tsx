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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loading } from '@/components/ui/loading';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { type EventType, type SubjectEvent, getErrorMessage } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EventForm } from './event-form';
import { EventTypeBadge } from './event-type-badge';

interface EventsTableProps {
  subjectId: string;
}

export function EventsTable({ subjectId }: EventsTableProps) {
  const [events, setEvents] = useState<SubjectEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SubjectEvent | null>(null);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<SubjectEvent | null>(null);

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

  const handleCreateEvent = async (data: {
    title: string;
    description?: string;
    date: Date;
    type: EventType;
  }) => {
    const toastId = toast.loading('Creando evento...');
    try {
      const response = await fetch('/api/docente/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || '',
          date: data.date.toISOString(),
          type: data.type,
          subjectId: subjectId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al crear el evento');
      }
      const createdEventResp = await response.json();
      const createdEvent = createdEventResp.data || createdEventResp;

      if (!createdEvent) {
        throw new Error('La respuesta del servidor no contiene datos válidos');
      }

      setEvents(prevEvents => [...prevEvents, createdEvent]);
      toast.success('Evento creado con éxito', { id: toastId });
      setIsCreateEventDialogOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
    }
  };

  const openEditEventDialog = (event: SubjectEvent) => {
    setCurrentEvent(event);
    setIsEditEventDialogOpen(true);
  };

  const handleUpdateEvent = async (data: {
    title: string;
    description?: string;
    date: Date;
    type: EventType;
  }) => {
    if (!currentEvent) {
      toast.error('No hay evento seleccionado para editar');
      return;
    }

    const toastId = toast.loading('Actualizando evento...');
    try {
      const response = await fetch(`/api/docente/eventos/${currentEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || '',
          date: data.date.toISOString(),
          type: data.type,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al actualizar el evento');
      }
      const updatedEventResp = await response.json();
      const updatedEvent = updatedEventResp.data || updatedEventResp;

      if (!updatedEvent) {
        throw new Error('La respuesta del servidor no contiene datos válidos');
      }

      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === currentEvent.id ? updatedEvent : event))
      );
      toast.success('Evento actualizado con éxito', { id: toastId });
      setIsEditEventDialogOpen(false);
      setCurrentEvent(null);
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
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
      setEventToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
      setEventToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card font-sans">
                Gestión de Eventos Especiales
              </CardTitle>
              <CardDescription className="text-xs font-sans">
                Gestiona exámenes, entregas y anuncios importantes.
              </CardDescription>
            </div>
            <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setIsCreateEventDialogOpen(true)}>
                  Crear Evento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-sans font-semibold sm:text-3xl text-2xl tracking-card">
                    Crear Nuevo Evento
                  </DialogTitle>
                  <DialogDescription className="text-xs font-sans text-muted-foreground">
                    Gestiona exámenes, entregas y anuncios importantes.
                  </DialogDescription>
                </DialogHeader>
                <EventForm
                  onSubmit={handleCreateEvent}
                  onCancel={() => setIsCreateEventDialogOpen(false)}
                  submitLabel="Crear Evento"
                />
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
                        <EventTypeBadge type={event.type} />
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
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-sans sm:text-3xl text-2xl font-semibold tracking-card">
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
            <div className="h-56 py-12 text-center flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No hay eventos especiales creados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Event Dialog */}
      {currentEvent && (
        <Dialog open={isEditEventDialogOpen} onOpenChange={setIsEditEventDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-sans sm:text-3xl text-2xl font-semibold tracking-card">
                Editar Evento
              </DialogTitle>
              <DialogDescription className="font-sans text-xs text-muted-foreground">
                Modifica los detalles del evento.
              </DialogDescription>
            </DialogHeader>
            <EventForm
              title={currentEvent.title}
              description={currentEvent.description || ''}
              date={new Date(currentEvent.date)}
              type={currentEvent.type}
              onSubmit={handleUpdateEvent}
              onCancel={() => {
                setIsEditEventDialogOpen(false);
                setCurrentEvent(null);
              }}
              submitLabel="Guardar Cambios"
              isEdit
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

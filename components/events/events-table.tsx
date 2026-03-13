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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { type EventType, type SubjectEvent, getErrorMessage } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Edit, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { sileo } from 'sileo';
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
      sileo.error({ title: getErrorMessage(error) });
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
    const loadingId = sileo.show({ title: 'Creando evento...', type: 'loading' });
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
      sileo.success({ title: 'Evento creado con éxito' });
      sileo.dismiss(loadingId);
      setIsCreateEventDialogOpen(false);
    } catch (error) {
      sileo.error({ title: getErrorMessage(error) });
      sileo.dismiss(loadingId);
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
      sileo.error({ title: 'No hay evento seleccionado para editar' });
      return;
    }

    const loadingId2 = sileo.show({ title: 'Actualizando evento...', type: 'loading' });
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
      sileo.success({ title: 'Evento actualizado con éxito' });
      sileo.dismiss(loadingId2);
      setIsEditEventDialogOpen(false);
      setCurrentEvent(null);
    } catch (error) {
      sileo.error({ title: getErrorMessage(error) });
      sileo.dismiss(loadingId2);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId) return;
    const loadingId3 = sileo.show({ title: 'Eliminando evento...', type: 'loading' });
    try {
      const response = await fetch(`/api/docente/eventos/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el evento');
      }
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      sileo.success({ title: 'Evento eliminado con éxito' });
      sileo.dismiss(loadingId3);
      setEventToDelete(null);
    } catch (error) {
      sileo.error({ title: getErrorMessage(error) });
      sileo.dismiss(loadingId3);
      setEventToDelete(null);
    }
  };

  return (
    <>
      <div>
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <CardTitle className="sm:text-lg text-xs font-semibold tracking-card font-sans">
              Gestión de Eventos Especiales
            </CardTitle>
            <CardDescription className="text-xs font-sans">
              Gestiona exámenes, entregas y anuncios importantes.
            </CardDescription>
          </div>
          <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
            <Button
              variant="default"
              className="rounded-full text-xs h-9 shrink-0"
              onClick={() => setIsCreateEventDialogOpen(true)}
            >
              Crear Evento
            </Button>
            <DialogContent className="rounded-2xl border border-border gap-6 sm:max-w-lg">
              <DialogHeader className="gap-1.5 text-left">
                <DialogTitle className="text-lg font-semibold tracking-card">
                  Crear nuevo evento
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Completa los datos del evento (examen, entrega, anuncio, etc.).
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
        <div className="mt-4">
          {isLoadingEvents ? (
            <div className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1">
              <div className="divide-y divide-border/40">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between gap-4 py-4 px-5">
                    <div className="flex flex-col gap-1.5 w-full">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-8 w-16 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : events.length > 0 ? (
            <div className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1 relative">
              <div className="divide-y divide-border/40">
                {events.map(event => (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 hover:bg-muted/50 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex flex-col min-w-0 gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-foreground tracking-card truncate">
                            {event.title}
                          </span>
                          <EventTypeBadge type={event.type} />
                        </div>
                        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 opacity-70" />
                          <span className="font-medium text-foreground/80">
                            {format(new Date(event.date), 'PPP', { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end shrink-0 sm:pl-0 pl-14 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground/50 hover:text-foreground shrink-0 transition-colors"
                        aria-label="Editar evento"
                        onClick={() => openEditEventDialog(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog
                        open={eventToDelete?.id === event.id}
                        onOpenChange={open => !open && setEventToDelete(null)}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground/50 hover:text-red-600 hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:bg-red-500/20 shrink-0 transition-colors"
                          aria-label="Eliminar evento"
                          onClick={() => setEventToDelete(event)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <AlertDialogContent className="rounded-2xl border border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-semibold tracking-card">
                              ¿Eliminar evento?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-muted-foreground">
                              Esta acción no se puede deshacer. El evento se eliminará
                              permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2 ">
                            <AlertDialogCancel
                              className="rounded-full text-xs"
                              onClick={() => setEventToDelete(null)}
                            >
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-full text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                              onClick={() => event.id && handleDeleteEvent(event.id)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No hay eventos especiales creados"
              description="Crea exámenes, entregas o anuncios para esta asignatura."
            />
          )}
        </div>
      </div>

      {/* Edit Event Dialog */}
      {currentEvent && (
        <Dialog open={isEditEventDialogOpen} onOpenChange={setIsEditEventDialogOpen}>
          <DialogContent className="rounded-2xl border border-border gap-6 sm:max-w-lg">
            <DialogHeader className="gap-1.5 text-left">
              <DialogTitle className="text-lg font-semibold tracking-card">
                Editar evento
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
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

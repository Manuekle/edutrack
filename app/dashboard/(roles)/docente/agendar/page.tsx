'use client';

import { SignaturePad } from '@/components/rooms/signature-pad';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Room } from '@prisma/client';
import { addHours, format, startOfHour } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  Info,
  Plus,
  Layout as RoomIcon,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

export default function DocenteAgendarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bookingForm, setBookingForm] = useState({
    startTime: startOfHour(new Date()),
    endTime: addHours(startOfHour(new Date()), 1),
    reason: '',
    signature: '',
  });

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/admin/rooms', { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        sileo.error({
          title:
            (data && typeof data.error === 'string' ? data.error : null) || 'Error al cargar salas',
        });
        setRooms([]);
        setLoading(false);
        return;
      }
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setRooms(list);
      if (list.length > 0) setSelectedRoom(list[0].id);
    } catch (error) {
      sileo.error({ title: 'Error al cargar salas' });
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomBookings = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/bookings?roomId=${roomId}`);
      const data = await response.json();
      if (response.ok) {
        setRoomBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings', error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) fetchRoomBookings(selectedRoom);
  }, [selectedRoom]);

  const handleBookingSubmit = async () => {
    if (!bookingForm.reason || !bookingForm.signature) {
      sileo.error({ title: 'Por favor completa todos los campos y firma la solicitud' });
      return;
    }

    try {
      const response = await fetch('/api/rooms/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom,
          startTime: bookingForm.startTime.toISOString(),
          endTime: bookingForm.endTime.toISOString(),
          reason: bookingForm.reason,
          signatureData: bookingForm.signature,
        }),
      });

      if (response.ok) {
        sileo.success({ title: 'Solicitud enviada exitosamente' });
        setIsBookingModalOpen(false);
        setBookingForm({ ...bookingForm, reason: '', signature: '' });
        if (selectedRoom) fetchRoomBookings(selectedRoom);
      } else {
        const err = await response.json();
        sileo.error({ title: err.error || 'Error al agendar' });
      }
    } catch (error) {
      sileo.error({ title: 'Error de red' });
    }
  };

  const getSelectedRoomName = () => {
    return rooms.find(r => r.id === selectedRoom)?.name || 'Selecciona una sala';
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start md:items-center">
            <div className="pb-0">
              <CardTitle className="sm:text-2xl text-xs font-semibold tracking-card">
                Agendar Sala
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Reserva espacios físicos para tus actividades académicas
              </CardDescription>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setIsBookingModalOpen(true)}
                className="gap-2 rounded-full px-6 shadow-sm text-xs h-9"
              >
                <Plus className="h-4 w-4" />
                Nueva Solicitud
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar: Salas */}
            <Card className="p-0 border border-border rounded-lg bg-card shadow-sm">
              <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-xs font-semibold tracking-card text-muted-foreground">
                  Salas e Instalaciones
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecciona para ver disponibilidad
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {loading ? (
                  <div className="py-8 flex justify-center">
                    <Loading />
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="py-8 px-2 text-center">
                    <RoomIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs font-medium text-muted-foreground">
                      No hay salas disponibles
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1">
                      Contacta al administrador para dar de alta salas.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {rooms.map(room => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedRoom(room.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-full text-left transition-colors text-xs',
                          selectedRoom === room.id
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded-full shrink-0',
                            selectedRoom === room.id ? 'bg-primary/20' : 'bg-muted/50'
                          )}
                        >
                          <RoomIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{room.name}</p>
                          <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                            <Users className="h-3 w-3" />
                            <span>{room.capacity ?? '—'} cap.</span>
                          </div>
                        </div>
                        {selectedRoom === room.id && (
                          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabla de disponibilidad */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border border-border rounded-lg bg-card shadow-sm p-0">
                <CardHeader className="px-4 pt-4 pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-xs font-semibold tracking-card">
                        {getSelectedRoomName()}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Cronograma de uso y disponibilidad
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs bg-muted/50 border-muted text-muted-foreground"
                    >
                      Activa
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1">
                    <div className="divide-y divide-border/40">
                      {roomBookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 gap-3 text-center">
                          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                            <CalendarIcon className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[14px] font-semibold text-foreground tracking-card">
                              No hay ocupación
                            </p>
                            <p className="text-[12px] text-muted-foreground">
                              Espacio disponible para reservar
                            </p>
                          </div>
                        </div>
                      ) : (
                        roomBookings.map(booking => (
                          <div
                            key={booking.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 hover:bg-muted/50 dark:hover:bg-white/[0.02] transition-colors group"
                          >
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="flex flex-col min-w-0 gap-1.5">
                                <span className="text-[14px] font-semibold text-foreground tracking-card truncate group-hover:text-primary transition-colors">
                                  {booking.reason}
                                </span>
                                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
                                  <Clock className="h-3.5 w-3.5 opacity-70" />
                                  <span>
                                    {format(new Date(booking.startTime), 'hh:mm a')} -{' '}
                                    {format(new Date(booking.endTime), 'hh:mm a')}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-border" />
                                  <span className="capitalize text-muted-foreground/80">
                                    {format(new Date(booking.startTime), "EEEE dd 'de' MMM", {
                                      locale: es,
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end shrink-0 sm:pl-0 pl-14 items-center">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-[10px] uppercase tracking-card font-bold px-2 py-0 h-5 border-0 shadow-none',
                                  booking.status === 'APROBADO' &&
                                    'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
                                  booking.status === 'RECHAZADO' &&
                                    'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
                                  booking.status === 'PENDIENTE' &&
                                    'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                                )}
                              >
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-start gap-3 rounded-md border border-border bg-muted/20 px-4 py-3 text-xs">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">Información importante</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Las solicitudes deben realizarse con al menos 24 horas de antelación. La
                    aprobación depende de la disponibilidad y el cumplimiento de las normas
                    institucionales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Nueva Solicitud de Reserva</DialogTitle>
            <DialogDescription className="text-xs">
              Completa los detalles para reservar {getSelectedRoomName()}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 pt-2">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs font-medium text-muted-foreground">
                  Hora de inicio
                </Label>
                <DateTimePicker
                  value={bookingForm.startTime}
                  onChange={date =>
                    setBookingForm({ ...bookingForm, startTime: date ?? new Date() })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-xs font-medium text-muted-foreground">
                  Hora de finalización
                </Label>
                <DateTimePicker
                  value={bookingForm.endTime}
                  onChange={date => setBookingForm({ ...bookingForm, endTime: date ?? new Date() })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-medium text-muted-foreground">
                Motivo de la actividad
              </Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Ej: Clase extra de Cálculo Diferencial, Reunión de Semillero…"
                value={bookingForm.reason}
                onChange={e => setBookingForm({ ...bookingForm, reason: e.target.value })}
                className="min-h-[80px] text-xs resize-none"
              />
            </div>

            <SignaturePad
              onSave={data => setBookingForm({ ...bookingForm, signature: data })}
              onClear={() => setBookingForm({ ...bookingForm, signature: '' })}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsBookingModalOpen(false)}
              className="rounded-full text-xs"
            >
              Cancelar
            </Button>
            <Button onClick={handleBookingSubmit} className="rounded-full text-xs gap-2">
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

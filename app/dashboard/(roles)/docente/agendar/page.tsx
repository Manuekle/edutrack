'use client';

import { SignaturePad } from '@/components/rooms/signature-pad';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DocenteAgendarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bookingForm, setBookingForm] = useState({
    startTime: format(startOfHour(new Date()), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addHours(startOfHour(new Date()), 1), "yyyy-MM-dd'T'HH:mm"),
    reason: '',
    signature: '',
  });

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/admin/rooms');
      const data = await response.json();
      if (response.ok) {
        setRooms(data);
        if (data.length > 0) setSelectedRoom(data[0].id);
      }
    } catch (error) {
      toast.error('Error al cargar salas');
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
      toast.error('Por favor completa todos los campos y firma la solicitud');
      return;
    }

    try {
      const response = await fetch('/api/rooms/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom,
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          reason: bookingForm.reason,
          signatureData: bookingForm.signature,
        }),
      });

      if (response.ok) {
        toast.success('Solicitud enviada exitosamente');
        setIsBookingModalOpen(false);
        setBookingForm({ ...bookingForm, reason: '', signature: '' });
        if (selectedRoom) fetchRoomBookings(selectedRoom);
      } else {
        const err = await response.json();
        toast.error(err.error || 'Error al agendar');
      }
    } catch (error) {
      toast.error('Error de red');
    }
  };

  const getSelectedRoomName = () => {
    return rooms.find(r => r.id === selectedRoom)?.name || 'Selecciona una sala';
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-card">Agendar Sala</h1>
          <p className="text-muted-foreground text-xs">Reserva espacios físicos para tus actividades académicas</p>
        </div>
        <Button onClick={() => setIsBookingModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Rooms List */}
        <div className="space-y-4">
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-xs font-semibold uppercase tracking-card text-muted-foreground">Salas e Instalaciones</CardTitle>
              <CardDescription className="text-xs">Selecciona para ver disponibilidad</CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="flex flex-col gap-1">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                      selectedRoom === room.id
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg bg-background/10",
                      selectedRoom === room.id ? "text-primary-foreground" : "text-primary bg-primary/10"
                    )}>
                      <RoomIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{room.name}</p>
                      <div className="flex items-center gap-2 text-xs opacity-80">
                        <Users className="h-3 w-3" />
                        <span>{room.capacity || '—'} cap.</span>
                      </div>
                    </div>
                    {selectedRoom === room.id && <ArrowRight className="h-4 w-4 opacity-50" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Availability Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/5 border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">{getSelectedRoomName()}</CardTitle>
                  <CardDescription className="text-xs">Cronograma de uso y disponibilidad</CardDescription>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200">
                  Activa
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs uppercase font-semibold text-muted-foreground/60 px-6">Horario</TableHead>
                    <TableHead className="text-xs uppercase font-semibold text-muted-foreground/60 px-4">Motivo / Clase</TableHead>
                    <TableHead className="text-xs uppercase font-semibold text-muted-foreground/60 px-6 text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <CalendarIcon className="h-10 w-10 text-muted-foreground/20" />
                          <p className="text-muted-foreground text-xs font-medium">No hay ocupación programada</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    roomBookings.map((booking) => (
                      <TableRow key={booking.id} className="text-xs font-medium border-b border-muted/30 last:border-0">
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-foreground font-semibold">
                              <Clock className="h-3 w-3 text-primary/50" />
                              {format(new Date(booking.startTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                            </div>
                            <span className="text-xs text-muted-foreground capitalize">
                              {format(new Date(booking.startTime), "EEEE dd 'de' MMMM", { locale: es })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span className="italic text-muted-foreground group-hover:text-foreground">"{booking.reason}"</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-semibold px-2 py-0.5",
                              booking.status === 'APROBADO' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                                booking.status === 'RECHAZADO' ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" :
                                  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            )}
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-none shadow-none">
            <CardContent className="p-4 flex gap-3 text-xs">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-primary">Información Importante</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Las solicitudes deben realizarse con al menos 24 horas de antelación. La aprobación depende de la disponibilidad y el cumplimiento de las normas institucionales.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Form Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Reserva</DialogTitle>
            <DialogDescription>Completa los detalles para reservar {getSelectedRoomName()}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs">Hora de Inicio</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  className="bg-muted/30 focus-visible:ring-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-xs">Hora de Finalización</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={bookingForm.endTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                  className="bg-muted/30 focus-visible:ring-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs">Motivo de la Actividad</Label>
              <Textarea
                id="reason"
                placeholder="Ej: Clase extra de Cálculo Diferencial, Reunión de Semillero..."
                value={bookingForm.reason}
                onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                className="bg-muted/30 focus-visible:ring-1 min-h-[80px]"
              />
            </div>

            <SignaturePad
              onSave={(data) => setBookingForm({ ...bookingForm, signature: data })}
              onClear={() => setBookingForm({ ...bookingForm, signature: '' })}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button variant="ghost" onClick={() => setIsBookingModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleBookingSubmit} className="flex-[2] bg-primary shadow-lg shadow-primary/20">
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

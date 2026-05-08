'use client';

import { QRViewer } from '@/components/qr-viewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Check,
  Clock,
  History,
  Info,
  QrCode,
  RefreshCw,
  Save,
  Search,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sileo } from 'sileo';

// --- Types ---

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';

interface StudentAttendance {
  studentId: string;
  name: string;
  email: string;
  status: AttendanceStatus;
}

interface ClassInfo {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  status: string;
}

const AttendanceStatusMap = {
  PRESENT: {
    label: 'Presente',
    icon: UserCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  ABSENT: {
    label: 'Inasistencia',
    icon: UserMinus,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
  },
  LATE: {
    label: 'Retraso',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
  JUSTIFIED: {
    label: 'Justificado',
    icon: History,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
};

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const classId = params?.classId as string;
  const groupId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrData, setQrData] = useState<{
    qrUrl: string;
    qrToken: string;
    expiresAt: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const toLocalTime = (dateInput: string | Date | null | undefined): Date | null => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  };

  const fetchData = useCallback(async () => {
    if (!classId) return;

    try {
      const [classRes, attendanceRes] = await Promise.all([
        fetch(`/api/docente/clases/${classId}`),
        fetch(`/api/docente/clases/${classId}/asistencia`),
      ]);

      if (!classRes.ok) throw new Error('No se pudieron cargar los detalles de la clase.');
      const classResponse = await classRes.json();
      const classData: ClassInfo = classResponse.data;
      setClassInfo(classData);

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setStudents(attendanceData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      sileo.error({ title: 'Error', description: 'No se pudo cargar la información de la clase.' });
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => (s.studentId === studentId ? { ...s, status } : s)));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'PRESENT' })));
    sileo.success({ title: 'Todos marcados como presente' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/docente/clases/${classId}/asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendances: students }),
      });

      if (!res.ok) throw new Error('Error al guardar la asistencia');
      sileo.success({ title: 'Asistencia guardada correctamente' });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    } catch (error) {
      sileo.error({ title: 'Error', description: 'No se pudo guardar la asistencia.' });
    } finally {
      setIsSaving(false);
    }
  };
  const handleQRAction = async (force: boolean = false) => {
    if (qrData && !force) {
      setIsQRModalOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch(`/api/docente/clases/${classId}/generar-qr`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQrData(data.data);
      setIsQRModalOpen(true);
      if (force) {
        sileo.success({ title: 'Código QR Renovado' });
      } else {
        sileo.success({ title: 'QR Generado' });
      }
    } catch (error) {
      sileo.error({ title: 'Error', description: 'No se pudo generar el código QR.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(
      s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    const total = students.length;
    return {
      total,
      present: students.filter(s => s.status === 'PRESENT').length,
      absent: students.filter(s => s.status === 'ABSENT').length,
      late: students.filter(s => s.status === 'LATE').length,
      justified: students.filter(s => s.status === 'JUSTIFIED').length,
    };
  }, [students]);

  const now = new Date();
  const classStartDate = classInfo
    ? toLocalTime(classInfo.startTime) || toLocalTime(classInfo.date)
    : null;
  const classEndDate = classInfo
    ? toLocalTime(classInfo.endTime) ||
    (classStartDate ? new Date(classStartDate.getTime() + 2 * 60 * 60 * 1000) : null)
    : null;

  const bufferMs = 10 * 60 * 1000;
  const isTooEarly = classStartDate ? now < new Date(classStartDate.getTime() - bufferMs) : false;
  const isPast = classEndDate ? now > new Date(classEndDate.getTime() + bufferMs) : false;
  const isCompleted = classInfo?.status === 'SIGNED' || classInfo?.status === 'CANCELADA';

  // Redirigir automáticamente cuando llegue la hora fin de clase
  useEffect(() => {
    if (!classEndDate || !groupId) return;
    const msUntilEnd = new Date(classEndDate.getTime() + bufferMs).getTime() - Date.now();
    if (msUntilEnd <= 0) return; // ya está manejado por isPast
    const timer = setTimeout(() => {
      sileo.info({ title: 'La clase ha finalizado', description: 'Redirigiendo al grupo...' });
      router.push(`/dashboard/docente/grupos/${groupId}`);
    }, msUntilEnd);
    return () => clearTimeout(timer);
  }, [classEndDate, groupId, router]);

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl bg-muted/30 p-4 space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-8 w-12 rounded-lg" />
          </div>
        ))}
      </div>
      {/* Student list skeleton */}
      <div className="rounded-2xl bg-muted/20 overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/20">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-8 w-8 rounded-lg" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isTooEarly || isPast || isCompleted) {
    const message = isTooEarly
      ? `La clase aún no comienza. Registro habilitado a las ${new Date(classStartDate!.getTime() - bufferMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      : isPast
        ? 'La clase ya finalizó.'
        : 'La clase ya ha sido marcada como completada o cancelada.';

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <Alert variant="destructive" className="max-w-md rounded-2xl border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No disponible</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push(`/dashboard/docente/grupos/${groupId}`)}
          variant="outline"
          className="mt-6 rounded-xl"
        >
          Volver al grupo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* --- Header --- */}
      <div className="pb-5 w-full flex flex-col gap-3 border-b border-border/30">
        <div className="flex sm:flex-row flex-col sm:items-center items-start gap-4 justify-between">
          <div>
            <h1 className="sm:text-2xl text-xl font-semibold tracking-card text-foreground">
              {classInfo?.subject.name}
            </h1>
            <CardDescription className="text-xs">
              {classInfo?.subject.code} · {classStartDate?.toLocaleDateString()} ·{' '}
              {classStartDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{' '}
              {classEndDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </CardDescription>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Button
              onClick={() => handleQRAction(false)}
              disabled={isGenerating}
              variant="outline"
              className="w-full sm:w-auto h-10 gap-2 text-xs font-medium"
            >
              <QrCode className="h-4 w-4" />
              {qrData ? 'Ver QR' : 'Generar QR'}
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto h-10 px-5 text-xs font-semibold gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>

      {/* --- QR Dialog --- */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-lg font-sans">
          <DialogHeader>
            <DialogTitle className="tracking-card sm:text-2xl text-xs font-semibold">
              Asistencia QR
            </DialogTitle>
            <DialogDescription className="text-xs">
              Muestra este código a los estudiantes para que registren su asistencia. El código se
              actualiza periódicamente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center justify-center">
            {qrData ? (
              <QRViewer
                qrUrl={qrData.qrUrl}
                qrToken={qrData.qrToken}
                expiresAt={qrData.expiresAt}
                onRefresh={() => handleQRAction(true)}
                onClose={() => setIsQRModalOpen(false)}
                isRefreshing={isGenerating}
              />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
                <RefreshCw className="h-8 w-8 animate-spin opacity-20 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Generando código...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Main Content --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estudiante..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Button
              onClick={markAllPresent}
              variant="outline"
              className="w-full sm:w-auto h-10 gap-2 text-xs font-medium px-5 whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              Todos presentes
            </Button>
          </div>

          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-xs">
            <div className="divide-y divide-border/30">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const statusInfo = AttendanceStatusMap[student.status];
                  return (
                    <div
                      key={student.studentId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-5 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold text-xs">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {student.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {student.email}
                          </span>
                        </div>
                      </div>

                      <Select
                        value={student.status}
                        onValueChange={val =>
                          handleStatusChange(student.studentId, val as AttendanceStatus)
                        }
                      >
                        <SelectTrigger
                          className={`w-[130px] h-8 rounded-full border-0 transition-colors font-medium text-xs ${statusInfo.bg} ${statusInfo.color}`}
                        >
                          <div className="flex items-center gap-2">
                            <statusInfo.icon className="h-3.5 w-3.5" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(AttendanceStatusMap).map(([key, info]) => (
                            <SelectItem key={key} value={key} className="py-2 cursor-pointer text-xs">
                              <div className="flex items-center gap-2">
                                <info.icon className="h-3.5 w-3.5" />
                                <span>{info.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="h-12 w-12 bg-muted/40 rounded-2xl flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-sm font-semibold">No se encontraron estudiantes</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    {searchQuery
                      ? `No hay resultados para "${searchQuery}"`
                      : 'No hay estudiantes matriculados en esta clase.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-4">
          <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-semibold mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <History className="h-3.5 w-3.5 text-primary" />
              Resumen de asistencia
            </h4>

            <div className="space-y-3">
              {[
                {
                  label: 'Presentes',
                  val: stats.present,
                  color: 'text-emerald-600 dark:text-emerald-400',
                  icon: UserCheck,
                  bg: 'bg-emerald-500/10',
                },
                {
                  label: 'Ausentes',
                  val: stats.absent,
                  color: 'text-rose-600 dark:text-rose-400',
                  icon: UserMinus,
                  bg: 'bg-rose-500/10',
                },
                {
                  label: 'Retrasos',
                  val: stats.late,
                  color: 'text-amber-600 dark:text-amber-400',
                  icon: Clock,
                  bg: 'bg-amber-500/10',
                },
                {
                  label: 'Justificados',
                  val: stats.justified,
                  color: 'text-primary',
                  icon: History,
                  bg: 'bg-primary/10',
                },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                    </div>
                    <span className="text-xs font-medium">{s.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
                </div>
              ))}

              <div className="pt-3 mt-3 border-t border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total
                  </span>
                  <span className="text-sm font-bold">{stats.total}</span>
                </div>
                <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${stats.total ? (stats.present / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
                  {stats.total ? Math.round((stats.present / stats.total) * 100) : 0}% asistencia
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/20 rounded-2xl p-4">
            <h4 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
              Recordatorio
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Los cambios no se guardan hasta que pulses <strong>Guardar</strong> arriba.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

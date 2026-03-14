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
import { LoadingPage } from '@/components/ui/loading';
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
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    darkBg: 'dark:bg-green-500/10',
  },
  ABSENT: {
    label: 'Inasistencia',
    icon: UserMinus,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    darkBg: 'dark:bg-red-500/10',
  },
  LATE: {
    label: 'Retraso',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    darkBg: 'dark:bg-amber-500/10',
  },
  JUSTIFIED: {
    label: 'Justificado',
    icon: History,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    darkBg: 'dark:bg-blue-500/10',
  },
};

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
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

  if (isLoading) return <LoadingPage />;

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
    <div className="space-y-6">
      {/* --- Header --- */}
      <div className="pb-6 w-full flex flex-col gap-3 border-b">
        <div className="flex sm:flex-row flex-col sm:items-center items-start gap-4 justify-between">
          <div>
            <h1 className="sm:text-2xl text-xl font-semibold tracking-card text-foreground">
              {classInfo?.subject.name}
            </h1>
            <CardDescription className="text-xs dark:text-gray-300">
              {classInfo?.subject.code} • {classStartDate?.toLocaleDateString()} •{' '}
              {classStartDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
              {classEndDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </CardDescription>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <Button
              onClick={() => handleQRAction(false)}
              disabled={isGenerating}
              variant="outline"
              className={`w-full sm:w-auto rounded-xl h-10 border-transparent transition-all text-sm font-medium gap-2 ${
                qrData
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-muted/40 hover:bg-muted/60'
              }`}
            >
              <QrCode className="h-4 w-4" />
              {qrData ? 'Ver código QR' : 'Generar código QR'}
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20 h-10 px-6 text-sm font-semibold transition-all gap-2 bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estudiante..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20"
              />
            </div>
            <Button
              onClick={markAllPresent}
              variant="outline"
              className="w-full sm:w-auto h-11 rounded-xl gap-2 font-medium border-primary/20 text-primary hover:bg-primary/5 px-6 whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              Todos presentes
            </Button>
          </div>

          <div className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl overflow-hidden shadow-sm p-1 border">
            <div className="divide-y divide-border/40">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const statusInfo = AttendanceStatusMap[student.status];
                  return (
                    <div
                      key={student.studentId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-6 hover:bg-muted/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {student.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {student.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Select
                          value={student.status}
                          onValueChange={val =>
                            handleStatusChange(student.studentId, val as AttendanceStatus)
                          }
                        >
                          <SelectTrigger
                            className={`w-[140px] h-9 rounded-xl border-transparent transition-all font-medium text-xs ${statusInfo.bg} ${statusInfo.color} ${statusInfo.darkBg}`}
                          >
                            <div className="flex items-center gap-2">
                              <statusInfo.icon className="h-3.5 w-3.5" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/40 shadow-xl overflow-hidden">
                            {Object.entries(AttendanceStatusMap).map(([key, info]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="py-2.5 cursor-pointer focus:bg-muted font-medium"
                              >
                                <div className="flex items-center gap-2">
                                  <span>{info.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-semibold">No se encontraron estudiantes</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mt-1">
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
        <div className="space-y-6">
          <div className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl p-6 shadow-sm border">
            <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Resumen de Asistencia
            </h4>

            <div className="space-y-4">
              {[
                {
                  label: 'Presentes',
                  val: stats.present,
                  color: 'text-green-600',
                  icon: UserCheck,
                  bg: 'bg-green-100 dark:bg-green-500/10',
                },
                {
                  label: 'Ausentes',
                  val: stats.absent,
                  color: 'text-red-600',
                  icon: UserMinus,
                  bg: 'bg-red-100 dark:bg-red-500/10',
                },
                {
                  label: 'Retrasos',
                  val: stats.late,
                  color: 'text-amber-600',
                  icon: Clock,
                  bg: 'bg-amber-100 dark:bg-amber-500/10',
                },
                {
                  label: 'Justificados',
                  val: stats.justified,
                  color: 'text-blue-600',
                  icon: History,
                  bg: 'bg-blue-100 dark:bg-blue-500/10',
                },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full ${s.bg} flex items-center justify-center`}
                    >
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-border/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-card text-muted-foreground">
                    Total Estudiantes
                  </span>
                  <span className="text-sm font-black">{stats.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${stats.total ? (stats.present / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Recordatorio
            </h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Los cambios no se guardan permanentemente hasta que hagas clic en el botón{' '}
              <strong>Guardar Cambios</strong> en la parte superior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

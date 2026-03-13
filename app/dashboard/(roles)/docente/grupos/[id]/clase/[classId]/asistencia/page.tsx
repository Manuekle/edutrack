'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, QrCode } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { sileo } from 'sileo';

const QRViewer = dynamic(
  () => import('@/components/qr-viewer').then(mod => ({ default: mod.QRViewer })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="h-64 w-64 rounded-lg" />
      </div>
    ),
    ssr: false,
  }
);

// Define los estados de asistencia como un mapa para la UI
const AttendanceStatusMap = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  TARDANZA: 'Tardanza',
  JUSTIFICADO: 'Justificado',
} as const;

// Tipos derivados del mapa
type AttendanceStatusKey = keyof typeof AttendanceStatusMap;

// Define el tipo para los datos que esperamos de la API
type StudentAttendance = {
  studentId: string;
  name: string;
  email: string;
  status: AttendanceStatusKey; // La API devuelve la clave en mayúsculas
};

type ClassInfo = {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  topic: string;
  status: 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA';
  subject: {
    name: string;
  };
};

export default function AttendancePage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const classId = params.classId as string;

  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClassPast, setIsClassPast] = useState(false);
  const [isClassTooEarly, setIsClassTooEarly] = useState(false);
  const [isClassCompleted, setIsClassCompleted] = useState(false);

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [qrData, setQrData] = useState<{
    qrUrl: string;
    qrToken: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  // Helper function to create a date in the local timezone
  const createLocalDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // Create a new date with the same local date/time values
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    );
  };

  const fetchData = useCallback(async () => {
    if (!classId) return;

    if (!qrData) setIsLoading(true);
    try {
      const [classRes, attendanceRes] = await Promise.all([
        fetch(`/api/docente/clases/${classId}`),
        fetch(`/api/docente/clases/${classId}/asistencia`),
      ]);

      if (!classRes.ok) throw new Error('No se pudieron cargar los detalles de la clase.');
      const classResponse = await classRes.json();
      const classData: ClassInfo = classResponse.data;
      setClassInfo(classData);

      const now = new Date();
      const classStartDate = classData.startTime
        ? createLocalDate(classData.startTime)
        : createLocalDate(classData.date);

      let classEndDate: Date | null = null;
      if (classData.endTime) {
        classEndDate = createLocalDate(classData.endTime);
      } else if (classStartDate) {
        // Add 2 hours to the start time if no end time is provided
        classEndDate = new Date(classStartDate.getTime() + 2 * 60 * 60 * 1000);
      }

      // Add a 10-minute buffer before and after class
      const bufferMinutes = 10;
      const bufferMs = bufferMinutes * 60 * 1000;

      const isTooEarly = classStartDate
        ? now < new Date(classStartDate.getTime() - bufferMs)
        : false;
      const isPast = classEndDate ? now > new Date(classEndDate.getTime() + bufferMs) : false;
      const isCompleted = classData.status === 'REALIZADA' || classData.status === 'CANCELADA';

      setIsClassPast(isPast);
      setIsClassTooEarly(isTooEarly);
      setIsClassCompleted(isCompleted);

      // Redirigir si la clase no está en un estado válido para tomar asistencia
      if (isTooEarly || isCompleted || isPast) {
        let errorMessage = 'No se puede tomar asistencia en este momento.';

        if (isTooEarly && classStartDate) {
          const startTime = classStartDate
            .toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
            .replace(/^0/, ''); // Elimina el cero inicial si existe
          errorMessage = `La clase comenzará a las ${startTime}. Por favor, intente más tarde.`;
        } else if (isPast && classEndDate) {
          const endTime = classEndDate
            .toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
            .replace(/^0/, ''); // Elimina el cero inicial si existe
          errorMessage = `La clase finalizó a las ${endTime}.`;
        } else if (isCompleted) {
          errorMessage = 'Esta clase ya ha sido marcada como completada o cancelada.';
        }

        router.replace(
          `/dashboard/docente/grupos/${subjectId}?asistenciaError=${encodeURIComponent(errorMessage)}`
        );
        return;
      }

      if (!attendanceRes.ok) throw new Error('No se pudo cargar la lista de asistencia.');
      const attendanceResponse = await attendanceRes.json();
      setStudents(attendanceResponse.data); // Corregido: usar response.data
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al cargar los datos de la clase';
      sileo.error({ title: errorMessage });
      setIsRedirecting(true);
      router.replace(`/dashboard/docente/grupos/${subjectId}`);
      return;
    } finally {
      setIsLoading(false);
    }
  }, [classId, subjectId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (expiresIn === null) return;

    if (expiresIn <= 0) {
      setQrData(null);
      setExpiresIn(null);
      sileo.info({ title: 'El código QR ha expirado.' });
      fetchData();
      return;
    }

    const timer = setInterval(() => {
      setExpiresIn(prev => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresIn, fetchData]);

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatusKey) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.studentId === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/docente/clases/${classId}/asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendances: students.map(({ studentId, status }) => ({
            studentId,
            status,
          })),
        }),
      });

      if (!response.ok) throw new Error('Error al guardar la asistencia.');

      sileo.success({ title: 'Asistencia guardada con éxito.' });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar la asistencia';
      sileo.error({ title: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateQr = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/docente/clases/${classId}/generar-qr`, {
        method: 'POST',
      });
      const responseData = await response.json();

      if (!response.ok) throw new Error(responseData.message || 'Error al generar el código QR.');

      setQrData(responseData.data); // Corregido: usar response.data
      setExpiresIn(300); // 5 minutos en segundos
      sileo.success({ title: 'Código QR generado. Los estudiantes ya pueden escanear.' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al generar el código QR';
      sileo.error({ title: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || isRedirecting) {
    return <LoadingPage />;
  }

  // Clase no empezada / ya finalizada: se redirige en fetchData; mostramos loading hasta que navegue
  if (isClassTooEarly || isClassCompleted || isClassPast) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-xl sm:text-2xl font-semibold tracking-card text-foreground">
            Toma de Asistencia
          </CardTitle>
          {classInfo && (
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {classInfo.subject.name} -{' '}
              {new Date(classInfo.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              <br />
              Tema: {classInfo.topic}
            </CardDescription>
          )}
        </div>
        {isClassPast && (
          <Badge variant="outline" className="text-xs font-normal">
            Realizada
          </Badge>
        )}
      </div>

      <div className="pt-4">
        {qrData && expiresIn !== null ? (
          <QRViewer
            qrUrl={qrData.qrUrl}
            qrToken={qrData.qrToken}
            expiresIn={expiresIn}
            onRefresh={handleGenerateQr}
            onClose={() => {
              setQrData(null);
              setExpiresIn(null);
              fetchData();
            }}
            isRefreshing={isGenerating}
          />
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <Button
                variant="default"
                onClick={handleGenerateQr}
                disabled={isGenerating || isClassPast}
                size="sm"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                Generar QR
              </Button>
            </div>

            <div className="space-y-4">
              {students.map(student => (
                <div
                  key={student.studentId}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-border rounded-lg bg-card gap-4 md:gap-2"
                >
                  <div className="w-full md:w-auto">
                    <p className="font-semibold tracking-card text-xs">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate md:overflow-visible md:whitespace-normal md:max-w-full max-w-[220px]">
                      {student.email}
                    </p>
                  </div>
                  <Select
                    value={student.status}
                    onValueChange={(value: AttendanceStatusKey) =>
                      handleStatusChange(student.studentId, value)
                    }
                    disabled={isClassPast}
                    name={`status-${student.studentId}`}
                  >
                    <SelectTrigger className="w-full md:w-44">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AttendanceStatusMap).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="font-sans text-xs font-normal">
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="default"
                onClick={handleSaveChanges}
                disabled={isSaving || isClassPast}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { ClassesTable } from '@/components/tables/classes-table';
import { EventsTable } from '@/components/tables/events-table';
import { StudentsTable } from '@/components/tables/students-table';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingPage } from '@/components/ui/loading';
import { ClassStatus as PrismaClassStatus } from '@prisma/client';

// Utility functions for date handling
const dateUtils = {
  // Crear una fecha local sin conversiones de timezone
  createLocalDate: (dateInput: string | Date): Date => {
    if (typeof dateInput === 'string') {
      // Si es una fecha ISO (YYYY-MM-DD), crear fecha local
      if (dateInput.includes('T')) {
        return new Date(dateInput);
      } else {
        // Para fechas en formato YYYY-MM-DD, crear fecha local
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
    }
    return new Date(dateInput);
  },

  // Formatear fecha para mostrar
  formatDisplayDate: (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Formatear hora para mostrar
  formatDisplayTime: (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${period}`;
  },

  // Obtener fecha de hoy sin hora
  getTodayWithoutTime: (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  },

  // Comparar solo fechas (sin hora)
  isSameDay: (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  },

  // Crear fecha combinando fecha y hora
  combineDateTime: (date: Date, timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  },

  // Formatear fecha para la API (YYYY-MM-DD)
  formatForAPI: (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
};

interface Student {
  id: string;
  name: string | null;
  correoInstitucional: string | null;
  correoPersonal: string | null;
  document?: string | null;
  telefono?: string | null;
}

type ClassStatus = PrismaClassStatus;

// Import the ClassWithStatus type from the table component
import type { ClassWithStatus as TableClassWithStatus } from '@/components/tables/classes-table';

// Local alias that extends the table type with Date support for form handling
type LocalClassWithStatus = Omit<
  TableClassWithStatus,
  'date' | 'startTime' | 'endTime' | 'topic' | 'description' | 'status' | 'cancellationReason'
> & {
  date: string | Date;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  topic?: string | null;
  description?: string | null;
  status: ClassStatus;
  cancellationReason?: string | null;
  [key: string]: unknown; // For any additional properties
};

// Utility function to convert LocalClassWithStatus to TableClassWithStatus
const toTableClass = (cls: LocalClassWithStatus): TableClassWithStatus => {
  return {
    ...cls,
    date: typeof cls.date === 'string' ? cls.date : dateUtils.formatForAPI(cls.date),
    startTime: cls.startTime
      ? typeof cls.startTime === 'string'
        ? cls.startTime
        : dateUtils.formatDisplayTime(cls.startTime)
      : undefined,
    endTime: cls.endTime
      ? typeof cls.endTime === 'string'
        ? cls.endTime
        : dateUtils.formatDisplayTime(cls.endTime)
      : undefined,
    topic: cls.topic || undefined,
    description: cls.description || undefined,
    status: cls.status as string, // Safe cast since we know it's a valid status
    cancellationReason: cls.cancellationReason || undefined,
  };
};

// Utility function to convert TableClassWithStatus to LocalClassWithStatus
const toLocalClass = (cls: TableClassWithStatus): LocalClassWithStatus => {
  return {
    ...cls,
    date: cls.date,
    startTime: cls.startTime || null,
    endTime: cls.endTime || null,
    topic: cls.topic || null,
    description: cls.description || null,
    status: cls.status as ClassStatus, // Safe cast since we know it's a valid status
    cancellationReason: cls.cancellationReason || null,
  };
};

const classStatusMap = {
  PROGRAMADA: {
    label: 'Programada',
    color: 'text-xs font-normal',
  },
  EN_CURSO: {
    label: 'En curso',
    color: 'text-xs font-normal text-blue-600 dark:text-blue-400',
  },
  REALIZADA: {
    label: 'Realizada',
    color: 'text-xs font-normal text-green-600 dark:text-green-400',
  },
  FINALIZADA: {
    label: 'Finalizada',
    color: 'text-xs font-normal text-gray-600 dark:text-gray-400',
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'text-xs font-normal text-amber-600 dark:text-amber-400',
  },
} as const;

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<void>;
  subjectName: string;
  isLoading: boolean;
}

const GenerateReportModal = ({
  isOpen,
  onClose,
  onGenerate,
  subjectName,
  isLoading,
}: GenerateReportModalProps) => {
  const { data: session } = useSession();
  const hasSignature = !!session?.user?.signatureUrl;
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-heading">
            Generar Bitacora Docente
          </DialogTitle>
          <DialogDescription>
            Se generará un reporte de asistencia para la asignatura:
          </DialogDescription>
          <div className="mt-2 p-4 border rounded-md">
            <p className="font-normal text-xs">{subjectName}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              El reporte se generará en formato PDF y se descargará automáticamente. También
              recibirás un correo con el enlace de descarga.
            </p>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={onGenerate}
            disabled={isLoading || !hasSignature}
            title={!hasSignature ? 'Debes tener una firma registrada para generar reportes' : ''}
          >
            {isLoading ? (
              <>Generando...</>
            ) : !hasSignature ? (
              <div className="flex items-center gap-2">Firma requerida</div>
            ) : (
              'Generar Reporte'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface Subject {
  id: string;
  name: string;
  code: string;
  // Add other subject properties as needed
}

export default function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  // Subject state
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLoadingSubject, setIsLoadingSubject] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Class management state
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<TableClassWithStatus | null>(null);
  const [classDate, setClassDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [classTopic, setClassTopic] = useState('');
  const [classDescription, setClassDescription] = useState('');

  const [isStartTimePickerOpen, setIsStartTimePickerOpen] = useState(false);
  const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Classes state
  const [classes, setClasses] = useState<LocalClassWithStatus[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [hasScheduledClasses, setHasScheduledClasses] = useState(false);
  const [reportExistsForCurrentPeriod, setReportExistsForCurrentPeriod] = useState(false);

  // Format classes for the table
  const tableClasses = classes.map(cls => toTableClass(cls));

  // Handlers para ClassesTable
  const handleEditClass = (tableClass: TableClassWithStatus) => {
    // Set the current class in the table format
    setCurrentClass(tableClass);

    // Convert the table class to local class for form handling
    const localClass = toLocalClass(tableClass);

    // Convert the date to a Date object for the form
    const classDate = dateUtils.createLocalDate(localClass.date as string);
    setClassDate(classDate);

    // Format times for the form
    const formatTime = (time: string | Date | null | undefined): string => {
      if (!time) return '';
      return typeof time === 'string' ? time : dateUtils.formatDisplayTime(time);
    };

    setStartTime(formatTime(localClass.startTime));
    setEndTime(formatTime(localClass.endTime));
    setClassTopic(localClass.topic || '');
    setClassDescription(localClass.description || '');
    setIsEditClassDialogOpen(true);
  };

  const handleCancelClass = (cls: TableClassWithStatus) => {
    setClassToCancel(toLocalClass(cls));
    setCancelReason('');
  };

  const handleMarkClassAsDone = (classId: string) => {
    handleUpdateClassStatus(classId, 'REALIZADA');
  };

  // Other UI state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateReport = useCallback(async () => {
    if (!subject) return;

    if (hasScheduledClasses) {
      toast.error('No se puede generar el reporte porque hay clases programadas pendientes');
      return;
    }

    if (reportExistsForCurrentPeriod) {
      toast.error('Este reporte ya ha sido generado para el período actual');
      setIsReportModalOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/docente/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: subject.id,
          format: 'PDF',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al generar el reporte');
      }

      toast.success('El reporte se está generando. Recibirás un correo cuando esté listo.');
      setIsReportModalOpen(false);
      setReportExistsForCurrentPeriod(true);
      router.push('/dashboard/docente/reportes');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al generar el reporte');
    } finally {
      setIsSubmitting(false);
    }
  }, [subject, router, hasScheduledClasses, reportExistsForCurrentPeriod]);

  // --- STATE MANAGEMENT ---

  // State for Students & Attendance
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [unenrollReason, setUnenrollReason] = useState('');

  const [currentStudentForUnenroll, setCurrentStudentForUnenroll] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [classToCancel, setClassToCancel] = useState<LocalClassWithStatus | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Student data without pagination

  // --- HANDLERS ---
  const handleUpdateClassStatus = async (classId: string, status: ClassStatus, reason?: string) => {
    const originalClasses = [...classes];

    // Optimistic update
    setClasses(prev => prev.map(c => (c.id === classId ? { ...c, status } : c)));

    try {
      const response = await fetch(`/api/docente/clases/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo actualizar el estado de la clase.');
      }

      const responseData = await response.json();
      const updatedClass = responseData.data;

      // Final update with server data
      setClasses(prev => prev.map(c => (c.id === classId ? updatedClass : c)));
      toast.success(`La clase ha sido marcada como ${status.toLowerCase()}.`);
      // Refresh the current page to ensure data is in sync
      fetchClasses();
    } catch (error) {
      // Revert on error
      setClasses(originalClasses);
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
    }
  };

  // --- DATA FETCHING ---
  // Function to check if a report exists for the current period
  const checkReportExistsForPeriod = useCallback(
    async (period: number) => {
      if (!subjectId) return false;

      try {
        const response = await fetch(
          `/api/docente/reportes?subjectId=${subjectId}&period=${period}`
        );
        if (!response.ok) {
          throw new Error('Error al verificar reportes existentes');
        }
        const { exists } = await response.json();
        return exists;
      } catch (error) {
        console.error('Error checking report existence:', error);
        return false;
      }
    },
    [subjectId]
  );

  // Function to determine the current period (1 or 2) based on current date
  const getCurrentPeriod = useCallback(() => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return currentMonth <= 6 ? 1 : 2; // Jan-Jun: Period 1, Jul-Dec: Period 2
  }, []);

  // Fetch all classes without pagination
  const fetchClasses = useCallback(async () => {
    if (!subjectId) {
      setError('ID de asignatura no válido');
      return;
    }

    try {
      setIsLoadingClasses(true);
      setError(null);

      const response = await fetch(
        `/api/docente/clases?subjectId=${subjectId}&sortBy=date&sortOrder=desc`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Error al cargar las clases';
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result || !result.data || !Array.isArray(result.data)) {
        throw new Error('Formato de respuesta inválido al cargar las clases');
      }

      // Check if any class is in PROGRAMADA status
      const hasScheduled = result.data.some(
        (cls: LocalClassWithStatus) => cls.status === 'PROGRAMADA'
      );
      setHasScheduledClasses(hasScheduled);

      setClasses(result.data);

      // Check if a report already exists for the current period
      try {
        const currentPeriod = getCurrentPeriod();
        const reportExists = await checkReportExistsForPeriod(currentPeriod);
        setReportExistsForCurrentPeriod(reportExists);
      } catch (error) {
        console.error('Error checking report existence:', error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar las clases';
      setError(errorMessage);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [subjectId, checkReportExistsForPeriod, getCurrentPeriod]);

  // Fetch classes when mounted
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchSubject = useCallback(async () => {
    if (!subjectId) {
      const errorMsg = 'No se proporcionó un ID de asignatura';
      setError(errorMsg);
      setIsLoadingSubject(false);
      return;
    }

    try {
      setIsLoadingSubject(true);
      setError(null);

      const response = await fetch(`/api/docente/asignaturas/${subjectId}`, {
        credentials: 'include', // Incluir credenciales para autenticación
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Error al cargar los detalles de la asignatura';
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result || !result.data) {
        throw new Error('Formato de respuesta inválido al cargar la asignatura');
      }

      const { data } = result;

      // Set the subject with the correct property names from the API response
      setSubject({
        id: data.id,
        name: data.name || 'Asignatura sin nombre',
        code: data.code || 'N/A',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar la asignatura';
      setError(errorMessage);
      // Set a default subject if there's an error
      setSubject({
        id: subjectId,
        name: 'Asignatura',
        code: 'N/A',
      });
      toast.error(errorMessage); // Show toast here
    } finally {
      setIsLoadingSubject(false);
    }
  }, [subjectId]);

  const fetchEnrolledStudents = useCallback(async () => {
    if (!subjectId) {
      setError('No se proporcionó un ID de asignatura para cargar estudiantes');
      return;
    }

    setIsLoadingStudents(true);
    try {
      setError(null);

      const response = await fetch(`/api/docente/matriculas?subjectId=${subjectId}`, {
        credentials: 'include', // Incluir credenciales para autenticación
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'No se pudieron cargar los estudiantes';
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result && result.data) {
        setEnrolledStudents(Array.isArray(result.data) ? result.data : []);
      } else {
        // Si el formato no es el esperado, intentamos con el resultado directo
        setEnrolledStudents(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los estudiantes';
      setError(errorMessage);
      setEnrolledStudents([]); // Reset students on error
    } finally {
      setIsLoadingStudents(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (!subjectId) return;

    const loadingToast = toast.loading('Cargando datos de la asignatura...');

    const loadData = async () => {
      try {
        await Promise.all([fetchSubject(), fetchClasses(), fetchEnrolledStudents()]);
        toast.dismiss(loadingToast);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.dismiss(loadingToast);
      }
    };

    loadData();

    return () => {
      toast.dismiss(loadingToast);
    };
  }, [subjectId, fetchSubject, fetchClasses, fetchEnrolledStudents]);

  const handleUnenrollRequest = async (studentId: string, reason: string) => {
    if (!subjectId) return;

    try {
      const response = await fetch('/api/docente/solicitudes/desmatricula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId,
          studentId,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al enviar la solicitud de desmatriculación');
      }

      // Refresh the students list
      fetchEnrolledStudents();
      toast.success('Solicitud de desmatriculación enviada correctamente');
      setUnenrollReason('');
      setCurrentStudentForUnenroll(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al enviar la solicitud de desmatriculación'
      );
    }
  };

  // Loading state
  const isLoading = isLoadingSubject || isLoadingClasses || isLoadingStudents;

  // Show loading state
  if (isLoading) {
    return <LoadingPage />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="p-6 rounded-lg max-w-md w-full flex flex-col justify-center items-center bg-destructive border border-destructive">
          <h2 className="text-2xl text-white text-center font-semibold tracking-tight pb-2">
            No disponible
          </h2>
          <p className="text-white text-center mb-4 text-xs">{error}</p>
          <Button
            onClick={() => router.push('/dashboard/docente/asignaturas')}
            variant="default"
            className="w-full sm:w-auto"
          >
            Volver a la lista de asignaturas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Generation Modal */}
      <GenerateReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        subjectName={subject?.name || 'Cargando asignatura...'}
        isLoading={isSubmitting}
      />

      <div className="pb-4 w-full flex sm:flex-row flex-col items-start gap-4 justify-between">
        <div>
          <CardTitle className="text-2xl font-semibold tracking-heading">Mis Clases</CardTitle>
          <CardDescription className="text-xs">Gestiona tus clases y eventos.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsReportModalOpen(true)}
            disabled={hasScheduledClasses || reportExistsForCurrentPeriod}
            title={
              hasScheduledClasses
                ? 'No se puede generar el reporte porque hay clases programadas pendientes'
                : reportExistsForCurrentPeriod
                  ? 'Ya se ha generado un reporte para este período'
                  : 'Generar reporte de asistencia'
            }
          >
            {reportExistsForCurrentPeriod ? 'Reporte Generado' : 'Generar Reporte'}
          </Button>
          <Button
            variant="default"
            onClick={() => router.push(`/dashboard/docente/asignaturas/${subject?.id}/preview`)}
          >
            Vista Previa
          </Button>
        </div>
      </div>

      {/* SECCIÓN DE GESTIÓN DE ESTUDIANTES */}
      <StudentsTable
        students={enrolledStudents}
        isLoading={isLoadingStudents}
        currentStudentForUnenroll={currentStudentForUnenroll}
        unenrollReason={unenrollReason}
        setUnenrollReason={setUnenrollReason}
        setCurrentStudentForUnenroll={setCurrentStudentForUnenroll}
        handleUnenrollRequest={handleUnenrollRequest}
        isSubmitting={isSubmitting}
      />

      <ClassesTable
        classes={tableClasses}
        isLoading={isLoadingClasses}
        handleEdit={handleEditClass}
        handleCancel={handleCancelClass}
        handleMarkAsDone={handleMarkClassAsDone}
        classStatusMap={classStatusMap}
        dateUtils={dateUtils}
        // Dialog states
        isCancelDialogOpen={!!classToCancel}
        classToCancel={classToCancel ? toTableClass(classToCancel) : null}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        onCancelDialogOpenChange={open => {
          if (!open) setClassToCancel(null);
        }}
        onConfirmCancel={async () => {
          if (classToCancel) {
            await handleUpdateClassStatus(classToCancel.id, 'CANCELADA', cancelReason);
            setClassToCancel(null);
            setCancelReason('');
          }
        }}
        isEditDialogOpen={isEditClassDialogOpen}
        onEditDialogOpenChange={setIsEditClassDialogOpen}
        // Form states
        classDate={classDate || new Date()}
        setClassDate={setClassDate}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        classTopic={classTopic}
        setClassTopic={setClassTopic}
        classDescription={classDescription}
        setClassDescription={setClassDescription}
        isSubmitting={isSubmitting}
        // Date picker states
        isDatePickerOpen={isDatePickerOpen}
        setIsDatePickerOpen={setIsDatePickerOpen}
        isStartTimePickerOpen={isStartTimePickerOpen}
        setIsStartTimePickerOpen={setIsStartTimePickerOpen}
        isEndTimePickerOpen={isEndTimePickerOpen}
        setIsEndTimePickerOpen={setIsEndTimePickerOpen}
        // Form submission
        onSubmitEdit={async () => {
          if (!currentClass) return;

          try {
            setIsSubmitting(true);
            // Format the date and time for the API
            const formattedDate = classDate ? dateUtils.formatForAPI(classDate) : '';
            const formattedStartTime = startTime || '';
            const formattedEndTime = endTime || '';

            const response = await fetch(`/api/docente/clases/${currentClass.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: formattedDate,
                startTime: formattedStartTime,
                endTime: formattedEndTime,
                topic: classTopic,
                description: classDescription,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'No se pudo actualizar la clase.');
            }

            const updatedClass = await response.json();

            // Update the classes list
            setClasses(prev => prev.map(c => (c.id === updatedClass.id ? updatedClass : c)));

            toast.success('La clase ha sido actualizada correctamente.');
            setIsEditClassDialogOpen(false);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al actualizar la clase');
          } finally {
            setIsSubmitting(false);
          }
        }}
        resetEditForm={() => {
          setClassDate(new Date());
          setStartTime('');
          setEndTime('');
          setClassTopic('');
          setClassDescription('');
        }}
        formatClassDate={cls => {
          const date =
            typeof cls.date === 'string' ? dateUtils.createLocalDate(cls.date) : cls.date;
          return dateUtils.formatDisplayDate(date);
        }}
      />

      <EventsTable subjectId={subjectId} />
    </div>
  );
}

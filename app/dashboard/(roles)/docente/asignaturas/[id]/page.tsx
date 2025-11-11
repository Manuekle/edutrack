'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ClassesTable } from '@/components/classes/classes-table';
import { EventsTable } from '@/components/events/events-table';
import { StudentsTable } from '@/components/students/students-table';
import { GenerateReportModal } from '@/components/subjects/generate-report-modal';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { useClassManagement } from '@/hooks/use-class-management';
import { useSubjectData } from '@/hooks/use-subject-data';
import { toTableClass } from '@/lib/class-converters';
import { classStatusMap } from '@/lib/class-utils';
import * as dateUtils from '@/lib/time-utils';

export default function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  // Subject data hook
  const {
    subject,
    enrolledStudents,
    classes,
    setClasses,
    isLoadingSubject,
    isLoadingStudents,
    isLoadingClasses,
    hasScheduledClasses,
    reportExistsForCurrentPeriod,
    setReportExistsForCurrentPeriod,
    error,
    fetchClasses,
    fetchEnrolledStudents,
  } = useSubjectData(subjectId);

  // Class management hook
  const classManagement = useClassManagement({
    classes,
    setClasses,
    fetchClasses,
  });

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Student unenroll state
  const [currentStudentForUnenroll, setCurrentStudentForUnenroll] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [unenrollReason, setUnenrollReason] = useState('');
  const [isSubmittingUnenroll, setIsSubmittingUnenroll] = useState(false);

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

    setIsSubmittingReport(true);
    try {
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
      setIsSubmittingReport(false);
    }
  }, [
    subject,
    router,
    hasScheduledClasses,
    reportExistsForCurrentPeriod,
    setReportExistsForCurrentPeriod,
  ]);

  const handleUnenrollRequest = async (studentId: string, reason: string) => {
    if (!subjectId) return;

    setIsSubmittingUnenroll(true);
    try {
      const response = await fetch('/api/docente/solicitudes/desmatricula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, studentId, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al enviar la solicitud de desmatriculación');
      }

      fetchEnrolledStudents();
      toast.success('Solicitud de desmatriculación enviada correctamente');
      setUnenrollReason('');
      setCurrentStudentForUnenroll(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al enviar la solicitud de desmatriculación'
      );
    } finally {
      setIsSubmittingUnenroll(false);
    }
  };

  // Loading state
  const isLoading = isLoadingSubject || isLoadingClasses || isLoadingStudents;

  if (isLoading) {
    return <LoadingPage />;
  }

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

  const tableClasses = classes.map(cls => toTableClass(cls));

  return (
    <div className="space-y-6">
      <GenerateReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        subjectName={subject?.name || 'Cargando asignatura...'}
        isLoading={isSubmittingReport}
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

      <StudentsTable
        students={enrolledStudents}
        isLoading={isLoadingStudents}
        currentStudentForUnenroll={currentStudentForUnenroll}
        unenrollReason={unenrollReason}
        setUnenrollReason={setUnenrollReason}
        setCurrentStudentForUnenroll={setCurrentStudentForUnenroll}
        handleUnenrollRequest={handleUnenrollRequest}
        isSubmitting={isSubmittingUnenroll}
      />

      <ClassesTable
        classes={tableClasses}
        isLoading={isLoadingClasses}
        subjectId={subjectId}
        handleCancel={classManagement.handleCancelClass}
        handleMarkAsDone={classManagement.handleMarkClassAsDone}
        classStatusMap={classStatusMap}
        dateUtils={dateUtils}
        isCancelDialogOpen={!!classManagement.classToCancel}
        classToCancel={
          classManagement.classToCancel ? toTableClass(classManagement.classToCancel) : null
        }
        cancelReason={classManagement.cancelReason}
        setCancelReason={classManagement.setCancelReason}
        onCancelDialogOpenChange={open => {
          if (!open) classManagement.setClassToCancel(null);
        }}
        onConfirmCancel={classManagement.handleConfirmCancel}
        isSubmitting={classManagement.isSubmitting}
        formatClassDate={cls =>
          dateUtils.formatDisplayDate(
            typeof cls.date === 'string' ? dateUtils.createLocalDate(cls.date) : cls.date
          )
        }
      />

      <EventsTable subjectId={subjectId} />
    </div>
  );
}

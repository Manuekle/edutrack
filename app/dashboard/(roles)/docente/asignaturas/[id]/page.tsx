'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

import { ClassesTable } from '@/components/classes/classes-table';
import { EventsTable } from '@/components/events/events-table';
import { StudentsTable } from '@/components/students/students-table';
import { GenerateReportModal } from '@/components/subjects/generate-report-modal';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { useClassManagement } from '@/hooks/use-class-management';
import { useSubjectDetail } from '@/hooks/use-subject-detail';
import { toTableClass } from '@/lib/class-converters';
import { classStatusMap } from '@/lib/class-utils';
import * as dateUtils from '@/lib/time-utils';

export default function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const subjectId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  // Toast de asistencia cuando el docente llega desde una URL de asistencia no permitida
  useEffect(() => {
    const asistenciaError = searchParams.get('asistenciaError');
    if (asistenciaError) {
      sileo.error({ title: decodeURIComponent(asistenciaError) });
      router.replace(`/dashboard/docente/asignaturas/${subjectId}`, { scroll: false });
    }
  }, [subjectId, searchParams, router]);

  // Subject data hook with React Query
  const {
    subject,
    enrolledStudents,
    classes,
    isLoadingSubject,
    isLoadingStudents,
    isLoadingClasses,
    hasScheduledClasses,
    reportExistsForCurrentPeriod,
    error,
    refetchClasses,
    generateReport,
    isGeneratingReport,
    unenrollStudent,
    isUnenrolling,
  } = useSubjectDetail({
    subjectId,
    enabled: !!subjectId,
  });

  // Local state for classes management - sync with React Query data
  const [localClasses, setLocalClasses] = useState(classes);

  // Sync local classes when React Query data changes
  useEffect(() => {
    if (classes.length > 0) {
      setLocalClasses(classes);
    }
  }, [classes]);

  // Class management hook
  const classManagement = useClassManagement({
    classes: localClasses,
    setClasses: setLocalClasses,
    fetchClasses: async () => {
      await refetchClasses();
    },
    subjectId,
  });

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Student unenroll state
  const [currentStudentForUnenroll, setCurrentStudentForUnenroll] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [unenrollReason, setUnenrollReason] = useState('');

  const handleGenerateReport = async () => {
    if (!subject) return;

    if (hasScheduledClasses) {
      sileo.error({
        title: 'No se puede generar el reporte porque hay clases programadas pendientes',
      });
      return;
    }

    if (reportExistsForCurrentPeriod) {
      sileo.error({ title: 'Este reporte ya ha sido generado para el período actual' });
      setIsReportModalOpen(false);
      return;
    }

    generateReport(subjectId, {
      onSuccess: () => {
        setIsReportModalOpen(false);
        router.push('/dashboard/docente/reportes');
      },
    });
  };

  const handleUnenrollRequest = async (studentId: string, reason: string) => {
    if (!subjectId) return;

    unenrollStudent(
      { studentId, reason },
      {
        onSuccess: () => {
          setUnenrollReason('');
          setCurrentStudentForUnenroll(null);
        },
      }
    );
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
          <h2 className="sm:text-2xl text-xs text-white text-center font-semibold tracking-card pb-2">
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
      <GenerateReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        subjectName={subject?.name || 'Cargando asignatura...'}
        isLoading={isGeneratingReport}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-card text-foreground flex items-center gap-2">
            Mis Clases
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona tus clases y eventos para esta asignatura.
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-xl shadow-none h-10 border-transparent bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
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
            className="w-full sm:w-auto rounded-xl shadow-none h-10 px-6 text-sm font-medium transition-all"
            onClick={() => router.push(`/dashboard/docente/asignaturas/${subject?.id}/preview`)}
            aria-label="Ver vista previa de la asignatura"
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
        isSubmitting={isUnenrolling}
      />

      <ClassesTable
        classes={localClasses.map(cls => toTableClass(cls))}
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

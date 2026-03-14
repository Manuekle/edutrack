'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

import { ClassesTable } from '@/components/classes/classes-table';
import { StudentsTable } from '@/components/students/students-table';
import { GenerateReportModal } from '@/components/subjects/generate-report-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { useClassManagement } from '@/hooks/use-class-management';
import { useSubjectDetail } from '@/hooks/use-subject-detail';
import { toTableClass } from '@/lib/class-converters';
import { classStatusMap } from '@/lib/class-utils';
import * as dateUtils from '@/lib/time-utils';
import { AlertCircle, Eye, NotebookPen } from 'lucide-react';

export default function GrupoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const grupoId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  // Toast de asistencia cuando el docente llega desde una URL de asistencia no permitida
  useEffect(() => {
    const asistenciaError = searchParams.get('asistenciaError');
    if (asistenciaError) {
      sileo.error({ title: decodeURIComponent(asistenciaError) });
      router.replace(`/dashboard/docente/grupos/${grupoId}`, { scroll: false });
    }
  }, [grupoId, searchParams, router]);

  // Subject data hook with React Query (using grupoId as id)
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
  } = useSubjectDetail({
    subjectId: grupoId,
    enabled: !!grupoId,
  });

  // Local state for classes management - sync with React Query data
  const [localClasses, setLocalClasses] = useState(classes);

  useEffect(() => {
    setLocalClasses(classes);
  }, [classes]);

  // Class management hook
  const classManagement = useClassManagement({
    classes: localClasses,
    setClasses: setLocalClasses,
    fetchClasses: async () => {
      await refetchClasses();
    },
    subjectId: grupoId,
  });

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

    generateReport(grupoId, {
      onSuccess: () => {
        setIsReportModalOpen(false);
        router.push('/dashboard/docente/reportes');
      },
    });
  };

  // Loading state
  const isLoading = isLoadingSubject || isLoadingClasses || isLoadingStudents;

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <Alert variant="destructive" className="max-w-md rounded-2xl border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No disponible</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push('/dashboard/docente/grupos')}
          variant="outline"
          className="mt-6 rounded-xl"
        >
          Volver a la lista de grupos
        </Button>
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

      <div className="pb-6 space-y-3">
        <div className="flex sm:flex-row flex-col sm:items-center items-start gap-4 justify-between">
          <div>
            <h1 className="sm:text-2xl text-xl font-semibold tracking-card text-foreground">
              {subject?.name}
            </h1>
            <CardDescription className="text-xs dark:text-gray-300">
              Gestiona estudiantes y <strong>planea los temas de tus clases</strong> en la bitácora.
            </CardDescription>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <Button
              variant="default"
              className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20 h-10 px-6 text-sm font-semibold transition-all gap-2 bg-primary hover:bg-primary/90"
              onClick={() => router.push(`/dashboard/docente/grupos/${grupoId}/bitacora`)}
            >
              Planear Temas y Bitácora
            </Button>

            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl shadow-none h-10 border-transparent bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium gap-2"
              onClick={() => router.push(`/dashboard/docente/grupos/${grupoId}/preview`)}
            >
              <Eye className="h-4 w-4" />
              Vista previa
            </Button>

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
          </div>
        </div>
      </div>
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-full mt-0.5">
          <NotebookPen className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-primary">
            ¿Cómo subir los temas de tus clases?
          </h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Usa el botón <strong>"Planear Temas y Bitácora"</strong> arriba para definir la
            programación de temas clase a clase por las 16 semanas. También puedes ajustar las
            fechas desde allí.
          </p>
        </div>
      </div>

      <StudentsTable students={enrolledStudents} isLoading={isLoadingStudents} />

      <ClassesTable
        classes={localClasses.map(cls => toTableClass(cls))}
        isLoading={isLoadingClasses}
        subjectId={grupoId}
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
    </div>
  );
}

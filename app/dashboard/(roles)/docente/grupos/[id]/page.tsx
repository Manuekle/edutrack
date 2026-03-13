'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import Link from 'next/link';

import { ClassesTable } from '@/components/classes/classes-table';
import { StudentsTable } from '@/components/students/students-table';
import { GenerateReportModal } from '@/components/subjects/generate-report-modal';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/ui/loading';
import { useClassManagement } from '@/hooks/use-class-management';
import { useSubjectDetail } from '@/hooks/use-subject-detail';
import { toTableClass } from '@/lib/class-converters';
import { classStatusMap } from '@/lib/class-utils';
import * as dateUtils from '@/lib/time-utils';
import { ArrowLeft, NotebookPen } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="p-6 rounded-lg max-w-md w-full flex flex-col justify-center items-center bg-destructive border border-destructive">
          <h2 className="sm:text-2xl text-xs text-white text-center font-semibold tracking-card pb-2">
            No disponible
          </h2>
          <p className="text-white text-center mb-4 text-xs">{error}</p>
          <Button
            onClick={() => router.push('/dashboard/docente/grupos')}
            variant="default"
            className="w-full sm:w-auto"
          >
            Volver a la lista de grupos
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
              <Link href="/dashboard/docente/grupos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-card text-foreground">
              {subject?.name}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1 ml-10">
            Gestiona estudiantes, eventos y <strong>planea los temas de tus clases</strong> en la bitácora.
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <Button
            variant="default"
            className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20 h-10 px-6 text-sm font-semibold transition-all gap-2 bg-primary hover:bg-primary/90"
            onClick={() => router.push(`/dashboard/docente/bitacora/${grupoId}`)}
          >
            <NotebookPen className="h-4 w-4" />
            Planear Temas y Bitácora
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

      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-full mt-0.5">
          <NotebookPen className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-primary">¿Cómo subir los temas de tus clases?</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Usa el botón <strong>"Planear Temas y Bitácora"</strong> arriba para definir la programación de temas clase a clase por las 16 semanas. También puedes ajustar las fechas desde allí.
          </p>
        </div>
      </div>

      <StudentsTable
        students={enrolledStudents}
        isLoading={isLoadingStudents}
      />

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

/**
 * Hook personalizado para gestionar detalles de asignatura con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentPeriod } from '@/lib/class-utils';
import type { LocalClassWithStatus } from '@/types/class';
import type { Student, Subject } from '@/types/subject';
import { toast } from 'sonner';

interface SubjectDetail {
  id: string;
  name: string;
  code: string;
}

interface SubjectDetailResponse {
  data: SubjectDetail;
}

interface StudentsResponse {
  data: Student[];
}

interface ClassesResponse {
  data: LocalClassWithStatus[];
}

interface ReportExistsResponse {
  exists: boolean;
}

interface UseSubjectDetailOptions {
  subjectId: string;
  enabled?: boolean;
}

export function useSubjectDetail({ subjectId, enabled = true }: UseSubjectDetailOptions) {
  const queryClient = useQueryClient();

  // Query para obtener los detalles de la asignatura
  const subjectQuery = useQuery<SubjectDetailResponse>({
    queryKey: ['subject-detail', subjectId],
    queryFn: async () => {
      const response = await fetch(`/api/docente/asignaturas/${subjectId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar los detalles de la asignatura');
      }

      const result = await response.json();

      if (!result || !result.data) {
        throw new Error('Formato de respuesta inválido al cargar la asignatura');
      }

      return result;
    },
    enabled: enabled && !!subjectId,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Query para obtener los estudiantes inscritos
  const studentsQuery = useQuery<StudentsResponse>({
    queryKey: ['subject-students', subjectId],
    queryFn: async () => {
      const response = await fetch(`/api/docente/matriculas?subjectId=${subjectId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudieron cargar los estudiantes');
      }

      const result = await response.json();

      if (result && result.data) {
        return { data: Array.isArray(result.data) ? result.data : [] };
      }

      return { data: Array.isArray(result) ? result : [] };
    },
    enabled: enabled && !!subjectId,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Query para obtener las clases
  const classesQuery = useQuery<ClassesResponse>({
    queryKey: ['subject-classes', subjectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/docente/clases?subjectId=${subjectId}&sortBy=date&sortOrder=desc`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar las clases');
      }

      const result = await response.json();

      if (!result || !result.data || !Array.isArray(result.data)) {
        throw new Error('Formato de respuesta inválido al cargar las clases');
      }

      return result;
    },
    enabled: enabled && !!subjectId,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Query para verificar si existe un reporte para el período actual
  const reportExistsQuery = useQuery<ReportExistsResponse>({
    queryKey: ['report-exists', subjectId, getCurrentPeriod()],
    queryFn: async () => {
      const currentPeriod = getCurrentPeriod();
      const response = await fetch(
        `/api/docente/reportes?subjectId=${subjectId}&period=${currentPeriod}`
      );

      if (!response.ok) {
        return { exists: false };
      }

      return response.json();
    },
    enabled: enabled && !!subjectId && classesQuery.isSuccess,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Mutation para generar reporte
  const generateReportMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      const response = await fetch(`/api/docente/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          format: 'PDF',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al generar el reporte');
      }

      return response.json();
    },
  });

  // Mutation para solicitud de desmatriculación
  const unenrollMutation = useMutation({
    mutationFn: async ({ studentId, reason }: { studentId: string; reason: string }) => {
      const response = await fetch('/api/docente/solicitudes/desmatricula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, studentId, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al enviar la solicitud de desmatriculación');
      }

      return response.json();
    },
  });

  // Calcular si hay clases programadas
  const hasScheduledClasses =
    classesQuery.data?.data?.some(cls => cls.status === 'PROGRAMADA') || false;

  return {
    subject: subjectQuery.data?.data
      ? {
          id: subjectQuery.data.data.id,
          name: subjectQuery.data.data.name || 'Asignatura sin nombre',
          code: subjectQuery.data.data.code || 'N/A',
        }
      : null,
    enrolledStudents: studentsQuery.data?.data || [],
    classes: classesQuery.data?.data || [],
    isLoadingSubject: subjectQuery.isLoading,
    isLoadingStudents: studentsQuery.isLoading,
    isLoadingClasses: classesQuery.isLoading,
    hasScheduledClasses,
    reportExistsForCurrentPeriod: reportExistsQuery.data?.exists || false,
    error:
      subjectQuery.error || studentsQuery.error || classesQuery.error
        ? (subjectQuery.error as Error)?.message ||
          (studentsQuery.error as Error)?.message ||
          (classesQuery.error as Error)?.message ||
          'Error al cargar los datos'
        : null,
    refetchSubject: subjectQuery.refetch,
    refetchStudents: studentsQuery.refetch,
    refetchClasses: classesQuery.refetch,
    generateReport: (subjectId: string, options?: { onSuccess?: () => void }) => {
      generateReportMutation.mutate(subjectId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['report-exists', subjectId] });
          toast.success('El reporte se está generando. Recibirás un correo cuando esté listo.');
          options?.onSuccess?.();
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Error al generar el reporte');
        },
      });
    },
    isGeneratingReport: generateReportMutation.isPending,
    unenrollStudent: (
      data: { studentId: string; reason: string },
      options?: { onSuccess?: () => void }
    ) => {
      unenrollMutation.mutate(data, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['subject-students', subjectId] });
          toast.success('Solicitud de desmatriculación enviada correctamente');
          options?.onSuccess?.();
        },
        onError: error => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Error al enviar la solicitud de desmatriculación'
          );
        },
      });
    },
    isUnenrolling: unenrollMutation.isPending,
  };
}

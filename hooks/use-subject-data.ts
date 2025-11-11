'use client';

import { getCurrentPeriod } from '@/lib/class-utils';
import type { LocalClassWithStatus } from '@/types/class';
import type { Student, Subject } from '@/types/subject';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useSubjectData(subjectId: string) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<LocalClassWithStatus[]>([]);

  const [isLoadingSubject, setIsLoadingSubject] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  const [hasScheduledClasses, setHasScheduledClasses] = useState(false);
  const [reportExistsForCurrentPeriod, setReportExistsForCurrentPeriod] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkReportExistsForPeriod = useCallback(
    async (period: number) => {
      if (!subjectId) return false;

      try {
        const response = await fetch(
          `/api/docente/reportes?subjectId=${subjectId}&period=${period}`
        );
        if (!response.ok) return false;

        const { exists } = await response.json();
        return exists;
      } catch (error) {
        return false;
      }
    },
    [subjectId]
  );

  const fetchSubject = useCallback(async () => {
    if (!subjectId) {
      setError('No se proporcionó un ID de asignatura');
      setIsLoadingSubject(false);
      return;
    }

    try {
      setIsLoadingSubject(true);
      setError(null);

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

      setSubject({
        id: result.data.id,
        name: result.data.name || 'Asignatura sin nombre',
        code: result.data.code || 'N/A',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar la asignatura';
      setError(errorMessage);
      setSubject({
        id: subjectId,
        name: 'Asignatura',
        code: 'N/A',
      });
      toast.error(errorMessage);
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
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudieron cargar los estudiantes');
      }

      const result = await response.json();

      if (result && result.data) {
        setEnrolledStudents(Array.isArray(result.data) ? result.data : []);
      } else {
        setEnrolledStudents(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los estudiantes';
      setError(errorMessage);
      setEnrolledStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [subjectId]);

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
        throw new Error(errorData.message || 'Error al cargar las clases');
      }

      const result = await response.json();

      if (!result || !result.data || !Array.isArray(result.data)) {
        throw new Error('Formato de respuesta inválido al cargar las clases');
      }

      const hasScheduled = result.data.some(
        (cls: LocalClassWithStatus) => cls.status === 'PROGRAMADA'
      );
      setHasScheduledClasses(hasScheduled);
      setClasses(result.data);

      const currentPeriod = getCurrentPeriod();
      const reportExists = await checkReportExistsForPeriod(currentPeriod);
      setReportExistsForCurrentPeriod(reportExists);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar las clases';
      setError(errorMessage);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [subjectId, checkReportExistsForPeriod]);

  useEffect(() => {
    if (!subjectId) return;

    const loadingToast = toast.loading('Cargando datos de la asignatura...');

    const loadData = async () => {
      try {
        await Promise.all([fetchSubject(), fetchClasses(), fetchEnrolledStudents()]);
        toast.dismiss(loadingToast);
      } catch (error) {
        toast.dismiss(loadingToast);
      }
    };

    loadData();

    return () => {
      toast.dismiss(loadingToast);
    };
  }, [subjectId, fetchSubject, fetchClasses, fetchEnrolledStudents]);

  return {
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
  };
}

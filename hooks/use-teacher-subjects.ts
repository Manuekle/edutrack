/**
 * Hook personalizado para gestionar asignaturas del docente con React Query
 */

import { useQuery } from '@tanstack/react-query';
import { Subject as PrismaSubject } from '@prisma/client';
import React from 'react';

// Extend the base Subject type with period information
export type SubjectWithPeriod = Omit<PrismaSubject, 'createdAt'> & {
  period?: string;
  createdAt: Date | string;
};

interface TeacherSubjectsResponse {
  data: SubjectWithPeriod[];
}

interface UseTeacherSubjectsOptions {
  period?: string;
  enabled?: boolean;
}

// Get current year and period (1: Jan-Jun, 2: Jul-Dec)
export function getCurrentPeriod(): string {
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
  const currentPeriod = currentMonth <= 6 ? '1' : '2';
  return `${currentYear}-${currentPeriod}`;
}

// Get period from a date (1: Jan-Jun, 2: Jul-Dec)
export function getPeriodFromDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // getMonth() is 0-indexed
  const period = month <= 6 ? '1' : '2';
  return `${year}-${period}`;
}

export function useTeacherSubjects(options: UseTeacherSubjectsOptions = {}) {
  const { period, enabled = true } = options;

  // Always fetch all subjects to get all available periods
  // Then filter by period on the client side
  const query = useQuery<TeacherSubjectsResponse>({
    queryKey: ['teacher-subjects'],
    queryFn: async () => {
      const url = new URL('/api/docente/asignaturas', window.location.origin);
      url.searchParams.append('sortBy', 'createdAt');
      url.searchParams.append('sortOrder', 'desc');
      // Don't pass period to get all subjects for period extraction

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudieron cargar las asignaturas.');
      }

      return response.json();
    },
    enabled,
    staleTime: 60 * 1000, // 1 minuto
    retry: 1,
  });

  // Extract unique periods from all subjects
  const availablePeriods = React.useMemo(() => {
    if (!query.data?.data) {
      // Return at least the current period
      return [getCurrentPeriod()];
    }

    const periods = new Set<string>();
    const selectedPeriod = period || getCurrentPeriod();

    // Add the selected period first (in case there are no subjects yet)
    periods.add(selectedPeriod);

    // Add periods from all subjects (using the period from API or calculating from createdAt)
    query.data.data.forEach((subject: SubjectWithPeriod) => {
      // Use period from API if available, otherwise calculate from createdAt
      const subjectPeriod = subject.period || getPeriodFromDate(subject.createdAt);
      periods.add(subjectPeriod);
    });

    // Sort periods from newest to oldest
    return Array.from(periods).sort((a, b) => {
      const [yearA, periodA] = a.split('-');
      const [yearB, periodB] = b.split('-');

      // Sort by year descending, then by period descending
      return yearB !== yearA
        ? parseInt(yearB, 10) - parseInt(yearA, 10)
        : parseInt(periodB, 10) - parseInt(periodA, 10);
    });
  }, [query.data?.data, period]);

  // Filter subjects by selected period
  const filteredSubjects = React.useMemo(() => {
    if (!query.data?.data) return [];

    const selectedPeriod = period || getCurrentPeriod();

    return query.data.data.filter((subject: SubjectWithPeriod) => {
      // Use period from API if available, otherwise calculate from createdAt
      const subjectPeriod = subject.period || getPeriodFromDate(subject.createdAt);
      return subjectPeriod === selectedPeriod;
    });
  }, [query.data?.data, period]);

  return {
    subjects: query.data?.data || [],
    filteredSubjects,
    availablePeriods,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

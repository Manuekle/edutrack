/**
 * Hook personalizado para gestionar el dashboard del estudiante con React Query
 */

import { useQuery } from '@tanstack/react-query';
import React from 'react';

export type EventType = 'EXAMEN' | 'TRABAJO' | 'LIMITE' | 'ANUNCIO' | 'INFO';

export interface NextClass {
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  topic?: string;
  timeUntil: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacher: string;
  attendancePercentage: number;
  nextClass?: NextClass;
  totalClasses: number;
  attendedClasses: number;
}

export interface UpcomingClass {
  id: string;
  title: string;
  code: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime?: string;
  description?: string;
  subjectName?: string;
  type: EventType;
  isEvent: boolean;
}

export interface LiveClass {
  id: string;
  subjectName: string;
  teacherName: string;
  topic: string;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  qrToken: string;
  attendanceStats: {
    present: number;
    absent: number;
    late: number;
    justified: number;
  };
  totalStudents: number;
  myStatus: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';
  classroom?: string;
}

export interface DashboardStats {
  globalAttendancePercentage: number;
  attendedClasses: number;
  totalClasses: number;
  totalSubjects: number;
  averageGrade: string;
  subjectsAtRisk: number;
  weeklyAttendanceAverage: number;
}

interface DashboardResponse {
  subjects: Subject[];
  upcomingItems: UpcomingClass[];
  cards: {
    globalAttendancePercentage: number;
    attendedClasses: number;
    totalClasses: number;
    subjectsAtRisk: number;
    weeklyAttendanceAverage: number;
  };
}

interface LiveClassResponse {
  liveClass: LiveClass | null;
}

export function useStudentDashboard() {
  // Dashboard data query - refreshes every 5 minutes (aligned with server cache)
  const dashboardQuery = useQuery<DashboardResponse>({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/estudiante/dashboard');
      if (!response.ok) {
        throw new Error('Error al cargar los datos del dashboard');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos (aligned with server cache)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 1,
  });

  // Live class query - refreshes every 2 minutes
  // React Query will handle caching and only refetch when data is stale
  const liveClassQuery = useQuery<LiveClassResponse>({
    queryKey: ['student-live-class'],
    queryFn: async () => {
      const response = await fetch('/api/estudiante/current-class');
      if (!response.ok) {
        throw new Error('Error al cargar la clase en vivo');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 segundos - data is considered stale after 30s
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    retry: 1,
  });

  // Transform dashboard data
  const subjects = React.useMemo(() => {
    if (!dashboardQuery.data?.subjects) return [];
    return dashboardQuery.data.subjects.map(subj => ({
      ...subj,
      teacher: subj.teacher || 'Profesor no asignado',
      attendancePercentage: subj.attendancePercentage || 0,
      totalClasses: subj.totalClasses || 0,
      attendedClasses: subj.attendedClasses || 0,
    }));
  }, [dashboardQuery.data?.subjects]);

  const upcomingClasses = React.useMemo(() => {
    if (!dashboardQuery.data?.upcomingItems) return [];
    return dashboardQuery.data.upcomingItems.map(item => ({
      ...item,
      isEvent: !!item.isEvent,
      endTime: item.endTime || '23:59',
      title: item.title || 'Sin título',
      code: item.code || '',
      teacher: item.teacher || 'Profesor no asignado',
      date: item.date,
      startTime: item.startTime || '00:00',
      type: (item.type || 'INFO') as EventType,
    }));
  }, [dashboardQuery.data?.upcomingItems]);

  const stats = React.useMemo<DashboardStats>(() => {
    if (!dashboardQuery.data?.cards) {
      return {
        globalAttendancePercentage: 0,
        attendedClasses: 0,
        totalClasses: 0,
        totalSubjects: 0,
        averageGrade: '0.0',
        subjectsAtRisk: 0,
        weeklyAttendanceAverage: 0,
      };
    }
    return {
      globalAttendancePercentage: dashboardQuery.data.cards.globalAttendancePercentage || 0,
      attendedClasses: dashboardQuery.data.cards.attendedClasses || 0,
      totalClasses: dashboardQuery.data.cards.totalClasses || 0,
      totalSubjects: subjects.length,
      averageGrade: '0.0',
      subjectsAtRisk: dashboardQuery.data.cards.subjectsAtRisk || 0,
      weeklyAttendanceAverage: dashboardQuery.data.cards.weeklyAttendanceAverage || 0,
    };
  }, [dashboardQuery.data?.cards, subjects.length]);

  // Transform live class data
  const liveClass = React.useMemo<LiveClass | null>(() => {
    if (!liveClassQuery.data?.liveClass) return null;
    const data = liveClassQuery.data.liveClass;
    return {
      id: data.id,
      subjectName: data.subjectName,
      teacherName: data.teacherName,
      topic: data.topic || 'Clase en curso',
      date: new Date(),
      startTime: data.startTime ? new Date(data.startTime) : null,
      endTime: data.endTime ? new Date(data.endTime) : null,
      qrToken: data.qrToken,
      attendanceStats: data.attendanceStats || {
        present: 0,
        absent: 0,
        late: 0,
        justified: 0,
      },
      totalStudents: data.totalStudents || 0,
      myStatus: data.myStatus || 'AUSENTE',
      classroom: data.classroom,
    };
  }, [liveClassQuery.data?.liveClass]);

  const isLoading = dashboardQuery.isLoading || liveClassQuery.isLoading;
  const error = dashboardQuery.error || liveClassQuery.error;

  return {
    subjects,
    upcomingClasses,
    liveClass,
    stats,
    isLoading,
    error,
    refetchDashboard: dashboardQuery.refetch,
    refetchLiveClass: liveClassQuery.refetch,
  };
}

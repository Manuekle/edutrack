import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';

type SubjectStats = {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  completedClasses: number;
  nextClass?: {
    id: string;
    date: string;
    topic: string;
  };
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export async function getTeacherDashboardData(): Promise<
  ApiResponse<{
    subjects: SubjectStats[];
    upcomingClasses: Array<{
      id: string;
      subjectId: string;
      subjectName: string;
      subjectCode: string;
      date: string;
      topic: string;
    }>;
  }>
> {
  try {
    const session = (await getSession()) as Session & { accessToken?: string };
    if (!session) {
      return { error: 'No autenticado' };
    }

    const response = await fetch('/api/docente/dashboard', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { error: error.message || 'Error al cargar los datos' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error in getTeacherDashboardData:', error);
    return { error: 'Error de conexión' };
  }
}

// Función para formatear fechas de la API
export function formatDate(dateString: string): Date {
  return new Date(dateString);
}

// Función para ordenar clases por fecha
export function sortByDate(classes: Array<{ date: string }>) {
  return [...classes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Tipos para los datos de la clase en vivo
export type LiveClassData = {
  id: string;
  topic: string;
  subjectName: string;
  classroom?: string | null;
  startTime: string;
  endTime: string;
  totalStudents: number;
  attendanceStats: {
    present: number;
    absent: number;
    late: number;
    justified: number;
  };
};

// Función para obtener datos de la clase en vivo
export async function getLiveClassData(): Promise<
  ApiResponse<{ liveClass: LiveClassData | null }>
> {
  try {
    const session = (await getSession()) as Session & { accessToken?: string };
    if (!session) {
      return { error: 'No autenticado' };
    }

    const response = await fetch('/api/docente/dashboard/live', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: 'no-store', // Asegurar que los datos sean siempre frescos
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { error: error.message || 'Error al cargar los datos en vivo' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error in getLiveClassData:', error);
    return { error: 'Error de conexión' };
  }
}

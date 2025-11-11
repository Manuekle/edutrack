/**
 * Hook personalizado para gestionar asignaturas con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
  code: string;
  program?: string | null;
  semester?: number | null;
  credits?: number | null;
  teacherId: string;
  teacher?: {
    id: string;
    name: string | null;
    correoInstitucional: string | null;
    codigoDocente: string | null;
  };
  studentIds: string[];
  studentCount: number;
  classCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SubjectsResponse {
  data: Subject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface UseSubjectsOptions {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}

export function useSubjects(options: UseSubjectsOptions = {}) {
  const { page = 1, limit = 10, search = '', enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery<SubjectsResponse>({
    queryKey: ['subjects', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/subjects?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al obtener las asignaturas');
      }
      return response.json();
    },
    enabled,
    staleTime: 60 * 1000, // 1 minuto
  });

  const deleteMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la asignatura');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar la query para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Asignatura eliminada correctamente');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la asignatura');
    },
  });

  return {
    subjects: query.data?.data || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    deleteSubject: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook personalizado para gestionar usuarios con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User } from '@/types';

interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  enabled?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { page = 1, limit = 10, search = '', role, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery<UsersResponse>({
    queryKey: ['users', page, limit, search, role],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (role) {
        params.append('role', role);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al obtener los usuarios');
      }
      return response.json();
    },
    enabled,
    staleTime: 60 * 1000, // 1 minuto
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del usuario');
      }

      return response.json();
    },
    onSuccess: data => {
      // Invalidar la query para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        `Usuario ${data.name} ${data.isActive ? 'activado' : 'desactivado'} correctamente.`
      );
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el usuario');
    },
  });

  return {
    users: query.data?.data || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    toggleActive: toggleActiveMutation.mutate,
    isTogglingActive: toggleActiveMutation.isPending,
  };
}

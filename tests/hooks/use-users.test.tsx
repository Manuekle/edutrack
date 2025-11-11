/**
 * Tests para el hook useUsers
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUsers } from '@/hooks/use-users';

// Mock de fetch
global.fetch = jest.fn() as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUsers', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('debería obtener usuarios correctamente', async () => {
    const mockUsers = {
      data: [
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'ESTUDIANTE',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    const { result } = renderHook(() => useUsers({ page: 1, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0]?.name).toBe('Test User');
  });

  it('debería manejar errores correctamente', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Error de red'));

    const { result } = renderHook(() => useUsers({ page: 1, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});

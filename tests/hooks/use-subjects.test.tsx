/**
 * Tests para el hook useSubjects
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSubjects } from '@/hooks/use-subjects';

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

describe('useSubjects', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('debería obtener asignaturas correctamente', async () => {
    const mockSubjects = {
      data: [
        {
          id: '1',
          name: 'Test Subject',
          code: 'TEST001',
          teacherId: 'teacher1',
          studentCount: 10,
          classCount: 5,
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
      json: async () => mockSubjects,
    });

    const { result } = renderHook(() => useSubjects({ page: 1, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subjects).toHaveLength(1);
    expect(result.current.subjects[0]?.name).toBe('Test Subject');
  });

  it('debería manejar errores correctamente', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Error de red'));

    const { result } = renderHook(() => useSubjects({ page: 1, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});

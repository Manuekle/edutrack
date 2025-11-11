/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateSubjectModal } from '@/components/modals/create-subject-modal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Mock de fetch para evitar llamadas reales a la API
global.fetch = jest.fn() as jest.Mock;

describe('CreateSubjectModal', () => {
  let queryClient: QueryClient;
  const mockOnSubjectCreated = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockOnSubjectCreated.mockClear();
    mockOnClose.mockClear();
    (fetch as jest.Mock).mockClear();

    // Mock de la API de docentes que se llama cuando el modal se abre
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: '1',
            name: 'Test Teacher',
            correoInstitucional: 'teacher@example.com',
            codigoDocente: 'T001',
          },
        ],
      }),
    });
  });

  const renderCreateSubjectModal = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CreateSubjectModal
          isOpen={true}
          onClose={mockOnClose}
          onSubjectCreated={mockOnSubjectCreated}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('debería renderizar el modal cuando está abierto', async () => {
    renderCreateSubjectModal();

    await waitFor(
      () => {
        // Usar un selector más específico - el título del modal
        expect(screen.getByText(/crear nueva asignatura/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/código/i)).toBeInTheDocument();
  });

  it('no debería renderizar el modal cuando está cerrado', () => {
    renderCreateSubjectModal({ isOpen: false });

    expect(screen.queryByText(/crear asignatura/i)).not.toBeInTheDocument();
  });

  it('debería validar que el nombre es requerido', async () => {
    renderCreateSubjectModal();

    await waitFor(
      () => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const submitButton = screen.getByRole('button', { name: /crear asignatura/i });
    fireEvent.click(submitButton);

    await waitFor(
      () => {
        // Buscar el mensaje de error exacto del schema
        expect(screen.getByText(/el nombre de la asignatura es requerido/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('debería validar que el código es requerido', async () => {
    renderCreateSubjectModal();

    await waitFor(
      () => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const nameInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nameInput, { target: { value: 'Test Subject' } });

    const submitButton = screen.getByRole('button', { name: /crear asignatura/i });
    fireEvent.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText(/el código es requerido/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('debería llamar a onClose cuando se hace clic en cancelar', async () => {
    renderCreateSubjectModal();

    await waitFor(
      () => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

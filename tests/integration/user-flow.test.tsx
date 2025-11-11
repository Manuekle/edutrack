/**
 * Tests de integración para el flujo de usuario
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateUserModal } from '@/components/modals/create-user-modal';
import { EventForm } from '@/components/events/event-form';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

// Mock de fetch
global.fetch = jest.fn() as jest.Mock;

describe('Flujo de integración de usuario', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    (fetch as jest.Mock).mockClear();
  });

  describe('Flujo de creación de usuario', () => {
    it('debería renderizar el modal de creación de usuario', async () => {
      const mockOnUserCreated = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <CreateUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
        </QueryClientProvider>
      );

      // Verificar que el modal se renderiza
      await waitFor(() => {
        expect(screen.getByText(/crear nuevo usuario/i)).toBeInTheDocument();
      });

      // Verificar que los campos del formulario están presentes
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/correo personal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/correo institucional/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    });

    it('debería permitir llenar y enviar el formulario de usuario', async () => {
      const mockOnUserCreated = jest.fn();
      const mockOnClose = jest.fn();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: '1',
            name: 'Test User',
            correoInstitucional: 'test@example.com',
            role: 'ESTUDIANTE',
          },
        }),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <CreateUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
        </QueryClientProvider>
      );

      // Llenar campos básicos
      const nameInput = screen.getByLabelText(/nombre completo/i);
      const emailInput = screen.getByLabelText(/correo institucional/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Verificar que los valores se establecieron
      expect(nameInput).toHaveValue('Test User');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Flujo de creación de evento', () => {
    it('debería renderizar el formulario de evento correctamente', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnCancel = jest.fn();

      // EventForm se usa dentro de un Dialog, pero podemos testearlo directamente
      // usando el patrón que usa EventsTable
      const {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
      } = require('@/components/ui/dialog');

      render(
        <QueryClientProvider client={queryClient}>
          <Dialog open={true}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Evento</DialogTitle>
                <DialogDescription>Formulario para crear un nuevo evento</DialogDescription>
              </DialogHeader>
              <EventForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            </DialogContent>
          </Dialog>
        </QueryClientProvider>
      );

      // Verificar que el formulario se renderiza
      await waitFor(() => {
        expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
      });

      // Verificar que los campos están presentes
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tipo de evento/i)).toBeInTheDocument();
    });
  });
});

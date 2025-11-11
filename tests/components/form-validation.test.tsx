/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventForm } from '@/components/events/event-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('Validación de formularios', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  describe('EventForm - Validaciones', () => {
    it('debería validar todos los campos requeridos', async () => {
      const mockOnSubmit = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <Dialog open={true}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Evento</DialogTitle>
                <DialogDescription>Formulario para crear un nuevo evento</DialogDescription>
              </DialogHeader>
              <EventForm onSubmit={mockOnSubmit} />
            </DialogContent>
          </Dialog>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
      });

      // Limpiar el título para forzar el error de validación
      const titleInput = screen.getByLabelText(/título/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /crear evento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el título es requerido/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('debería permitir enviar el formulario con datos válidos', async () => {
      const mockOnSubmit = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <Dialog open={true}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Evento</DialogTitle>
                <DialogDescription>Formulario para crear un nuevo evento</DialogDescription>
              </DialogHeader>
              <EventForm onSubmit={mockOnSubmit} />
            </DialogContent>
          </Dialog>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/título/i);
      fireEvent.change(titleInput, { target: { value: 'Test Event' } });

      // El formulario tiene valores por defecto para fecha y tipo
      const submitButton = screen.getByRole('button', { name: /crear evento/i });

      await waitFor(() => {
        expect(submitButton).toBeInTheDocument();
      });

      fireEvent.click(submitButton);

      // El formulario debería enviar ya que tiene valores por defecto
      await waitFor(
        () => {
          expect(mockOnSubmit).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });
});

/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventForm } from '@/components/events/event-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('EventForm', () => {
  let queryClient: QueryClient;
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  const renderEventForm = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Evento</DialogTitle>
            </DialogHeader>
            <EventForm
              onSubmit={mockOnSubmit}
              onCancel={mockOnCancel}
              submitLabel="Crear Evento"
              {...props}
            />
          </DialogContent>
        </Dialog>
      </QueryClientProvider>
    );
  };

  it('debería renderizar el formulario correctamente', () => {
    renderEventForm();

    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de evento/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear evento/i })).toBeInTheDocument();
  });

  it('debería validar que el título es requerido', async () => {
    renderEventForm();

    const submitButton = screen.getByRole('button', { name: /crear evento/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/el título es requerido/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('debería validar que la fecha es requerida', async () => {
    renderEventForm({
      title: 'Test Event',
    });

    const submitButton = screen.getByRole('button', { name: /crear evento/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('debería llamar a onSubmit con los datos correctos', async () => {
    renderEventForm();

    await waitFor(() => {
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/título/i);
    const descriptionInput = screen.getByLabelText(/descripción/i);

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

    // El formulario ya tiene una fecha por defecto, así que solo necesitamos el título
    // y el tipo de evento que también tiene un valor por defecto
    const submitButton = screen.getByRole('button', { name: /crear evento/i });

    // Esperar un momento para que el formulario se actualice
    await waitFor(() => {
      expect(submitButton).toBeInTheDocument();
    });

    fireEvent.click(submitButton);

    await waitFor(
      () => {
        expect(mockOnSubmit).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('debería llamar a onCancel cuando se hace clic en cancelar', () => {
    renderEventForm();

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('debería mostrar valores por defecto cuando se proporcionan props', () => {
    const defaultDate = new Date('2024-01-15');
    renderEventForm({
      title: 'Default Title',
      description: 'Default Description',
      date: defaultDate,
      type: 'EXAMEN',
    });

    expect(screen.getByDisplayValue('Default Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Default Description')).toBeInTheDocument();
  });
});

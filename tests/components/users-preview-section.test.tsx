/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { UsersPreviewSection, UserPreviewItem } from '@/components/users/preview-section';

const mockPreviewData: UserPreviewItem[] = [
  {
    data: {
      name: 'Juan Pérez',
      document: '1234567890',
      correoPersonal: 'juan@example.com',
      correoInstitucional: 'juan.perez@university.edu',
      role: 'ESTUDIANTE',
    },
    status: 'success',
    message: 'Usuario válido',
  },
  {
    data: {
      name: 'María González',
      document: '0987654321',
      correoPersonal: 'maria@example.com',
      role: 'DOCENTE',
    },
    status: 'warning',
    message: 'Advertencia: correo institucional faltante',
  },
  {
    data: {
      name: 'Error User',
      document: '1111111111',
      correoPersonal: 'invalid-email',
      role: 'ESTUDIANTE',
    },
    status: 'error',
    message: 'Correo electrónico inválido',
  },
];

const mockFinalResults = [
  {
    document: '1234567890',
    name: 'Juan Pérez',
    status: 'created' as const,
    message: 'Usuario creado exitosamente',
  },
  {
    document: '0987654321',
    name: 'María González',
    status: 'skipped' as const,
    message: 'Usuario ya existe',
  },
  {
    document: '1111111111',
    name: 'Error User',
    status: 'error' as const,
    message: 'Error al crear usuario',
  },
];

describe('UsersPreviewSection', () => {
  const mockOnUpload = jest.fn();
  const mockOnNewUpload = jest.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
    mockOnNewUpload.mockClear();
  });

  it('debería mostrar el estado de carga cuando isLoading es true', () => {
    render(
      <UsersPreviewSection
        isLoading={true}
        isPreview={false}
        previewData={[]}
        finalResults={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    // Verificar que se muestra el loader (Loader2 tiene aria-hidden="true")
    const loader = document.querySelector('.lucide-loader-circle');
    expect(loader).toBeInTheDocument();
  });

  it('debería mostrar el mensaje de estado vacío cuando no hay datos', () => {
    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={false}
        previewData={[]}
        finalResults={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    expect(screen.getByText(/sube un archivo/i)).toBeInTheDocument();
  });

  it('debería mostrar los datos de preview correctamente', () => {
    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        finalResults={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    // Verificar que se muestran los usuarios
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María González')).toBeInTheDocument();
    expect(screen.getByText('Error User')).toBeInTheDocument();

    // Verificar badges de estado
    expect(screen.getByText('Listo')).toBeInTheDocument();
    expect(screen.getByText('Advertencia')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('debería mostrar los contadores de estado correctamente', () => {
    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        finalResults={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    // Verificar badges de conteo
    expect(screen.getByText(/1 válido/i)).toBeInTheDocument();
    expect(screen.getByText(/1 advertencia/i)).toBeInTheDocument();
    expect(screen.getByText(/1 error/i)).toBeInTheDocument();
  });

  it('debería mostrar los resultados finales cuando están disponibles', () => {
    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={false}
        previewData={[]}
        finalResults={mockFinalResults}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    expect(screen.getByText(/carga completada/i)).toBeInTheDocument();
    // El texto está dividido en múltiples elementos, buscar partes individuales
    expect(screen.getByText(/usuario creado/i)).toBeInTheDocument();
    expect(screen.getByText(/con éxito/i)).toBeInTheDocument();
    expect(screen.getByText(/usuarios no fueron creados/i)).toBeInTheDocument();
    expect(screen.getByText(/omitidos o con errores/i)).toBeInTheDocument();
  });

  it('debería mostrar errores en los resultados finales', () => {
    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={false}
        previewData={[]}
        finalResults={mockFinalResults}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    expect(screen.getByText(/errores:/i)).toBeInTheDocument();
    expect(screen.getByText(/error user/i)).toBeInTheDocument();
  });

  it('debería llamar a onUpload cuando se hace clic en el botón de confirmar', () => {
    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        finalResults={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirmar carga/i });
    fireEvent.click(confirmButton);

    expect(mockOnUpload).toHaveBeenCalledTimes(1);
  });

  it('debería deshabilitar el botón de confirmar cuando no hay usuarios válidos', () => {
    const errorOnlyData: UserPreviewItem[] = [
      {
        data: {
          name: 'Error User',
          document: '1111111111',
          correoPersonal: 'invalid-email',
          role: 'ESTUDIANTE',
        },
        status: 'error',
        message: 'Correo electrónico inválido',
      },
    ];

    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={true}
        previewData={errorOnlyData}
        finalResults={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirmar carga/i });
    expect(confirmButton).toBeDisabled();
  });

  it('debería llamar a onNewUpload cuando se hace clic en el botón de cargar otro archivo', () => {
    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={false}
        previewData={[]}
        finalResults={mockFinalResults}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    const newUploadButton = screen.getByRole('button', { name: /cargar otro archivo/i });
    fireEvent.click(newUploadButton);

    expect(mockOnNewUpload).toHaveBeenCalledTimes(1);
  });

  it('debería mostrar el estado de confirmación cuando isConfirming es true', () => {
    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        finalResults={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
        isConfirming={true}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /procesando/i });
    expect(confirmButton).toBeDisabled();
  });

  it('debería mostrar información de correos correctamente', () => {
    render(
      <UsersPreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        finalResults={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
    expect(screen.getByText('juan.perez@university.edu')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
  });
});

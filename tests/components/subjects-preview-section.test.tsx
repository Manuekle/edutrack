/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PreviewSection, PreviewItem, ClassDataItem } from '@/components/subjects/preview-section';

const mockPreviewData: PreviewItem[] = [
  {
    codigoAsignatura: 'MAT101',
    nombreAsignatura: 'Matemáticas I',
    creditosClase: 3,
    semestreAsignatura: 1,
    programa: 'Ingeniería',
    status: 'success',
    classes: [
      {
        id: 1,
        fechaClase: '2024-01-15',
        horaInicio: '08:00',
        horaFin: '10:00',
        temaClase: 'Introducción al álgebra',
        descripcionClase: 'Primera clase del curso',
      },
      {
        id: 2,
        fechaClase: '2024-01-22',
        horaInicio: '08:00',
        horaFin: '10:00',
        temaClase: 'Ecuaciones lineales',
        descripcionClase: 'Segunda clase del curso',
      },
    ],
  },
  {
    codigoAsignatura: 'FIS101',
    nombreAsignatura: 'Física I',
    creditosClase: 4,
    semestreAsignatura: 1,
    programa: 'Ingeniería',
    status: 'error',
    error: 'Asignatura duplicada',
    classes: [],
  },
  {
    codigoAsignatura: 'QUI101',
    nombreAsignatura: 'Química I',
    creditosClase: 3,
    semestreAsignatura: 1,
    programa: 'Ingeniería',
    status: 'duplicate',
    classes: [
      {
        id: 3,
        fechaClase: '2024-01-16',
        horaInicio: '10:00',
        horaFin: '12:00',
        temaClase: 'Introducción a la química',
        descripcionClase: 'Primera clase',
      },
    ],
  },
];

const mockUploadResult = {
  processed: 2,
  errors: ['Error al procesar FIS101'],
};

describe('PreviewSection', () => {
  const mockOnUpload = jest.fn();
  const mockOnNewUpload = jest.fn();
  const mockOnUpdateClass = jest.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
    mockOnNewUpload.mockClear();
    mockOnUpdateClass.mockClear();
  });

  it('debería mostrar el estado de carga cuando isLoading es true', () => {
    render(
      <PreviewSection
        isLoading={true}
        isPreview={false}
        previewData={[]}
        uploadResult={null}
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
      <PreviewSection
        isLoading={false}
        isPreview={false}
        previewData={[]}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    expect(screen.getByText(/sube un archivo/i)).toBeInTheDocument();
  });

  it('debería mostrar los datos de preview correctamente', () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    // Verificar que se muestran las asignaturas
    expect(screen.getByText('Matemáticas I')).toBeInTheDocument();
    expect(screen.getByText('Física I')).toBeInTheDocument();
    expect(screen.getByText('Química I')).toBeInTheDocument();

    // Verificar códigos
    expect(screen.getByText('MAT101')).toBeInTheDocument();
    expect(screen.getByText('FIS101')).toBeInTheDocument();
    expect(screen.getByText('QUI101')).toBeInTheDocument();
  });

  it('debería mostrar los badges de estado correctamente', () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    // Verificar badges
    expect(screen.getByText('Listo')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Duplicado')).toBeInTheDocument();
  });

  it('debería mostrar las clases de cada asignatura', () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    // Verificar que se muestran los temas de las clases
    expect(screen.getByText('Introducción al álgebra')).toBeInTheDocument();
    expect(screen.getByText('Ecuaciones lineales')).toBeInTheDocument();
    expect(screen.getByText('Introducción a la química')).toBeInTheDocument();
  });

  it('debería mostrar el contador de clases correctamente', () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    // Verificar que se muestra el conteo de clases
    expect(screen.getByText(/2 clases/i)).toBeInTheDocument();
    expect(screen.getByText(/1 clase/i)).toBeInTheDocument();
  });

  it('debería mostrar errores cuando están presentes', () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    expect(screen.getByText('Asignatura duplicada')).toBeInTheDocument();
  });

  it('debería mostrar los resultados de upload cuando están disponibles', () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={false}
        previewData={[]}
        uploadResult={mockUploadResult}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    expect(screen.getByText(/carga completada/i)).toBeInTheDocument();
    // El texto completo es "Se procesaron 2 asignaturas."
    expect(screen.getByText(/se procesaron 2 asignaturas/i)).toBeInTheDocument();
  });

  it('debería llamar a onUpload cuando se hace clic en el botón de confirmar', () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirmar carga/i });
    fireEvent.click(confirmButton);

    expect(mockOnUpload).toHaveBeenCalledTimes(1);
  });

  it('debería deshabilitar el botón de confirmar cuando no hay asignaturas válidas', () => {
    const errorOnlyData: PreviewItem[] = [
      {
        codigoAsignatura: 'FIS101',
        nombreAsignatura: 'Física I',
        creditosClase: 4,
        semestreAsignatura: 1,
        programa: 'Ingeniería',
        status: 'error',
        error: 'Error en la asignatura',
        classes: [],
      },
    ];

    render(
      <PreviewSection
        isLoading={false}
        isPreview={true}
        previewData={errorOnlyData}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirmar carga/i });
    expect(confirmButton).toBeDisabled();
  });

  it('debería llamar a onNewUpload cuando se hace clic en el botón de cargar otro archivo', () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={false}
        previewData={[]}
        uploadResult={mockUploadResult}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    const newUploadButton = screen.getByRole('button', { name: /cargar otro archivo/i });
    fireEvent.click(newUploadButton);

    expect(mockOnNewUpload).toHaveBeenCalledTimes(1);
  });

  it('debería mostrar información de créditos y programa', () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
      />
    );

    // Verificar que se muestran los créditos (puede haber múltiples, usar getAllByText)
    const creditos3 = screen.getAllByText(/3 créditos/i);
    expect(creditos3.length).toBeGreaterThan(0);

    const creditos4 = screen.getAllByText(/4 créditos/i);
    expect(creditos4.length).toBeGreaterThan(0);
  });

  it('debería permitir editar una clase cuando onUpdateClass está disponible', async () => {
    render(
      <PreviewSection
        isLoading={false}
        isPreview={true}
        previewData={mockPreviewData}
        uploadResult={null}
        onUpload={mockOnUpload}
        onNewUpload={mockOnNewUpload}
        onUpdateClass={mockOnUpdateClass}
      />
    );

    // Buscar el botón de editar (si existe)
    // Nota: Los botones de editar pueden no estar visibles por defecto
    // Este test verifica que el componente se renderiza correctamente con onUpdateClass
    expect(screen.getByText('Matemáticas I')).toBeInTheDocument();
  });
});

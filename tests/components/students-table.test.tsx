/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { StudentsTable } from '@/components/students/students-table';

const mockStudents = [
  {
    id: '1',
    name: 'Estudiante 1',
    document: '1234567890',
    correoInstitucional: 'estudiante1@example.com',
    correoPersonal: null,
    telefono: null,
  },
  {
    id: '2',
    name: 'Estudiante 2',
    document: '0987654321',
    correoInstitucional: 'estudiante2@example.com',
    correoPersonal: null,
    telefono: null,
  },
];

describe('StudentsTable', () => {
  const mockProps = {
    students: mockStudents,
    isLoading: false,
    currentStudentForUnenroll: null,
    unenrollReason: '',
    setUnenrollReason: jest.fn(),
    setCurrentStudentForUnenroll: jest.fn(),
    handleUnenrollRequest: jest.fn().mockResolvedValue(undefined),
    isSubmitting: false,
  };

  it('debería renderizar la tabla de estudiantes', () => {
    render(<StudentsTable {...mockProps} />);

    expect(screen.getByText(/estudiante 1/i)).toBeInTheDocument();
    expect(screen.getByText(/estudiante 2/i)).toBeInTheDocument();
  });

  it('debería mostrar el estado de carga', () => {
    render(<StudentsTable {...mockProps} isLoading={true} />);

    // Verificar que se muestra algún indicador de carga
    expect(screen.queryByText(/estudiante 1/i)).not.toBeInTheDocument();
  });

  it('debería mostrar mensaje cuando no hay estudiantes', () => {
    render(<StudentsTable {...mockProps} students={[]} />);

    expect(screen.getByText(/no hay estudiantes/i)).toBeInTheDocument();
  });
});

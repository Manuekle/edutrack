/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import React from 'react';

// Test component that uses the form components
function TestFormComponent() {
  const form = useForm({
    defaultValues: {
      testField: '',
    },
  });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="testField"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Field</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter value" />
              </FormControl>
              <FormDescription>This is a test field description</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

// Test component with error
function TestFormWithError() {
  const form = useForm({
    defaultValues: {
      testField: '',
    },
  });

  // Trigger validation error
  React.useEffect(() => {
    form.setError('testField', {
      type: 'required',
      message: 'This field is required',
    });
  }, [form]);

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="testField"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Field</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter value" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

describe('Form Components', () => {
  describe('Form', () => {
    it('debería renderizar el FormProvider correctamente', () => {
      render(<TestFormComponent />);
      expect(screen.getByLabelText(/test field/i)).toBeInTheDocument();
    });
  });

  describe('FormField', () => {
    it('debería renderizar un campo de formulario con todos sus componentes', () => {
      render(<TestFormComponent />);

      expect(screen.getByLabelText(/test field/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter value/i)).toBeInTheDocument();
      expect(screen.getByText(/this is a test field description/i)).toBeInTheDocument();
    });

    it('debería renderizar el input con el valor correcto', () => {
      render(<TestFormComponent />);

      const input = screen.getByPlaceholderText(/enter value/i) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('');
    });
  });

  describe('FormLabel', () => {
    it('debería renderizar el label correctamente', () => {
      render(<TestFormComponent />);
      expect(screen.getByLabelText(/test field/i)).toBeInTheDocument();
    });

    it('debería aplicar estilos de error cuando hay un error', () => {
      render(<TestFormWithError />);
      const label = screen.getByText(/test field/i);
      expect(label).toBeInTheDocument();
      // El label debería tener el atributo data-error cuando hay un error
      expect(label.closest('label')?.getAttribute('data-error')).toBe('true');
    });
  });

  describe('FormControl', () => {
    it('debería renderizar el control con el input', () => {
      render(<TestFormComponent />);
      const input = screen.getByPlaceholderText(/enter value/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('id');
    });

    it('debería aplicar aria-invalid cuando hay un error', () => {
      render(<TestFormWithError />);
      const input = screen.getByPlaceholderText(/enter value/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('FormDescription', () => {
    it('debería renderizar la descripción correctamente', () => {
      render(<TestFormComponent />);
      expect(screen.getByText(/this is a test field description/i)).toBeInTheDocument();
    });
  });

  describe('FormMessage', () => {
    it('debería mostrar el mensaje de error cuando hay un error', () => {
      render(<TestFormWithError />);
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    });

    it('no debería mostrar mensaje cuando no hay error', () => {
      render(<TestFormComponent />);
      expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument();
    });
  });

  describe('FormItem', () => {
    it('debería renderizar el contenedor del item correctamente', () => {
      render(<TestFormComponent />);
      const formItem = screen.getByLabelText(/test field/i).closest('[data-slot="form-item"]');
      expect(formItem).toBeInTheDocument();
    });
  });
});

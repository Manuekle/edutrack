/**
 * Tests para lib/utils.ts
 */

import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('debería combinar clases correctamente', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('debería manejar clases condicionales', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('debería filtrar clases falsas', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).not.toContain('active-class');
    });

    it('debería manejar arrays de clases', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('debería manejar objetos de clases condicionales', () => {
      const result = cn({
        'active-class': true,
        'inactive-class': false,
      });
      expect(result).toContain('active-class');
      expect(result).not.toContain('inactive-class');
    });

    it('debería fusionar clases de Tailwind correctamente', () => {
      // cn usa twMerge, por lo que debería fusionar clases conflictivas
      const result = cn('px-2', 'px-4');
      // twMerge debería mantener solo px-4
      expect(result).toBe('px-4');
    });

    it('debería manejar clases vacías', () => {
      const result = cn('', 'class1', null, undefined, false);
      expect(result).toContain('class1');
    });

    it('debería manejar múltiples argumentos', () => {
      const result = cn('class1', 'class2', 'class3', 'class4');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
      expect(result).toContain('class4');
    });

    it('debería fusionar clases de margen correctamente', () => {
      const result = cn('m-2', 'm-4');
      expect(result).toBe('m-4');
    });

    it('debería fusionar clases de padding correctamente', () => {
      const result = cn('p-2', 'p-4');
      expect(result).toBe('p-4');
    });

    it('debería mantener clases no conflictivas', () => {
      const result = cn('px-2', 'py-4', 'text-red-500');
      expect(result).toContain('px-2');
      expect(result).toContain('py-4');
      expect(result).toContain('text-red-500');
    });

    it('debería manejar strings vacíos', () => {
      const result = cn('', 'class1');
      expect(result).toContain('class1');
    });

    it('debería manejar undefined y null', () => {
      const result = cn(undefined, null, 'class1');
      expect(result).toContain('class1');
    });

    it('debería manejar combinaciones complejas', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class',
        {
          'conditional-class': true,
          'another-conditional': false,
        },
        'always-present'
      );

      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('disabled-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('another-conditional');
      expect(result).toContain('always-present');
    });
  });
});

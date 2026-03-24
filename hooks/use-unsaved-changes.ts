'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseUnsavedChangesOptions {
  /** Mensaje personalizado para el diálogo de confirmación */
  message?: string;
  /** Si está habilitado (por defecto true) */
  enabled?: boolean;
}

interface UseUnsavedChangesReturn {
  /** Marca los cambios como guardados */
  markAsSaved: () => void;
  /** Marca que hay cambios sin guardar */
  markAsDirty: () => void;
  /** Si hay cambios sin guardar */
  hasUnsavedChanges: boolean;
  /** Si está habilitado */
  isEnabled: boolean;
}

/**
 * Hook para detectar y manejar cambios sin guardar en formularios.
 * Muestra un diálogo de confirmación antes de abandonar la página.
 *
 * @example
 * ```tsx
 * const { hasUnsavedChanges, markAsDirty, markAsSaved } = useUnsavedChanges();
 *
 * // Marcar como dirty cuando hay cambios
 * <Input onChange={(e) => { handleChange(e); markAsDirty(); }} />
 *
 * // Marcar como guardado cuando se guarda exitosamente
 * <Button onClick={async () => { await save(); markAsSaved(); }} />
 * ```
 */
export function useUnsavedChanges(options: UseUnsavedChangesOptions = {}): UseUnsavedChangesReturn {
  const {
    message = '¿Estás seguro de salir? Tienes cambios sin guardar que se perderán.',
    enabled = true,
  } = options;

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);

  // Mantener ref sincronizado para uso en event handlers
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const markAsDirty = useCallback(() => {
    if (enabled) {
      setHasUnsavedChanges(true);
    }
  }, [enabled]);

  // H5-C: Handler para beforeunload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, message]);

  return {
    hasUnsavedChanges,
    markAsSaved,
    markAsDirty,
    isEnabled: enabled,
  };
}

/**
 * Versión alternativa que observa cambios en un valor específico.
 * Útil para formularios con un estado que cambia.
 *
 * @example
 * ```tsx
 * const formValues = { name: '', email: '' };
 * const { hasUnsavedChanges } = useUnsavedChangesOnValue(formValues, {
 *   compare: (a, b) => JSON.stringify(a) !== JSON.stringify(b),
 *   initialValue: initialFormValues,
 * });
 * ```
 */
export function useUnsavedChangesOnValue<T>(
  value: T,
  options: {
    compare?: (current: T, previous: T) => boolean;
    initialValue: T;
    enabled?: boolean;
    message?: string;
  }
): UseUnsavedChangesReturn {
  const {
    compare = (a, b) => a !== b,
    initialValue,
    enabled = true,
    message = '¿Estás seguro de salir? Tienes cambios sin guardar.',
  } = options;

  const previousValueRef = useRef(initialValue);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const isDifferent = compare(value, previousValueRef.current);
    if (isDifferent !== hasUnsavedChanges) {
      setHasUnsavedChanges(isDifferent);
    }
  }, [value, compare, hasUnsavedChanges, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, hasUnsavedChanges, message]);

  const markAsSaved = useCallback(() => {
    previousValueRef.current = value;
    setHasUnsavedChanges(false);
  }, [value]);

  const markAsDirty = useCallback(() => {
    if (enabled) {
      previousValueRef.current = value;
      setHasUnsavedChanges(true);
    }
  }, [enabled, value]);

  return {
    hasUnsavedChanges,
    markAsSaved,
    markAsDirty,
    isEnabled: enabled,
  };
}

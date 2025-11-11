'use client';

import type React from 'react';

import { toLocalClass } from '@/lib/class-converters';
import type { ClassStatus } from '@/lib/class-utils';
import type { LocalClassWithStatus, TableClassWithStatus } from '@/types/class';
import { useState } from 'react';
import { toast } from 'sonner';

interface UseClassManagementProps {
  classes: LocalClassWithStatus[];
  setClasses: React.Dispatch<React.SetStateAction<LocalClassWithStatus[]>>;
  fetchClasses: () => Promise<void>;
}

export function useClassManagement({ classes, setClasses, fetchClasses }: UseClassManagementProps) {
  const [classToCancel, setClassToCancel] = useState<LocalClassWithStatus | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancelClass = (cls: TableClassWithStatus) => {
    setClassToCancel(toLocalClass(cls));
    setCancelReason('');
  };

  const handleUpdateClassStatus = async (classId: string, status: ClassStatus, reason?: string) => {
    const originalClasses = [...classes];
    setClasses(prev => prev.map(c => (c.id === classId ? { ...c, status } : c)));
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/docente/clases/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo actualizar el estado de la clase.');
      }

      const responseData = await response.json();
      const updatedClass = responseData.data;

      if (updatedClass) {
        setClasses(prev => prev.map(c => (c.id === classId ? updatedClass : c)));
      }
      toast.success(`La clase ha sido marcada como ${status.toLowerCase()}.`);
      await fetchClasses();
    } catch (error) {
      setClasses(originalClasses);
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkClassAsDone = (classId: string) => {
    handleUpdateClassStatus(classId, 'REALIZADA');
  };

  const handleConfirmCancel = async () => {
    if (classToCancel) {
      await handleUpdateClassStatus(classToCancel.id, 'CANCELADA', cancelReason);
      setClassToCancel(null);
      setCancelReason('');
    }
  };

  return {
    // Dialog states
    classToCancel,
    setClassToCancel,
    cancelReason,
    setCancelReason,
    isSubmitting,

    // Handlers
    handleCancelClass,
    handleMarkClassAsDone,
    handleConfirmCancel,
  };
}

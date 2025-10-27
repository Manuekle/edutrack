'use client';

import type React from 'react';

import { toLocalClass } from '@/lib/class-converters';
import type { ClassStatus } from '@/lib/class-utils';
import * as dateUtils from '@/lib/time-utils';
import type { LocalClassWithStatus, TableClassWithStatus } from '@/types/class';
import { useState } from 'react';
import { toast } from 'sonner';

interface UseClassManagementProps {
  classes: LocalClassWithStatus[];
  setClasses: React.Dispatch<React.SetStateAction<LocalClassWithStatus[]>>;
  fetchClasses: () => Promise<void>;
}

export function useClassManagement({ classes, setClasses, fetchClasses }: UseClassManagementProps) {
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<TableClassWithStatus | null>(null);
  const [classToCancel, setClassToCancel] = useState<LocalClassWithStatus | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [classDate, setClassDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [classTopic, setClassTopic] = useState('');
  const [classDescription, setClassDescription] = useState('');

  const handleEditClass = (tableClass: TableClassWithStatus) => {
    setCurrentClass(tableClass);
    const localClass = toLocalClass(tableClass);

    // Convert date to Date object if it's a string
    const classDate = typeof localClass.date === 'string' 
      ? dateUtils.createLocalDate(localClass.date)
      : localClass.date;
    setClassDate(classDate);

    const formatTime = (time: string | Date | null | undefined): string => {
      if (!time) return '';
      return typeof time === 'string' ? time : dateUtils.formatDisplayTime(time);
    };

    setStartTime(formatTime(localClass.startTime));
    setEndTime(formatTime(localClass.endTime));
    setClassTopic(localClass.topic || '');
    setClassDescription(localClass.description || '');
    setIsEditClassDialogOpen(true);
  };

  const handleCancelClass = (cls: TableClassWithStatus) => {
    setClassToCancel(toLocalClass(cls));
    setCancelReason('');
  };

  const handleUpdateClassStatus = async (classId: string, status: ClassStatus, reason?: string) => {
    const originalClasses = [...classes];
    setClasses(prev => prev.map(c => (c.id === classId ? { ...c, status } : c)));

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

      setClasses(prev => prev.map(c => (c.id === classId ? updatedClass : c)));
      toast.success(`La clase ha sido marcada como ${status.toLowerCase()}.`);
      fetchClasses();
    } catch (error) {
      setClasses(originalClasses);
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
    }
  };

  const handleMarkClassAsDone = (classId: string) => {
    handleUpdateClassStatus(classId, 'REALIZADA');
  };

  const handleSubmitEdit = async () => {
    if (!currentClass) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/docente/clases/${currentClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: classDate ? dateUtils.formatForAPI(classDate) : '',
          startTime: startTime || '',
          endTime: endTime || '',
          topic: classTopic,
          description: classDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo actualizar la clase.');
      }

      const updatedClass = await response.json();
      setClasses(prev => prev.map(c => (c.id === updatedClass.id ? updatedClass : c)));
      toast.success('La clase ha sido actualizada correctamente.');
      setIsEditClassDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la clase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (classToCancel) {
      await handleUpdateClassStatus(classToCancel.id, 'CANCELADA', cancelReason);
      setClassToCancel(null);
      setCancelReason('');
    }
  };

  const resetEditForm = () => {
    setClassDate(new Date());
    setStartTime('');
    setEndTime('');
    setClassTopic('');
    setClassDescription('');
  };

  return {
    // Dialog states
    isEditClassDialogOpen,
    setIsEditClassDialogOpen,
    currentClass,
    classToCancel,
    setClassToCancel,
    cancelReason,
    setCancelReason,
    isSubmitting,

    // Form states
    classDate,
    setClassDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    classTopic,
    setClassTopic,
    classDescription,
    setClassDescription,

    // Handlers
    handleEditClass,
    handleCancelClass,
    handleMarkClassAsDone,
    handleSubmitEdit,
    handleConfirmCancel,
    resetEditForm,
  };
}

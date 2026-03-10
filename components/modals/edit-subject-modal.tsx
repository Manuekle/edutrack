'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Teacher {
  id: string;
  name: string | null;
  correoInstitucional: string | null;
  codigoDocente: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  program?: string | null;
  group?: string | null;
  teacherIds: string[];
  teachers: Teacher[];
  studentCount: number;
  classCount: number;
}

interface EditSubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onSubjectUpdate: (subject: Subject) => void;
}

/** Solo se pueden editar: grupo, programa y docente */
const editSubjectSchema = z.object({
  group: z.string().optional(),
  program: z.string().optional(),
  teacherId: z.string().min(1, 'El docente es requerido'),
});

type EditSubjectFormValues = z.infer<typeof editSubjectSchema>;

export function EditSubjectModal({
  subject,
  isOpen,
  onClose,
  onSubjectUpdate,
}: EditSubjectModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const form = useForm<EditSubjectFormValues>({
    resolver: zodResolver(editSubjectSchema),
    defaultValues: {
      group: '',
      program: '',
      teacherId: '',
    },
  });

  useEffect(() => {
    if (subject && isOpen) {
      form.reset({
        group: subject.group || '',
        program: subject.program || '',
        teacherId: subject.teacherIds[0] || '',
      });
      fetchTeachers();
    }
  }, [subject, isOpen, form]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const response = await fetch('/api/admin/users?role=DOCENTE');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.data || data);
      }
    } catch (error) {
      sileo.error({ title: 'Error al cargar los docentes' });
    } finally {
      setLoadingTeachers(false);
    }
  };

  const onSubmit = async (data: EditSubjectFormValues) => {
    if (!subject) {
      sileo.error({ title: 'No hay asignatura seleccionada para editar' });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: data.group || undefined,
          program: data.program || undefined,
          teacherId: data.teacherId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || 'No se pudo actualizar la asignatura.'
        );
      }

      const responseData = await response.json();
      const updatedSubject: Subject = responseData.data || responseData;

      if (!updatedSubject) {
        throw new Error('La respuesta del servidor no contiene datos válidos');
      }

      sileo.success({ title: 'Asignatura actualizada con éxito.' });
      onSubjectUpdate(updatedSubject);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        sileo.error({ title: err.message });
      } else {
        sileo.error({ title: 'Ocurrió un error inesperado.' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (!subject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg font-sans">
        <DialogHeader>
          <DialogTitle className="tracking-card sm:text-2xl text-xs">
            Editar Asignatura
          </DialogTitle>
          <DialogDescription className="text-xs">
            {subject.name} ({subject.code}). Solo puedes editar grupo, programa y docente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej. A, B, 01"
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="program"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programa</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej. Ingeniería de Sistemas"
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Docente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingTeachers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un docente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="font-sans">
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name ?? 'Sin nombre'}{' '}
                          {teacher.codigoDocente ? `(${teacher.codigoDocente})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
import { toast } from 'sonner';

interface Teacher {
  id: string;
  name: string;
  correoInstitucional: string;
  codigoDocente: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  program?: string | null;
  semester?: number | null;
  credits?: number | null;
  teacherId: string;
  teacher: Teacher;
  studentCount: number;
  classCount: number;
}

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectCreated: (subject: Subject) => void;
}

const createSubjectSchema = z.object({
  name: z.string().min(1, 'El nombre de la asignatura es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  program: z.string().optional(),
  semester: z
    .string()
    .optional()
    .refine(
      val => !val || (Number(val) >= 1 && Number(val) <= 10),
      'El semestre debe ser un número entre 1 y 10'
    ),
  credits: z
    .string()
    .optional()
    .refine(
      val => !val || (Number(val) >= 1 && Number(val) <= 10),
      'Los créditos deben ser un número entre 1 y 10'
    ),
  teacherId: z.string().min(1, 'El docente es requerido'),
});

type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;

export function CreateSubjectModal({ isOpen, onClose, onSubjectCreated }: CreateSubjectModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const form = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: '',
      code: '',
      program: '',
      semester: '',
      credits: '',
      teacherId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const response = await fetch('/api/admin/users?role=DOCENTE');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.data || data);
      }
    } catch (error) {
      toast.error('Error al cargar los docentes');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const onSubmit = async (data: CreateSubjectFormValues) => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          semester: data.semester ? parseInt(data.semester, 10) : null,
          credits: data.credits ? parseInt(data.credits, 10) : null,
          program: data.program || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'No se pudo crear la asignatura.');
      }

      const responseData = await response.json();
      const createdSubject: Subject = responseData.data || responseData;

      if (!createdSubject) {
        throw new Error('La respuesta del servidor no contiene datos válidos');
      }

      toast.success('Asignatura creada con éxito.');
      onSubjectCreated(createdSubject);
      onClose();
      form.reset();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Ocurrió un error inesperado.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg font-sans">
        <DialogHeader>
          <DialogTitle className="tracking-card sm:text-3xl text-2xl">Crear Nueva Asignatura</DialogTitle>
          <DialogDescription className="text-xs">
            Completa los datos para crear una nueva asignatura en el sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Asignatura</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Programación Orientada a Objetos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: CS101" {...field} />
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
                      <Input placeholder="Ej: Ingeniería de Sistemas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semestre</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" placeholder="1-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Créditos</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" placeholder="1-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                          {teacher.name} {teacher.codigoDocente ? `(${teacher.codigoDocente})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear Asignatura'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

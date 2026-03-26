'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
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
import type { User } from '@/types';
import { Role } from '@prisma/client';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
}

const createUserSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido'),
    personalEmail: z.string().email('Correo personal inválido').optional().or(z.literal('')),
    institutionalEmail: z
      .string()
      .email('Correo institucional inválido')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.nativeEnum(Role),
    document: z.string().optional(),
    phone: z.string().optional(),
    studentCode: z.string().optional(),
    teacherCode: z.string().optional(),
  })
  .refine(data => data.personalEmail || data.institutionalEmail, {
    message: 'Debes proporcionar al menos un correo (personal o institucional)',
    path: ['personalEmail'],
  });

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // H5-C: Detectar cambios sin guardar
  const { hasUnsavedChanges, markAsSaved, markAsDirty } = useUnsavedChanges({
    message: '¿Estás seguro de cerrar? Los cambios sin guardar se perderán.',
  });

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      personalEmail: '',
      institutionalEmail: '',
      password: '',
      role: Role.ESTUDIANTE,
      document: '',
      phone: '',
      studentCode: '',
      teacherCode: '',
    },
  });

  // H5-C: Marcar dirty cuando el formulario tiene cambios
  useEffect(() => {
    if (isOpen && form.formState.isDirty) {
      markAsDirty();
    }
  }, [isOpen, form.formState.isDirty, markAsDirty]);

  // H5-C: Manejar cierre con cambios sin guardar
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        '¿Estás seguro de cerrar? Los cambios sin guardar se perderán.'
      );
      if (!confirmed) return;
    }
    markAsSaved();
    form.reset();
    onClose();
  };

  const role = form.watch('role');

  const onSubmit = async (data: CreateUserFormValues) => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          password: data.password,
          role: data.role,
          personalEmail: data.personalEmail || undefined,
          institutionalEmail: data.institutionalEmail || undefined,
          document: data.document || undefined,
          phone: data.phone || undefined,
          studentCode: data.studentCode || undefined,
          teacherCode: data.teacherCode || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'No se pudo crear el usuario.');
      }

      const responseData = await response.json();
      const createdUser: User = responseData.data || responseData;

      if (!createdUser) {
        throw new Error('La respuesta del servidor no contiene datos válidos');
      }

      sileo.success({ title: 'Usuario creado con éxito.' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // H5-C: Marcar como guardado después de éxito
      markAsSaved();
      form.reset();
      onClose();
      onUserCreated(createdUser);
    } catch (err) {
      if (err instanceof Error) {
        sileo.error({ title: err.message });
      } else {
        sileo.error({ title: 'Ocurrió un error inesperado.' });
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg font-sans">
        <DialogHeader>
          <DialogTitle className="tracking-card sm:text-2xl text-xs">
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription className="text-xs">
            Completa los datos para crear un nuevo usuario. Al menos un correo es requerido.
            {hasUnsavedChanges && (
              <span className="block mt-1 text-amber-600 dark:text-amber-500 font-medium">
                ⚠ Tienes cambios sin guardar
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="personalEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Personal</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="correo@personal.com…"
                        className="text-xs"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="institutionalEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Institucional</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="correo@institucional.com…"
                        className="text-xs"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres…"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento</FormLabel>
                    <FormControl>
                      <Input className="text-xs" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input className="text-xs" autoComplete="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="font-sans">
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="DOCENTE">Docente</SelectItem>
                      <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === 'ESTUDIANTE' && (
              <FormField
                control={form.control}
                name="studentCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Estudiante</FormLabel>
                    <FormControl>
                      <Input className="text-xs" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {role === 'DOCENTE' && (
              <FormField
                control={form.control}
                name="teacherCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Docente</FormLabel>
                    <FormControl>
                      <Input className="text-xs" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

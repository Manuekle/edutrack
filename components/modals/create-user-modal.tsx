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
import type { User } from '@/types';
import { Role } from '@prisma/client';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
}

const createUserSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido'),
    correoPersonal: z.string().email('Correo personal inválido').optional().or(z.literal('')),
    correoInstitucional: z
      .string()
      .email('Correo institucional inválido')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.nativeEnum(Role),
    document: z.string().optional(),
    telefono: z.string().optional(),
    codigoEstudiantil: z.string().optional(),
    codigoDocente: z.string().optional(),
  })
  .refine(data => data.correoPersonal || data.correoInstitucional, {
    message: 'Debes proporcionar al menos un correo (personal o institucional)',
    path: ['correoPersonal'],
  });

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      correoPersonal: '',
      correoInstitucional: '',
      password: '',
      role: Role.ESTUDIANTE,
      document: '',
      telefono: '',
      codigoEstudiantil: '',
      codigoDocente: '',
    },
  });

  const role = form.watch('role');

  const onSubmit = async (data: CreateUserFormValues) => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          correoPersonal: data.correoPersonal || undefined,
          correoInstitucional: data.correoInstitucional || undefined,
          document: data.document || undefined,
          telefono: data.telefono || undefined,
          codigoEstudiantil: data.codigoEstudiantil || undefined,
          codigoDocente: data.codigoDocente || undefined,
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

      toast.success('Usuario creado con éxito.');
      onUserCreated(createdUser);
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
          <DialogTitle className="tracking-card sm:text-3xl text-2xl">Crear Nuevo Usuario</DialogTitle>
          <DialogDescription className="text-xs">
            Completa los datos para crear un nuevo usuario. Al menos un correo es requerido.
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
                    <Input placeholder="Nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="correoPersonal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Personal</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="correo@personal.com"
                        className="text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="correoInstitucional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Institucional</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="correo@institucional.com"
                        className="text-xs"
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
                    <Input type="password" className="text-xs" {...field} />
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
                      <Input className="text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input className="text-xs" {...field} />
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
                      <SelectItem value="COORDINADOR">Coordinador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === 'ESTUDIANTE' && (
              <FormField
                control={form.control}
                name="codigoEstudiantil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Estudiante</FormLabel>
                    <FormControl>
                      <Input className="text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {role === 'DOCENTE' && (
              <FormField
                control={form.control}
                name="codigoDocente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Docente</FormLabel>
                    <FormControl>
                      <Input className="text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
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

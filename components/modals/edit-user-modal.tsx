'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Role, User } from '@/types';
import { ROLES } from '@/types';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

const ROLES_TUPLE = ['ADMIN', 'DOCENTE', 'ESTUDIANTE', 'COORDINADOR'] as const;

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

// Nombre: mínimo 2 caracteres, permite letras (ñ, tildes) y espacios
const editUserSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .refine(
        (v) => /^[\p{L}\s]+$/u.test(v.trim()) && v.trim().length >= 2,
        'El nombre debe tener al menos 2 caracteres (se permiten ñ y tildes)'
      ),
    document: z.string().min(1, 'El documento es obligatorio').optional().or(z.literal('')),
    correoPersonal: z
      .string()
      .email('Correo personal inválido')
      .optional()
      .or(z.literal('')),
    correoInstitucional: z
      .string()
      .email('Correo institucional inválido')
      .optional()
      .or(z.literal('')),
    telefono: z.string().optional(),
    codigoEstudiantil: z.string().optional(),
    codigoDocente: z.string().optional(),
    role: z.enum(ROLES_TUPLE),
    isActive: z.boolean(),
  })
  .refine(
    (data) =>
      (data.correoPersonal && data.correoPersonal.trim() !== '') ||
      (data.correoInstitucional && data.correoInstitucional.trim() !== ''),
    { message: 'Debe haber al menos un correo (personal o institucional)', path: ['correoPersonal'] }
  );

type EditUserFormValues = z.infer<typeof editUserSchema>;

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onUserUpdate,
}: EditUserModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      document: '',
      correoPersonal: '',
      correoInstitucional: '',
      telefono: '',
      codigoEstudiantil: '',
      codigoDocente: '',
      role: 'ESTUDIANTE',
      isActive: true,
    },
  });

  const role = form.watch('role');

  useEffect(() => {
    if (isOpen && user) {
      form.reset({
        name: user.name ?? '',
        document: user.document ?? '',
        correoPersonal: user.correoPersonal ?? '',
        correoInstitucional: user.correoInstitucional ?? '',
        telefono: user.telefono ?? '',
        codigoEstudiantil: user.codigoEstudiantil ?? '',
        codigoDocente: user.codigoDocente ?? '',
        role: (user.role as Role) ?? 'ESTUDIANTE',
        isActive: user.isActive ?? true,
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          document: data.document?.trim() || undefined,
          correoPersonal: data.correoPersonal?.trim() || undefined,
          correoInstitucional: data.correoInstitucional?.trim() || undefined,
          telefono: data.telefono?.trim() || undefined,
          codigoEstudiantil: data.codigoEstudiantil?.trim() || undefined,
          codigoDocente: data.codigoDocente?.trim() || undefined,
          role: data.role,
          isActive: data.isActive,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Error al guardar');
      }

      const updatedUser = await response.json();
      onUserUpdate(updatedUser);
      sileo.success({ title: 'Usuario actualizado correctamente.' });
      onClose();
    } catch (e) {
      sileo.error({
        title: e instanceof Error ? e.message : 'Error al actualizar el usuario.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans sm:text-2xl text-xs font-semibold tracking-card">
            Editar usuario
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del usuario. Se permiten caracteres como ñ y tildes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. María Peña" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Documento de identidad" {...field} />
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
                    <FormLabel>Correo personal</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="correo@ejemplo.com" {...field} />
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
                    <FormLabel>Correo institucional</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="correo@institucion.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Teléfono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r.charAt(0) + r.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
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
                    <FormLabel>Código estudiantil</FormLabel>
                    <FormControl>
                      <Input placeholder="Código" {...field} />
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
                    <FormLabel>Código docente</FormLabel>
                    <FormControl>
                      <Input placeholder="Código" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel>Usuario activo</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

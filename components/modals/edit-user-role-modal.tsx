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
import { toast } from 'sonner';

interface EditUserRoleModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

const editUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'DOCENTE', 'ESTUDIANTE', 'COORDINADOR'] as const),
});

type EditUserRoleFormValues = z.infer<typeof editUserRoleSchema>;

export function EditUserRoleModal({ user, isOpen, onClose, onUserUpdate }: EditUserRoleModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EditUserRoleFormValues>({
    resolver: zodResolver(editUserRoleSchema),
    defaultValues: {
      role: (user?.role as Role) || 'ESTUDIANTE',
    },
  });

  // Resetear el formulario cuando el modal se abre o cambia el usuario
  useEffect(() => {
    if (isOpen && user?.role) {
      form.reset({
        role: user.role as Role,
      });
    }
  }, [isOpen, user?.role, form]);

  const onSubmit = async (data: EditUserRoleFormValues) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: data.role }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el rol del usuario');
      }

      const updatedUser = await response.json();
      onUserUpdate(updatedUser);
      toast.success(`El rol de ${updatedUser.name} ha sido actualizado a ${updatedUser.role}.`);
      onClose();
    } catch (error) {
      toast.error('Error al actualizar el rol del usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg font-sans" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold tracking-card">
            Editar Rol de {user.name}
          </DialogTitle>
          <DialogDescription>
            Selecciona el nuevo rol para el usuario. Este cambio afectará sus permisos en el
            sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

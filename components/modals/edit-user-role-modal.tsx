'use client';

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

export function EditUserRoleModal({ user, isOpen, onClose, onUserUpdate }: EditUserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Resetear el estado cuando el modal se abre o cambia el usuario
  useEffect(() => {
    if (isOpen && user?.role) {
      setSelectedRole(user.role as Role);
    } else {
      setSelectedRole(null);
    }
  }, [isOpen, user?.role]);

  const handleSave = async () => {
    if (!user || !selectedRole) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el rol del usuario');
      }

      const updatedUser = await response.json();
      onUserUpdate(updatedUser);
      toast.success(`El rol de ${updatedUser.name} ha sido actualizado a ${updatedUser.role}.`);
      onClose();
    } catch (error) {
      console.error(error);
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
          <DialogTitle className="font-sans text-xl font-semibold tracking-tight">
            Editar Rol de {user.name}
          </DialogTitle>
          <DialogDescription>
            Selecciona el nuevo rol para el usuario. Este cambio afectará sus permisos en el
            sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select
            value={selectedRole || ''}
            onValueChange={value => setSelectedRole(value as Role)}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(role => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedRole}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

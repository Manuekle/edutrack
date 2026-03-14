'use client';

import { CargarUsuarioTab } from '@/components/admin/cargar-usuario-tab';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Role } from '@prisma/client';
import {
  Edit2,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface UserData {
  id: string;
  name: string | null;
  institutionalEmail: string | null;
  personalEmail: string | null;
  role: Role;
  isActive: boolean;
  document: string | null;
  studentCode?: string | null;
  teacherCode?: string | null;
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    institutionalEmail: '',
    personalEmail: '',
    role: 'ESTUDIANTE' as Role,
    document: '',
    password: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users?limit=100');
      const data = await res.json();
      if (data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      sileo.error({ title: 'No se pudieron cargar los usuarios' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingUserId ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
      const method = editingUserId ? 'PATCH' : 'POST';

      const payload = {
        name: formData.name,
        institutionalEmail: formData.institutionalEmail,
        personalEmail: formData.personalEmail,
        role: formData.role,
        document: formData.document,
        ...(formData.password ? { password: formData.password } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        sileo.success({ title: editingUserId ? 'Usuario actualizado' : 'Usuario creado con éxito' });
        setIsDialogOpen(false);
        fetchUsers();
        resetForm();
      } else {
        const err = await res.json();
        sileo.error({ title: err.message || 'Error al procesar el usuario' });
      }
    } catch (error) {
      sileo.error({ title: 'Ocurrió un error inesperado' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        sileo.success({ title: 'Usuario eliminado' });
        setIsDeleteDialogOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        sileo.error({ title: err.message || 'No se pudo eliminar el usuario' });
      }
    } catch (error) {
      sileo.error({ title: 'Ocurrió un error al eliminar' });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      institutionalEmail: '',
      personalEmail: '',
      role: 'ESTUDIANTE',
      document: '',
      password: '',
    });
    setEditingUserId(null);
  };

  const stats = React.useMemo(() => [
    { label: 'Total Usuarios', count: users.length },
    { label: 'Docentes', count: users.filter(u => u.role === 'DOCENTE').length },
    { label: 'Alumnos', count: users.filter(u => u.role === 'ESTUDIANTE').length },
    { label: 'Administradores', count: users.filter(u => u.role === 'ADMIN').length },
  ], [users]);

  const handleEditUser = (user: UserData) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name || '',
      institutionalEmail: user.institutionalEmail || '',
      personalEmail: user.personalEmail || '',
      role: user.role,
      document: user.document || '',
      password: '', // Password is not returned or editable via this form normally
    });
    setIsDialogOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.institutionalEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.document?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });


  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'DOCENTE':
        return 'Docente';
      case 'ESTUDIANTE':
        return 'Estudiante';
      default:
        return role;
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      case 'DOCENTE':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'ESTUDIANTE':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          Gestión de Usuarios
        </h1>
        <p className="text-muted-foreground text-sm">
          Administra los roles, accesos y datos personales de toda la comunidad académica.
        </p>
      </div>

      <div className="flex gap-2">
        <Tabs defaultValue="listado" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md  text-xs mb-6 mx-auto">
            <TabsTrigger value="listado" className="text-xs h-7">Listado de Usuarios</TabsTrigger>
            <TabsTrigger value="docentes" className="text-xs h-7">Cargar Docentes</TabsTrigger>
            <TabsTrigger value="estudiantes" className="text-xs h-7">Cargar Estudiantes</TabsTrigger>
          </TabsList>

          <TabsContent value="listado" className="mt-4 space-y-6">
            <div className="flex justify-end gap-2">
              <Dialog
                open={isDialogOpen}
                onOpenChange={open => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className=" px-4 shadow-sm gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs font-semibold">Nuevo Usuario</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-xl border shadow-2xl">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold tracking-card">
                        {editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        Completa los datos necesarios para gestionar el acceso al sistema.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold ml-1">
                          Nombre Completo
                        </Label>
                        <Input
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className=" text-xs"
                          placeholder="Ej: Juan Pérez"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold ml-1">
                            Documento
                          </Label>
                          <Input
                            value={formData.document}
                            onChange={e => setFormData({ ...formData, document: e.target.value })}
                            className=" text-xs"
                            placeholder="Identificación"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold ml-1">
                            Rol
                          </Label>
                          <Select
                            value={formData.role}
                            onValueChange={(v: Role) => setFormData({ ...formData, role: v })}
                          >
                            <SelectTrigger className=" text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border shadow-xl">
                              <SelectItem value="ADMIN" className="text-xs">Administrador</SelectItem>
                              <SelectItem value="DOCENTE" className="text-xs">Docente</SelectItem>
                              <SelectItem value="ESTUDIANTE" className="text-xs">Estudiante</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {!editingUserId && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold ml-1">
                            Contraseña
                          </Label>
                          <Input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className=" text-xs"
                            placeholder="••••••••"
                            required={!editingUserId}
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold ml-1">
                          Correo Institucional
                        </Label>
                        <Input
                          value={formData.institutionalEmail}
                          onChange={e =>
                            setFormData({ ...formData, institutionalEmail: e.target.value })
                          }
                          className=" text-xs"
                          placeholder="usuario@fup.edu.co"
                          required
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="submit"
                        className="w-full  font-semibold text-xs"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editingUserId ? (
                          'Guardar Cambios'
                        ) : (
                          'Crear Usuario'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {stats.map(stat => (
                <Card key={stat.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold">{loading ? '—' : stat.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="px-5 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      placeholder="Buscar por nombre, documento o correo..."
                      className="pl-9  bg-background border-border/40 text-xs"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className=" bg-background border-border/40 w-full sm:w-44 text-xs">
                        <SelectValue placeholder="Filtrar Rol" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border shadow-xl">
                        <SelectItem value="all" className="text-xs">Todos los roles</SelectItem>
                        <SelectItem value="ADMIN" className="text-xs">Administradores</SelectItem>
                        <SelectItem value="DOCENTE" className="text-xs">Docentes</SelectItem>
                        <SelectItem value="ESTUDIANTE" className="text-xs">Estudiantes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Usuario</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Documento</TableHead>
                      <TableHead className="text-xs font-semibold hidden sm:table-cell">Rol</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground/30" />
                            <p className="text-sm font-semibold text-foreground">No hay usuarios</p>
                            <p className="text-xs text-muted-foreground">
                              {searchTerm ? 'No hay resultados para tu búsqueda.' : 'Aún no hay usuarios registrados.'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map(user => (
                        <TableRow key={user.id} className="group">
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-semibold text-[10px]',
                                getRoleColor(user.role)
                              )}>
                                {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{user.institutionalEmail}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 hidden md:table-cell">
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                              {user.document}
                            </code>
                          </TableCell>
                          <TableCell className="py-3 hidden sm:table-cell">
                            <Badge variant="secondary" className={cn(
                              'rounded-md px-1.5 py-0 text-[9px] font-semibold uppercase border-none',
                              getRoleColor(user.role)
                            )}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border">
                                <DropdownMenuItem className="cursor-pointer gap-2 py-2.5 rounded-lg text-blue-500 focus:bg-blue-500/10" onClick={() => handleEditUser(user)}>
                                  <Edit2 className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-primary">Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer gap-2 py-2.5 rounded-lg text-destructive focus:bg-destructive/10" onClick={() => {
                                  setUserToDelete(user);
                                  setIsDeleteDialogOpen(true);
                                }}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  <span className="text-destructive">Eliminar</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent className="rounded-xl border shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg tracking-card font-semibold text-destructive">
                    ¿Eliminar usuario?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    Estás por eliminar a <strong className="text-foreground">{userToDelete?.name}</strong>. Esta acción es irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-lg  text-xs">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteUser}
                    className="rounded-lg  text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar Permanentemente'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="docentes" className="mt-0">
            <CargarUsuarioTab type="DOCENTE" />
          </TabsContent>
          <TabsContent value="estudiantes" className="mt-0">
            <CargarUsuarioTab type="ESTUDIANTE" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

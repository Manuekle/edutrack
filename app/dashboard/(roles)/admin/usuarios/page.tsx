'use client';

import { CreateUserModal } from '@/components/modals/create-user-modal';
import { EditUserRoleModal } from '@/components/modals/edit-user-role-modal';
import { TablePagination } from '@/components/shared/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import { useUsers } from '@/hooks/use-users';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Search, UserCheck, UserCog, UserX, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const ITEMS_PER_PAGE = [5, 10, 20, 50, 100] as const;

export default function GestionUsuariosPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Debounce para búsqueda
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Usar React Query para obtener usuarios
  const { users, pagination, isLoading, toggleActive, isTogglingActive, refetch } = useUsers({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
    role: selectedRole,
    isActive: selectedStatus,
    enabled: true,
  });

  const handleUserUpdate = (updatedUser: User) => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handleUserCreated = (newUser: User) => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handleToggleActive = async (user: User) => {
    toggleActive({ userId: user.id, isActive: !user.isActive });
  };

  // Resetear a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedRole, selectedStatus]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full" id="tour-users-title">
          <CardTitle className="text-xl sm:text-2xl font-semibold tracking-card text-foreground">
            Gestión de Usuarios
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Administra los usuarios y sus permisos en el sistema
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2">
          <Button variant="default" onClick={() => setIsCreateModalOpen(true)} className="gap-2" id="tour-users-create">
            <span>Nuevo Usuario</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <span>Cargar Usuarios</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Tipo de carga</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/docentes/cargar" className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  <span className="text-xs">Cargar Docentes</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/estudiantes/cargar" className="cursor-pointer">
                  <UserCheck className="mr-2 h-4 w-4" />
                  <span className="text-xs">Cargar Estudiantes</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div className="flex flex-wrap items-center gap-2" id="tour-users-filters">
              <div className="relative w-full md:w-[250px]">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email…"
                  className="pl-9 h-9 text-xs bg-background"
                  name="search"
                  autoComplete="off"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full md:w-32 h-9 text-xs bg-background">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todos los roles</SelectItem>
                    <SelectItem value="ESTUDIANTE" className="text-xs">Estudiante</SelectItem>
                    <SelectItem value="DOCENTE" className="text-xs">Docente</SelectItem>
                    <SelectItem value="ADMIN" className="text-xs">Administrador</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-32 h-9 text-xs bg-background">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todos los estados</SelectItem>
                    <SelectItem value="true" className="text-xs">Activo</SelectItem>
                    <SelectItem value="false" className="text-xs">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>


        <div className="p-0" id="tour-users-table">
          <div className="bg-card border rounded-md overflow-hidden shadow-sm">
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Usuario</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Documento</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Correo</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Rol</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">Código</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-center">Estado</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: itemsPerPage }).map((_, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 group">
                        <TableCell className="px-4 py-3">
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-[120px]" />
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-4 w-[90px]" />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-4 w-[160px]" />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-5 w-[60px] rounded-md" />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-4 w-[80px]" />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex justify-center">
                            <Skeleton className="h-5 w-[70px] rounded-md" />
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {searchTerm ? (
                          <div className="flex flex-col items-center justify-center py-6">
                            <Search className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">
                              No se encontraron usuarios que coincidan con "{searchTerm}"
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6">
                            <p className="text-xs text-muted-foreground">
                              No hay usuarios registrados
                            </p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id} className="hover:bg-muted/50 group transition-colors">
                        <TableCell className="px-4 py-3">
                          <span className="font-semibold text-foreground text-xs">
                            {user.name || 'Usuario sin nombre'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-xs font-mono text-muted-foreground">
                            {user.document || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span
                            className="text-xs text-muted-foreground truncate max-w-[200px] inline-block"
                            title={user.correoInstitucional || user.correoPersonal || 'Sin correo'}
                          >
                            {user.correoInstitucional || user.correoPersonal || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0.5 font-normal rounded-md bg-muted/60 text-muted-foreground">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-xs text-muted-foreground font-semibold">
                            {user.role === 'ESTUDIANTE' ? user.codigoEstudiantil || '—' : '—'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex justify-center lowercase text-xs font-normal">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 font-normal rounded-md',
                                user.isActive
                                  ? 'border-success/30 text-success bg-success/10'
                                  : 'border-destructive/30 text-destructive bg-destructive/10'
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    user.isActive ? 'bg-success' : 'bg-destructive'
                                  )}
                                ></span>
                                {user.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-xs font-sans">
                                  Acciones
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <UserCog className="mr-2 h-4 w-4" />
                                  <span className="text-xs font-sans">Editar rol</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleActive(user)}
                                  disabled={isTogglingActive}
                                  className={cn(
                                    'cursor-pointer',
                                    user.isActive ? 'text-destructive' : 'text-success'
                                  )}
                                >
                                  {user.isActive ? (
                                    <UserX className="mr-2 h-4 w-4" />
                                  ) : (
                                    <UserCheck className="mr-2 h-4 w-4" />
                                  )}
                                  <span className="text-xs font-sans">
                                    {user.isActive ? 'Desactivar' : 'Activar'}
                                  </span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Mostrar</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={value => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[65px] text-[11px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE.map(pageSize => (
                    <SelectItem
                      key={pageSize}
                      value={pageSize.toString()}
                      className="text-[11px]"
                    >
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalItems={pagination?.total || 0}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <EditUserRoleModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserUpdate={handleUserUpdate}
      />
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}

'use client';

import { CreateUserModal } from '@/components/modals/create-user-modal';
import { EditUserRoleModal } from '@/components/modals/edit-user-role-modal';
import { TablePagination } from '@/components/shared/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { MoreHorizontal, Search, UserCheck, UserCog, UserX } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const ITEMS_PER_PAGE = [5, 10, 20, 50, 100] as const;

export default function GestionUsuariosPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Usar React Query para obtener usuarios
  const { users, pagination, isLoading, toggleActive, isTogglingActive, refetch } = useUsers({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    enabled: true,
  });

  const handleUserUpdate = (updatedUser: User) => {
    // Invalidar la query para refrescar los datos
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handleUserCreated = (newUser: User) => {
    // Invalidar la query para refrescar los datos
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handleToggleActive = async (user: User) => {
    toggleActive({ userId: user.id, isActive: !user.isActive });
  };

  // Resetear a la primera página cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <CardHeader className="p-0 w-full">
          <CardTitle className="text-2xl font-semibold tracking-card">
            Gestión de Usuarios
          </CardTitle>
          <CardDescription className="text-xs">
            Administra los usuarios y sus permisos en el sistema
          </CardDescription>
        </CardHeader>
        <div className="flex gap-2">
          <Button variant="default" onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <span>Nuevo Usuario</span>
          </Button>
          <Link href="/dashboard/admin/usuarios/cargar-usuarios">
            <Button variant="outline" className="gap-2">
              <span>Cargar Usuarios</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b px-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold tracking-card">
                Lista de Usuarios
              </CardTitle>
              <CardDescription className="text-xs">
                {pagination?.total || 0} usuario
                {pagination?.total !== 1 ? 's' : ''} encontrado
                {pagination?.total !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-9 w-full md:w-[300px] text-xs"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 pb-5 border-b">
            <div className="flex items-center gap-2 p-0">
              <p className="text-xs text-muted-foreground whitespace-nowrap">Mostrar</p>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={value => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE.map(pageSize => (
                    <SelectItem
                      key={pageSize}
                      value={pageSize.toString()}
                      className="text-xs font-semibold text-muted-foreground font-sans"
                    >
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground whitespace-nowrap">por página</p>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-md hidden sm:block">
              Página <span className="font-normal">{currentPage}</span> de{' '}
              <span className="font-normal">{pagination?.totalPages || 1}</span>
            </div>
          </div>

          <div className="relative overflow-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-normal px-4 py-2">Usuario</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Correo</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Rol</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Código</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Estado</TableHead>
                  <TableHead className="text-xs font-normal text-right px-4 py-2">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex justify-center">
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 text-right">
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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
                    <TableRow key={user.id} className="hover:bg-muted/50 group">
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-normal text-foreground">
                              {user.name || 'Usuario sin nombre'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.document || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex items-center">
                          <span
                            className="truncate max-w-[200px]"
                            title={user.correoInstitucional || user.correoPersonal || 'Sin correo'}
                          >
                            {user.correoInstitucional || user.correoPersonal || 'Sin correo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <Badge className="text-xs font-normal" variant="outline">
                          {user.role.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="text-xs text-muted-foreground">
                          {user.role === 'ESTUDIANTE' ? user.codigoEstudiantil || 'N/A' : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        <div className="flex justify-center lowercase text-xs font-normal">
                          {user.isActive ? (
                            <>
                              <Badge variant="outline" className="font-normal text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Activo
                                </span>
                              </Badge>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline" className="font-normal text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Inactivo
                                </span>
                              </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
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
                                  user.isActive ? 'text-red-600' : 'text-green-600'
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

          <div className="px-4 py-3 border-t">
            <TablePagination
              currentPage={currentPage}
              totalItems={pagination?.total || 0}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>

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

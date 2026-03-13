'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
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
import { Card, CardContent } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Room, RoomType } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  Building2,
  Computer,
  Download,
  Edit2,
  Layout,
  Loader2,
  Mic2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { sileo } from 'sileo';



export default function AdminSalasPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'SALON' as RoomType,
    capacity: '',
    description: '',
  });
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CSV Upload State (carga masiva inline en pestaña Espacios)
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreviewData, setUploadPreviewData] = useState<any[]>([]);
  const [isUploadPreview, setIsUploadPreview] = useState(false);



  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/admin/rooms');
      const data = await response.json();
      setRooms(response.ok ? data : []);
    } catch (error) {
      sileo.error({ title: 'Error al cargar salas' });
    }
  };



  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRooms();
      setLoading(false);
    };
    init();
  }, []);

  const handleEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity?.toString() || '',
      description: room.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/rooms/${roomToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        sileo.success({ title: 'Sala eliminada exitosamente' });
        setIsDeleteDialogOpen(false);
        setRoomToDelete(null);
        fetchRooms();
      } else {
        const error = await response.json();
        sileo.error({ title: error.error || 'Error al eliminar sala' });
      }
    } catch (error) {
      sileo.error({ title: 'Error de red' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadPreview = async () => {
    if (!uploadFile) {
      sileo.error({ title: 'Selecciona un archivo primero' });
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('preview', 'true');
      const response = await fetch('/api/admin/salas/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUploadPreviewData(data.previewData || []);
        setIsUploadPreview(true);
      } else {
        sileo.error({ title: data.error || 'Error al procesar archivo' });
      }
    } catch (e) {
      sileo.error({ title: 'Error de red' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadConfirm = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const response = await fetch('/api/admin/salas/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        sileo.success({
          title: `Se procesaron ${data.created} salas. Hubo ${data.errors} repetidas.`,
        });
        setUploadFile(null);
        setIsUploadPreview(false);
        setUploadPreviewData([]);
        fetchRooms();
      } else {
        sileo.error({ title: data.error || 'Error al procesar archivo' });
      }
    } catch (e) {
      sileo.error({ title: 'Error de red' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRoomId ? `/api/admin/rooms/${editingRoomId}` : '/api/admin/rooms';
      const method = editingRoomId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        sileo.success({
          title: editingRoomId ? 'Sala actualizada exitosamente' : 'Sala creada exitosamente',
        });
        setIsDialogOpen(false);
        setEditingRoomId(null);
        setFormData({ name: '', type: 'SALON', capacity: '', description: '' });
        fetchRooms();
      } else {
        const error = await response.json();
        sileo.error({ title: error.error || 'Error al procesar solicitud' });
      }
    } catch (error) {
      sileo.error({ title: 'Error de red' });
    }
  };

  const getTypeIcon = (type: RoomType) => {
    switch (type) {
      case 'SALA_COMPUTO':
        return <Computer className="h-4 w-4" />;
      case 'SALON':
        return <Building2 className="h-4 w-4" />;
      case 'AUDITORIO':
        return <Mic2 className="h-4 w-4" />;
      default:
        return <Layout className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: RoomType) => {
    switch (type) {
      case 'SALA_COMPUTO':
        return 'Sala de Cómputo';
      case 'SALON':
        return 'Salón de Clase';
      case 'AUDITORIO':
        return 'Auditorio';
      default:
        return type;
    }
  };

  const filteredRooms = rooms.filter(
    room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTypeLabel(room.type).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Tabs defaultValue="list" className="flex flex-col gap-8 h-full">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        id="tour-salas-title"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
            Gestión de Salas
          </h1>
          <p className="text-muted-foreground text-[15px] mt-1 max-w-2xl">
            Administración de espacios físicos. La asignación a grupos se hace en Planeador →
            Asignación.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TabsList
            className="flex items-center p-1 gap-1 bg-muted/30 rounded-full border border-muted/50 h-auto"
            id="tour-salas-tabs"
          >
            <TabsTrigger
              value="list"
              className="rounded-full px-5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground"
            >
              Espacios
            </TabsTrigger>

          </TabsList>

          <div className="flex gap-2" id="tour-salas-actions">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="rounded-full px-5 gap-2 shadow-sm"
                  onClick={() => {
                    setEditingRoomId(null);
                    setFormData({ name: '', type: 'SALON', capacity: '', description: '' });
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Nueva Sala</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-2xl border border-border">
                <form onSubmit={handleSubmit} className="space-y-6 p-2">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                      {editingRoomId ? 'Editar Sala' : 'Nueva Sala'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingRoomId
                        ? 'Actualiza los detalles del espacio institucional.'
                        : 'Configura los detalles del nuevo espacio institucional.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold tracking-card text-muted-foreground ml-1">
                        Identificación
                      </Label>
                      <Input
                        className="rounded-xl bg-muted/30 border-none h-11"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Laboratorio 401"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold tracking-card text-muted-foreground ml-1">
                          Tipo
                        </Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: RoomType) =>
                            setFormData({ ...formData, type: value })
                          }
                        >
                          <SelectTrigger className="rounded-xl bg-muted/30 border-none h-11">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-xl">
                            <SelectItem value="SALON">Clase</SelectItem>
                            <SelectItem value="SALA_COMPUTO">Cómputo</SelectItem>
                            <SelectItem value="AUDITORIO">Auditorio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold tracking-card text-muted-foreground ml-1">
                          Capacidad
                        </Label>
                        <Input
                          className="rounded-xl bg-muted/30 border-none h-11"
                          type="number"
                          value={formData.capacity}
                          onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold tracking-card text-muted-foreground ml-1">
                        Descripción
                      </Label>
                      <Textarea
                        className="rounded-xl bg-muted/30 border-none min-h-24 resize-none pt-4"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" variant="default" className="w-full">
                      {editingRoomId ? 'Guardar Cambios' : 'Crear Espacio'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* TAB: ESPACIOS (Carga masiva + Listado) */}
        <TabsContent value="list" className="m-0 focus-visible:outline-none">
          <Tabs defaultValue="listado" className="space-y-6">
            <TabsList className="mb-4 flex items-center p-1 gap-2 bg-muted/20 rounded-full border border-muted/50">
              <TabsTrigger
                value="carga"
                className="rounded-full px-6 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Carga masiva
              </TabsTrigger>
              <TabsTrigger
                value="listado"
                className="rounded-full px-6 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Listado de espacios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="carga" className="m-0 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="bg-card border rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold tracking-card text-foreground">
                      Cómo funciona la carga masiva
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      1. Descarga la plantilla CSV de salas.
                    </p>
                    <a href="/formatos/plantilla_salas.csv" download>
                      <Button variant="outline" className="w-full justify-start h-9 text-xs">
                        <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                        Descargar plantilla de salas
                      </Button>
                    </a>
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-foreground">
                        Columnas esperadas:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[10px] text-muted-foreground">
                        <li>name (identificación del espacio)</li>
                        <li>type (SALON, SALA_COMPUTO, AUDITORIO)</li>
                        <li>capacity (opcional)</li>
                      </ul>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      2. Completa el archivo y súbelo para generar una vista previa y validar los
                      datos antes de importarlos.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-card border rounded-xl p-5 space-y-4">
                    <p className="text-xs font-semibold tracking-card text-foreground">
                      Subir archivo CSV
                    </p>
                    <SubjectFileUpload
                      onFileSelect={f => {
                        setUploadFile(f);
                        setIsUploadPreview(false);
                        setUploadPreviewData([]);
                      }}
                      file={uploadFile}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        className="flex-1 text-xs h-9"
                        variant="outline"
                        onClick={handleUploadPreview}
                        disabled={!uploadFile || isUploading || isUploadPreview}
                      >
                        {isUploading && !isUploadPreview ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando vista previa...
                          </>
                        ) : (
                          'Vista previa'
                        )}
                      </Button>
                      {(uploadFile || isUploadPreview) && (
                        <Button
                          onClick={() => {
                            setUploadFile(null);
                            setIsUploadPreview(false);
                            setUploadPreviewData([]);
                          }}
                          variant="ghost"
                          className="h-9 px-3 text-[11px] text-muted-foreground"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      También puedes crear salas individuales con el botón Nueva Sala en el listado.
                    </p>
                  </div>

                  <div className="bg-card border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b flex items-center justify-between">
                      <p className="text-xs font-semibold tracking-card text-foreground">
                        Salas para cargar ({uploadPreviewData.length})
                      </p>
                      <Badge variant="outline" className="text-[10px] bg-muted/30">
                        {uploadPreviewData.length} registros
                      </Badge>
                    </div>
                    <div className="p-0">
                      {uploadPreviewData.length === 0 ? (
                        <div className="py-10 text-center text-[11px] text-muted-foreground">
                          Sube un archivo y genera la vista previa para ver aquí las salas a
                          importar.
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-auto">
                          <Table>
                            <TableHeader className="bg-muted/30">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                  Identificación
                                </TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                  Tipo
                                </TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                                  Capacidad
                                </TableHead>
                                <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground text-right">
                                  Estado
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {uploadPreviewData.map(row => (
                                <TableRow key={row.name} className="hover:bg-muted/50 group">
                                  <TableCell className="text-xs px-4 py-3 font-medium">
                                    {row.name}
                                  </TableCell>
                                  <TableCell className="text-xs px-4 py-3">{row.type}</TableCell>
                                  <TableCell className="text-xs px-4 py-3">
                                    {row.capacity}
                                  </TableCell>
                                  <TableCell className="text-xs px-4 py-3 text-right">
                                    <Badge
                                      variant={row.status === 'success' ? 'default' : 'secondary'}
                                      className={cn(
                                        'text-[10px]',
                                        row.status === 'success'
                                          ? 'bg-success text-success-foreground hover:bg-success/90'
                                          : 'bg-warning/10 text-warning hover:bg-warning/20'
                                      )}
                                    >
                                      {row.status === 'success' ? 'Válido' : 'Existente'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                    {uploadPreviewData.length > 0 && (
                      <div className="px-5 py-3 border-t flex justify-end">
                        <Button
                          onClick={handleUploadConfirm}
                          disabled={
                            !isUploadPreview || isUploading || uploadPreviewData.length === 0
                          }
                          className="px-6 h-9 text-xs"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            'Confirmar e importar'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="listado" className="m-0">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-4 px-1">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      placeholder="Buscar por nombre o tipo..."
                      className="pl-10 bg-muted/20 rounded-full focus-visible:ring-1"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Mini Stats */}
                {!loading && filteredRooms.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-1">
                    {[
                      {
                        label: 'Salones',
                        count: rooms.filter(r => r.type === 'SALON').length,
                        icon: Building2,
                        bg: 'bg-blue-500/10',
                        text: 'text-blue-600 dark:text-blue-400',
                      },
                      {
                        label: 'Cómputo',
                        count: rooms.filter(r => r.type === 'SALA_COMPUTO').length,
                        icon: Computer,
                        bg: 'bg-orange-500/10',
                        text: 'text-orange-600 dark:text-orange-400',
                      },
                      {
                        label: 'Auditorios',
                        count: rooms.filter(r => r.type === 'AUDITORIO').length,
                        icon: Mic2,
                        bg: 'bg-purple-500/10',
                        text: 'text-purple-600 dark:text-purple-400',
                      },
                    ].map(({ label, count, icon: Icon, bg, text }) => (
                      <Card
                        key={label}
                        className="border-border/50 shadow-sm overflow-hidden bg-muted/30 p-0"
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg} ${text} shrink-0`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold tracking-tight text-foreground">
                              {count}
                            </p>
                            <p className="text-[12px] text-muted-foreground">{label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed">
                    <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                      <Layout className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-[17px] tracking-card font-semibold text-foreground">Sin resultados</p>
                    <p className="text-muted-foreground text-[14px] mt-2 max-w-xs">
                      {searchTerm
                        ? 'No encontramos salas que coincidan con tu búsqueda.'
                        : 'Aún no has creado ningún espacio. Usa el botón Nueva Sala.'}
                    </p>
                  </div>
                ) : (
                  <Card className="border-border/50 shadow-sm overflow-hidden bg-card p-0">
                    <div className="divide-y divide-border/40">
                      {filteredRooms.map((room, idx) => (
                        <div
                          key={room.id || `room-${idx}`}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group"
                        >
                          {/* Left: Icon */}
                          <div
                            className={cn(
                              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                              room.type === 'SALON'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : room.type === 'SALA_COMPUTO'
                                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            )}
                          >
                            {getTypeIcon(room.type)}
                          </div>

                          {/* Center: Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {room.isActive === false && (
                                <div
                                  className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0"
                                  title="Inactivo"
                                />
                              )}
                              <p className="text-[15px] font-medium text-foreground truncate">
                                {room.name}
                              </p>
                            </div>
                            <p className="text-[12px] text-muted-foreground truncate">
                              {getTypeLabel(room.type)}{' '}
                              {room.description && `• ${room.description}`}
                            </p>
                          </div>

                          {/* Right: Metadata & Actions */}
                          <div className="flex items-center gap-4">
                            {room.capacity && (
                              <div className="flex items-center gap-1.2 text-[12px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full shrink-0">
                                <Users className="h-3 w-3 opacity-60" />
                                <span>{room.capacity}</span>
                              </div>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-foreground transition-colors"
                                >
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl shadow-xl border-border/50 backdrop-blur-md"
                              >
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 py-2.5 rounded-lg"
                                  onClick={() => handleEditRoom(room)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                  <span className="text-xs">Editar detalles</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 py-2.5 rounded-lg text-destructive focus:bg-destructive/10"
                                  onClick={() => {
                                    setRoomToDelete(room);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="text-xs font-medium">Eliminar espacio</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </TabsContent>


      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-semibold tracking-card">
              ¿Estás completamente seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Esta acción eliminará permanentemente la sala <strong>{roomToDelete?.name}</strong>.
              Esto podría afectar a las solicitudes y programaciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl h-11 text-xs font-semibold tracking-card">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="rounded-xl h-11 text-xs font-semibold tracking-card bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar sala'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Tabs>
  );
}

'use client';

import { MicrocurriculoTab } from '@/components/admin/microcurriculo-tab';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

import { ChevronLeft, ChevronRight, Loader2, Pencil, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  program: string | null;
  semester: number | null;
  directHours: number | null;
}

interface EditForm {
  name: string;
  code: string;
  program: string;
  semester: string;
  directHours: string;
}

export default function MicrocurriculoPage() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Edit state
  const [editSubject, setEditSubject] = useState<SubjectRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    code: '',
    program: '',
    semester: '',
    directHours: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteSubject, setDeleteSubject] = useState<SubjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSubjects = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      search,
      semester: semesterFilter,
    });

    fetch(`/api/admin/microcurriculo?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSubjects(data.subjects ?? []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalItems(data.pagination?.total || 0);
        }
      })
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, semesterFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, semesterFilter]);

  const openEdit = (subject: SubjectRow) => {
    setEditSubject(subject);
    setEditForm({
      name: subject.name,
      code: subject.code,
      program: subject.program ?? '',
      semester: subject.semester?.toString() ?? '',
      directHours: subject.directHours?.toString() ?? '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editSubject) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/microcurriculo/${editSubject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          code: editForm.code.trim(),
          program: editForm.program.trim() || null,
          semester: editForm.semester ? parseInt(editForm.semester) : null,
          directHours: editForm.directHours ? parseInt(editForm.directHours) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        sileo.error({ title: data.error || 'Error al actualizar la asignatura' });
        return;
      }
      sileo.success({ title: 'Asignatura actualizada correctamente' });
      setEditSubject(null);
      fetchSubjects();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSubject) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/microcurriculo/${deleteSubject.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        sileo.error({ title: data.error || 'Error al eliminar la asignatura' });
        return;
      }
      sileo.success({ title: 'Asignatura eliminada correctamente' });
      setDeleteSubject(null);
      fetchSubjects();
    } finally {
      setDeleting(false);
    }
  };

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div id="tour-microcurriculo-title" className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          Microcurrículo
        </h1>
        <p className="text-muted-foreground sm:text-sm text-xs">
          Carga el catálogo de asignaturas por CSV o una a una; luego consúltalas en el listado.
        </p>
      </div>

      <Tabs defaultValue="carga">
        <TabsList id="tour-microcurriculo-mode" className="mb-4">
          <TabsTrigger value="carga">Cargar asignaturas</TabsTrigger>
          <TabsTrigger value="listado">Ver listado</TabsTrigger>
        </TabsList>

        <TabsContent value="carga" className="space-y-4">
          <MicrocurriculoTab />
        </TabsContent>

        <TabsContent value="listado" className="space-y-4">
          {/* Stats */}
          <div id="tour-microcurriculo-preview" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="sm:text-sm text-xs font-medium text-muted-foreground">
                  Total Asignaturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {loading && totalItems === 0 ? '—' : totalItems}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="sm:text-sm text-xs font-medium text-muted-foreground">
                  Programas Académicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {loading && subjects.length === 0
                    ? '—'
                    : new Set(subjects.map(s => s.program || 'N/A')).size}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="sm:text-sm text-xs font-medium text-muted-foreground">
                  Semestres Diferentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {loading && subjects.length === 0
                    ? '—'
                    : new Set(subjects.map(s => s.semester ?? 'N/A')).size}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar asignatura o código..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Buscar asignatura"
                  />
                </div>
                <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los semestres</SelectItem>
                    {semesters.map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semestre {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead className="text-center">Semestre</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-8 mx-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-7 w-16 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : subjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10">
                        <div className="flex flex-col items-center justify-center text-center gap-2">
                          <p className="sm:text-sm text-xs font-medium text-foreground">
                            {search
                              ? 'No hay resultados para esa búsqueda.'
                              : 'No hay asignaturas cargadas aún.'}
                          </p>
                          {!search && (
                            <p className="text-xs text-muted-foreground">
                              Ve a la pestaña{' '}
                              <strong>&quot;Cargar asignaturas&quot;</strong> para subir el
                              catálogo.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    subjects.map(subject => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {subject.code}
                          </code>
                        </TableCell>
                        <TableCell className="sm:text-sm text-xs text-muted-foreground">
                          {subject.program ?? '—'}
                        </TableCell>
                        <TableCell className="text-center">{subject.semester ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={() => openEdit(subject)}
                              aria-label={`Editar ${subject.name}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => setDeleteSubject(subject)}
                              aria-label={`Eliminar ${subject.name}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Mostrando página{' '}
                    <span className="font-medium text-foreground">{page}</span> de{' '}
                    <span className="font-medium text-foreground">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && page > 3) {
                          pageNum = page - 3 + i + 1;
                          if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'ghost'}
                            size="default"
                            onClick={() => setPage(pageNum)}
                            className="h-8 w-8 text-xs p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-8 text-xs"
                    >
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editSubject} onOpenChange={open => !open && setEditSubject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar asignatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Cálculo Diferencial"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-code">
                Código <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-code"
                value={editForm.code}
                onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
                placeholder="Ej: MAT101"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-program">Programa académico</Label>
              <Input
                id="edit-program"
                value={editForm.program}
                onChange={e => setEditForm(f => ({ ...f, program: e.target.value }))}
                placeholder="Ej: Ingeniería de Sistemas"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-semester">Semestre</Label>
                <Select
                  value={editForm.semester}
                  onValueChange={val => setEditForm(f => ({ ...f, semester: val }))}
                >
                  <SelectTrigger id="edit-semester">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                      <SelectItem key={s} value={s.toString()}>
                        Semestre {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-hours">Horas directas</Label>
                <Input
                  id="edit-hours"
                  type="number"
                  min={0}
                  value={editForm.directHours}
                  onChange={e => setEditForm(f => ({ ...f, directHours: e.target.value }))}
                  placeholder="Ej: 48"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSubject(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editForm.name.trim() || !editForm.code.trim()}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteSubject} onOpenChange={open => !open && setDeleteSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar asignatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar{' '}
              <span className="font-semibold text-foreground">{deleteSubject?.name}</span> (
              {deleteSubject?.code}). Esta acción no se puede deshacer. Solo es posible si la
              asignatura no tiene grupos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

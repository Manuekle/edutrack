'use client';

import { MicrocurriculoTab } from '@/components/admin/microcurriculo-tab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  program: string | null;
  semester: number | null;
  periodoAcademico: string | null;
}

export default function MicrocurriculoPage() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/microcurriculo')
      .then(r => r.json())
      .then(data => setSubjects(data.subjects ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = subjects.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          Microcurrículo
        </h1>
        <p className="text-muted-foreground text-sm">
          Carga el catálogo de asignaturas por CSV o una a una; luego consúltalas en el listado.
        </p>
      </div>

      <Tabs defaultValue="carga">
        <TabsList className="mb-4">
          <TabsTrigger value="carga">Cargar asignaturas</TabsTrigger>
          <TabsTrigger value="listado">Ver listado</TabsTrigger>
        </TabsList>

        <TabsContent value="carga" className="space-y-4">
          <MicrocurriculoTab />
        </TabsContent>

        <TabsContent value="listado" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Asignaturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{loading ? '—' : subjects.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Programas Académicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {loading ? '—' : new Set(subjects.map(s => s.program || 'N/A')).size}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Semestres Diferentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {loading ? '—' : new Set(subjects.map(s => s.semester ?? 'N/A')).size}
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
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Semestre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10">
                        <div className="flex flex-col items-center justify-center text-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {search
                              ? 'No hay resultados para esa búsqueda.'
                              : 'No hay asignaturas cargadas aún.'}
                          </p>
                          {!search && (
                            <p className="text-xs text-muted-foreground">
                              Ve a la pestaña <strong>&quot;Cargar asignaturas&quot;</strong> para
                              subir el catálogo.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(subject => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {subject.code}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {subject.program ?? '—'}
                        </TableCell>
                        <TableCell>{subject.periodoAcademico ?? '—'}</TableCell>
                        <TableCell className="text-right">{subject.semester ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

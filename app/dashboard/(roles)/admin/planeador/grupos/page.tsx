'use client';

import { Badge } from '@/components/ui/badge';
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
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Grupo {
  id: string;
  codigo: string;
  periodoAcademico: string;
  subject: { id: string; name: string; code: string };
  docentes: { id: string; name: string | null }[];
  horario: {
    id: string;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    sala?: { id: string; name: string } | null;
  } | null;
  sala: { id: string; name: string } | null;
  _count: { estudiantes: number };
}

const DIA_LABELS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

interface Conflicto {
  tipo: 'docente' | 'sala';
  entidad: string;
  dia: string;
  hora: string;
  grupoIds: string[];
}

function detectConflicts(grupos: Grupo[]): Conflicto[] {
  const conflictos: Conflicto[] = [];

  // Group by docente+dia+hora
  const docenteSlots = new Map<string, Grupo[]>();
  const salaSlots = new Map<string, Grupo[]>();

  for (const g of grupos) {
    if (!g.horario) continue;
    const slot = `${g.horario.diaSemana}|${g.horario.horaInicio}|${g.horario.horaFin}`;

    // Check docente conflicts
    for (const d of g.docentes) {
      const key = `docente|${d.id}|${slot}`;
      if (!docenteSlots.has(key)) docenteSlots.set(key, []);
      docenteSlots.get(key)!.push(g);
    }

    // Check sala conflicts
    const salaName = g.sala?.name ?? g.horario.sala?.name;
    const salaId = g.sala?.id ?? g.horario.sala?.id;
    if (salaId) {
      const key = `sala|${salaId}|${slot}`;
      if (!salaSlots.has(key)) salaSlots.set(key, []);
      salaSlots.get(key)!.push(g);
    }
  }

  for (const [key, gs] of docenteSlots) {
    if (gs.length > 1) {
      const [, , dia, horaInicio, horaFin] = key.split('|');
      const docente = gs[0].docentes.find(d => key.includes(d.id));
      conflictos.push({
        tipo: 'docente',
        entidad: docente?.name ?? 'Docente desconocido',
        dia: DIA_LABELS[dia] ?? dia,
        hora: `${horaInicio}–${horaFin}`,
        grupoIds: gs.map(g => g.id),
      });
    }
  }

  for (const [key, gs] of salaSlots) {
    if (gs.length > 1) {
      const [, , dia, horaInicio, horaFin] = key.split('|');
      const sala = gs[0].sala?.name ?? gs[0].horario?.sala?.name ?? 'Sala';
      conflictos.push({
        tipo: 'sala',
        entidad: sala,
        dia: DIA_LABELS[dia] ?? dia,
        hora: `${horaInicio}–${horaFin}`,
        grupoIds: gs.map(g => g.id),
      });
    }
  }

  return conflictos;
}

export default function VerificacionPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/planeador/grupos')
      .then(r => r.json())
      .then(d => setGrupos(d.grupos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const conflictos = useMemo(() => detectConflicts(grupos), [grupos]);
  const conflictGrupoIds = useMemo(
    () => new Set(conflictos.flatMap(c => c.grupoIds)),
    [conflictos]
  );

  const sinHorario = grupos.filter(g => !g.horario).length;
  const sinDocente = grupos.filter(g => g.docentes.length === 0).length;
  const sinSala = grupos.filter(g => !g.sala && !g.horario?.sala).length;
  const completos = grupos.filter(
    g => g.horario && g.docentes.length > 0 && (g.sala || g.horario?.sala)
  ).length;

  const filtered = grupos.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.codigo.toLowerCase().includes(q) ||
      g.subject.name.toLowerCase().includes(q) ||
      g.subject.code.toLowerCase().includes(q) ||
      g.periodoAcademico.toLowerCase().includes(q) ||
      g.docentes.some(d => d.name?.toLowerCase().includes(q)) ||
      g.sala?.name.toLowerCase().includes(q) ||
      g.horario?.sala?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          Verificación
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Revisa que la programación cargada esté correcta. Aquí podrás ver si hay conflictos de
          horario (un docente o sala asignados a dos grupos al mismo tiempo).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-none border-0 bg-green-500/5 dark:bg-green-500/10 rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-[13px] font-medium text-green-700/70 dark:text-green-400/70 flex items-center gap-2 tracking-card uppercase">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              Completos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-4xl font-semibold tracking-card text-green-700 dark:text-green-400">
                {loading ? '—' : completos}
              </p>
              <p className="text-xs font-medium text-green-600/70 dark:text-green-400/70">
                de {grupos.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-0 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-[13px] font-medium text-amber-700/70 dark:text-amber-400/70 flex items-center gap-2 tracking-card uppercase">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="h-4 w-4" />
              </div>
              Sin horario
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-4xl font-semibold tracking-card text-amber-700 dark:text-amber-400 mt-2">
              {loading ? '—' : sinHorario}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-[13px] font-medium text-blue-700/70 dark:text-blue-400/70 flex items-center gap-2 tracking-card uppercase">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-500">
                <Users className="h-4 w-4" />
              </div>
              Sin docente
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-4xl font-semibold tracking-card text-blue-700 dark:text-blue-400 mt-2">
              {loading ? '—' : sinDocente}
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-none border-0 rounded-2xl ${
          conflictos.length > 0
            ? 'bg-red-500/5 dark:bg-red-500/10'
            : 'bg-muted/30 dark:bg-white/[0.02]'
        }`}>
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className={`text-[13px] font-medium flex items-center gap-2 tracking-card uppercase ${
              conflictos.length > 0
                ? 'text-red-700/70 dark:text-red-400/70'
                : 'text-muted-foreground'
            }`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                conflictos.length > 0
                  ? 'bg-red-500/10 text-red-600 dark:text-red-500'
                  : 'bg-muted/50 text-muted-foreground'
              }`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              Conflictos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className={`text-4xl font-semibold tracking-card mt-2 ${
              conflictos.length > 0
                ? 'text-red-700 dark:text-red-400'
                : 'text-foreground'
            }`}>
              {loading ? '—' : conflictos.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conflictos */}
      {conflictos.length > 0 && (
        <Card className="border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 shadow-xs">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Conflictos detectados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {conflictos.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-xs rounded-lg bg-red-100/50 dark:bg-red-500/10 px-3 py-2"
              >
                <Badge
                  variant="destructive"
                  className="text-[9px] px-1.5 py-0 h-4 font-normal bg-red-500/20 text-red-700 dark:text-red-300 shadow-none border-0 shrink-0 mt-0.5"
                >
                  {c.tipo === 'docente' ? 'Docente' : 'Sala'}
                </Badge>
                <span className="text-red-800 dark:text-red-300">
                  <strong>{c.entidad}</strong> tiene {c.grupoIds.length} grupos asignados el{' '}
                  <strong>{c.dia}</strong> de <strong>{c.hora}</strong>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden border shadow-xs">
        <CardHeader className="bg-muted/10 border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por asignatura, docente, grupo, sala..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-background shadow-none"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/5 border-none">
                <TableHead className="text-xs font-semibold px-5">Periodo</TableHead>
                <TableHead className="text-xs font-semibold px-5">Asignatura</TableHead>
                <TableHead className="text-xs font-semibold px-5">Grupo</TableHead>
                <TableHead className="text-xs font-semibold px-5 hidden md:table-cell">
                  Docente
                </TableHead>
                <TableHead className="text-xs font-semibold px-5">Horario</TableHead>
                <TableHead className="text-xs font-semibold px-5 hidden sm:table-cell">
                  Salón
                </TableHead>
                <TableHead className="text-xs font-semibold px-5 text-right hidden sm:table-cell">
                  Estud.
                </TableHead>
                <TableHead className="text-xs font-semibold px-5 text-right w-[80px]">
                  Estado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10">
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {search
                          ? 'No hay resultados para esa búsqueda.'
                          : 'No hay grupos cargados aún.'}
                      </p>
                      {!search && (
                        <p className="text-xs text-muted-foreground">
                          Ve a <strong>&quot;1. Programación&quot;</strong> para importar el CSV.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(g => {
                  const isComplete =
                    g.horario && g.docentes.length > 0 && (g.sala || g.horario?.sala);
                  const hasConflict = conflictGrupoIds.has(g.id);
                  const salaName = g.sala?.name ?? g.horario?.sala?.name;

                  return (
                    <TableRow
                      key={g.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        hasConflict ? 'bg-red-50/50 dark:bg-red-500/5' : ''
                      }`}
                    >
                      <TableCell className="px-5">
                        <Badge variant="outline" className="font-mono text-[10px] shadow-none">
                          {g.periodoAcademico}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground truncate max-w-[150px]">
                            {g.subject.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {g.subject.code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5">
                        <Badge variant="outline" className="font-mono text-xs shadow-none">
                          {g.codigo}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 hidden md:table-cell">
                        {g.docentes.length > 0 ? (
                          <span className="text-xs text-muted-foreground truncate max-w-[140px] block">
                            {g.docentes.map(d => d.name).join(', ')}
                          </span>
                        ) : (
                          <Badge className="text-[9px] px-1.5 py-0 h-4 font-normal bg-amber-500/10 text-amber-600 shadow-none border-0">
                            Sin docente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-5">
                        {g.horario ? (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {DIA_LABELS[g.horario.diaSemana] ?? g.horario.diaSemana}{' '}
                            {g.horario.horaInicio}–{g.horario.horaFin}
                          </span>
                        ) : (
                          <Badge className="text-[9px] px-1.5 py-0 h-4 font-normal bg-amber-500/10 text-amber-600 shadow-none border-0">
                            Sin horario
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-5 hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {salaName ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 hidden sm:table-cell text-right text-xs text-muted-foreground">
                        {g._count?.estudiantes ?? 0}
                      </TableCell>
                      <TableCell className="px-5 text-right">
                        {hasConflict ? (
                          <Badge
                            variant="destructive"
                            className="text-[9px] px-1.5 py-0 h-4 font-normal bg-red-500/10 text-red-600 border-0 shadow-none"
                          >
                            Conflicto
                          </Badge>
                        ) : isComplete ? (
                          <Badge className="text-[9px] px-1.5 py-0 h-4 font-normal bg-green-500/10 text-green-600 shadow-none border-0">
                            OK
                          </Badge>
                        ) : (
                          <Badge className="text-[9px] px-1.5 py-0 h-4 font-normal bg-amber-500/10 text-amber-600 shadow-none border-0">
                            Incompleto
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

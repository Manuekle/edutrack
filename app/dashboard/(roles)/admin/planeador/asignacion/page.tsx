'use client';

import { BulkEnrollmentUpload } from '@/components/admin/bulk-enrollment-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  ChevronsUpDown,
  FileUp,
  GraduationCap,
  Layout,
  Loader2,
  Save,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { sileo } from 'sileo';

interface Grupo {
  id: string;
  codigo: string;
  periodoAcademico: string;
  subject: { name: string; code: string };
  docentes: { id: string; name: string }[];
  horario: {
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    sala?: { id: string; name: string } | null;
  } | null;
  sala: { id: string; name: string } | null;
  estudianteIds: string[];
}

interface Estudiante {
  id: string;
  name: string;
  document?: string | null;
  studentCode: string | null;
  correoInstitucional: string | null;
}

interface Docente {
  id: string;
  name: string;
  document?: string | null;
  codigoDocente: string | null;
}

interface Sala {
  id: string;
  name: string;
  capacity: number | null;
  type: string;
}

const DIA_LABELS: Record<string, string> = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};

export default function AsignacionPage() {
  const searchParams = useSearchParams();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  const [grupoComboOpen, setGrupoComboOpen] = useState(false);

  // Estudiantes
  const [students, setStudents] = useState<Estudiante[]>([]);
  const [studentsInGroup, setStudentsInGroup] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Docentes
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [docentesInGroup, setDocentesInGroup] = useState<string[]>([]);
  const [docenteSearch, setDocenteSearch] = useState('');

  // Modes
  const [studentMode, setStudentMode] = useState<'search' | 'csv'>('search');
  const [docenteMode, setDocenteMode] = useState<'search' | 'csv'>('search');

  // Sala
  const [salas, setSalas] = useState<Sala[]>([]);
  const [salaId, setSalaId] = useState('');

  // Global save
  const [saving, setSaving] = useState(false);

  const gruposOrdenados = useMemo(
    () =>
      [...(grupos ?? [])].sort((a, b) => {
        const cmpPeriodo = (b.periodoAcademico ?? '').localeCompare(a.periodoAcademico ?? '');
        if (cmpPeriodo !== 0) return cmpPeriodo;
        return (a.subject?.code ?? '').localeCompare(b.subject?.code ?? '');
      }),
    [grupos]
  );

  const totalConSala = useMemo(() => grupos.filter(g => g.sala?.id).length, [grupos]);
  const totalConDocente = useMemo(
    () => grupos.filter(g => g.docentes?.length > 0).length,
    [grupos]
  );
  const totalConEstudiantes = useMemo(
    () => grupos.filter(g => (g.estudianteIds?.length ?? 0) > 0).length,
    [grupos]
  );

  const fetchUsers = useCallback(() => {
    Promise.all([
      fetch('/api/admin/usuarios?role=ESTUDIANTE').then(r => r.json()),
      fetch('/api/admin/usuarios?role=DOCENTE').then(r => r.json()),
    ]).then(([st, d]) => {
      setStudents(st.users ?? []);
      setDocentes(d.users ?? []);
    });
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/planeador/grupos').then(r => r.json()),
      fetch('/api/admin/usuarios?role=ESTUDIANTE').then(r => r.json()),
      fetch('/api/admin/usuarios?role=DOCENTE').then(r => r.json()),
      fetch('/api/admin/rooms').then(r => r.json()),
    ])
      .then(([g, st, d, sa]) => {
        const list = g.grupos ?? [];
        setGrupos(list);
        setStudents(st.users ?? []);
        setDocentes(d.users ?? []);
        setSalas(Array.isArray(sa) ? sa : (sa?.rooms ?? []));
        const grupoFromUrl = searchParams.get('grupo');
        if (grupoFromUrl && list.some((gr: Grupo) => gr.id === grupoFromUrl)) {
          setSelectedGrupo(grupoFromUrl);
        }
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (!selectedGrupo) return;
    const g = grupos.find(x => x.id === selectedGrupo);
    if (g) {
      setStudentsInGroup(g.estudianteIds ?? []);
      setDocentesInGroup(g.docentes.map(d => d.id));
      setSalaId(g.sala?.id ? g.sala.id : (g.horario?.sala?.id ?? 'none'));
    }
  }, [selectedGrupo, grupos]);

  const currentGrupo = grupos.find(g => g.id === selectedGrupo);

  async function saveAll() {
    setSaving(true);
    try {
      const salaIdToSend = salaId && salaId !== 'none' ? salaId : null;

      await Promise.all([
        fetch(`/api/admin/planeador/grupos/${selectedGrupo}/estudiantes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estudianteIds: studentsInGroup }),
        }),
        fetch(`/api/admin/planeador/grupos/${selectedGrupo}/docentes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docenteIds: docentesInGroup }),
        }),
        fetch(`/api/admin/planeador/grupos/${selectedGrupo}/sala`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salaId: salaIdToSend }),
        }),
      ]);

      sileo.success({ description: 'Grupo actualizado correctamente' });

      // Update local state
      setGrupos(prev =>
        prev.map(g => {
          if (g.id !== selectedGrupo) return g;
          return {
            ...g,
            estudianteIds: studentsInGroup,
            docentes: docentes
              .filter(d => docentesInGroup.includes(d.id))
              .map(d => ({ id: d.id, name: d.name })),
            sala: salas.find(s => s.id === salaIdToSend) || null,
          };
        })
      );
    } catch {
      sileo.error({ description: 'Error al guardar los cambios' });
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = students.filter(
    s =>
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentCode?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredDocentes = docentes.filter(
    d =>
      d.name?.toLowerCase().includes(docenteSearch.toLowerCase()) ||
      d.codigoDocente?.toLowerCase().includes(docenteSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="">
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">Ajustes</h1>
        <p className="text-muted-foreground sm:text-sm text-xs mt-1 max-w-2xl">
          Configura cada grupo: asigna sala, docentes y estudiantes. Puedes buscar usuarios
          existentes o cargar un CSV para asignar en masa.
        </p>
      </div>

      {/* Resumen */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="shadow-none border-0 bg-muted/30 dark:bg-white/[0.02] rounded-2xl">
            <CardHeader className="pb-1 pt-5 px-5">
              <CardTitle className="text-[13px] font-medium text-muted-foreground flex items-center gap-2 tracking-card uppercase">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/10 text-slate-500">
                  <Users className="h-4 w-4" />
                </div>
                Total grupos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-4xl font-semibold tracking-card text-foreground mt-2">
                {grupos.length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-none border-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl">
            <CardHeader className="pb-1 pt-5 px-5">
              <CardTitle className="text-[13px] font-medium text-blue-700/70 dark:text-blue-400/70 flex items-center gap-2 tracking-card uppercase">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-500">
                  <Layout className="h-4 w-4" />
                </div>
                Con sala
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-4xl font-semibold tracking-card text-blue-700 dark:text-blue-400">
                  {totalConSala}
                </p>
                <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70">
                  de {grupos.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border-0 bg-green-500/5 dark:bg-green-500/10 rounded-2xl">
            <CardHeader className="pb-1 pt-5 px-5">
              <CardTitle className="text-[13px] font-medium text-green-700/70 dark:text-green-400/70 flex items-center gap-2 tracking-card uppercase">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-500">
                  <UserCheck className="h-4 w-4" />
                </div>
                Con docente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-4xl font-semibold tracking-card text-green-700 dark:text-green-400">
                  {totalConDocente}
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
                  <GraduationCap className="h-4 w-4" />
                </div>
                Con estud.
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-4xl font-semibold tracking-card text-amber-700 dark:text-amber-400">
                  {totalConEstudiantes}
                </p>
                <p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">
                  de {grupos.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selector de grupo */}
      <Card className="border shadow-xs overflow-hidden p-0 bg-card rounded-2xl relative z-10">
        <CardHeader className="bg-muted/10 border-b px-5 py-4">
          <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
            Seleccionar grupo a configurar
          </CardTitle>
          <CardDescription className="text-[11px] mt-0.5">
            Elige un grupo para asignar sala, docentes y estudiantes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <Skeleton className="h-10 w-full rounded-xl" />
          ) : grupos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="bg-muted/30 p-4 rounded-full mb-3">
                <Users className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="sm:text-[15px] text-xs font-medium text-foreground">No hay grupos</p>
              <p className="text-[13px] text-muted-foreground mt-1 mb-4 max-w-sm">
                Primero importa la programación en el paso 1. Programación. Luego vuelve aquí para
                hacer ajustes manuales.
              </p>
              <Button asChild variant="outline" size="default" className="rounded-full shadow-sm">
                <Link href="/dashboard/admin/planeador/horarios">Ir a 1. Programación</Link>
              </Button>
            </div>
          ) : (
            <>
              <Popover open={grupoComboOpen} onOpenChange={setGrupoComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={grupoComboOpen}
                    className="w-full h-11 rounded-xl sm:text-sm text-xs px-4 shadow-none bg-background border border-input hover:bg-accent focus:bg-background focus:border-primary/50 transition-colors justify-between font-normal"
                  >
                    {currentGrupo ? (
                      <span className="flex items-center gap-2 truncate">
                        <span className="font-mono text-muted-foreground text-xs">
                          [{currentGrupo.codigo}]
                        </span>
                        <span className="font-medium truncate">{currentGrupo.subject.name}</span>
                        <span className="text-muted-foreground text-xs hidden sm:inline">
                          — {currentGrupo.subject.code} — {currentGrupo.periodoAcademico}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Buscar por grupo, código o asignatura...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-lg" align="start">
                  <Command
                    filter={(value, search) => {
                      const grupo = grupos.find(g => g.id === value);
                      if (!grupo) return 0;
                      const s = search.toLowerCase();
                      const haystack = `${grupo.codigo} ${grupo.subject.name} ${grupo.subject.code} ${grupo.periodoAcademico}`.toLowerCase();
                      return haystack.includes(s) ? 1 : 0;
                    }}
                  >
                    <CommandInput placeholder="Buscar grupo, código o asignatura..." className="h-11" />
                    <CommandList className="max-h-80">
                      <CommandEmpty className="py-6 text-center sm:text-sm text-xs text-muted-foreground">
                        No se encontró ningún grupo.
                      </CommandEmpty>
                      <CommandGroup>
                        {gruposOrdenados.map(g => (
                          <CommandItem
                            key={g.id}
                            value={g.id}
                            onSelect={(val) => {
                              setSelectedGrupo(val === selectedGrupo ? '' : val);
                              setGrupoComboOpen(false);
                            }}
                            className="py-2.5 px-3 rounded-lg mx-1 my-0.5 cursor-pointer"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 shrink-0 ${selectedGrupo === g.id ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-muted-foreground text-xs">
                                  Grupo {g.codigo}
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                  {g.periodoAcademico}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium sm:text-sm text-xs truncate">{g.subject.name}</span>
                                <span className="text-muted-foreground text-xs shrink-0">
                                  {g.subject.code}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                {g.docentes?.length > 0 && (
                                  <span className="truncate max-w-[200px]">
                                    {g.docentes.map(d => d.name).join(', ')}
                                  </span>
                                )}
                                <span>{g.estudianteIds?.length ?? 0} est.</span>
                                {g.sala && <span>{g.sala.name}</span>}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {currentGrupo && (
                <div className="flex flex-wrap items-center gap-2 mt-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 sm:text-sm text-xs">
                  <div className="w-full sm:w-auto mb-1 sm:mb-0 mr-2 flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">
                      {currentGrupo.subject.name}
                    </span>
                    <span className="text-muted-foreground text-xs uppercase tracking-card">
                      {currentGrupo.subject.code}
                    </span>
                  </div>
                  {currentGrupo.horario && (
                    <Badge
                      variant="outline"
                      className="bg-background/50 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-card border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 uppercase"
                    >
                      {DIA_LABELS[currentGrupo.horario.diaSemana]} {currentGrupo.horario.horaInicio}
                      –{currentGrupo.horario.horaFin}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-0 font-medium px-2 py-0.5 rounded-md text-xs"
                  >
                    {currentGrupo.periodoAcademico}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1.5 ml-0 sm:ml-auto text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Estudiantes: <strong>{studentsInGroup.length}</strong>
                  </span>
                  {currentGrupo.docentes?.length > 0 && (
                    <span className="text-muted-foreground flex items-center gap-1.5 ml-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      Docentes:{' '}
                      <span className="max-w-[150px] truncate text-foreground font-medium">
                        {currentGrupo.docentes.map(d => d.name).join(', ')}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedGrupo && (
        <>
          <Tabs defaultValue="estudiantes" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="grid grid-cols-3 w-full bg-muted/50 p-1 rounded-full shadow-inner max-w-[480px]">
                <TabsTrigger
                  value="estudiantes"
                  className="gap-2 rounded-full py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Estudiantes</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">{studentsInGroup.length}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="docentes"
                  className="gap-2 rounded-full py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Docentes</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">{docentesInGroup.length}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sala"
                  className="gap-2 rounded-full py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <Layout className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sala</span>
                </TabsTrigger>
              </TabsList>
              <Button
                onClick={saveAll}
                disabled={saving}
                className="rounded-xl shadow-sm px-6 text-xs gap-2 shrink-0"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>

            {/* Estudiantes Tab */}
            <TabsContent value="estudiantes" className="outline-none">
              <Card className="border shadow-xs overflow-hidden p-0 rounded-2xl">
                <CardHeader className="bg-muted/10 border-b px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                        Estudiantes
                      </CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">
                        {studentsInGroup.length} asignados de {students.length} en el sistema.
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        variant={studentMode === 'search' ? 'default' : 'outline'}
                        size="default"
                        className="text-xs rounded-lg gap-1.5 h-8"
                        onClick={() => setStudentMode('search')}
                      >
                        <Search className="h-3 w-3" />
                        Buscar
                      </Button>
                      <Button
                        variant={studentMode === 'csv' ? 'default' : 'outline'}
                        size="default"
                        className="text-xs rounded-lg gap-1.5 h-8"
                        onClick={() => setStudentMode('csv')}
                      >
                        <FileUp className="h-3 w-3" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {studentMode === 'search' ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre o código..."
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          className="pl-10 h-10 rounded-xl bg-muted/40 border-transparent focus-visible:bg-background shadow-none sm:text-sm text-xs"
                        />
                      </div>
                      <div className="bg-card rounded-xl border overflow-hidden shadow-none">
                        <div className="max-h-[400px] overflow-y-auto p-0">
                          {filteredStudents.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                              No se encontraron estudiantes
                            </div>
                          ) : (
                            <div className="flex flex-col divide-y">
                              {filteredStudents.map(s => (
                                <label
                                  key={s.id}
                                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                                >
                                  <Checkbox
                                    id={`student-${s.id}`}
                                    className="rounded-[4px] h-4 w-4"
                                    checked={studentsInGroup.includes(s.id)}
                                    onCheckedChange={checked => {
                                      setStudentsInGroup(prev =>
                                        checked ? [...prev, s.id] : prev.filter(id => id !== s.id)
                                      );
                                    }}
                                    onClick={e => e.stopPropagation()}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">
                                      {s.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {s.studentCode ??
                                        s.correoInstitucional ??
                                        'Sin código matriculado'}
                                    </p>
                                  </div>
                                  {studentsInGroup.includes(s.id) && (
                                    <Badge
                                      variant="default"
                                      className="text-[9px] font-semibold uppercase tracking-card bg-primary/10 text-primary border-0 shadow-none px-1.5 py-0 h-4 rounded-sm"
                                    >
                                      Asignado
                                    </Badge>
                                  )}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <BulkEnrollmentUpload
                      role="ESTUDIANTE"
                      allUsers={students.map(s => ({ id: s.id, name: s.name, document: s.document, studentCode: s.studentCode }))}
                      currentlyAssignedIds={studentsInGroup}
                      onEnrollmentComplete={(merged) => setStudentsInGroup(merged)}
                      onUsersCreated={fetchUsers}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Docentes Tab */}
            <TabsContent value="docentes" className="outline-none">
              <Card className="border shadow-xs overflow-hidden p-0 rounded-2xl">
                <CardHeader className="bg-muted/10 border-b px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                        Docentes
                      </CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">
                        {docentesInGroup.length === 1 ? '1 docente asignado' : 'Sin docente asignado'} — {docentes.length} disponibles.
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        variant={docenteMode === 'search' ? 'default' : 'outline'}
                        size="default"
                        className="text-xs rounded-lg gap-1.5 h-8"
                        onClick={() => setDocenteMode('search')}
                      >
                        <Search className="h-3 w-3" />
                        Buscar
                      </Button>
                      <Button
                        variant={docenteMode === 'csv' ? 'default' : 'outline'}
                        size="default"
                        className="text-xs rounded-lg gap-1.5 h-8"
                        onClick={() => setDocenteMode('csv')}
                      >
                        <FileUp className="h-3 w-3" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {docenteMode === 'search' ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre o código..."
                          value={docenteSearch}
                          onChange={e => setDocenteSearch(e.target.value)}
                          className="pl-10 h-10 rounded-xl bg-muted/40 border-transparent focus-visible:bg-background shadow-none sm:text-sm text-xs"
                        />
                      </div>
                      <div className="bg-card rounded-xl border overflow-hidden shadow-none">
                        <div className="max-h-[400px] overflow-y-auto">
                          {filteredDocentes.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                              No se encontraron docentes
                            </div>
                          ) : (
                            <div className="flex flex-col divide-y">
                              {filteredDocentes.map(d => (
                                <label
                                  key={d.id}
                                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                                >
                                  <Checkbox
                                    id={`docente-${d.id}`}
                                    className="rounded-[4px] h-4 w-4 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    checked={docentesInGroup.includes(d.id)}
                                    onCheckedChange={checked => {
                                      setDocentesInGroup(checked ? [d.id] : []);
                                    }}
                                    onClick={e => e.stopPropagation()}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">
                                      {d.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {d.codigoDocente ?? 'Sin código docente'}
                                    </p>
                                  </div>
                                  {docentesInGroup.includes(d.id) && (
                                    <Badge
                                      variant="default"
                                      className="text-[9px] font-semibold uppercase tracking-card bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0 shadow-none px-1.5 py-0 h-4 rounded-sm"
                                    >
                                      Asignado
                                    </Badge>
                                  )}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <BulkEnrollmentUpload
                      role="DOCENTE"
                      allUsers={docentes.map(d => ({ id: d.id, name: d.name, document: d.document }))}
                      currentlyAssignedIds={docentesInGroup}
                      onEnrollmentComplete={(merged) => setDocentesInGroup(merged)}
                      onUsersCreated={fetchUsers}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sala Tab */}
            <TabsContent value="sala" className="outline-none">
              <Card className="border shadow-xs overflow-hidden p-0 rounded-2xl max-w-2xl">
                <CardHeader className="bg-muted/10 border-b px-5 py-4">
                  <div>
                    <CardTitle className="sm:text-sm text-xs font-semibold tracking-card text-foreground">
                      Sala asignada al grupo
                    </CardTitle>
                    {currentGrupo?.horario?.sala && (
                      <CardDescription className="text-[11px] flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                        Sugerida por horario:{' '}
                        <strong className="text-foreground">{currentGrupo.horario.sala.name}</strong>
                      </CardDescription>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <Select
                    value={salaId || 'none'}
                    onValueChange={v => setSalaId(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full rounded-full border sm:text-sm text-xs px-4 shadow-none bg-muted/40 focus:bg-background focus:border-primary/50 transition-colors">
                      <SelectValue placeholder="Seleccionar sala..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-lg border-muted-foreground/10 max-h-80">
                      <SelectItem
                        value="none"
                        className="py-2.5 pl-10 rounded-full mx-1 my-0.5 sm:text-sm text-xs text-muted-foreground"
                      >
                        Sin sala asignada
                      </SelectItem>
                      {salas.map(s => (
                        <SelectItem
                          key={s.id}
                          value={s.id}
                          className="py-2.5 pl-10 rounded-full mx-1 my-0.5 sm:text-sm text-xs"
                        >
                          <span className="font-medium">{s.name}</span>
                          {s.capacity != null ? (
                            <span className="text-muted-foreground ml-2 text-xs">
                              — Cap. {s.capacity}
                            </span>
                          ) : (
                            ''
                          )}
                          <span className="text-muted-foreground ml-1 text-[10px] uppercase">
                            ({s.type?.replace('_', ' ') ?? 'sala'})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {salaId &&
                    salaId !== 'none' &&
                    (() => {
                      const sala = salas.find(s => s.id === salaId);
                      return sala ? (
                        <div className="text-xs text-muted-foreground p-4 bg-orange-50/50 dark:bg-orange-500/5 rounded-xl flex flex-col gap-1.5 border border-orange-100 dark:border-orange-500/10">
                          <p className="flex justify-between items-center">
                            <span className="text-muted-foreground/80 font-medium">
                              Sala seleccionada:
                            </span>{' '}
                            <strong className="text-orange-700 dark:text-orange-400 font-semibold">
                              {sala.name}
                            </strong>
                          </p>
                          {sala.capacity != null && (
                            <p className="flex justify-between items-center">
                              <span className="text-muted-foreground/80 font-medium">Capacidad:</span>{' '}
                              <span>{sala.capacity} personas</span>
                            </p>
                          )}
                          {sala.type && (
                            <p className="flex justify-between items-center">
                              <span className="text-muted-foreground/80 font-medium">
                                Tipo de sala:
                              </span>{' '}
                              <span className="capitalize">
                                {sala.type.toLowerCase().replace('_', ' ')}
                              </span>
                            </p>
                          )}
                        </div>
                      ) : null;
                    })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </>
      )}
    </div>
  );
}

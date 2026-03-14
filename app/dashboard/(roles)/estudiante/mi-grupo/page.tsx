'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark, CalendarDays, Layout, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MiGrupoData {
  grupos: {
    id: string;
    codigo: string;
    periodoAcademico: string;
    subject: { name: string; code: string };
    docentes: { id: string; name: string; correoInstitucional: string | null }[];
    horario: {
      diaSemana: string;
      horaInicio: string;
      horaFin: string;
      periodicidad: string;
    } | null;
    sala: { name: string; type: string; capacity: number | null } | null;
    estudiantes: { id: string; name: string; studentCode: string | null }[];
  }[];
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

export default function MiGrupoPage() {
  const [data, setData] = useState<MiGrupoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/estudiante/mi-grupo')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  const grupos = data?.grupos ?? [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          Mi Grupo
        </h1>
        <p className="text-muted-foreground text-[15px] mt-2 max-w-2xl">
          Conoce a tus compañeros de clase y los detalles del docente asignado a cada asignatura.
        </p>
      </div>

      {grupos.length === 0 ? (
        <Card className="rounded-3xl border-dashed shadow-sm">
          <CardContent className="py-20 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No estás asignado a ningún grupo</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Aún no tienes grupos matriculados en el período académico actual.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grupos.map(g => (
            <div key={g.id} className="space-y-5">
              {/* Encabezado e Info Principal del Grupo */}
              <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
                <CardHeader className="p-6 pb-5 bg-muted/30 border-b border-border/40">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="font-mono bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 text-[11px] px-2 py-0.5 rounded-md border-0"
                      >
                        Grupo {g.codigo}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-medium tracking-card px-1.5 py-0 bg-background/50"
                      >
                        {g.periodoAcademico}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Bookmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold tracking-card leading-snug">
                          {g.subject.name}
                        </CardTitle>
                        <code className="text-[13px] text-muted-foreground">{g.subject.code}</code>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
                    {/* Docente */}
                    <div className="p-6 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-card flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-blue-500" /> Docente
                      </p>
                      {g.docentes.length > 0 ? (
                        <div className="space-y-3">
                          {g.docentes.map(d => (
                            <div key={d.id} className="space-y-0.5">
                              <p className="font-medium text-[15px]">{d.name}</p>
                              {d.correoInstitucional && (
                                <p
                                  className="text-[13px] text-muted-foreground line-clamp-1"
                                  title={d.correoInstitucional}
                                >
                                  {d.correoInstitucional}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[15px] text-muted-foreground">Sin asignar</p>
                      )}
                    </div>

                    {/* Horario */}
                    <div className="p-6 space-y-3 bg-muted/5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-card flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-purple-500" /> Horario
                      </p>
                      {g.horario ? (
                        <div className="space-y-1">
                          <p className="font-medium text-[15px]">
                            {DIA_LABELS[g.horario.diaSemana]}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-mono text-muted-foreground flex items-center gap-1">
                              {g.horario.horaInicio}{' '}
                              <span className="text-muted-foreground/50">-</span>{' '}
                              {g.horario.horaFin}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] mt-1 uppercase font-medium"
                          >
                            {g.horario.periodicidad === 'SEMANAL' ? 'Semanal' : 'Quincenal'}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-[15px] text-muted-foreground">Sin horario</p>
                      )}
                    </div>

                    {/* Sala */}
                    <div className="p-6 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-card flex items-center gap-1.5">
                        <Layout className="h-3.5 w-3.5 text-emerald-500" /> Aula
                      </p>
                      {g.sala ? (
                        <div className="space-y-1">
                          <p className="font-medium text-[15px]">{g.sala.name}</p>
                          <p className="text-[13px] text-muted-foreground capitalize">
                            {g.sala.type.toLowerCase().replace('_', ' ')}
                          </p>
                          {g.sala.capacity && (
                            <p className="text-[12px] text-muted-foreground mt-1">
                              Capacidad: {g.sala.capacity} estudiantes
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[15px] text-muted-foreground">Sin aula asignada</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Compañeros (Inset Grouped List) */}
              <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-background">
                <CardHeader className="px-5 py-4 bg-muted/20 border-b border-border/40">
                  <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Compañeros de clase
                    <Badge
                      variant="secondary"
                      className="ml-1 text-[11px] font-medium bg-background border-border/50"
                    >
                      {g.estudiantes.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <div className="divide-y divide-border/40 max-h-[400px] overflow-y-auto">
                  {g.estudiantes.length === 0 ? (
                    <div className="p-8 text-center bg-muted/5">
                      <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hay compañeros matriculados
                      </p>
                    </div>
                  ) : (
                    g.estudiantes.map((e, index) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50 text-[11px] font-medium text-muted-foreground">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-foreground truncate">
                            {e.name}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <code className="text-[12px] text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                            {e.studentCode ?? 'Sin código'}
                          </code>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

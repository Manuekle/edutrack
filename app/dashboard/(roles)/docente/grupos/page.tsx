'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, GraduationCap, Layout, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface GrupoDocente {
  id: string;
  codigo?: string;
  code?: string;
  periodoAcademico?: string;
  academicPeriod?: string;
  subject: { id: string; name: string; code: string; credits: number | null };
  horario?: { diaSemana: string; horaInicio: string; horaFin: string } | null;
  schedule?: { dayOfWeek: string; startTime: string; endTime: string } | null;
  sala?: { name: string; type: string } | null;
  room?: { name: string; type: string } | null;
  estudianteIds?: string[];
  studentIds?: string[];
  planeacion?: { id: string; semanas: { numero: number }[] } | null;
}

const DIA_LABELS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export default function MisGruposPage() {
  const [grupos, setGrupos] = useState<GrupoDocente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/docente/grupos')
      .then(r => r.json())
      .then(d => setGrupos(d.groups || d.grupos || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-wide">Mis Grupos</h1>
        <p className="text-muted-foreground sm:text-sm text-xs mt-1">
          Grupos activos — selecciona uno para gestionar clases y asistencia.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card
              key={i}
              className="shadow-sm border-border/20 bg-card/80 backdrop-blur-sm rounded-2xl"
            >
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-9 w-full rounded-xl mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <div className="col-span-full py-16 text-center bg-muted/20 rounded-2xl border border-dashed border-border/30">
          <div className="h-12 w-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-foreground">No tienes grupos asignados</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Verifica con el administrador que el período académico esté activo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map(g => (
            <Card
              key={g.id}
              className="shadow-sm border-border/20 bg-card/80 backdrop-blur-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 rounded-2xl"
            >
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {g.codigo || g.code}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20"
                      >
                        {g.periodoAcademico || g.academicPeriod}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm">{g.subject.name}</CardTitle>
                    <code className="text-xs text-muted-foreground font-mono">
                      {g.subject.code}
                    </code>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {(g.horario || g.schedule) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                      <span>
                        {g.horario?.diaSemana || g.schedule?.dayOfWeek
                          ? DIA_LABELS[g.horario?.diaSemana || g.schedule?.dayOfWeek || '']
                          : 'Día Pendiente'}{' '}
                        · {g.horario?.horaInicio || g.schedule?.startTime} –{' '}
                        {g.horario?.horaFin || g.schedule?.endTime}
                      </span>
                    </div>
                  )}
                  {(g.sala || g.room) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layout className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{g.sala?.name || g.room?.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span>{(g.estudianteIds || g.studentIds)?.length || 0} estudiantes</span>
                  </div>
                </div>
                <Link href={`/dashboard/docente/grupos/${g.id}`}>
                  <Button className="w-full mt-1">
                    Ver Detalles
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

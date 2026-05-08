'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, CalendarDays, ChevronRight, GraduationCap, Layout, Users } from 'lucide-react';
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
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mié',
  THURSDAY: 'Jue',
  FRIDAY: 'Vie',
  SATURDAY: 'Sáb',
  SUNDAY: 'Dom',
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-card text-foreground">Mis Grupos</h1>
        <p className="text-muted-foreground sm:text-sm text-xs mt-1">
          Grupos activos — selecciona uno para gestionar clases y asistencia.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-border/40">
          <div className="h-14 w-14 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Users className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-foreground">No tienes grupos asignados</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Verifica con el administrador que el período académico esté activo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map(g => {
            const codigo = g.codigo || g.code || '—';
            const periodo = g.periodoAcademico || g.academicPeriod || '';
            const dia = g.horario?.diaSemana || g.schedule?.dayOfWeek || '';
            const horaInicio = g.horario?.horaInicio || g.schedule?.startTime || '';
            const horaFin = g.horario?.horaFin || g.schedule?.endTime || '';
            const sala = g.sala?.name || g.room?.name || '';
            const studentsCount = (g.estudianteIds || g.studentIds)?.length || 0;
            return (
              <Card
                key={g.id}
                className="hover:shadow-sm transition-shadow duration-200 group"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
                        {g.subject.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-mono uppercase mt-0.5 tracking-wider">
                        {g.subject.code} · Grupo {codigo}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {dia && horaInicio && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {DIA_LABELS[dia] ?? dia} · {horaInicio}–{horaFin}
                        </span>
                      </div>
                    )}
                    {sala && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Layout className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{sala}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      <span>{studentsCount} estudiantes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                      {periodo}
                    </span>
                    <Link href={`/dashboard/docente/grupos/${g.id}`}>
                      <Button size="sm" variant="ghost" className="h-7 px-3 text-xs gap-1 group-hover:bg-primary/10 group-hover:text-primary">
                        Ver detalle
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

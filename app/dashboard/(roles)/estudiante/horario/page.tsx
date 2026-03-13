'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Layout, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HorarioItem {
  grupoId: string;
  grupoCodigo: string;
  subjectName: string;
  subjectCode: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  salaName: string | null;
  docenteName: string | null;
  periodoAcademico: string;
}

const DIAS_ORDER = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const DIA_LABELS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

export default function HorarioEstudiantePage() {
  const [horarios, setHorarios] = useState<HorarioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/estudiante/horario')
      .then(r => r.json())
      .then(d => setHorarios(d.horarios ?? []))
      .finally(() => setLoading(false));
  }, []);

  const horariosPorDia = DIAS_ORDER.reduce(
    (acc, dia) => {
      const items = horarios.filter(h => h.diaSemana === dia);
      if (items.length > 0) acc[dia] = items;
      return acc;
    },
    {} as Record<string, HorarioItem[]>
  );

  const diasConClases = DIAS_ORDER.filter(d => horariosPorDia[d]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          Mi Horario
        </h1>
        <p className="text-muted-foreground text-[15px] mt-2 max-w-2xl">
          Visualiza tu horario semanal de clases matriculadas para el período académico actual.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : diasConClases.length === 0 ? (
        <Card className="rounded-3xl border-dashed shadow-sm">
          <CardContent className="py-20 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <CalendarDays className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">Aún no tienes clases</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              No tienes asignaturas con horario matriculadas en el período académico actual.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {diasConClases.map(dia => (
            <div key={dia} className="space-y-3">
              <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-card pl-2">
                {DIA_LABELS[dia]}
              </h2>
              <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
                <div className="divide-y divide-border/50">
                  {(horariosPorDia[dia] ?? [])
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                    .map((h, i) => (
                      <div
                        key={i}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex bg-blue-500/10 text-blue-700 dark:text-blue-400 font-mono text-sm font-semibold h-12 px-3 items-center justify-center rounded-xl shrink-0">
                          {h.horaInicio}
                          <span className="text-blue-600/50 dark:text-blue-400/50 mx-1.5">-</span>
                          {h.horaFin}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-[16px] font-semibold text-foreground truncate">
                              {h.subjectName}
                            </p>
                            <Badge
                              variant="secondary"
                              className="bg-muted text-muted-foreground hover:bg-muted font-mono text-[10px] px-1.5 py-0"
                            >
                              {h.subjectCode}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
                            {h.docenteName && (
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                                  {h.docenteName}
                                </span>
                              </div>
                            )}

                            {h.salaName && (
                              <>
                                <div className="hidden sm:block text-border/60">•</div>
                                <div className="flex items-center gap-1.5">
                                  <Layout className="h-3.5 w-3.5 shrink-0" />
                                  <span>{h.salaName}</span>
                                </div>
                              </>
                            )}

                            <div className="hidden sm:block text-border/60">•</div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-muted/50 px-1.5 rounded text-xs">
                                Grupo {h.grupoCodigo}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock, Layout } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HorarioClase {
  grupoId: string;
  grupoCodigo: string;
  subjectName: string;
  subjectCode: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  salaName: string | null;
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

export default function MiHorarioPage() {
  const [horarios, setHorarios] = useState<HorarioClase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/docente/horario')
      .then(r => r.json())
      .then(d => setHorarios(d.horarios ?? []))
      .finally(() => setLoading(false));
  }, []);

  const horariosPorDia = DIAS_ORDER.reduce(
    (acc, dia) => {
      const clasesDelDia = horarios.filter(h => h.diaSemana === dia);
      if (clasesDelDia.length > 0) acc[dia] = clasesDelDia;
      return acc;
    },
    {} as Record<string, HorarioClase[]>
  );

  const diasConClases = DIAS_ORDER.filter(d => horariosPorDia[d]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Mi Horario
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vista semanal de tu programación de clases.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : diasConClases.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay clases programadas para este período.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {diasConClases.map(dia => (
            <Card key={dia}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-card">
                  {DIA_LABELS[dia]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(horariosPorDia[dia] ?? [])
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                    .map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-sm font-medium w-32 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {h.horaInicio} – {h.horaFin}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{h.subjectName}</p>
                          <code className="text-xs text-muted-foreground">{h.subjectCode}</code>
                        </div>
                        <Badge variant="outline" className="font-mono shrink-0">
                          {h.grupoCodigo}
                        </Badge>
                        {h.salaName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Layout className="h-3 w-3" />
                            {h.salaName}
                          </div>
                        )}
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {h.periodoAcademico}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

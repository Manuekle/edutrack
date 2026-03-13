'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookMarked, CalendarDays, GraduationCap, Layout, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AsignaturaEstudiante {
  grupoId: string;
  grupoCodigo: string;
  periodoAcademico: string;
  subject: {
    name: string;
    code: string;
    credits: number | null;
    program: string | null;
    semester: number | null;
  };
  docentes: { name: string }[];
  horario: { diaSemana: string; horaInicio: string; horaFin: string } | null;
  sala: { name: string } | null;
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

export default function MisAsignaturasEstudiantePage() {
  const [asignaturas, setAsignaturas] = useState<AsignaturaEstudiante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/estudiante/asignaturas')
      .then(r => r.json())
      .then(d => setAsignaturas(d.asignaturas ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-card flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <BookMarked className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          Mis Asignaturas
        </h1>
        <p className="text-muted-foreground text-[15px] mt-2 max-w-2xl">
          Visualiza las asignaturas en las que estás matriculado durante el período académico
          actual.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : asignaturas.length === 0 ? (
        <Card className="rounded-3xl border-dashed shadow-sm">
          <CardContent className="py-20 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <BookMarked className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">
              No estás matriculado en ninguna asignatura
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Contacta al coordinador de tu programa para gestionar tu matrícula del período actual.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {asignaturas.map(a => (
            <Card
              key={a.grupoId}
              className="rounded-2xl shadow-sm border-border/60 hover:shadow-md hover:border-border transition-all duration-200 overflow-hidden flex flex-col"
            >
              <CardHeader className="p-5 pb-4 bg-muted/20 border-b border-border/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="font-mono bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 text-xs px-2 py-0.5 rounded-md border-0"
                      >
                        {a.grupoCodigo}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-medium tracking-card px-1.5 py-0"
                      >
                        {a.periodoAcademico}
                      </Badge>
                    </div>
                    <CardTitle className="text-[17px] font-semibold tracking-card leading-snug">
                      {a.subject.name}
                    </CardTitle>
                    <p className="text-xs font-mono text-muted-foreground">{a.subject.code}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {a.subject.program && (
                    <div className="flex items-start gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[13px] font-medium text-foreground line-clamp-1">
                          {a.subject.program}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.subject.semester
                            ? `Semestre ${a.subject.semester}`
                            : 'Plan de estudios'}
                          {a.subject.credits ? ` • ${a.subject.credits} créditos` : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {a.docentes.length > 0 && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="text-[13px] text-foreground font-medium">
                        {a.docentes.map(d => d.name).join(', ')}
                        <p className="text-[11px] font-normal text-muted-foreground">
                          Docente{a.docentes.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {(a.horario || a.sala) && (
                    <div className="pt-3 mt-3 border-t border-border/40 space-y-2.5">
                      {a.horario && (
                        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                          <CalendarDays className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-foreground">
                            {DIA_LABELS[a.horario.diaSemana]}
                          </span>
                          <span>•</span>
                          <span>
                            {a.horario.horaInicio} – {a.horario.horaFin}
                          </span>
                        </div>
                      )}
                      {a.sala && (
                        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                          <Layout className="h-4 w-4 text-emerald-500" />
                          <span>
                            Aula <span className="font-medium text-foreground">{a.sala.name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

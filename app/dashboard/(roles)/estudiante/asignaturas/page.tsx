'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, GraduationCap, Layout, User, BookOpen } from 'lucide-react';
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
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};

export default function MisAsignaturasEstudiantePage() {
  const [asignaturas, setAsignaturas] = useState<AsignaturaEstudiante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/estudiante/asignaturas')
      .then(r => r.json())
      .then(d => setAsignaturas(d.asignaturas || d.subjects || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-card text-foreground">Mis Asignaturas</h1>
        <p className="text-muted-foreground sm:text-sm text-xs mt-1">
          Asignaturas matriculadas en el período académico actual.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : asignaturas.length === 0 ? (
        <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-border/40">
          <div className="h-14 w-14 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4 shadow-xs">
            <GraduationCap className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="sm:text-[15px] text-xs font-semibold text-foreground tracking-card">
            No estás matriculado en ninguna asignatura.
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Contacta al coordinador de tu programa para gestionar tu matrícula.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {asignaturas.map(a => (
            <Card
              key={a.grupoId}
              className="hover:shadow-sm transition-shadow group"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
                      {a.subject.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono uppercase mt-0.5 tracking-wider">
                      {a.subject.code} · {a.grupoCodigo}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {a.subject.program && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {a.subject.program}
                        {a.subject.semester ? ` · Sem. ${a.subject.semester}` : ''}
                      </span>
                    </div>
                  )}
                  {a.docentes.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{a.docentes.map(d => d.name).join(', ')}</span>
                    </div>
                  )}
                  {a.horario && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {DIA_LABELS[a.horario.diaSemana]} · {a.horario.horaInicio}–
                        {a.horario.horaFin}
                      </span>
                    </div>
                  )}
                  {a.sala && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layout className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{a.sala.name}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/30">
                  <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                    {a.periodoAcademico}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

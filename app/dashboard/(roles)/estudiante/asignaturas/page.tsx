'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, GraduationCap, Layout, User } from 'lucide-react';
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
      .then(d => setAsignaturas(d.asignaturas || d.subjects || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-card text-foreground">Mis Asignaturas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Asignaturas matriculadas en el período académico actual.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : asignaturas.length === 0 ? (
        <Card className="rounded-3xl border-dashed shadow-sm">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No estás matriculado en ninguna asignatura.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contacta al coordinador de tu programa para gestionar tu matrícula.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {asignaturas.map(a => (
            <Card
              key={a.grupoId}
              className="hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono">
                        {a.grupoCodigo}
                      </Badge>
                      <Badge variant="secondary">{a.periodoAcademico}</Badge>
                    </div>
                    <CardTitle className="text-base">{a.subject.name}</CardTitle>
                    <code className="text-xs text-muted-foreground">{a.subject.code}</code>
                    {a.subject.credits && (
                      <span className="text-xs text-muted-foreground ml-2">
                        &middot; {a.subject.credits} cr&eacute;ditos
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {a.subject.program && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {a.subject.program}
                        {a.subject.semester ? ` · Semestre ${a.subject.semester}` : ''}
                      </span>
                    </div>
                  )}
                  {a.docentes.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span>{a.docentes.map(d => d.name).join(', ')}</span>
                    </div>
                  )}
                  {a.horario && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {DIA_LABELS[a.horario.diaSemana]} &middot; {a.horario.horaInicio} –{' '}
                        {a.horario.horaFin}
                      </span>
                    </div>
                  )}
                  {a.sala && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layout className="h-3.5 w-3.5 shrink-0" />
                      <span>{a.sala.name}</span>
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

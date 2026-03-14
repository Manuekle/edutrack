'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import { CalendarDays, GraduationCap, Layout, Users } from 'lucide-react';
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
  // Prisma enum variants
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
        <h1 className="text-2xl font-semibold tracking-card">Mis Grupos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Grupos activos — haz clic en «Ver Bitácora» para registrar las clases de cada grupo.
        </p>
      </div>

      {loading ? (
        <LoadingPage />
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tienes grupos asignados.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Verifica con el administrador que el período académico esté activo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {grupos.map(g => (
            <Card key={g.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono">
                        {g.codigo || g.code}
                      </Badge>
                      <Badge variant="secondary">{g.periodoAcademico || g.academicPeriod}</Badge>
                    </div>
                    <CardTitle className="text-base">{g.subject.name}</CardTitle>
                    <code className="text-xs text-muted-foreground">{g.subject.code}</code>
                    {g.subject.credits && (
                      <span className="text-xs text-muted-foreground ml-2">
                        · {g.subject.credits} créditos
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {(g.horario || g.schedule) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {g.horario?.diaSemana || g.schedule?.dayOfWeek ? DIA_LABELS[g.horario?.diaSemana || g.schedule?.dayOfWeek || ''] : 'Día Pendiente'} · {g.horario?.horaInicio || g.schedule?.startTime} –{' '}
                        {g.horario?.horaFin || g.schedule?.endTime}
                      </span>
                    </div>
                  )}
                  {(g.sala || g.room) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layout className="h-3.5 w-3.5 shrink-0" />
                      <span>{g.sala?.name || g.room?.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    <span>{(g.estudianteIds || g.studentIds)?.length || 0} estudiantes matriculados</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button asChild size="default" variant="default" className="flex-1">
                    <Link href={`/dashboard/docente/grupos/${g.id}`}>Ver Detalles</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

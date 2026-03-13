'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, CalendarDays, NotebookPen, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface GrupoConPlaneacion {
  id: string;
  codigo: string;
  periodoAcademico: string;
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number | null;
  };
  horario: { diaSemana: string; horaInicio: string; horaFin: string } | null;
  sala: { name: string } | null;
  estudianteIds: string[];
  planeacion: {
    id: string;
    fechaInicio: string;
    semanas: {
      id: string;
      numero: number;
      fechaInicio: string;
      fechaFin: string;
      clases: {
        id: string;
        status: string;
        bitacora: { id: string } | null;
      }[];
    }[];
  } | null;
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

export default function BitacoraListPage() {
  const [grupos, setGrupos] = useState<GrupoConPlaneacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/docente/bitacora')
      .then(r => r.json())
      .then(d => setGrupos(d.grupos ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <NotebookPen className="h-6 w-6 text-primary" />
          Bitácora de Clases
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selecciona un grupo para registrar o consultar las clases semana a semana.
        </p>
      </div>

      {grupos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <NotebookPen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay grupos con planeación activa.</p>
            <p className="text-sm text-muted-foreground mt-1">
              La bitácora se habilita cuando el administrador genera la planeación de 16 semanas
              para tu grupo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grupos.map(grupo => {
            const semanas = grupo.planeacion?.semanas ?? [];
            const totalClases = semanas.reduce((acc, s) => acc + s.clases.length, 0);
            const clasesRealizadas = semanas.reduce(
              (acc, s) => acc + s.clases.filter(c => c.status === 'REALIZADA').length,
              0
            );
            const bitacorasRegistradas = semanas.reduce(
              (acc, s) => acc + s.clases.filter(c => c.bitacora).length,
              0
            );
            const progress = totalClases > 0 ? (clasesRealizadas / totalClases) * 100 : 0;
            const semanaActual = semanas.find(s => {
              const inicio = new Date(s.fechaInicio);
              const fin = new Date(s.fechaFin);
              const ahora = new Date();
              return ahora >= inicio && ahora <= fin;
            });

            return (
              <Card
                key={grupo.id}
                className="border-0 shadow-none bg-muted/30 dark:bg-white/[0.02] rounded-3xl hover:bg-muted/50 dark:hover:bg-white/[0.04] transition-colors p-1"
              >
                <CardHeader className="pb-3 px-5 pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] uppercase font-bold tracking-card px-2 py-0 h-5 border-foreground/10"
                        >
                          {grupo.codigo}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-bold tracking-card px-2 py-0 h-5 bg-background"
                        >
                          {grupo.periodoAcademico}
                        </Badge>
                        {semanaActual && (
                          <Badge className="text-[10px] uppercase font-bold tracking-card px-2 py-0 h-5 bg-primary/20 text-primary hover:bg-primary/30 border-0">
                            Semana {semanaActual.numero}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-[16px] font-semibold text-foreground tracking-card leading-tight mb-1">
                        {grupo.subject.name}
                      </CardTitle>
                      <code className="text-[11px] font-mono font-bold tracking-card text-muted-foreground bg-background px-1.5 py-0.5 rounded-md">
                        {grupo.subject.code}
                      </code>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5">
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                    {grupo.horario && (
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <CalendarDays className="h-4 w-4 opacity-70" />
                        <span>
                          {DIA_LABELS[grupo.horario.diaSemana]} {grupo.horario.horaInicio}–
                          {grupo.horario.horaFin}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <Users className="h-4 w-4 opacity-70" />
                      <span>{grupo.estudianteIds.length} estudiantes</span>
                    </div>
                  </div>

                  {grupo.planeacion ? (
                    <div className="bg-background rounded-2xl p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[12px] font-medium text-muted-foreground">
                          <span>Progreso del curso</span>
                          <span className="text-foreground shrink-0">
                            {clasesRealizadas} / {totalClases} clases
                          </span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>

                      <div className="flex items-center justify-between text-[12px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <NotebookPen className="h-3.5 w-3.5" />
                          {bitacorasRegistradas} bitácoras
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {format(new Date(grupo.planeacion.fechaInicio), 'd MMM', { locale: es })}
                        </span>
                      </div>

                      <Button
                        asChild
                        className="w-full rounded-xl h-10 shadow-none font-semibold text-[13px] bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary mt-2"
                      >
                        <Link href={`/dashboard/docente/bitacora/${grupo.id}`}>Abrir Bitácora</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-[13px] font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-4 py-3 rounded-2xl text-center">
                      Requiere planeación de 16 semanas para habilitar bitácora
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

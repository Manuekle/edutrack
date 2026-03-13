'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CheckCircle2, Save, Users, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Asistencia {
  id: string | null;
  studentId: string;
  studentName: string;
  status: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';
}

interface ClaseData {
  id: string;
  date: string;
  status: 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA';
  cancellationReason: string | null;
  grupo: {
    id: string;
    codigo: string;
    subject: { name: string; code: string };
  };
  semana: { numero: number };
  bitacora: {
    id: string;
    temaPlaneado: string | null;
    temaEjecutado: string | null;
    actividades: string | null;
    observaciones: string | null;
    evidencias: string[];
  } | null;
  asistencias: Asistencia[];
}

const STATUS_LABELS: Record<string, string> = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  TARDANZA: 'Tardanza',
  JUSTIFICADO: 'Justificado',
};

const STATUS_COLORS: Record<string, string> = {
  PRESENTE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  AUSENTE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  TARDANZA: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  JUSTIFICADO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export default function RegistrarBitacoraPage() {
  const { grupoId, claseId } = useParams<{ grupoId: string; claseId: string }>();
  const [data, setData] = useState<ClaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bitácora form
  const [temaPlaneado, setTemaPlaneado] = useState('');
  const [temaEjecutado, setTemaEjecutado] = useState('');
  const [actividades, setActividades] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estadoClase, setEstadoClase] = useState<'REALIZADA' | 'CANCELADA'>('REALIZADA');
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Asistencia
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);

  useEffect(() => {
    fetch(`/api/docente/bitacora/${grupoId}/${claseId}`)
      .then(r => r.json())
      .then((d: ClaseData) => {
        setData(d);
        if (d.bitacora) {
          setTemaPlaneado(d.bitacora.temaPlaneado ?? '');
          setTemaEjecutado(d.bitacora.temaEjecutado ?? '');
          setActividades(d.bitacora.actividades ?? '');
          setObservaciones(d.bitacora.observaciones ?? '');
        }
        if (d.status !== 'PROGRAMADA') setEstadoClase(d.status as 'REALIZADA' | 'CANCELADA');
        setAsistencias(d.asistencias);
      })
      .finally(() => setLoading(false));
  }, [grupoId, claseId]);

  function updateAsistencia(studentId: string, status: Asistencia['status']) {
    setAsistencias(prev => prev.map(a => (a.studentId === studentId ? { ...a, status } : a)));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/docente/bitacora/${grupoId}/${claseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temaPlaneado,
          temaEjecutado,
          actividades,
          observaciones,
          estadoClase,
          motivoCancelacion: estadoClase === 'CANCELADA' ? motivoCancelacion : null,
          asistencias: asistencias.map(a => ({
            studentId: a.studentId,
            status: a.status,
          })),
        }),
      });
      toast.success('Bitácora guardada exitosamente');
      // Reload to get updated data
      const updated = await fetch(`/api/docente/bitacora/${grupoId}/${claseId}`).then(r =>
        r.json()
      );
      setData(updated);
    } catch {
      toast.error('Error al guardar la bitácora');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Clase no encontrada.</p>;

  const presentCount = asistencias.filter(a => a.status === 'PRESENTE').length;
  const tardanzaCount = asistencias.filter(a => a.status === 'TARDANZA').length;
  const ausenteCount = asistencias.filter(a => a.status === 'AUSENTE').length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5">
          <Link href={`/dashboard/docente/bitacora/${grupoId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold">Registro de Clase</h1>
            <Badge variant="outline">Semana {data.semana?.numero}</Badge>
            {data.bitacora && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Registrada
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {data.grupo.subject.name} — Grupo {data.grupo.codigo}
          </p>
          <p className="text-muted-foreground text-sm">
            {format(new Date(data.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* Estado de la clase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de la Clase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              variant={estadoClase === 'REALIZADA' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEstadoClase('REALIZADA')}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Realizada
            </Button>
            <Button
              variant={estadoClase === 'CANCELADA' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setEstadoClase('CANCELADA')}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Cancelada
            </Button>
          </div>
          {estadoClase === 'CANCELADA' && (
            <div className="space-y-2">
              <Label>Motivo de cancelación</Label>
              <Textarea
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                placeholder="Describir el motivo de la cancelación..."
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bitácora */}
      {estadoClase === 'REALIZADA' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bitácora de Clase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tema Planeado</Label>
              <Textarea
                value={temaPlaneado}
                onChange={e => setTemaPlaneado(e.target.value)}
                placeholder="Tema programado en el microcurrículo para esta clase..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Tema Ejecutado</Label>
              <Textarea
                value={temaEjecutado}
                onChange={e => setTemaEjecutado(e.target.value)}
                placeholder="Tema que realmente se desarrolló en clase..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Actividades Desarrolladas</Label>
              <Textarea
                value={actividades}
                onChange={e => setActividades(e.target.value)}
                placeholder="Describir las actividades, ejercicios, talleres realizados..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Observaciones generales, dificultades, logros..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asistencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Asistencia ({asistencias.length} estudiantes)
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{presentCount}P</span>
              <span className="text-amber-600 font-medium">{tardanzaCount}T</span>
              <span className="text-red-600 font-medium">{ausenteCount}A</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {asistencias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay estudiantes asignados a este grupo.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Quick actions */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <span className="text-xs text-muted-foreground">Marcar todos como:</span>
                {(['PRESENTE', 'AUSENTE', 'TARDANZA'] as const).map(s => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => setAsistencias(prev => prev.map(a => ({ ...a, status: s })))}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
              {asistencias.map(a => (
                <div
                  key={a.studentId}
                  className="flex items-center justify-between gap-3 py-2 border-b last:border-0"
                >
                  <p className="text-sm font-medium flex-1">{a.studentName}</p>
                  <div className="flex items-center gap-1.5">
                    {(['PRESENTE', 'TARDANZA', 'AUSENTE', 'JUSTIFICADO'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateAsistencia(a.studentId, s)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          a.status === s
                            ? STATUS_COLORS[s]
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {s === 'PRESENTE'
                          ? 'P'
                          : s === 'TARDANZA'
                            ? 'T'
                            : s === 'AUSENTE'
                              ? 'A'
                              : 'J'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : data.bitacora ? 'Actualizar Bitácora' : 'Guardar Bitácora'}
        </Button>
      </div>
    </div>
  );
}

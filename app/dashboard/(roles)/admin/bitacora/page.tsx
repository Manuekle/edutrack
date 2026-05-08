'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Loader2, Save } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

interface Settings {
  codigo: string;
  version: string;
  fecha: string;
}

export default function BitacoraSettingsPage() {
  const [data, setData] = useState<Settings>({ codigo: '', version: '', fecha: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bitacora-settings');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData({ codigo: json.codigo, version: json.version, fecha: json.fecha });
    } catch {
      sileo.error({ description: 'Error al cargar configuración' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!data.codigo.trim() || !data.version.trim() || !data.fecha.trim()) {
      sileo.error({ description: 'Completa todos los campos' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/bitacora-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      sileo.success({ description: 'Configuración actualizada' });
    } catch {
      sileo.error({ description: 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-card text-foreground">
          Encabezado de Bitácora
        </h1>
        <p className="text-muted-foreground sm:text-sm text-xs mt-1 max-w-2xl">
          Configura el código institucional, versión y fecha que aparece en el encabezado de la bitácora docente. Estos cambios se reflejan automáticamente en todas las vistas de bitácora.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <Card>
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Datos del encabezado
            </CardTitle>
            <CardDescription className="text-xs">
              Estos campos identifican el formato institucional.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo" className="text-xs font-medium">
                Código
              </Label>
              <Input
                id="codigo"
                value={data.codigo}
                onChange={e => setData(d => ({ ...d, codigo: e.target.value }))}
                placeholder="FO-DO-005"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version" className="text-xs font-medium">
                Versión
              </Label>
              <Input
                id="version"
                value={data.version}
                onChange={e => setData(d => ({ ...d, version: e.target.value }))}
                placeholder="08"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-xs font-medium">
                Fecha
              </Label>
              <Input
                id="fecha"
                value={data.fecha}
                onChange={e => setData(d => ({ ...d, fecha: e.target.value }))}
                placeholder="mayo de 2026"
                maxLength={60}
              />
              <p className="text-[11px] text-muted-foreground">
                Texto libre. Ej: &quot;mayo de 2026&quot;.
              </p>
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live preview */}
        <Card>
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="text-sm font-semibold">Vista previa</CardTitle>
            <CardDescription className="text-xs">
              Así verán docentes y administradores el encabezado.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="border-b border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="relative h-14 w-14 shrink-0">
                  <Image
                    src="/logo-fup.png"
                    alt="Logo FUP"
                    width={64}
                    height={64}
                    className="h-full w-full object-contain dark:brightness-0 dark:invert opacity-90"
                    unoptimized
                  />
                </div>
                <div className="flex-1 text-center min-w-0">
                  <h3 className="text-slate-900 dark:text-white font-semibold text-sm tracking-card uppercase truncate">
                    Registro de Clases y Asistencia
                  </h3>
                  <p className="text-primary text-[9px] font-semibold tracking-card uppercase mt-1">
                    Sistema de Gestión Académica · Docencia
                  </p>
                </div>
                <div className="shrink-0 text-[10px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="flex justify-between items-center gap-3 border-b border-slate-100 dark:border-slate-800 py-1.5 px-3">
                    <span className="font-semibold text-slate-500 uppercase tracking-card">
                      Código:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {data.codigo || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3 border-b border-slate-100 dark:border-slate-800 py-1.5 px-3">
                    <span className="font-semibold text-slate-500 uppercase tracking-card">
                      Versión:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {data.version || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3 py-1.5 px-3">
                    <span className="font-semibold text-slate-500 uppercase tracking-card">
                      Fecha:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                      {data.fecha || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

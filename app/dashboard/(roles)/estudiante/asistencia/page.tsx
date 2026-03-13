'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, CheckCircle2, Loader2, QrCode, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

const QRScanner = dynamic(() => import('@/components/qr-scanner'), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-8 w-3/4 mx-auto" />
    </div>
  ),
  ssr: false,
});

type ManualAttendanceResponse = {
  message: string;
  className?: string;
  subjectName?: string;
};

type QrAttendanceData = {
  subject: string;
  class: string;
  recordedAt: string;
};

export default function StudentAttendancePage() {
  const router = useRouter();
  const { status } = useSession();

  // Estado para código manual
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState<ManualAttendanceResponse | null>(null);

  // Estado para QR
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrSuccess, setQrSuccess] = useState(false);
  const [qrData, setQrData] = useState<QrAttendanceData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent('/dashboard/estudiante/asistencia')}`);
    }
  }, [status, router]);

  const isValidToken = (t: string) => /^[a-f0-9]{32}$/i.test(t);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      sileo.error({ title: 'Ingresa el código de asistencia' });
      return;
    }
    if (!isValidToken(token)) {
      sileo.error({ title: 'Formato de código inválido' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/asistencia/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token.trim() }),
      });
      const data: ManualAttendanceResponse = await response.json();
      if (!response.ok) {
        const errorMessages: Record<number, string> = {
          400: 'Token inválido o expirado',
          403: 'No autorizado para esta clase',
          404: 'Clase no encontrada',
          409: 'Asistencia ya registrada',
          410: 'Token expirado',
        };
        sileo.error({ title: errorMessages[response.status] || 'Error al procesar código' });
        return;
      }
      setManualSuccess(data);
      setToken('');
      sileo.success({ title: '¡Asistencia registrada!' });
      setTimeout(() => setManualSuccess(null), 8000);
    } catch {
      sileo.error({ title: 'Error de conexión' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (qrToken: string) => {
    setIsProcessing(true);
    setQrSuccess(false);
    const loadingId = sileo.show({ title: 'Procesando código QR...', type: 'loading' });
    try {
      const response = await fetch('/api/asistencia/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken }),
      });
      const data = await response.json();
      if (response.ok) {
        setQrSuccess(true);
        setQrData({
          subject: data.data.subject,
          class: data.data.class,
          recordedAt: new Date(data.data.recordedAt).toLocaleString('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        });
        sileo.success({ title: '¡Asistencia registrada exitosamente!' });
      } else {
        sileo.error({ title: data.message || 'Código QR inválido' });
      }
    } catch {
      sileo.error({ title: 'Error al procesar el código QR. Intenta nuevamente.' });
    } finally {
      sileo.dismiss(loadingId);
      setIsProcessing(false);
    }
  };

  const handleError = (errorMessage: string) => {
    sileo.error({ title: errorMessage });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pt-10 pb-12">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3">
          <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-card text-foreground">
          Registrar Asistencia
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-[280px] mx-auto leading-snug">
          Escanea el código QR de tu docente o ingresa el código manualmente
        </p>
      </div>

      <Tabs defaultValue="qr" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-muted/40 p-1 rounded-full shadow-inner h-auto">
          <TabsTrigger
            value="qr"
            className="flex gap-2 rounded-full py-2.5 text-[15px] font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <QrCode className="h-4 w-4" />
            Escanear QR
          </TabsTrigger>
          <TabsTrigger
            value="codigo"
            className="flex gap-2 rounded-full py-2.5 text-[15px] font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Send className="h-4 w-4" />
            Código
          </TabsTrigger>
        </TabsList>

        {/* ── Pestaña: Escanear QR ── */}
        <TabsContent value="qr" className="mt-6 space-y-5">
          {qrSuccess && qrData ? (
            <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/5 shadow-sm overflow-hidden">
              <CardHeader className="text-center pb-4 pt-8">
                <div className="flex justify-center mb-4">
                  <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-400 text-xl">
                  ¡Asistencia Registrada!
                </CardTitle>
                <CardDescription className="text-[15px]">
                  Tu asistencia ha sido registrada correctamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6 pb-8">
                <div className="bg-background rounded-2xl p-5 border border-border/40 shadow-sm space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-muted-foreground">
                      Asignatura
                    </span>
                    <span className="font-semibold text-[15px]">{qrData.subject}</span>
                  </div>
                  <div className="h-px bg-border/40 my-2" />
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-muted-foreground">Clase</span>
                    <span className="font-medium">{qrData.class}</span>
                  </div>
                  <div className="h-px bg-border/40 my-2" />
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-muted-foreground">Hora</span>
                    <span className="font-medium">{qrData.recordedAt}</span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setQrSuccess(false);
                    setQrData(null);
                  }}
                  variant="outline"
                  className="w-full rounded-full h-12 text-[15px] font-medium shadow-sm hover:bg-muted/50"
                >
                  Escanear otro código
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="rounded-3xl overflow-hidden shadow-sm border border-border/50 bg-card">
                <QRScanner onScan={handleScan} onError={handleError} isLoading={isProcessing} />
              </div>
              <Card className="rounded-2xl border-border/40 bg-muted/20 shadow-none">
                <CardContent className="p-5">
                  <div className="space-y-3 text-[14px] text-muted-foreground">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Instrucciones
                    </p>
                    <ul className="space-y-2.5 list-none pl-1">
                      <li className="flex gap-2 items-start">
                        <span className="text-muted-foreground/50 mt-0.5">•</span> Asegúrate de
                        estar en la clase correspondiente
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="text-muted-foreground/50 mt-0.5">•</span> Solicita al
                        docente que muestre el código QR
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="text-muted-foreground/50 mt-0.5">•</span> Apunta tu cámara
                        hacia el código QR
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="text-muted-foreground/50 mt-0.5">•</span> Espera a que se
                        procese automáticamente
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Pestaña: Código manual ── */}
        <TabsContent value="codigo" className="mt-6 space-y-5">
          {manualSuccess ? (
            <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/5 shadow-sm">
              <CardHeader className="pb-4 pt-6 text-center">
                <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-400 text-lg">
                  ¡Registrado!
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-3 text-[15px] text-center">
                <div className="bg-background rounded-2xl p-4 border border-border/40 shadow-sm space-y-2">
                  <div>
                    <span className="text-muted-foreground">Clase: </span>
                    <span className="font-semibold">
                      {manualSuccess.className || 'No especificada'}
                    </span>
                  </div>
                  {manualSuccess.subjectName && (
                    <div>
                      <span className="text-muted-foreground">Materia: </span>
                      <span className="font-medium">{manualSuccess.subjectName}</span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground pt-2 mt-2 border-t border-border/40 font-mono">
                    {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Input
                      type="text"
                      name="token"
                      placeholder="Pega el código aquí..."
                      value={token}
                      onChange={e => setToken(e.target.value.toLowerCase())}
                      className="text-center font-mono text-[15px] h-14 rounded-2xl bg-muted/40 border-border/60 focus-visible:ring-blue-500/30"
                      autoComplete="off"
                      disabled={isLoading}
                    />
                    <p className="text-[13px] text-muted-foreground text-center font-medium">
                      32 caracteres generados por el docente
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-full h-12 text-[15px] font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    disabled={isLoading || !token.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin opacity-70" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Registrar Asistencia
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-none bg-transparent shadow-none">
            <CardContent className="p-2 text-[13px] text-muted-foreground text-center space-y-1.5 flex flex-col items-center">
              <p>• El código se muestra en la pantalla del aula</p>
              <p>• Verifica que sea exacto antes de enviar</p>
              <p>• Token válido únicamente durante la clase</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

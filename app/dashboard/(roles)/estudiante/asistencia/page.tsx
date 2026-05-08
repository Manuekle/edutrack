'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Loader2, QrCode, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

const QRScanner = dynamic(() => import('@/components/qr-scanner'), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full rounded-2xl" />
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

interface SuccessCardProps {
  subject?: string;
  className?: string;
  recordedAt?: string;
  onReset: () => void;
  resetLabel?: string;
}

function SuccessCard({ subject, className, recordedAt, onReset, resetLabel = 'Escanear otro código' }: SuccessCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              ¡Asistencia registrada!
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tu asistencia ha sido confirmada
            </p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-4 space-y-2.5 text-xs">
          {subject && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Asignatura</span>
              <span className="font-medium text-foreground text-right truncate">{subject}</span>
            </div>
          )}
          {className && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Clase</span>
              <span className="font-medium text-foreground text-right truncate">{className}</span>
            </div>
          )}
          {recordedAt && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Hora</span>
              <span className="font-medium text-foreground font-mono">{recordedAt}</span>
            </div>
          )}
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          className="w-full h-11"
        >
          {resetLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StudentAttendancePage() {
  const router = useRouter();
  const { status } = useSession();

  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState<ManualAttendanceResponse | null>(null);

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

  const handleScan = async (rawData: string) => {
    const tokenMatch = rawData.match(/escanear\/([a-f0-9]{32})/i);
    const qrToken = tokenMatch ? tokenMatch[1] : rawData;

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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-card text-foreground">
          Registrar Asistencia
        </h1>
        <p className="text-xs text-muted-foreground">
          Escanea el código QR o ingresa el código manualmente
        </p>
      </div>

      <Tabs defaultValue="qr" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-muted/40 p-1 rounded-full h-auto">
          <TabsTrigger
            value="qr"
            className="flex gap-2 rounded-full py-2.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <QrCode className="h-4 w-4" />
            Escanear QR
          </TabsTrigger>
          <TabsTrigger
            value="codigo"
            className="flex gap-2 rounded-full py-2.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <Send className="h-4 w-4" />
            Código
          </TabsTrigger>
        </TabsList>

        {/* Pestaña QR */}
        <TabsContent value="qr" className="mt-5 space-y-4">
          {qrSuccess && qrData ? (
            <SuccessCard
              subject={qrData.subject}
              className={qrData.class}
              recordedAt={qrData.recordedAt}
              onReset={() => {
                setQrSuccess(false);
                setQrData(null);
              }}
            />
          ) : (
            <>
              <div className="rounded-2xl overflow-hidden border border-border/40 bg-card shadow-xs">
                <QRScanner onScan={handleScan} onError={handleError} isLoading={isProcessing} />
              </div>
              <Card className="bg-muted/20 shadow-none">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Instrucciones
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-muted-foreground/40">•</span>
                      Asegúrate de estar en la clase correspondiente
                    </li>
                    <li className="flex gap-2">
                      <span className="text-muted-foreground/40">•</span>
                      Solicita al docente que muestre el código QR
                    </li>
                    <li className="flex gap-2">
                      <span className="text-muted-foreground/40">•</span>
                      Apunta tu cámara hacia el código QR
                    </li>
                    <li className="flex gap-2">
                      <span className="text-muted-foreground/40">•</span>
                      Espera a que se procese automáticamente
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Pestaña código manual */}
        <TabsContent value="codigo" className="mt-5 space-y-4">
          {manualSuccess ? (
            <SuccessCard
              className={manualSuccess.className}
              subject={manualSuccess.subjectName}
              recordedAt={new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              onReset={() => setManualSuccess(null)}
              resetLabel="Registrar otro"
            />
          ) : (
            <Card>
              <CardContent className="p-5">
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      name="token"
                      placeholder="Pega el código aquí..."
                      value={token}
                      onChange={e => setToken(e.target.value.toLowerCase())}
                      className="text-center font-mono text-xs h-11"
                      autoComplete="off"
                      disabled={isLoading}
                    />
                    <p className="text-[11px] text-muted-foreground text-center">
                      32 caracteres generados por el docente
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isLoading || !token.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Registrar asistencia
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <ul className="space-y-1.5 text-[11px] text-muted-foreground text-center">
            <li>El código se muestra en la pantalla del aula</li>
            <li>Verifica que sea exacto antes de enviar</li>
            <li>Token válido únicamente durante la clase</li>
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

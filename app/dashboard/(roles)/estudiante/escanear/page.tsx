'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

export default function ScannerPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{
    subject: string;
    class: string;
    recordedAt: string;
  } | null>(null);
  const router = useRouter();

  const handleScan = async (rawData: string) => {
    const tokenMatch = rawData.match(/escanear\/([a-f0-9]{32})/i);
    const qrToken = tokenMatch ? tokenMatch[1] : rawData;

    setIsProcessing(true);
    setSuccess(false);

    const loadingId = sileo.show({ title: 'Procesando código QR...', type: 'loading' });

    try {
      const response = await fetch('/api/asistencia/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setAttendanceData({
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

  const handleReset = () => {
    setSuccess(false);
    setAttendanceData(null);
  };

  const handleGoBack = () => {
    router.push('/dashboard/estudiante');
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-card text-foreground">
          Escanear Asistencia
        </h1>
        <p className="text-xs text-muted-foreground">
          Apunta tu cámara al código QR generado por el docente
        </p>
      </div>

      <div className="space-y-4">
        {success && attendanceData ? (
          <Card>
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
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Asignatura</span>
                  <span className="font-medium text-foreground text-right truncate">{attendanceData.subject}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Clase</span>
                  <span className="font-medium text-foreground text-right truncate">{attendanceData.class}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Hora</span>
                  <span className="font-medium text-foreground font-mono">{attendanceData.recordedAt}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleReset} variant="outline" className="flex-1 h-11">
                  Otro código
                </Button>
                <Button onClick={handleGoBack} className="flex-1 h-11">
                  Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
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
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

export default function ScannerPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{
    subject: string;
    class: string;
    recordedAt: string;
  } | null>(null);
  const router = useRouter();

  const handleScan = async (qrToken: string) => {
    setIsProcessing(true);
    setSuccess(false);

    const loadingId = sileo.show({ title: 'Procesando código QR...', type: 'loading' });

    try {
      const response = await fetch('/api/asistencia/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        sileo.dismiss(loadingId);
      } else {
        sileo.error({ title: data.message || 'Código QR inválido' });
        sileo.dismiss(loadingId);
      }
    } catch (err) {
      const errorMsg = 'Error al procesar el código QR. Intenta nuevamente.';
      sileo.error({ title: errorMsg });
      sileo.dismiss(loadingId);
    } finally {
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
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">

        <h1 className="text-2xl font-semibold tracking-card text-foreground">
          Escanear Asistencia
        </h1>
        <p className="sm:text-sm text-xs text-muted-foreground">
          Apunta tu cámara al código QR generado por el docente
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {success && attendanceData ? (
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
              <CardDescription className="sm:text-[15px] text-xs">
                Tu asistencia ha sido registrada correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-8">
              <div className="bg-background rounded-2xl p-5 border border-border/40 shadow-sm space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-muted-foreground">Asignatura</span>
                  <span className="font-semibold sm:text-[15px] text-xs">{attendanceData.subject}</span>
                </div>
                <div className="h-px bg-border/40 my-2" />
                <div className="flex justify-between items-center sm:text-[15px] text-xs">
                  <span className="text-muted-foreground">Clase</span>
                  <span className="font-medium">{attendanceData.class}</span>
                </div>
                <div className="h-px bg-border/40 my-2" />
                <div className="flex justify-between items-center sm:text-[15px] text-xs">
                  <span className="text-muted-foreground">Hora</span>
                  <span className="font-medium">{attendanceData.recordedAt}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 rounded-full h-12 text-[14px] shadow-sm hover:bg-muted/50"
                >
                  Otro código
                </Button>
                <Button
                  onClick={handleGoBack}
                  className="flex-1 rounded-full h-12 text-[14px] bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Inicio
                </Button>
              </div>
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
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                    Instrucciones
                  </span>
                  <ul className="space-y-2.5 list-none pl-1">
                    <li className="flex gap-2 items-start">
                      <span className="text-muted-foreground/50 mt-0.5">•</span> Asegúrate de estar
                      en la clase correspondiente
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-muted-foreground/50 mt-0.5">•</span> Solicita al docente
                      que muestre el código QR
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-muted-foreground/50 mt-0.5">•</span> Apunta tu cámara
                      hacia el código QR
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

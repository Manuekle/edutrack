'use client';

import QRScanner from '@/components/qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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

    const loadingToast = toast.loading('Procesando código QR...');

    console.log('Procesando token QR:', qrToken);

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
        toast.success('¡Asistencia registrada exitosamente!', { id: loadingToast });
      } else {
        toast.error(data.message || 'Código QR inválido', { id: loadingToast });
      }
    } catch (err) {
      console.error('Error procesando QR:', err);
      const errorMsg = 'Error al procesar el código QR. Intenta nuevamente.';
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (errorMessage: string) => {
    toast.error(errorMessage);
  };

  const handleReset = () => {
    setSuccess(false);
    setAttendanceData(null);
  };

  const handleGoBack = () => {
    router.push('/dashboard/estudiante');
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-heading">Registrar Asistencia</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Escanea el código QR mostrado por tu docente para registrar tu asistencia
          </p>
        </div>

        {/* Success Message */}
        {success && attendanceData ? (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-green-700 dark:text-green-400">
                ¡Asistencia Registrada!
              </CardTitle>
              <CardDescription>Tu asistencia ha sido registrada correctamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Asignatura:</span>
                  <span className="font-medium">{attendanceData.subject}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Clase:</span>
                  <span className="font-medium">{attendanceData.class}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hora de registro:</span>
                  <span className="font-medium">{attendanceData.recordedAt}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  Escanear otro código
                </Button>
                <Button onClick={handleGoBack} className="flex-1">
                  Volver al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Scanner */}
            <QRScanner onScan={handleScan} onError={handleError} isLoading={isProcessing} />

            {/* Help Text */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Instrucciones:</p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Asegúrate de estar en la clase correspondiente</li>
                    <li>Solicita al docente que muestre el código QR</li>
                    <li>Apunta tu cámara hacia el código QR</li>
                    <li>Espera a que se procese automáticamente</li>
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

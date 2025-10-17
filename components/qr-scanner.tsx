'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, CameraOff, Type } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface QRScannerProps {
  onScan: (qrToken: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export default function QRScanner({ onScan, onError, isLoading = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCamera, setHasCamera] = useState(true);
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError('No se encontró cámara disponible');
          return;
        }

        const qrScanner = new QrScanner(
          videoRef.current,
          result => {
            try {
              console.log('QR Token escaneado:', result.data);
              onScan(result.data);
              setError('');
              stopScanning();
            } catch (err) {
              console.error('Error procesando código QR:', err);
              console.log('Datos QR que causaron error:', result?.data);
              setError('Error procesando el código QR');
              onError?.('Error procesando el código QR');
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment',
            maxScansPerSecond: 5,
            returnDetailedScanResult: true,
          }
        );

        qrScannerRef.current = qrScanner;
      } catch (err) {
        console.error('Error initializing QR scanner:', err);
        const errorMsg = err instanceof Error ? err.message : 'Error al inicializar el escáner';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    initScanner();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, [onScan, onError]);

  const startScanning = async () => {
    if (!qrScannerRef.current) return;
    try {
      await qrScannerRef.current.start();
      setIsScanning(true);
      setError('');
      setShowManualInput(false);
    } catch (err) {
      console.error('Error starting scanner:', err);
      const errorMsg = 'Error al iniciar el escáner. Verifica los permisos de cámara.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const toggleScanning = () => {
    if (isScanning) stopScanning();
    else startScanning();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = manualToken.trim();
    if (!rawInput) return;

    try {
      console.log('Token ingresado manualmente:', rawInput);
      onScan(rawInput);
      setManualToken('');
      setShowManualInput(false);
    } catch (err) {
      console.error('Error procesando entrada manual:', err);
      console.log('Entrada que causó error:', rawInput);
      setError('Error procesando el código');
      onError?.('Error procesando el código');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardDescription>
          {showManualInput
            ? 'Ingresa manualmente el código de asistencia'
            : 'Apunta la cámara hacia el código QR de asistencia'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && toast.error(error)}

        {showManualInput ? (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualToken">Código de asistencia</Label>
              <Input
                id="manualToken"
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                placeholder="Ingresa el código de asistencia"
                disabled={isLoading}
                className="text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowManualInput(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !manualToken.trim()}>
                {isLoading ? 'Procesando...' : 'Confirmar'}
              </Button>
            </div>
          </form>
        ) : hasCamera ? (
          <>
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs">Presiona iniciar para comenzar</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex sm:flex-row flex-col gap-2">
              <Button
                onClick={toggleScanning}
                variant={isScanning ? 'destructive' : 'default'}
                className="flex-1 font-medium"
                disabled={isLoading}
              >
                {isScanning ? (
                  <>
                    <CameraOff className="h-4 w-4 mr-2" />
                    Detener
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    {isLoading ? 'Cargando...' : 'Escanear QR'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowManualInput(true)}
                disabled={isLoading}
              >
                <Type className="h-4 w-4 mr-2" />
                Ingresar manualmente
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CameraOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No se encontró cámara disponible</p>
            <Button variant="outline" onClick={() => setShowManualInput(true)} disabled={isLoading}>
              <Type className="h-4 w-4 mr-2" />
              Ingresar código manualmente
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>Asegúrate de permitir el acceso a la cámara cuando se solicite</p>
        </div>
      </CardContent>
    </Card>
  );
}

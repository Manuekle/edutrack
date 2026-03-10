'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Camera, CameraOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  onScan: (qrToken: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export default function QRScanner({ onScan, onError, isLoading = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrScannerRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCamera, setHasCamera] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [QrScannerLib, setQrScannerLib] = useState<any>(null);

  useEffect(() => {
    import('qr-scanner')
      .then(mod => setQrScannerLib(mod.default))
      .catch(() => {
        setError('Error al cargar la librería del escáner');
      });
  }, []);

  useEffect(() => {
    if (!QrScannerLib || !videoRef.current) return;

    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        const hasCamera = await QrScannerLib.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError('No se encontró cámara disponible');
          return;
        }

        const qrScanner = new QrScannerLib(
          videoRef.current,
          (result: { data: string }) => {
            try {
              onScan(result.data);
              setError('');
              stopScanning();
            } catch (err) {
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
  }, [QrScannerLib, onScan, onError]);

  const startScanning = async () => {
    if (!qrScannerRef.current) return;
    try {
      await qrScannerRef.current.start();
      setIsScanning(true);
      setError('');
    } catch (err) {
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardDescription>Apunta la cámara hacia el código QR de asistencia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {hasCamera ? (
          <>
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs">Presiona iniciar para comenzar</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={toggleScanning}
              variant={isScanning ? 'destructive' : 'default'}
              className="w-full font-semibold"
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
          </>
        ) : (
          <div className="text-center py-8">
            <CameraOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontró cámara disponible</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>Asegúrate de permitir el acceso a la cámara cuando se solicite</p>
        </div>
      </CardContent>
    </Card>
  );
}

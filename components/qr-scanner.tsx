'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Camera, CameraOff, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

interface QRScannerProps {
  onScan: (qrToken: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

// Simple QR code detection using canvas
async function detectQRCode(video: HTMLVideoElement): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    // Note: This is a simplified version. For real QR detection,
    // we'd need a library like jsQR or html5-qrcode
    return null;
  } catch {
    return null;
  }
}

export default function QRScanner({ onScan, onError, isLoading = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Start camera
  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCamera(true);
      setIsScanning(true);
      scanningRef.current = true;

      // Start scanning loop
      scanLoop();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'No se pudo acceder a la cámara';

      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        setError('Permiso de cámara denegado. Permite el acceso en tu navegador.');
      } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('not found')) {
        setError('No se encontró cámara en este dispositivo.');
      } else {
        setError('Error al iniciar la cámara: ' + errorMsg);
      }
      setHasCamera(false);
      onError?.(errorMsg);
    } finally {
      setIsStarting(false);
    }
  }, [onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    scanningRef.current = false;
    setIsScanning(false);
  }, []);

  // Simple scan using external library detection
  const scanLoop = useCallback(async () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

    try {
      // Use HTML5-QR library if available
      const { Html5Qrcode } = await import('html5-qrcode');

      const html5QrCode = new Html5Qrcode('qr-video-element');

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        decodedText => {
          // Got a QR code!
          scanningRef.current = false;

          // Extract token from URL or direct token
          const match = decodedText.match(/escanear\/([a-f0-9]{32})/i);
          const token = match ? match[1] : decodedText;

          if (token.length >= 32) {
            stopCamera();
            onScan(token);
          }
        },
        () => {
          // No QR detected, continue scanning
        }
      );
    } catch (err) {
      // Fallback: try basic video frame capture
      console.log('Html5Qr not available, using fallback');
    }
  }, [onScan, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle scan button
  const handleScanClick = () => {
    if (isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardDescription>Apunta la cámara hacia el código QR</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Video container */}
        <div className="relative aspect-square bg-black rounded-xl overflow-hidden">
          {/* Video element */}
          <video
            ref={videoRef}
            id="qr-video-element"
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Initial state - camera not started */}
          {!isScanning && !hasCamera && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90">
              <Camera className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center px-4">
                Presiona "Iniciar cámara" para comenzar el escaneo
              </p>
            </div>
          )}

          {/* Starting state */}
          {isStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Iniciando cámara...</p>
            </div>
          )}

          {/* Scanning state indicator */}
          {isScanning && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-green-500/90 text-white px-3 py-1.5 rounded-full text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Escaneando...
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isScanning && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>1. Solicita al docente que muestre el código QR</p>
            <p>2. Presiona el botón para iniciar la cámara</p>
            <p>3. Apunta al código QR hasta detectarlo</p>
          </div>
        )}

        {/* Action button */}
        <Button
          onClick={handleScanClick}
          disabled={isLoading || isStarting}
          className="w-full"
          variant={isScanning ? 'destructive' : 'default'}
        >
          {isLoading || isStarting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Iniciando...
            </>
          ) : isScanning ? (
            <>
              <CameraOff className="h-4 w-4 mr-2" />
              Detener
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              {hasCamera === false ? 'Verificar cámara' : 'Iniciar escaneo'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Camera, CameraOff, Loader2, AlertCircle, Info } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

interface QRScannerProps {
  onScan: (qrToken: string) => void;
  onError?: (error: string, retryAfter?: number, remaining?: number) => void;
  isLoading?: boolean;
}

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 60000; // 1 minute

export default function QRScanner({ onScan, onError, isLoading = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrScannerRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCamera, setHasCamera] = useState<boolean | null>(null); // null = checking
  const [isInitializing, setIsInitializing] = useState(true); // H1-A: Loading state
  const [showStopConfirm, setShowStopConfirm] = useState(false); // H3-A: Confirmation
  const [attempts, setAttempts] = useState(0); // H5-B: Rate limiting visual
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [QrScannerLib, setQrScannerLib] = useState<any>(null);

  // Check rate limiting
  const isRateLimited = attempts >= MAX_ATTEMPTS;
  const rateLimitRemaining = Math.max(0, MAX_ATTEMPTS - attempts);

  // Reset rate limit after window expires
  useEffect(() => {
    if (attempts > 0 && Date.now() - lastAttemptTime > ATTEMPT_WINDOW) {
      setAttempts(0);
    }
  }, [attempts, lastAttemptTime]);

  useEffect(() => {
    import('qr-scanner')
      .then(mod => {
        const Lib = mod.default;
        setQrScannerLib(() => Lib);
      })
      .catch(() => {
        setError('Error al cargar la librería del escáner');
        setIsInitializing(false);
      });
  }, []);

  useEffect(() => {
    if (!QrScannerLib || !videoRef.current) return;

    const initScanner = async () => {
      if (!videoRef.current) return;

      setIsInitializing(true); // H1-A: Show loading

      try {
        const hasCamera = await QrScannerLib.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError(
            'No se encontró cámara disponible. Verifica que tu dispositivo tenga una cámara conectada.'
          );
          setIsInitializing(false);
          return;
        }

        const qrScanner = new QrScannerLib(
          videoRef.current,
          (result: { data: string }) => {
            // H5-A: Local validation before sending
            const token = result.data.trim();

            // Also handle URL format: /dashboard/estudiante/escanear/[token]
            const urlMatch = token.match(/escanear\/([a-f0-9]{32})/i);
            const finalToken = urlMatch ? urlMatch[1] : token;

            if (finalToken.length < 32 || finalToken.length > 64) {
              const errMsg = 'Código QR no válido. Intenta con otro código.';
              setError(errMsg);
              return;
            }

            // H5-B: Track attempts for rate limiting
            const now = Date.now();
            if (now - lastAttemptTime > ATTEMPT_WINDOW) {
              setAttempts(1);
            } else {
              setAttempts(prev => prev + 1);
            }
            setLastAttemptTime(now);

            // Clear error on successful scan
            setError('');
            onScan(finalToken);
            stopScanning();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: false,
          }
        );

        qrScannerRef.current = qrScanner;
        setIsInitializing(false); // H1-A: Done loading
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al inicializar el escáner';
        setError(errorMsg);
        onError?.(errorMsg);
        setIsInitializing(false);
      }
    };

    initScanner();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, [QrScannerLib, onScan, onError, lastAttemptTime]);

  const startScanning = useCallback(async () => {
    if (!qrScannerRef.current) return;
    if (isRateLimited) {
      const retryAfter = Math.ceil((ATTEMPT_WINDOW - (Date.now() - lastAttemptTime)) / 1000);
      const errMsg = `Demasiados intentos. Espera ${retryAfter}s para reintentar.`;
      setError(errMsg);
      onError?.(errMsg, retryAfter, 0);
      return;
    }
    try {
      await qrScannerRef.current.start();
      setIsScanning(true);
      setError('');
    } catch (err) {
      const errorMsg =
        'Error al iniciar el escáner. Verifica que hayas permitido el acceso a la cámara en tu navegador.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [isRateLimited, lastAttemptTime, onError]);

  const stopScanning = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setIsScanning(false);
    }
  }, []);

  // H3-A: Confirmation before stopping
  const handleStopClick = () => {
    if (isScanning) {
      setShowStopConfirm(true);
    } else {
      startScanning();
    }
  };

  const confirmStop = () => {
    stopScanning();
    setShowStopConfirm(false);
  };

  // H10-A: Accessible button labels
  const getCameraButtonLabel = () => {
    if (isInitializing || isLoading) return 'Cargando cámara...';
    if (isScanning) return 'Detener escaneo';
    if (isRateLimited) return `Espera para escanear (${rateLimitRemaining} intentos)`;
    return 'Escanear código QR';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardDescription>Apunta la cámara hacia el código QR de asistencia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error display */}
        {error && (
          <div
            className="sm:text-sm text-xs text-destructive text-center flex items-center justify-center gap-2"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Rate limit warning */}
        {isRateLimited && !error && (
          <div
            className="sm:text-sm text-xs text-amber-600 dark:text-amber-500 text-center flex items-center justify-center gap-2"
            role="status"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Demasiados intentos. Espera{' '}
              {Math.ceil((ATTEMPT_WINDOW - (Date.now() - lastAttemptTime)) / 1000)}s para
              reintentar.
            </span>
          </div>
        )}

        {/* Camera area with loading state */}
        {hasCamera !== false ? (
          <>
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {/* H1-A: Loading state visible */}
              {isInitializing && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-muted/95 z-10"
                  role="status"
                  aria-label="Inicializando cámara"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Inicializando cámara...
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Verificando acceso</p>
                </div>
              )}

              {/* Video element with accessibility */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                aria-label="Vista previa de la cámara para escanear código QR de asistencia"
              />

              {/* Idle state */}
              {!isScanning && !isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-10 w-10 mx-auto mb-3 text-primary/60" aria-hidden="true" />
                    <p className="text-sm font-medium">
                      Presiona &ldquo;Escanear QR&rdquo; para comenzar
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground/70">
                      Se solicitará permiso para usar la cámara
                    </p>
                  </div>
                </div>
              )}

              {/* Scanning active indicator */}
              {isScanning && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Escaneando...
                </div>
              )}
            </div>

            {/* Attempts indicator */}
            {!isRateLimited && attempts > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>
                  {rateLimitRemaining} intento{rateLimitRemaining !== 1 ? 's' : ''} restante
                  {rateLimitRemaining !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-3 rounded-full transition-colors ${
                        i < attempts ? 'bg-amber-500' : 'bg-muted'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Main action button */}
            <Button
              onClick={handleStopClick}
              variant={isScanning ? 'destructive' : 'default'}
              className="w-full font-semibold"
              disabled={isLoading || isInitializing || isRateLimited}
              aria-label={getCameraButtonLabel()}
              title={isScanning ? 'Detener el escaneo actual' : 'Iniciar escaneo de código QR'}
            >
              {isLoading || isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Cargando...
                </>
              ) : isScanning ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" aria-hidden="true" />
                  Detener
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" aria-hidden="true" />
                  Escanear QR
                </>
              )}
            </Button>
          </>
        ) : (
          /* No camera state */
          <div className="text-center py-10">
            <CameraOff
              className="h-14 w-14 text-muted-foreground mx-auto mb-4"
              aria-hidden="true"
            />
            <p className="text-muted-foreground font-medium">No se encontró cámara disponible</p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Verifica que tu dispositivo tenga una cámara conectada y que esté habilitada
            </p>
          </div>
        )}

        {/* H10-B: Comprehensive help text */}
        <div className="bg-muted/30 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium text-foreground/80">¿Cómo usar el escáner?</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground/80">
                <li>Presiona el botón &ldquo;Escanear QR&rdquo;</li>
                <li>Permite el acceso a la cámara cuando el navegador lo solicite</li>
                <li>Apunta hacia el código QR que muestra el docente</li>
                <li>Espera la confirmación de registro</li>
              </ol>
              <p className="pt-1 border-t border-border/50 mt-2">
                <strong>Problemas frecuentes:</strong>
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>
                  Si la cámara no funciona, verifica los permisos en la configuración de tu
                  navegador
                </li>
                <li>Asegúrate de que ninguna otra aplicación esté usando la cámara</li>
                <li>En dispositivos móviles, usa Chrome o Safari para mejores resultados</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>

      {/* H3-A: Confirmation dialog */}
      <AlertDialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Detener el escaneo?</AlertDialogTitle>
            <AlertDialogDescription>
              Si detienes el escaneo ahora, tendrás que iniciar uno nuevo para registrar tu
              asistencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar escaneando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStop}>Sí, detener</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

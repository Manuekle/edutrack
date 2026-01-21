'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, Info, Loader2, RotateCw, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Tipos para la respuesta de la API y el estado
type ApiData = {
  message: string;
  error?: string;
  details?: string;
  startsIn?: number;
  classStartsAt?: string;
  classEndedAt?: string;
  retryAfter?: number;
  attendance?: { id: string; status: string; recordedAt: string };
  subjectName?: string;
  className?: string;
};

type AttendanceRecord = {
  id: string;
  status: string;
  recordedAt: string;
  subjectName?: string;
  className?: string;
};

type ScanStatus = 'loading' | 'success' | 'error' | 'info';

// Tiempo de redirección en segundos
const REDIRECT_DELAY = 15;

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const token = params.token as string;

  const [scanState, setScanState] = useState<{
    status: ScanStatus;
    message: string;
    error?: ApiData;
    attendance?: AttendanceRecord;
  }>({
    status: 'loading',
    message: 'Validando sesión...',
  });

  const [redirectIn, setRedirectIn] = useState<number | undefined>(undefined);
  const isMounted = useRef(true);
  const hasScanned = useRef(false);
  const redirectTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (redirectTimer.current) window.clearInterval(redirectTimer.current);
    };
  }, []);

  // Estado para controlar la navegación
  const [navigationPath, setNavigationPath] = useState<string | null>(null);

  // Efecto para manejar la navegación
  useEffect(() => {
    if (navigationPath) {
      router.push(navigationPath);
    }
  }, [navigationPath, router]);

  const startRedirectCountdown = useCallback((seconds: number, path: string) => {
    if (redirectTimer.current) window.clearInterval(redirectTimer.current);
    setRedirectIn(seconds);
    redirectTimer.current = window.setInterval(() => {
      setRedirectIn(prev => {
        if (!isMounted.current || prev === undefined || prev <= 1) {
          window.clearInterval(redirectTimer.current!);
          if (isMounted.current) {
            setNavigationPath(path);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApiResponse = useCallback(
    (data: ApiData, responseOk: boolean) => {
      if (!isMounted.current) return;

      const attendanceRecord = data.attendance
        ? {
            ...data.attendance,
            subjectName: data.subjectName,
            className: data.className,
          }
        : undefined;

      let status: ScanStatus = 'error';
      let message = data.message;
      let redirectDelay = REDIRECT_DELAY;
      let redirectPath = '/dashboard/estudiante';

      if (responseOk) {
        status = 'success';
      } else {
        switch (data.error) {
          case 'RATE_LIMITED':
            message = `Has realizado demasiados intentos. Por favor, espera ${data.retryAfter || 'un momento'}.`;
            redirectDelay = data.retryAfter || REDIRECT_DELAY;
            break;
          case 'CLASS_NOT_STARTED':
            message = `La clase aún no ha comenzado.`;
            if (data.startsIn) message += ` Faltan ${data.startsIn} minutos.`;
            break;
          case 'CLASS_ENDED':
            message = 'Esta clase ya ha finalizado.';
            break;
          case 'INVALID_QR_CODE':
          case 'INVALID_TOKEN':
            message = 'El código QR no es válido o ha expirado.';
            break;
          case 'NOT_ENROLLED':
            message = 'No estás inscrito en esta asignatura.';
            redirectPath = '/dashboard';
            break;
          case 'ATTENDANCE_ALREADY_RECORDED':
            status = 'info';
            message = 'Ya tienes una asistencia registrada para esta clase.';
            break;
          default:
            message = data.message || 'Ocurrió un error inesperado.';
            break;
        }
      }

      setScanState({
        status,
        message,
        error: responseOk ? undefined : data,
        attendance: attendanceRecord,
      });

      startRedirectCountdown(redirectDelay, redirectPath);
    },
    [startRedirectCountdown]
  );

  const handleScan = useCallback(async () => {
    if (redirectTimer.current) window.clearInterval(redirectTimer.current);
    setRedirectIn(undefined);

    if (!token) {
      handleApiResponse(
        {
          message: 'No se proporcionó un token de asistencia.',
          error: 'INVALID_TOKEN',
        },
        false
      );
      return;
    }

    setScanState({ status: 'loading', message: 'Registrando asistencia...' });

    try {
      const response = await fetch('/api/asistencia/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token }),
      });

      const data: ApiData = await response.json();
      handleApiResponse(data, response.ok);
    } catch {
      handleApiResponse(
        {
          message: 'No se pudo conectar con el servidor. Revisa tu conexión a internet.',
          error: 'NETWORK_ERROR',
        },
        false
      );
    }
  }, [token, handleApiResponse]);

  useEffect(() => {
    if (authStatus === 'loading' || hasScanned.current) return;

    if (authStatus === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (authStatus === 'authenticated') {
      if (session?.user?.role !== 'ESTUDIANTE') {
        toast.error('Acceso denegado. Debes ser un estudiante.');
        router.push('/dashboard');
        return;
      }

      hasScanned.current = true;
      handleScan();
    }
  }, [authStatus, session, router, handleScan]);

  const renderIcon = () => {
    switch (scanState.status) {
      case 'loading':
        return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-destructive" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="pt-56 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl tracking-card">Registro de Asistencia</CardTitle>
            <CardDescription>
              {authStatus === 'authenticated'
                ? scanState.status === 'loading'
                  ? 'Procesando registro...'
                  : 'Procesando asistencia...'
                : 'Inicia sesión para continuar'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-center">
            <div className="flex justify-center">{renderIcon()}</div>

            <p className="text-xs text-muted-foreground">{scanState.message}</p>

            {scanState.status === 'error' && scanState.error?.error === 'CLASS_NOT_STARTED' && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">Clase inicia a las:</p>
                <p className="font-medium">{formatTime(scanState.error.classStartsAt)}</p>
              </div>
            )}

            {(scanState.status === 'success' || scanState.status === 'info') &&
              scanState.attendance && (
                <div className="pt-4 border-t space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asignatura:</span>
                    <span className="font-medium">{scanState.attendance.subjectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-medium">
                      {new Date(scanState.attendance.recordedAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              )}

            {redirectIn !== undefined && redirectIn > 0 && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Redirigiendo en {redirectIn} segundos
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/estudiante')}
              className="flex-1"
            >
              Inicio
            </Button>
            {scanState.status === 'error' && (
              <Button onClick={handleScan} className="flex-1">
                <RotateCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

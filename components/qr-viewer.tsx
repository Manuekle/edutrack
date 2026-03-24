'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Clock, Copy, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';

interface QRViewerProps {
  qrUrl: string;
  qrToken: string;
  expiresAt?: string | Date | null;
  onRefresh?: () => void;
  onClose?: () => void;
  isRefreshing?: boolean;
}

export function QRViewer({
  qrUrl,
  qrToken,
  expiresAt = null,
  onRefresh,
  onClose,
  isRefreshing = false,
}: QRViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const qrSize = isFullscreen ? 500 : 260;

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      try {
        const target = new Date(expiresAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((target - now) / 1000));
        setTimeLeft(diff);
        return diff;
      } catch (e) {
        return 0;
      }
    };

    calculateTimeLeft();
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const toggleFullscreen = () => {
    if (!qrContainerRef.current) return;
    if (!document.fullscreenElement) {
      qrContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // H2-A: Improved time formatting with contextual labels
  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // H2-A: Get human-readable time description
  const getTimeDescription = (seconds: number | null) => {
    if (seconds === null) return 'Sin límite de tiempo';
    if (seconds <= 0) return 'Ha expirado';
    if (seconds <= 30) return 'Expira pronto';
    if (seconds <= 60) return 'Menos de 1 minuto';
    if (seconds <= 120) return 'Aproximadamente 1 minuto';
    return `Válido por ${Math.ceil(seconds / 60)} minutos`;
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      sileo.success({ title: 'Token copiado al portapapeles' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      sileo.error({
        title: 'Error al copiar',
        description: 'No se pudo copiar el token. Intenta de nuevo.',
      });
    }
  };

  return (
    <div
      ref={qrContainerRef}
      className={cn(
        'flex flex-col items-center justify-center w-full',
        isFullscreen ? 'bg-white dark:bg-[#0a0a0a] fixed inset-0 z-[60] p-10' : ''
      )}
    >
      <div className="flex flex-col items-center w-full max-w-[340px] space-y-6">
        {/* QR Frame - Standard Centered */}
        <div
          className={cn(
            'bg-white p-6 rounded-2xl shadow-sm border border-border/40 transition-all',
            isFullscreen ? 'scale-110' : 'scale-100'
          )}
        >
          {qrUrl ? (
            <QRCodeCanvas
              value={qrUrl}
              size={qrSize}
              level="M"
              fgColor="#000000"
              bgColor="#ffffff"
            />
          ) : (
            <div
              className="flex items-center justify-center bg-muted/20"
              style={{ width: qrSize, height: qrSize }}
            >
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Info & Controls */}
        {!isFullscreen && (
          <div className="w-full space-y-5">
            {/* H2-A: Time display with context */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm transition-all duration-300',
                  timeLeft !== null && timeLeft <= 30
                    ? 'bg-destructive/10 border-destructive/20 text-destructive animate-pulse'
                    : 'bg-primary/5 border-primary/10 text-primary'
                )}
              >
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="font-mono sm:text-sm text-xs font-black tracking-card leading-none">
                  {formatTime(timeLeft)}
                </span>
              </div>
              {/* H2-A: Contextual time description */}
              <p
                className={cn(
                  'text-[11px] font-medium',
                  timeLeft !== null && timeLeft <= 30
                    ? 'text-destructive/80'
                    : 'text-muted-foreground'
                )}
                aria-live="polite"
              >
                {getTimeDescription(timeLeft)}
              </p>
            </div>

            {/* Token display with accessible copy button */}
            <div className="px-4 py-2 bg-muted/40 rounded-full border border-border/20">
              <div className="flex items-center justify-between gap-3">
                <code className="font-mono sm:text-sm text-xs font-bold tracking-card text-foreground truncate select-all">
                  {qrToken || '........'}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToken}
                  className="h-8 w-8 shrink-0 hover:bg-background"
                  aria-label={copied ? 'Token copiado' : 'Copiar token al portapapeles'}
                  title={copied ? 'Copiado' : 'Copiar token'}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons Integrated */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={toggleFullscreen}
                  className="rounded-full text-xs font-bold uppercase border-muted-foreground/20"
                  aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  title={
                    isFullscreen ? 'Salir de pantalla completa' : 'Ampliar a pantalla completa'
                  }
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                      <span className="hidden sm:inline">Minimizar</span>
                      <span className="sm:hidden">Min.</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                      Pantalla
                    </>
                  )}
                </Button>

                {onRefresh && (
                  <Button
                    variant="default"
                    size="default"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="rounded-full text-xs font-bold uppercase border-muted-foreground/20"
                    aria-label={isRefreshing ? 'Renovando código QR' : 'Renovar código QR'}
                    title="Generar un nuevo código QR"
                  >
                    <RefreshCw
                      className={cn('h-3.5 w-3.5 mr-2', isRefreshing && 'animate-spin')}
                      aria-hidden="true"
                    />
                    Renovar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen controls */}
        {isFullscreen && (
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label={isRefreshing ? 'Renovando código QR' : 'Renovar código QR'}
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
                  aria-hidden="true"
                />
                {isRefreshing ? 'Renovando...' : 'Renovar QR'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={toggleFullscreen}
              aria-label="Salir de pantalla completa"
            >
              <Minimize2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Salir de pantalla completa
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Clock, Copy, Loader2, Maximize2, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface QRViewerProps {
  qrUrl: string;
  qrToken: string;
  expiresIn: number | null;
  onRefresh?: () => void;
  onClose: () => void;
  isRefreshing?: boolean;
}

export function QRViewer({
  qrUrl,
  qrToken,
  expiresIn,
  onRefresh,
  onClose,
  isRefreshing = false,
}: QRViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Removed unused isDarkMode state as it's not being used in the component
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const qrSize = isFullscreen ? 400 : 240;

  // Removed unused dark mode detection effect

  const toggleFullscreen = () => {
    if (!qrContainerRef.current) return;
    if (!document.fullscreenElement) {
      qrContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('No se pudo copiar el código');
    }
  };

  return (
    <div
      ref={qrContainerRef}
      className={cn(
        'transition-all duration-300',
        isFullscreen
          ? 'bg-white dark:bg-black w-screen h-screen fixed inset-0 z-50 flex items-center justify-center'
          : 'bg-background rounded-xl shadow-sm dark:shadow-zinc-900 w-full max-w-md mx-auto p-8 flex flex-col items-center justify-center'
      )}
    >
      {isFullscreen ? (
        // Solo QR en pantalla completa
        <QRCodeCanvas value={qrUrl} size={qrSize} level="H" fgColor="#000000" bgColor="#ffffff" />
      ) : (
        // Vista normal con todos los elementos
        <>
          {/* QR Code */}
          <div className="relative mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm dark:shadow-zinc-900">
              <QRCodeCanvas
                value={qrUrl}
                size={qrSize}
                level="H"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>

            {/* Timer */}
            {expiresIn !== null && (
              <div className="absolute -top-5 -right-5 bg-background border rounded-full px-3 py-1 shadow-sm">
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono">{formatTime(expiresIn)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Manual Code */}
          <div className="w-full mb-6 space-y-3">
            <div className="relative">
              <div className="font-mono text-center p-3 pr-10 bg-muted rounded-lg text-xs break-all select-all">
                {qrToken}
              </div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToken}
                  className="h-8 w-8 p-0 relative overflow-visible"
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
                      copied
                        ? 'translate-y-0 opacity-100'
                        : '-translate-y-2 opacity-0 pointer-events-none'
                    }`}
                  >
                    <Check className="h-3 w-3 text-green-500" />
                  </div>
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
                      copied
                        ? 'translate-y-2 opacity-0 pointer-events-none'
                        : 'translate-y-0 opacity-100'
                    }`}
                  >
                    <Copy className="h-3 w-3" />
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>

              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <Button onClick={onClose} className="w-full font-medium">
              Finalizar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

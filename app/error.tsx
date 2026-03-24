'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

interface ErrorContext {
  type?: 'data-fetch' | 'auth' | 'network' | 'server' | 'unknown';
  suggestedAction?: string;
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; context?: ErrorContext };
  reset: () => void;
}) {
  useEffect(() => {
    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Boundary]', error);
    }
  }, [error]);

  // Determine error type for contextual messaging
  const getErrorInfo = () => {
    const errorMessage = error.message?.toLowerCase() || '';

    if (
      errorMessage.includes('fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('timeout')
    ) {
      return {
        type: 'network',
        title: 'Sin conexión a internet',
        description:
          'No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.',
        suggestions: [
          'Verifica que estés conectado a internet',
          'Intenta recargar la página',
          'Si usas VPN, intenta desconectarla',
        ],
      };
    }

    if (
      errorMessage.includes('401') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('sesión')
    ) {
      return {
        type: 'auth',
        title: 'Tu sesión expiró',
        description:
          'Por seguridad, tu sesión ha finalizado. Inicia sesión nuevamente para continuar.',
        suggestions: [
          'Cierra todas las pestañas del navegador',
          'Inicia sesión con tus credenciales',
          'Si el problema persiste, contacta a soporte',
        ],
      };
    }

    if (
      errorMessage.includes('500') ||
      errorMessage.includes('server') ||
      errorMessage.includes('internal')
    ) {
      return {
        type: 'server',
        title: 'Error del servidor',
        description: 'Ocurrió un problema interno. El equipo técnico ha sido notificado.',
        suggestions: [
          'Espera unos minutos e intenta de nuevo',
          'Si el problema persiste, contacta a soporte',
        ],
      };
    }

    // Default fallback
    return {
      type: 'unknown',
      title: 'Algo salió mal',
      description: 'No pudimos cargar la información solicitada. Por favor, intenta de nuevo.',
      suggestions: [
        'Recarga la página',
        'Cierra y vuelve a abrir el navegador',
        'Si el problema persiste, contacta a soporte',
      ],
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 bg-muted/20">
      <Alert
        variant="destructive"
        className="max-w-lg rounded-2xl border-destructive/30 bg-destructive/5"
      >
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">{errorInfo.title}</AlertTitle>
        <AlertDescription className="mt-3 space-y-3">
          <p className="text-sm leading-relaxed">{errorInfo.description}</p>

          {/* Suggestions list */}
          <div className="bg-background/60 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-medium text-foreground/70 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              ¿Qué puedes hacer?
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="text-primary/60">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Error code for support */}
          {error.digest && (
            <p className="text-[11px] text-muted-foreground/60 border-t border-border/50 pt-2 mt-2">
              Código de referencia:{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">
                {error.digest}
              </code>
            </p>
          )}
        </AlertDescription>
      </Alert>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <Button variant="outline" size="lg" className="flex-1 rounded-xl" asChild>
          <Link href="/" className="flex items-center justify-center gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            Volver al inicio
          </Link>
        </Button>
        <Button
          onClick={reset}
          size="lg"
          className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
          Reintentar
        </Button>
      </div>

      {/* Support contact */}
      <p className="text-xs text-muted-foreground/60 text-center">
        Si el problema persiste, contacta a soporte técnico indicando el código de referencia.
      </p>
    </div>
  );
}

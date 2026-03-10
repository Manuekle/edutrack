'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Alert variant="destructive" className="max-w-md rounded-lg border-destructive/50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Algo salió mal</AlertTitle>
        <AlertDescription>
          {error.message || 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.'}
        </AlertDescription>
      </Alert>
      <Button onClick={reset} variant="outline" size="lg">
        Reintentar
      </Button>
    </div>
  );
}

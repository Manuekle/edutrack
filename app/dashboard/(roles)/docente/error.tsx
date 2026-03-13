'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function DocenteError({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-6">
      <Alert variant="destructive" className="max-w-md rounded-lg border-destructive/50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error en el panel docente</AlertTitle>
        <AlertDescription>
          {error.message ||
            'Ocurrió un error al cargar esta sección. Por favor, intenta de nuevo.'}
        </AlertDescription>
      </Alert>
      <Button onClick={reset} variant="outline" size="lg">
        Reintentar
      </Button>
    </div>
  );
}

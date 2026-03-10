'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardError({
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
        <AlertTitle>Error en el panel</AlertTitle>
        <AlertDescription>
          {error.message || 'No se pudo cargar esta sección. Revisa tu conexión e inténtalo de nuevo.'}
        </AlertDescription>
      </Alert>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="outline" size="lg">
          Reintentar
        </Button>
        <Button asChild variant="default" size="lg">
          <Link href="/dashboard">Ir al inicio del panel</Link>
        </Button>
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'Error de configuración del servidor.',
  AccessDenied: 'No tienes permiso para acceder.',
  Verification: 'El enlace de verificación es inválido o ha expirado.',
  Default: 'Ocurrió un error al iniciar sesión.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') ?? 'Default';
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Error de autenticación</h1>
      <p className="text-muted-foreground">{message}</p>
      <Button asChild className="mt-2 rounded-full">
        <Link href="/login">Volver al inicio de sesión</Link>
      </Button>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans">
      <Suspense fallback={null}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LoadingPage } from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import { Link, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Main page component with Suspense boundary
function JustificarAusenciaContent() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJustificationSubmitted, setIsJustificationSubmitted] = useState(false);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState('');
  const router = useRouter();

  const classId = searchParams.get('classId');
  const studentId = searchParams.get('studentId');

  // Check for existing justification on component mount
  useEffect(() => {
    // Handle countdown for redirection
    const startCountdown = (seconds: number) => {
      setRedirectIn(seconds);
      const timer = setInterval(() => {
        setRedirectIn(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            router.push('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    };

    const checkExistingJustification = async () => {
      if (!classId || !studentId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/justificar-ausencia/check?classId=${classId}&studentId=${studentId}`
        );
        const data = await response.json();

        if (data.exists) {
          setIsJustificationSubmitted(true);
          const cleanup = startCountdown(5);
          return cleanup; // Return cleanup function
        }
      } catch (error) {
        console.error('Error checking existing justification:', error);
      } finally {
        setIsLoading(false);
      }
      return () => {};
    };

    let cleanup: (() => void) | undefined;

    (async () => {
      cleanup = await checkExistingJustification();
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [classId, studentId, router]);

  // Handle countdown for form submission
  const handleSuccessfulSubmission = () => {
    setRedirectIn(5);
    const timer = setInterval(() => {
      setRedirectIn(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast('Por favor ingresa una justificación');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/justificar-ausencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          studentId,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.message?.includes('ya tiene una justificación')) {
          throw new Error('Ya has enviado una justificación para esta clase.');
        }
        throw new Error(data.message || 'Error al procesar la justificación');
      }

      toast.success('Tu justificación ha sido enviada correctamente.');
      setReason('');
      setIsJustificationSubmitted(true);
      handleSuccessfulSubmission();
    } catch (error) {
      console.error('Error al enviar la justificación:', error);
      toast(error instanceof Error ? error.message : 'Ocurrió un error al enviar la justificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isJustificationSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 font-sans">
        <Card className="w-full max-w-sm mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight text-center">
              Justificación Enviada
            </CardTitle>
            <CardDescription className="text-center">
              Ya has enviado una justificación para esta clase.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-xs text-muted-foreground">
              Serás redirigido a la página principal en {redirectIn} segundos...
            </p>
            <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
              Ir a la página principal ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classId || !studentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center">
        <Card className="w-full max-w-md p-8">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight text-center">
              Enlace inválido
            </CardTitle>
            <CardDescription className="text-xs">
              El enlace de justificación no es válido o ha expirado.
            </CardDescription>
          </CardHeader>

          <Button asChild className="text-xs">
            <Link href="/dashboard" className="px-6 py-2">
              Volver al inicio
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[100dvh] p-4 font-sans">
      <Card className="w-full max-w-sm mx-auto my-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight text-center">
            Justificar ausencia
          </CardTitle>
          <CardDescription className="text-center">
            Por favor, describe el motivo de tu ausencia a la clase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs">
                Motivo de la ausencia
              </Label>
              <Textarea
                id="reason"
                placeholder="Describe el motivo de tu ausencia..."
                className="min-h-[120px] text-xs resize-none"
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full text-xs" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar justificación'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Export the main page component wrapped in Suspense
export default function JustificarAusenciaPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <JustificarAusenciaContent />
    </Suspense>
  );
}

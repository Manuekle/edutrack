'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LoadingPage } from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { sileo } from 'sileo';

const justifyAbsenceSchema = z.object({
  reason: z.string().min(10, 'Por favor ingresa una justificación más detallada (mínimo 10 caracteres)'),
});

type JustifyAbsenceFormValues = z.infer<typeof justifyAbsenceSchema>;

function JustificarAusenciaContent() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJustificationSubmitted, setIsJustificationSubmitted] = useState(false);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const classId = searchParams.get('classId');
  const studentId = searchParams.get('studentId');

  const form = useForm<JustifyAbsenceFormValues>({
    resolver: zodResolver(justifyAbsenceSchema),
    defaultValues: {
      reason: '',
    },
  });

  useEffect(() => {
    const startCountdown = (seconds: number) => {
      setRedirectIn(seconds);
      const timer = setInterval(() => {
        setRedirectIn(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard');
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
          startCountdown(10);
        }
      } catch (error) {
        // Error silenciado
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingJustification();
  }, [classId, studentId, router]);

  const onSubmit = async (data: JustifyAbsenceFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/justificar-ausencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          studentId,
          reason: data.reason,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al procesar la justificación');
      }

      sileo.success({ title: 'Justificación enviada correctamente.' });
      setIsJustificationSubmitted(true);

      // Iniciar cuenta regresiva para redirección
      setRedirectIn(10);
      const timer = setInterval(() => {
        setRedirectIn(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      sileo.error({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo enviar.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  // Estado: Ya enviado
  if (isJustificationSubmitted) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background font-sans overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>

        <Card className="w-full max-w-md relative z-10 border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
          <CardHeader className="pt-12 pb-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-3xl font-semibold tracking-card text-foreground">
              ¡Recibido!
            </CardTitle>
            <CardDescription className="text-[16px] mt-2 px-6">
              Tu justificación ha sido enviada y será revisada por tu docente.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6 px-10 pb-12">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
              <p className="text-sm text-muted-foreground">
                Serás redirigido al panel en <span className="font-semibold text-foreground font-mono">{redirectIn}s</span>
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all"
            >
              Ir al Panel ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado: Link inválido
  if (!classId || !studentId) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background font-sans">
        <Card className="w-full max-w-md border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-destructive" />
          <CardHeader className="pt-12 pb-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-card">Enlace inválido</CardTitle>
            <CardDescription className="px-6">
              Este enlace de justificación no es válido o ya ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-12">
            <Button
              asChild
              variant="outline"
              className="w-full h-12 rounded-xl border-border/60 hover:bg-muted/50"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Volver al Inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px] animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-lg relative z-10 border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

        <CardHeader className="pt-12 pb-6 px-10 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-semibold tracking-card">
                Justificar ausencia
              </CardTitle>
              <CardDescription className="text-[15px]">
                Cuéntanos el motivo de tu inasistencia para que el docente pueda validarlo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-10 pb-12">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <FormLabel className="text-sm font-semibold text-foreground/80">Motivo de la ausencia</FormLabel>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Máximo 500 caracteres</span>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="Ej: Tenía una cita médica programada (adjunto soporte por otros medios si es necesario)..."
                          className="min-h-[160px] rounded-2xl bg-muted/30 border-border/40 focus:border-primary/50 focus:ring-primary/20 transition-all p-5 text-[15px] resize-none leading-relaxed"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="px-1" />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-[16px] font-semibold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando reporte...
                    </>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-5 w-5" /> Enviar justificación
                    </span>
                  )}
                </Button>

                <p className="text-center text-[13px] text-muted-foreground">
                  Al enviar, se notificará automáticamente a tu docente a cargo.
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JustificarAusenciaPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <JustificarAusenciaContent />
    </Suspense>
  );
}

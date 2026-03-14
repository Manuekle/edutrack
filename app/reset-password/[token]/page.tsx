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
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { sileo } from 'sileo';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Por favor confirma la contraseña'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Verificar si el token es válido al cargar la página
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidToken(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Token inválido o expirado');
        }

        setIsValidToken(true);
        setUserEmail(data.correoInstitucional || data.correoPersonal || '');
      } catch (error: unknown) {
        setIsValidToken(false);
        sileo.error({
          title: 'Acceso inválido',
          description: error instanceof Error ? error.message : 'El enlace no es válido.',
        });
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      sileo.error({ title: 'Error', description: 'Token no válido' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al restablecer la contraseña');
      }

      sileo.success({
        title: '¡Éxito!',
        description: 'Contraseña restablecida. Redirigiendo...',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: unknown) {
      sileo.error({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo restablecer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidToken === null) {
    return <LoadingPage />;
  }

  if (!isValidToken) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background font-sans">
        <Card className="w-full max-w-md border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="space-y-4 pt-10 pb-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-card">Enlace inválido</CardTitle>
            <CardDescription className="text-muted-foreground">
              El enlace de restablecimiento ha expirado o ya no es válido.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-8 pb-10">
            <Button asChild variant="outline" className="w-full h-12 rounded-xl">
              <Link href="/forgot-password">Solicitar un nuevo enlace</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full h-12 rounded-xl">
              <Link href="/login" className="flex items-center gap-2">
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
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse delay-700" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

        <CardHeader className="space-y-4 pt-10 pb-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 rotate-3 hover:rotate-0 transition-transform duration-300">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-3xl font-semibold tracking-card">
              Nueva contraseña
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[15px]">
              Estás restableciendo la contraseña para:<br />
              <span className="font-medium text-foreground">{userEmail}</span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2.5">
                    <FormLabel className="text-sm font-medium ml-1">Nueva Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 8 caracteres"
                          className="h-12 pl-12 pr-12 rounded-xl bg-muted/30 border-border/40 focus:border-primary/50 focus:ring-primary/20 transition-all text-[15px]"
                          disabled={isSubmitting}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          disabled={isSubmitting}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="ml-1" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-2.5">
                    <FormLabel className="text-sm font-medium ml-1">Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <CheckCircle2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repite tu contraseña"
                          className="h-12 pl-12 pr-12 rounded-xl bg-muted/30 border-border/40 focus:border-primary/50 focus:ring-primary/20 transition-all text-[15px]"
                          disabled={isSubmitting}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                          disabled={isSubmitting}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="ml-1" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Restablecer contraseña'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

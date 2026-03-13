'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

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
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
        setMessage({
          type: 'error',
          text:
            error instanceof Error
              ? error.message
              : 'El enlace de restablecimiento no es válido o ha expirado.',
        });
      }
    };

    verifyToken();
  }, [token]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setMessage({
        type: 'error',
        text: 'Token no válido',
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

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

      setMessage({
        type: 'success',
        text: '¡Contraseña restablecida con éxito! Redirigiendo al inicio de sesión...',
      });

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error al restablecer la contraseña. Por favor, inténtalo de nuevo.',
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
      <div className="flex flex-col items-center justify-center min-h-dvh p-4 font-sans">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-card">Enlace inválido</CardTitle>
            <CardDescription className="text-muted-foreground">
              El enlace de restablecimiento no es válido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <Button asChild variant="outline">
              <Link href="/forgot-password">Solicitar un nuevo enlace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh p-4 font-sans">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-card text-center">
            Restablecer contraseña
          </CardTitle>
          <CardDescription className="text-center">Ingresa tu nueva contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  {message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <FormLabel>Correo electrónico</FormLabel>
                <Input
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  value={userEmail}
                  disabled
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Ingresa tu nueva contraseña"
                          className="pr-10"
                          disabled={isSubmitting}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          disabled={isSubmitting}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirma tu nueva contraseña"
                          className="pr-10"
                          disabled={isSubmitting}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={
                            showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'
                          }
                          disabled={isSubmitting}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
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

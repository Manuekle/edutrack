'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const loginFormSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// Client component that uses useSearchParams
function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('/dashboard');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Usar el hook useSearchParams del lado del cliente
  const searchParams = useSearchParams();

  // Obtener la URL de retorno de los parámetros de búsqueda
  useEffect(() => {
    const urlCallbackUrl = searchParams?.get('callbackUrl');
    if (urlCallbackUrl) {
      setCallbackUrl(Array.isArray(urlCallbackUrl) ? urlCallbackUrl[0] : urlCallbackUrl);
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError('Credenciales inválidas. Por favor, inténtalo de nuevo.');
      } else {
        // Redirigir a la URL de retorno o al dashboard por defecto
        const redirectUrl = typeof callbackUrl === 'string' ? callbackUrl : '/dashboard';
        window.location.href = redirectUrl;
      }
    } catch {
      setError('Ha ocurrido un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto my-auto border-border/20 dark:border-white/[0.08] shadow-xl dark:shadow-2xl backdrop-blur-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center">
          <img src="/icons/favicon-96x96.png" alt="SIRA" className="w-full h-full" />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-card">Bienvenido</CardTitle>
        <CardDescription className="text-sm mt-1">
          Ingresa tus credenciales para acceder al sistema.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-5 pt-2">
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@correo.com"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Ingresa tu contraseña"
                        disabled={isLoading}
                        className="pr-10 h-11"
                        autoComplete="current-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        disabled={isLoading}
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6 pb-2">
            <Button className="w-full h-11 text-sm font-medium" type="submit" disabled={isLoading}>
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
            <div className="text-center text-sm">
              <Link
                href="/forgot-password"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-dvh p-4 font-sans bg-gradient-to-br from-background via-accent/30 to-primary/10">
      <Suspense
        fallback={
          <Card className="w-full max-w-md mx-auto my-auto p-8 backdrop-blur-2xl">
            <div className="text-center text-sm text-muted-foreground">Cargando...</div>
          </Card>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

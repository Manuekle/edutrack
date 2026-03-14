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
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const loginFormSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

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

  const searchParams = useSearchParams();

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
    <Card className="w-full max-w-md relative z-10 border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">


      <CardHeader className="space-y-4 pt-10 pb-4 text-center">
        <div className='flex items-center justify-center'>
          <Image src="/icons/favicon-96x96.png" alt="SIRA" width={40} height={40} className="object-contain rounded-full" />
        </div>

        <div className="space-y-1.5">
          <CardTitle className="text-3xl font-semibold tracking-card">Bienvenido</CardTitle>
          <CardDescription className="text-muted-foreground text-[15px]">
            Ingresa al sistema de registro académico
          </CardDescription>
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-6 px-8 py-6">
            {error && (
              <Alert variant="destructive" className="rounded-2xl bg-destructive/5 border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[13px]">{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2.5">
                  <FormLabel className="text-sm font-semibold ml-1 text-foreground/80">Correo institucional</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        type="email"
                        placeholder="ejemplo@fup.edu.co"
                        disabled={isLoading}
                        className="pl-12 rounded-xl bg-muted/40 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all text-xs"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="ml-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <FormLabel className="text-sm font-semibold text-foreground/80">Contraseña</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="pl-12 pr-12 rounded-xl bg-muted/40 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all text-[15px]"
                        autoComplete="current-password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="ml-1" />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="px-8 pb-10 pt-2 flex flex-col gap-6">
            <Button
              className="w-full rounded-full bg-primary hover:bg-primary/95 text-xs font-semibold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              type="submit"
              size="default"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            <p className="text-center text-[13px] text-muted-foreground font-medium">
              ¿No tienes cuenta? Contacta con administración académmica.
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[5%] -left-[5%] w-[35%] h-[35%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[5%] -right-[5%] w-[35%] h-[35%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse delay-700" />
      </div>

      <Suspense
        fallback={
          <Card className="w-full max-w-md mx-auto my-auto p-12 bg-background/60 backdrop-blur-xl border-border/40 rounded-[2.5rem] flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          </Card>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

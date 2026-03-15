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
import { ArrowLeft, Loader2, Mail, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { sileo } from 'sileo';

const forgotPasswordSchema = z.object({
  correo: z.string().email('Correo electrónico inválido'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      correo: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: data.correo }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al procesar la solicitud');
      }

      sileo.success({
        title: 'Correo enviado',
        description: 'Si el correo existe, recibirás un enlace de recuperación.',
      });
      form.reset();
    } catch (error: unknown) {
      sileo.error({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo enviar el correo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse delay-700" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">


        <CardHeader className="space-y-4 pt-10 pb-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <ShieldQuestion className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-3xl font-semibold tracking-card text-foreground">
              ¿Olvidaste tu contraseña?
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs px-4">
              Ingresa tu correo y te enviaremos las instrucciones de recuperación.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="correo"
                render={({ field }) => (
                  <FormItem className="space-y-2.5">
                    <FormLabel className="sm:text-sm text-xs font-medium ml-1">Correo Institucional / Personal</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          type="email"
                          placeholder="nombre@ejemplo.com"
                          className="pl-12 pr-4 rounded-xl bg-muted/30 border-border/40 focus:border-primary/50 focus:ring-primary/20 transition-all text-xs"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="ml-1" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full text-xs rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
                size="default"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando código...
                  </>
                ) : (
                  'Enviar enlace de recuperación'
                )}
              </Button>

              <div className="pt-4 flex justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 sm:text-sm text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

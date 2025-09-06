'use client';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// Client component that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('/dashboard');

  // Usar el hook useSearchParams del lado del cliente
  const searchParams = useSearchParams();

  // Obtener la URL de retorno de los parámetros de búsqueda
  useEffect(() => {
    const urlCallbackUrl = searchParams?.get('callbackUrl');
    if (urlCallbackUrl) {
      setCallbackUrl(Array.isArray(urlCallbackUrl) ? urlCallbackUrl[0] : urlCallbackUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
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
    <Card className="w-full max-w-sm mx-auto my-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight text-center">
          Iniciar Sesión
        </CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder al sistema.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              required
              className="text-xs"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10 text-xs" // Add right padding for the eye icon
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </CardFooter>
        {/* olvidateste tu password */}

        <div className="text-center text-xs pt-4">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Olvidaste tu contraseña?
          </Link>
        </div>
      </form>
      <div className="mx-6 mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-1">Cuentas de prueba:</p>
        <p>Admin: meerazo7@hotmail.com / admin123</p>
        <p>Docente: elustondo129@gmail.com / docente123</p>
        <p>Estudiante 1: manuel.erazo@estudiante.fup.edu.co / estudiante123</p>
        <p>Estudiante 2: andres.pena@estudiante.fup.edu.co / estudiante123</p>
      </div>
    </Card>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] p-4 font-sans">
      <Suspense
        fallback={
          <Card className="w-full max-w-sm mx-auto my-auto p-8">
            <div className="text-center">Cargando...</div>
          </Card>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

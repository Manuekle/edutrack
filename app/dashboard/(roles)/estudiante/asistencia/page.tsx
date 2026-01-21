'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type AttendanceResponse = {
  message: string;
  className?: string;
  subjectName?: string;
};

export default function StudentAttendancePage() {
  const router = useRouter();
  const { status } = useSession();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<AttendanceResponse | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent('/dashboard/estudiante/asistencia')}`);
    }
  }, [status, router]);

  const isValidToken = (token: string): boolean => {
    return /^[a-f0-9]{32}$/i.test(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      toast.error('Ingresa el código de asistencia');
      return;
    }

    if (!isValidToken(token)) {
      toast.error('Formato de código inválido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/asistencia/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token.trim() }),
      });

      const data: AttendanceResponse = await response.json();

      if (!response.ok) {
        const errorMessages: Record<number, string> = {
          400: 'Token inválido o expirado',
          403: 'No autorizado para esta clase',
          404: 'Clase no encontrada',
          409: 'Asistencia ya registrada',
          410: 'Token expirado',
        };
        toast.error(errorMessages[response.status] || 'Error al procesar código');
        return;
      }

      setSuccess(data);
      setToken('');
      toast.success('¡Asistencia registrada!');

      setTimeout(() => setSuccess(null), 8000);
    } catch {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="sm:pt-56 max-w-md mx-auto p-4 space-y-4">
      <div className="text-center space-y-2">
        <h1 className="sm:text-3xl text-2xl font-semibold tracking-card">Registrar Asistencia</h1>
        <p className="text-xs text-muted-foreground">
          Busca el código de asistencia en la pantalla de la clase
        </p>
      </div>

      {success ? (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-green-700 dark:text-green-300 flex items-center justify-center gap-2 text-xs">
              <CheckCircle className="h-4 w-4" />
              ¡Registrado!
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-xs">
            <div>
              <span className="font-normal">Clase: </span>
              {success.className || 'No especificada'}
            </div>
            {success.subjectName && (
              <div>
                <span className="font-normal">Materia: </span>
                {success.subjectName}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Código de asistencia"
                  value={token}
                  onChange={e => setToken(e.target.value.toLowerCase())}
                  className="text-center font-mono text-xs"
                  autoComplete="off"
                  autoFocus
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground text-center">32 caracteres</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !token.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Registrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>• Verifica que el código sea correcto</p>
        <p>• Contacta a tu docente si hay problemas</p>
      </div>
    </div>
  );
}

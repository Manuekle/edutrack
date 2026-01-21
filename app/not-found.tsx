import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Error 404 - FUP',
  description: 'Página no encontrada',
  keywords: 'dashboard, panel de control, FUP',
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center">
      <h1 className="text-6xl tracking-card font-semibold mb-4">404</h1>
      <h2 className="sm:text-3xl text-2xl tracking-card font-semibold mb-6">Página no encontrada</h2>
      <p className="text-xs mb-8 max-w-md">
        Lo sentimos, no pudimos encontrar la página que estás buscando.
      </p>
      <Button asChild className="text-xs">
        <Link href="/dashboard/" className="px-6 py-2">
          Volver al inicio
        </Link>
      </Button>
    </div>
  );
}

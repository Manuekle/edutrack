'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

interface LeavePageGuardProps {
  /** Si hay cambios sin guardar */
  hasUnsavedChanges: boolean;
  /** Mensaje personalizado */
  message?: string;
  /** children que contienen enlaces de navegación */
  children: React.ReactNode;
}

/**
 * Componente que envuelve enlaces de navegación y muestra
 * un diálogo de confirmación si hay cambios sin guardar.
 *
 * @example
 * ```tsx
 * <LeavePageGuard hasUnsavedChanges={hasUnsavedChanges}>
 *   <nav>
 *     <Link href="/dashboard">Dashboard</Link>
 *     <Link href="/settings">Configuración</Link>
 *   </nav>
 * </LeavePageGuard>
 * ```
 */
export function LeavePageGuard({
  hasUnsavedChanges,
  message = '¿Estás seguro de salir? Tienes cambios sin guardar que se perderán.',
  children,
}: LeavePageGuardProps) {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const router = useRouter();

  // Interceptar clics en enlaces internos
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignorar enlaces externos, anclas, o del mismo dominio con hash
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        return;
      }

      // Ignorar si es la misma página (hash navigation)
      if (href === window.location.pathname) {
        return;
      }

      // Si hay cambios sin guardar, prevenir navegación y mostrar diálogo
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.stopPropagation();
        setPendingUrl(href);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [hasUnsavedChanges]);

  const handleConfirm = () => {
    if (pendingUrl) {
      setPendingUrl(null);
      router.push(pendingUrl);
    }
  };

  const handleCancel = () => {
    setPendingUrl(null);
  };

  return (
    <>
      {children}

      <AlertDialog open={!!pendingUrl} onOpenChange={open => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Abandonar esta página?</AlertDialogTitle>
            <AlertDialogDescription>{message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Permanecer en la página</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Hook que proporciona estado de cambios sin guardar y
 * un callback para marcar como guardado.
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { hasUnsavedChanges, markAsSaved, markAsDirty } = useLeavePageGuard();
 *
 *   const handleSave = async () => {
 *     await saveData();
 *     markAsSaved();
 *   };
 *
 *   return (
 *     <div>
 *       <input onChange={() => markAsDirty()} />
 *       <button onClick={handleSave}>Guardar</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLeavePageGuard(options?: { message?: string; enabled?: boolean }) {
  return useUnsavedChanges(options);
}

'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  className?: string;
  text?: string;
}

export function Loading({ className, text = 'Cargando...' }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-48 gap-4', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground text-xs">{text}</p>
    </div>
  );
}

export function LoadingPage({ className, text = 'Cargando...' }: LoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-xs">{text}</p>
      </div>
    </div>
  );
}

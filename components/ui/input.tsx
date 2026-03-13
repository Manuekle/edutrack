import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground border-input/50 flex h-10 w-full min-w-0 rounded-xl border bg-muted/40 px-4 py-2 text-sm shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-normal disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-transparent hover:border-primary/30',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary/90 text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive/90 text-destructive-foreground hover:bg-destructive/80',
        outline: 'border text-foreground border-border/40',
        success: 'bg-success text-success-foreground hover:bg-success/80',
        successSoft: 'bg-success/10 text-success hover:bg-success/20',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/80',
        warningSoft: 'bg-warning/10 text-warning hover:bg-warning/20',
        info: 'bg-info/90 text-info-foreground hover:bg-info/80',
        warm: 'bg-warm text-warm-foreground hover:bg-warm/90',
        warmSoft: 'bg-warm/15 text-amber-700 dark:text-warm hover:bg-warm/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

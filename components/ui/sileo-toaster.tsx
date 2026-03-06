'use client';

import { useTheme } from 'next-themes';
import type { ComponentProps } from 'react';
import { Toaster } from 'sileo';

type Theme = ComponentProps<typeof Toaster>['theme'];

export function SileoToaster() {
  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const isDark = theme === 'dark';

  return (
    <Toaster
      position="top-right"
      theme={theme}
      options={
        isDark
          ? {
            fill: '#171717',
            roundness: 16,
            styles: {
              title: 'text-white font-semibold!',
              description: 'text-white/70!',
              badge: 'bg-white/10!',
              button: 'bg-white/10! hover:bg-white/20! transition-colors',
            },
          }
          : {
            fill: '#ffffff',
            roundness: 16,
            styles: {
              title: 'text-neutral-900 font-semibold!',
              description: 'text-neutral-500!',
              badge: 'bg-neutral-100!',
              button: 'bg-neutral-100! hover:bg-neutral-200! transition-colors',
            },
          }
      }
    />
  );
}

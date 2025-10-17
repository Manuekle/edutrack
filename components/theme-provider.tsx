'use client';

import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps,
} from 'next-themes';
import { useEffect, useState } from 'react';

// Componente wrapper para manejar la sincronización del tema
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Sincronizar el tema con localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Leer el tema guardado
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && savedTheme !== theme) {
        setTheme(savedTheme);
      }
    }
    setMounted(true);
  }, [setTheme, theme]);

  // Evitar parpadeo en la carga inicial
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return <>{children}</>;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
      {...props}
    >
      <ThemeWrapper>{children}</ThemeWrapper>
    </NextThemesProvider>
  );
}

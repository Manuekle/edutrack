'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Clock, QrCode, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

const features = [
  {
    icon: <QrCode className="w-8 h-8 text-primary" />,
    title: 'Registro QR Instantáneo',
    description: 'Registra tu asistencia escaneando el código en segundos.',
  },
  {
    icon: <Clock className="w-8 h-8 text-primary" />,
    title: 'Seguimiento en Tiempo Real',
    description: 'Consulta tus estadísticas y asistencias al momento.',
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: 'Seguro y Confiable',
    description: 'Tu información académica siempre protegida y validada.',
  },
];

export default function HomePageMobile() {
  const router = useRouter();
  const [currentFeature, setCurrentFeature] = useState(0);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground font-sans overflow-hidden relative">
      {/* Subtle Background Pattern (Optional, but using primary/5 or just empty) */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom" style={{ maskImage: 'linear-gradient(to bottom, transparent, black)' }} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-12"
        >
          {/* Logo Icon */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-primary/25 mb-4 bg-background flex items-center justify-center">
            <img src="/icons/favicon-192x192.png" alt="SIRA Logo" className="w-full h-full" />
          </div>
          <h1 className="text-3xl font-semibold tracking-card text-center">SIRA</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistema Integral de Registro Académico
          </p>
        </motion.div>

        {/* Feature Carousel (App-like Onboarding) */}
        <div className="w-full h-48 relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col items-center text-center px-4"
            >
              <div className="mb-4 p-4 bg-muted/30 rounded-full border border-border/50">
                {features[currentFeature].icon}
              </div>
              <h2 className="text-md tracking-card font-medium mb-2">
                {features[currentFeature].title}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {features[currentFeature].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination Dots */}
        <div className="flex gap-2 mt-4 mb-8">
          {features.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentFeature ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                }`}
            />
          ))}
        </div>
      </main>

      {/* Bottom Action Area (Safe Area) */}
      <footer className="p-6 pb-10 w-full max-w-md mx-auto relative z-10">
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full text-sm font-medium"
            onClick={() => router.push('/login')}
          >
            Iniciar Sesión
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Sistema de Gestión FUP v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}

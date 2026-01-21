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
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-primary/5 blur-3xl rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/5 blur-3xl rounded-full" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="w-20 h-20 bg-linear-to-tr from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/10 border border-primary/10 backdrop-blur-sm">
            <QrCode className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-card text-center">
            edu<span className="text-primary">Track</span>
          </h1>
        </motion.div>

        {/* Feature Carousel (App-like Onboarding) */}
        <div className="w-full h-48 relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center text-center px-4"
            >
              <div className="mb-4 p-4 bg-card/50 rounded-full border border-border/50 backdrop-blur-sm">
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
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentFeature ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
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
            className="w-full text-xs font-semibold rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
            onClick={() => router.push('/login')}
          >
            Iniciar Sesión
          </Button>

          <p className="text-center text-[10px] text-muted-foreground mt-4">
            Sistema de Gestión FUP v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}

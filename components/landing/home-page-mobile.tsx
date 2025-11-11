'use client';

import { motion } from 'framer-motion';
import { Clock, QrCode, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

export default function HomePageMobile() {
  const router = useRouter();

  const features = [
    {
      icon: <QrCode className="w-6 h-6 text-foreground" />,
      title: 'Registro con QR',
      description: 'Escanea y registra en segundos',
    },
    {
      icon: <Clock className="w-6 h-6 text-foreground" />,
      title: 'Tiempo Real',
      description: 'Control instantáneo',
    },
    {
      icon: <Users className="w-6 h-6 text-foreground" />,
      title: 'Gestión Simple',
      description: 'Administra tus grupos fácilmente',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background blur elements - shadcn style */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-secondary/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-accent/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto pt-16 text-center"
        >
          {/* Logo and Title */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-12"
          >
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <QrCode className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
              edu<span className="text-amber-500">Track</span>
            </h1>
            <p className="text-muted-foreground text-xs max-w-xs mx-auto">
              Gestión de asistencia inteligente para la Fundación Universitaria de la Popayán
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4 mb-10"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl backdrop-blur-sm bg-card border border-border hover:bg-accent/50 transition-all duration-300 shadow-sm p-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center">{feature.icon}</div>
                  <div className="flex flex-col justify-end items-start w-full">
                    <h3 className="font-normal text-foreground text-xs">{feature.title}</h3>
                    <p className="text-muted-foreground text-xs">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full"
          >
            <Button
              size="lg"
              onClick={() => router.push('/login')}
              variant="default"
              className="w-full"
            >
              Iniciar Sesión
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

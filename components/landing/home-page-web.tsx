'use client';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import { motion } from 'framer-motion';
import {
    BarChart2,
    BellRing,
    CheckCircle2,
    Clock,
    QrCode,
    ScanLine,
    Settings,
    Shield,
    ShieldCheck,
    Smartphone,
    Users,
    Zap,
} from 'lucide-react';

export default function HomePageWeb() {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-foreground" />,
      title: 'Registro Rápido',
      description:
        'Registra la asistencia en segundos con códigos QR dinámicos y fáciles de escanear.',
    },
    {
      icon: <Clock className="w-6 h-6 text-foreground" />,
      title: 'Tiempo Real',
      description:
        'Visualiza y analiza los datos de asistencia al instante desde cualquier dispositivo.',
    },
    {
      icon: <Users className="w-6 h-6 text-foreground" />,
      title: 'Gestión de Grupos',
      description:
        'Administra múltiples clases y grupos de estudiantes de manera sencilla y organizada.',
    },
    {
      icon: <BarChart2 className="w-6 h-6 text-foreground" />,
      title: 'Reportes Detallados',
      description: 'Genera informes detallados de asistencia para un mejor seguimiento académico.',
    },
    {
      icon: <ScanLine className="w-6 h-6 text-foreground" />,
      title: 'Escaneo Fácil',
      description: 'Escanéa códigos QR rápidamente con nuestra interfaz intuitiva y amigable.',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-foreground" />,
      title: 'Acceso Móvil',
      description:
        'Accede a la plataforma desde cualquier dispositivo móvil con nuestra aplicación web responsive.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-foreground" />,
      title: 'Seguridad Garantizada',
      description:
        'Tus datos están protegidos con las más altas medidas de seguridad y privacidad.',
    },
    {
      icon: <BellRing className="w-6 h-6 text-foreground" />,
      title: 'Notificaciones',
      description: 'Recibe alertas en tiempo real sobre cambios importantes en la asistencia.',
    },
  ];

  const steps = [
    {
      icon: <QrCode className="w-6 h-6 text-foreground" />,
      title: 'Genera el código QR',
      description: 'El docente genera un código QR único para la clase en segundos',
      step: 1,
    },
    {
      icon: <ScanLine className="w-6 h-6 text-foreground" />,
      title: 'Estudiantes escanean',
      description: 'Los estudiantes escanean el código con la cámara de su dispositivo móvil',
      step: 2,
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-foreground" />,
      title: 'Confirmación instantánea',
      description: 'Reciben confirmación inmediata de su registro de asistencia',
      step: 3,
    },
    {
      icon: <Users className="w-6 h-6 text-foreground" />,
      title: 'Registro automático',
      description: 'La asistencia se registra automáticamente en el sistema del docente',
      step: 4,
    },
  ];

  const aboutFeatures = [
    {
      icon: <Zap className="w-6 h-6 text-foreground" />,
      title: 'Rápido y Eficiente',
      description: 'Registra asistencias en segundos',
    },
    {
      icon: <Shield className="w-6 h-6 text-foreground" />,
      title: 'Seguro',
      description: 'Protección de datos garantizada',
    },
    {
      icon: <Users className="w-6 h-6 text-foreground" />,
      title: 'Fácil de Usar',
      description: 'Interfaz intuitiva y amigable',
    },
    {
      icon: <Settings className="w-6 h-6 text-foreground" />,
      title: 'Personalizable',
      description: 'Configuración flexible',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 relative">
        {/* Hero Section */}
        <section className="w-full pt-16 pb-24 md:pt-28 md:pb-32 relative overflow-hidden">
          {/* Background blur elements */}
          <div className="absolute top-20 left-20 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-green-500/10 rounded-full blur-3xl"></div>

          <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6 relative z-10"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center rounded-full px-4 py-2 text-xs font-normal bg-muted/50 backdrop-blur-sm border border-border text-muted-foreground"
                >
                  Moderno, Rápido y Fácil de Usar
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl font-semibold tracking-card sm:text-4xl md:text-5xl lg:text-6xl"
                >
                  <span className="block text-foreground tracking-card font-semibold">
                    Bienvenido a
                  </span>
                  <span className="relative inline-block mt-2">
                    <span className="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-card bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                      edu<span className="text-amber-500">Track</span>
                    </span>
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mx-auto max-w-2xl text-xs text-muted-foreground md:text-xs"
                >
                  Transforma la gestión de asistencia con nuestra plataforma intuitiva. Simplifica
                  el registro, ahorra tiempo y lleva el control total de la asistencia de tus
                  estudiantes.
                </motion.p>
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
              >
                {[
                  {
                    icon: <QrCode className="w-6 h-6 text-foreground" />,
                    title: 'Registro con QR',
                    description:
                      'Escanea y registra asistencia en segundos con códigos QR dinámicos y seguros.',
                  },
                  {
                    icon: <Clock className="w-6 h-6 text-foreground" />,
                    title: 'Tiempo Real',
                    description:
                      'Visualiza y gestiona las asistencias en tiempo real desde cualquier dispositivo.',
                  },
                  {
                    icon: <Users className="w-6 h-6 text-foreground" />,
                    title: 'Gestión de Grupos',
                    description:
                      'Administra múltiples grupos y clases de manera sencilla y organizada.',
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl backdrop-blur-sm bg-white/80 dark:bg-muted/50 border border-border/50 hover:bg-white/90 dark:hover:bg-muted/70 transition-all duration-500 shadow-sm hover:shadow-md"
                  >
                    <div className="p-8 relative z-10">
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted/50 dark:bg-muted/50 rounded-xl flex items-center justify-center backdrop-blur-sm border border-border/20">
                            {feature.icon}
                          </div>
                          <h3 className="sm:text-3xl text-2xl font-semibold tracking-card text-foreground">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-balance leading-relaxed text-xs font-normal">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 relative overflow-hidden">
          {/* Background blur elements */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-red-500/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>

          <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
            >
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-normal bg-muted/50 backdrop-blur-sm border-border text-muted-foreground">
                Características
              </div>
              <h2 className="sm:text-3xl text-2xl font-semibold tracking-card sm:text-4xl text-foreground">
                Potencia tu gestión educativa
              </h2>
              <p className="max-w-2xl mx-auto text-xs text-muted-foreground">
                Descubre cómo nuestra plataforma puede transformar la forma en que gestionas las
                asistencias
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full"
                >
                  <div className="group relative overflow-hidden rounded-2xl backdrop-blur-sm bg-white/80 dark:bg-muted/50 border border-border/50 hover:bg-white/90 dark:hover:bg-muted/70 transition-all duration-500 h-full shadow-sm hover:shadow-md">
                    <div className="p-8 relative z-10 h-full">
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            {feature.icon}
                          </div>
                          <h3 className="sm:text-3xl text-2xl font-semibold tracking-card text-foreground">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground flex items-center text-center justify-center leading-relaxed text-xs font-normal">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-16 md:py-24 relative overflow-hidden">
          {/* Background blur elements */}
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-20 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl"></div>

          <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
            >
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-normal bg-muted/50 backdrop-blur-sm border-border text-muted-foreground">
                Proceso
              </div>
              <h2 className="sm:text-3xl text-2xl font-semibold tracking-card sm:text-4xl text-foreground">
                Así de fácil es comenzar
              </h2>
              <p className="max-w-2xl mx-auto text-xs text-muted-foreground">
                Un proceso intuitivo diseñado para ahorrarte tiempo y complicaciones
              </p>
            </motion.div>

            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className="flex items-start group"
                  >
                    <div className="flex flex-col items-center mr-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/50 backdrop-blur-sm border border-border">
                        {step.icon}
                      </div>
                      {step.step < steps.length && (
                        <div className="h-16 w-0.5 bg-gradient-to-b from-muted/50 to-muted/20 my-1" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center mb-1">
                        <span className="text-xs font-normal text-muted-foreground mr-2">
                          Paso {step.step}
                        </span>
                        <div className="h-px w-4 bg-gradient-to-r from-muted/50 to-muted/20" />
                      </div>
                      <h3 className="text-xs font-medium tracking-card mb-1 text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="group relative overflow-hidden rounded-2xl backdrop-blur-sm bg-white/80 dark:bg-muted/50 border border-border/50 hover:bg-white/90 dark:hover:bg-muted/70 transition-all duration-500 shadow-sm hover:shadow-md">
                  <div className="p-8 relative z-10">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="flex items-center justify-center p-6 bg-white/90 dark:bg-muted/50 backdrop-blur-sm rounded-2xl border border-border shadow-sm">
                          <QrCode className="h-32 w-32 text-foreground" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div className="mt-8 text-center">
                        <h3 className="sm:text-3xl text-2xl font-medium tracking-card mb-2 text-foreground">
                          Confirmar Asistencia
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md text-xs">
                          Escanea el código QR para confirmar tu asistencia a la clase de{' '}
                          <span className="font-normal text-foreground">
                            Inteligencia Artificial - G1
                          </span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button className="px-6 py-2 bg-black text-white rounded-lg font-normal  shadow-lg flex items-center justify-center gap-2 text-xs">
                            <ScanLine className="h-4 w-4" />
                            Escanear código
                          </button>
                          <button className="px-6 py-2 border-2 border-border bg-white text-black rounded-lg font-normal text-xs">
                            Ingresar código
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="w-full py-16 md:py-24 md:pb-56 relative overflow-hidden">
          {/* Background blur elements */}
          <div className="absolute top-20 right-20 w-56 h-56 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-normal bg-muted/50 backdrop-blur-sm border-border text-muted-foreground mb-4">
                  Nuestra Historia
                </div>
                <h2 className="sm:text-3xl text-2xl font-semibold tracking-card sm:text-3xl md:text-4xl mb-6 text-foreground">
                  Conoce más sobre{' '}
                  <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                    edu<span className="text-amber-500">Track</span>
                  </span>
                </h2>
                <p className="max-w-3xl mx-auto text-xs text-muted-foreground">
                  Una solución innovadora para la gestión de asistencia en entornos educativos
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h3 className="sm:text-3xl text-2xl font-semibold tracking-card text-foreground">
                      Nuestra Misión
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      En <span className="font-semibold text-foreground">eduTrack</span>, nos
                      dedicamos a transformar la manera en que las instituciones educativas
                      gestionan la asistencia, ofreciendo una solución intuitiva, segura y eficiente
                      que ahorra tiempo y recursos valiosos.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {aboutFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className="h-full group relative overflow-hidden rounded-2xl backdrop-blur-sm bg-white/80 dark:bg-muted/50 border border-border/50 hover:bg-white/90 dark:hover:bg-muted-70 transition-all duration-500 shadow-sm hover:shadow-md">
                        <div className="p-6 relative z-10">
                          <div className="flex items-start space-x-4">
                            <div className="bg-muted/50 p-3 rounded-xl backdrop-blur-sm">
                              {feature.icon}
                            </div>
                            <div>
                              <h4 className="font-medium tracking-card text-foreground text-xs">
                                {feature.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">{feature.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

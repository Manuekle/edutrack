// app/dashboard/profile/page.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SignatureFileUpload } from '@/components/profile/signature-file-upload';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingPage } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadSignature } from '@/lib/actions/user.actions';
import { AlertCircle, Loader2, Lock, PenLine, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { sileo } from 'sileo';

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const profileFormSchema = z.object({
  name: z.string().min(1, 'El nombre completo es requerido'),
  correoInstitucional: z.string().email('Correo institucional inválido'),
  correoPersonal: z.string().email('Correo personal inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  codigoEstudiantil: z.string().optional(),
  codigoDocente: z.string().optional(),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Por favor confirma la nueva contraseña'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isSignatureLoading, setIsSignatureLoading] = useState(false);

  // Signature
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const sigCanvas = useRef<SignatureCanvas>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      correoInstitucional: '',
      correoPersonal: '',
      telefono: '',
      codigoEstudiantil: '',
      codigoDocente: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Initialize form with session data
  useEffect(() => {
    if (session?.user) {
      profileForm.reset({
        name: session.user.name || '',
        correoInstitucional: session.user?.correoInstitucional || '',
        correoPersonal: session.user?.correoPersonal || '',
        telefono: session.user?.telefono || '',
        codigoEstudiantil: session.user?.codigoEstudiantil || '',
        codigoDocente: session.user?.codigoDocente || '',
      });
      // Set initial preview from session
      if (!signatureFile) {
        setSignaturePreview(session.user?.signatureUrl || null);
      }
    }
  }, [session, signatureFile, profileForm]);

  // This effect handles the resizing of the signature canvas to prevent pixelation.
  useEffect(() => {
    const canvas = sigCanvas.current?.getCanvas();
    const wrapper = canvasWrapperRef.current;

    if (!canvas || !wrapper) return;

    const handleResize = () => {
      const { width, height } = wrapper.getBoundingClientRect();
      // Adjust for device pixel ratio for better quality on mobile
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size in display pixels
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Set actual canvas size in memory (scaled for device resolution)
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Scale the canvas context to account for the DPR
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Clear and redraw if needed
      sigCanvas.current?.clear();
    };

    // Initial setup
    handleResize();

    // Add event listeners
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(wrapper);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Handle file selection for signature
  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        sileo.error({ title: 'El archivo es demasiado grande. El tamaño máximo es 2MB.' });
        return;
      }
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    } else {
      setSignatureFile(null);
      setSignaturePreview(session?.user?.signatureUrl || null);
    }
  };

  const handleCancelSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(session?.user?.signatureUrl || null);
    sigCanvas.current?.clear();
  };

  // Prevent page scroll when drawing on mobile
  const preventScroll = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target === sigCanvas.current?.getCanvas() ||
      target.closest('.signature-canvas-container')
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Add touch event listeners for better mobile support
  useEffect(() => {
    // Add passive: false to ensure preventDefault works on touch events
    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  const clearCanvas = () => {
    sigCanvas.current?.clear();
    setSignatureFile(null);
    setSignaturePreview(session?.user?.signatureUrl || null);
    // Remove any existing event listeners to prevent memory leaks
    document.removeEventListener('touchmove', preventScroll);
  };

  const saveCanvas = () => {
    if (!sigCanvas.current) {
      sileo.error({ title: 'Error: Canvas no disponible' });
      return;
    }

    if (sigCanvas.current.isEmpty()) {
      sileo.error({ title: 'Por favor, dibuja tu firma antes de guardar.' });
      return;
    }

    try {
      const canvas = sigCanvas.current.getCanvas();
      if (!canvas) {
        sileo.error({ title: 'Error: No se pudo acceder al canvas' });
        return;
      }

      // Verificar que el contexto del canvas esté disponible
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        sileo.error({ title: 'Error: Contexto del canvas no disponible' });
        return;
      }

      let dataUrl: string;

      // Método 1: Usar getTrimmedCanvas si está disponible
      try {
        const trimmedCanvas = sigCanvas.current.getTrimmedCanvas
          ? sigCanvas.current.getTrimmedCanvas()
          : null;

        if (trimmedCanvas) {
          dataUrl = trimmedCanvas.toDataURL('image/png');
        } else {
          throw new Error('getTrimmedCanvas no disponible');
        }
      } catch (trimError) {
        // Método 2: Usar un canvas temporal con fondo blanco
        try {
          // Crear un canvas temporal para limpiar el fondo
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');

          if (!tempCtx) {
            throw new Error('No se pudo crear el contexto temporal');
          }

          // Rellenar con fondo blanco
          tempCtx.fillStyle = 'white';
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          // Dibujar la firma
          tempCtx.drawImage(canvas, 0, 0);

          // Obtener la URL de datos del canvas temporal
          dataUrl = tempCanvas.toDataURL('image/png');
        } catch (canvasError) {
          // Método 3: Usar el canvas original sin procesar
          try {
            dataUrl = canvas.toDataURL('image/png');
          } catch (finalError) {
            sileo.error({ title: 'Error: No se pudo capturar la firma' });
            return;
          }
        }
      }

      if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
        sileo.error({ title: 'Error: La imagen capturada está vacía' });
        return;
      }

      setSignaturePreview(dataUrl);
      const filename = `signature_${Date.now()}.png`;
      const newFile = dataURLtoFile(dataUrl, filename);
      setSignatureFile(newFile);
      sileo.success({ title: 'Firma capturada exitosamente' });
    } catch (error) {
      sileo.error({ title: 'Error inesperado al capturar la firma' });
    }
  };

  // Update profile
  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!session?.user?.id) return;

    setIsProfileLoading(true);
    try {
      const updateData: {
        name: string;
        correoPersonal: string | null;
        correoInstitucional: string;
        telefono: string | null;
        codigoEstudiantil?: string | null;
        codigoDocente?: string | null;
      } = {
        name: data.name,
        correoPersonal: data.correoPersonal || null,
        correoInstitucional: data.correoInstitucional,
        telefono: data.telefono || null,
      };

      // Only include the appropriate code based on user role
      if (session?.user?.role === 'ESTUDIANTE') {
        updateData.codigoEstudiantil = data.codigoEstudiantil || null;
      } else {
        updateData.codigoDocente = data.codigoDocente || null;
      }

      const response = await fetch(`/api/users?id=${session?.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el perfil');
      }

      // Get the updated user data from the response
      const result = await response.json();

      if (!result.data) {
        throw new Error('No se recibieron datos actualizados del servidor');
      }

      const updatedUser = result.data;

      // Update the session with all the updated fields
      await update({
        ...session?.user, // Keep existing session data
        ...updatedUser, // Override with updated fields
        // Ensure these fields are explicitly included in the session
        telefono: updatedUser.telefono || null,
        codigoEstudiantil: updatedUser.codigoEstudiantil || null,
        codigoDocente: updatedUser.codigoDocente || null,
      });

      // Force a session refresh to ensure all fields are up to date
      await update();
      sileo.success({ title: 'Perfil actualizado correctamente' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil';
      sileo.error({ title: errorMessage });
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Update password
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsPasswordLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cambiar la contraseña');
      }

      passwordForm.reset();
      sileo.success({ title: 'Contraseña actualizada correctamente' });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cambiar la contraseña';
      sileo.error({ title: errorMessage });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Upload signature
  const handleUploadSignature = async () => {
    if (!signatureFile || !session?.user?.id) return;

    setIsSignatureLoading(true);
    const formData = new FormData();
    formData.append('file', signatureFile);

    try {
      const result = await uploadSignature(formData);

      if (result.success && result.url) {
        await update(); // Refresh the session in the background
        sileo.success({ title: 'Firma guardada con éxito.' });
        setSignaturePreview(result.url); // Directly update the preview for immediate feedback
        setSignatureFile(null);
      } else {
        sileo.error({ title: result.message || 'Error al guardar la firma.' });
      }
    } catch (error) {
      sileo.error({ title: 'Ocurrió un error inesperado al subir la firma.' });
    } finally {
      setIsSignatureLoading(false);
    }
  };

  if (status === 'loading') {
    return <LoadingPage />;
  }

  return (
    <div className="mx-auto space-y-10 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Mi Perfil
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Gestiona tu información personal, seguridad de la cuenta y preferencias de firma digital.
        </p>
      </div>

      <Tabs
        defaultValue="profile"
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList
          className="inline-flex h-10 items-center justify-center rounded-full bg-muted p-1 text-muted-foreground w-full max-w-md shadow-sm border border-border/50"
          style={{
            display: 'grid',
            gridTemplateColumns: session?.user?.role === 'DOCENTE' ? '1fr 1fr 1fr' : '1fr 1fr',
          }}
        >
          <TabsTrigger
            value="profile"
            className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Perfil</span>
            <span className="sm:hidden">Perfil</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Lock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Seguridad</span>
            <span className="sm:hidden">Seg.</span>
          </TabsTrigger>
          {session?.user?.role === 'DOCENTE' && (
            <TabsTrigger
              value="signature"
              className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <PenLine className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Firma</span>
              <span className="sm:hidden">Firma</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-8 animate-in fade-in-50 duration-500">
          <Card className="border shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
            <div className="h-24 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-border/50" />
            <CardHeader className="relative -mt-12 pt-0 pb-6 px-4 sm:px-8">
              <div className="flex flex-col sm:flex-row items-end gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/50 to-primary-foreground/50 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-500" />
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background bg-background shadow-xl relative z-10 transition-transform duration-500 hover:scale-105">
                    <AvatarFallback className="text-3xl font-bold bg-muted text-primary">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 pb-2 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                    {session?.user?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium tracking-wider bg-muted/50 inline-block px-2 py-0.5 rounded-md mt-1 border border-border/50">
                    {session?.user?.role}
                  </p>
                </div>
              </div>
            </CardHeader>

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="px-4 sm:px-8 space-y-8 pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-border/50">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground tracking-tight">Información de Cuenta</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs font-bold text-muted-foreground/70 tracking-widest">Nombre completo</FormLabel>
                            <FormControl>
                              <Input
                                disabled
                                placeholder="Tu nombre completo"
                                className="h-11 bg-background/50 border-muted-foreground/20 text-sm focus-visible:ring-primary/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="correoInstitucional"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs font-bold text-muted-foreground/70 tracking-widest">Correo Institucional</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="correo@institucion.edu"
                                className="h-11 bg-background/50 border-muted-foreground/20 text-sm focus-visible:ring-primary/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-border/50">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground tracking-tight">Información de Contacto y Académica</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <FormField
                        control={profileForm.control}
                        name="correoPersonal"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs font-bold text-muted-foreground/70 tracking-widest">Correo Personal (Opcional)</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="correo@personal.com"
                                className="h-11 bg-background/50 border-muted-foreground/20 text-sm focus-visible:ring-primary/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs font-bold text-muted-foreground/70 tracking-widest">Teléfono/WhatsApp</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+57 312 312 312"
                                className="h-11 bg-background/50 border-muted-foreground/20 text-sm focus-visible:ring-primary/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      {session?.user?.role === 'ESTUDIANTE' && (
                        <FormField
                          control={profileForm.control}
                          name="codigoEstudiantil"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-xs font-bold text-muted-foreground/70 tracking-widest">Código Estudiantil</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ingrese su código"
                                  className="h-11 bg-background/50 border-muted-foreground/20 text-sm focus-visible:ring-primary/30"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      )}
                      {session?.user?.role === 'DOCENTE' && (
                        <FormField
                          control={profileForm.control}
                          name="codigoDocente"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-xs font-bold text-muted-foreground/70 tracking-widest">Código Docente</FormLabel>
                              <FormControl>
                                <Input
                                  disabled
                                  placeholder="Su código docente"
                                  className="h-11 bg-background/50 border-muted-foreground/20 text-sm focus-visible:ring-primary/30"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-4 sm:px-8 py-6 bg-muted/30 border-t border-border/50">
                  <Button type="submit" disabled={isProfileLoading} className="w-full sm:w-auto px-10 shadow-lg shadow-primary/20">
                    {isProfileLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando cambios...
                      </>
                    ) : (
                      'Actualizar Información'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
          <Card className="border shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="px-4 sm:px-8 pt-8 pb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold">Cambiar Contraseña</CardTitle>
                  <CardDescription className="text-sm">
                    Recomendamos cambiar tu contraseña periódicamente para mantener tu cuenta segura.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <CardContent className="px-4 sm:px-8 py-8 space-y-6">
                  <div className="max-w-md space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-bold text-muted-foreground/70 tracking-widest">Contraseña actual</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="h-11 bg-background/50 border-muted-foreground/20 text-sm focus-visible:ring-primary/30"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold text-muted-foreground/70 tracking-widest">Nueva contraseña</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="h-11 bg-background/50 border-muted-foreground/20 text-sm focus-visible:ring-primary/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-bold text-muted-foreground/70 tracking-widest">Confirmar contraseña</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="h-11 bg-background/50 border-muted-foreground/20 text-sm focus-visible:ring-primary/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-xs text-muted-foreground flex items-start gap-3 shadow-sm">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">Requisitos de seguridad:</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-80">
                          <li>Mínimo 6 caracteres</li>
                          <li>Combina letras y números</li>
                          <li>No compartas tu contraseña con nadie</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-4 sm:px-8 py-6 bg-muted/30 border-t border-border/50">
                  <Button type="submit" disabled={isPasswordLoading} className="w-full sm:w-auto px-10 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                    {isPasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Actualizando contraseña...
                      </>
                    ) : (
                      'Actualizar Contraseña'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {session?.user?.role === 'DOCENTE' && (
          <TabsContent value="signature" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
            <Card className="border shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardHeader className="px-4 sm:px-8 pt-8 pb-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <PenLine className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold">Firma Digital</CardTitle>
                    <CardDescription className="text-sm">
                      Gestiona tu firma oficial para certificados y documentos académicos.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-4 sm:px-8 py-8 space-y-10">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] font-bold text-muted-foreground/70 tracking-widest">
                        Opción 1: Subir Imagen
                      </Label>
                    </div>
                    <div className="min-h-[220px] rounded-2xl overflow-hidden shadow-inner border border-dashed border-border group hover:border-primary/50 transition-colors">
                      <SignatureFileUpload onFileSelect={handleFileSelect} file={signatureFile} />
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center italic">
                      Formatos recomendados: PNG con fondo transparente o fondo blanco limpio.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] font-bold text-muted-foreground/70 tracking-widest">
                        Opción 2: Dibujar a Mano
                      </Label>
                    </div>
                    <div className="flex flex-col space-y-4">
                      <div
                        ref={canvasWrapperRef}
                        className="w-full h-[220px] items-center justify-center border border-muted-foreground/20 rounded-2xl bg-muted/20 relative shadow-inner overflow-hidden group touch-none"
                      >
                        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] bg-background/80 backdrop-blur px-2 py-1 rounded-full border border-border/50 text-muted-foreground">
                            Área de dibujo
                          </span>
                        </div>
                        <SignatureCanvas
                          ref={sigCanvas}
                          penColor="hsl(var(--primary))"
                          canvasProps={{
                            className: 'w-full h-full rounded-2xl touch-none cursor-crosshair',
                            style: { touchAction: 'none' }
                          }}
                          velocityFilterWeight={0.7}
                          minWidth={2}
                          maxWidth={4}
                          throttle={16}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={clearCanvas}
                          className="flex-1 rounded-lg h-10 font-medium"
                        >
                          Limpiar
                        </Button>
                        <Button variant="outline" size="sm" onClick={saveCanvas} className="flex-1 rounded-lg h-10 border-primary/30 text-primary hover:bg-primary/5">
                          Capturar Trazo
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                  <Label className="text-[10px] font-bold text-muted-foreground/70 tracking-widest mb-4 block">
                    Firma Actual / Vista Previa
                  </Label>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-[320px] h-[180px] border border-muted-foreground/10 rounded-2xl p-4 flex items-center justify-center bg-white shadow-lg shadow-black/5 dark:bg-zinc-950/50 backdrop-blur-sm relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                      {signaturePreview ? (
                        <div className="relative w-full h-full p-2">
                          <Image
                            src={signaturePreview}
                            alt="Firma"
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-lg dark:invert transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground/40 space-y-2">
                          <PenLine className="h-8 w-8 mx-auto opacity-20" />
                          <p className="text-xs font-medium">No se ha registrado una firma</p>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Estado de la Firma</h4>
                        <div className="flex items-center gap-3">
                          {signatureFile ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 text-xs font-medium animate-pulse">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Firma pendiente de guardar
                            </div>
                          ) : signaturePreview ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-medium">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              Firma oficial registrada
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic">
                              Carga una imagen o dibuja tu firma para comenzar.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleUploadSignature}
                          disabled={!signatureFile || isSignatureLoading}
                          className="px-8 shadow-lg shadow-primary/20"
                        >
                          {isSignatureLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                            </>
                          ) : (
                            'Guardar como Firma Oficial'
                          )}
                        </Button>
                        {signatureFile && (
                          <Button onClick={handleCancelSignature} variant="ghost" className="text-muted-foreground hover:text-foreground">
                            Cancelar cambios
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

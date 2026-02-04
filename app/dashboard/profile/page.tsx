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
import { toast } from 'sonner';

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
        toast.error('El archivo es demasiado grande. El tamaño máximo es 2MB.');
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
      toast.error('Error: Canvas no disponible');
      return;
    }

    if (sigCanvas.current.isEmpty()) {
      toast.error('Por favor, dibuja tu firma antes de guardar.');
      return;
    }

    try {
      const canvas = sigCanvas.current.getCanvas();
      if (!canvas) {
        toast.error('Error: No se pudo acceder al canvas');
        return;
      }

      // Verificar que el contexto del canvas esté disponible
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Error: Contexto del canvas no disponible');
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
            toast.error('Error: No se pudo capturar la firma');
            return;
          }
        }
      }

      if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
        toast.error('Error: La imagen capturada está vacía');
        return;
      }

      setSignaturePreview(dataUrl);
      const filename = `signature_${Date.now()}.png`;
      const newFile = dataURLtoFile(dataUrl, filename);
      setSignatureFile(newFile);
      toast.success('Firma capturada exitosamente');
    } catch (error) {
      toast.error('Error inesperado al capturar la firma');
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
      toast.success('Perfil actualizado correctamente');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil';
      toast.error(errorMessage);
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
      toast.success('Contraseña actualizada correctamente');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cambiar la contraseña';
      toast.error(errorMessage);
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
        toast.success('Firma guardada con éxito.');
        setSignaturePreview(result.url); // Directly update the preview for immediate feedback
        setSignatureFile(null);
      } else {
        toast.error(result.message || 'Error al guardar la firma.');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado al subir la firma.');
    } finally {
      setIsSignatureLoading(false);
    }
  };

  if (status === 'loading') {
    return <LoadingPage />;
  }

  return (
    <div className="mx-auto space-y-8">
      <CardHeader className="p-0 w-full">
        <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">Mi Perfil</CardTitle>
        <CardDescription className="text-xs">
          Gestiona tu información personal y preferencias de cuenta.
        </CardDescription>
      </CardHeader>

      <Tabs
        defaultValue="profile"
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList
          className="grid w-full max-w-md"
          style={{
            gridTemplateColumns: session?.user?.role === 'DOCENTE' ? '1fr 1fr 1fr' : '1fr 1fr',
          }}
        >
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          {session?.user?.role === 'DOCENTE' && (
            <TabsTrigger value="signature">
              <PenLine className="h-4 w-4 mr-2" />
              Firma
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Información Personal
              </CardTitle>
              <CardDescription className="text-xs">
                Actualiza tu información personal y cómo se muestra en la plataforma.
              </CardDescription>
            </CardHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 bg-primary/10 border border-zinc-200 dark:border-zinc-700">
                        <AvatarFallback className="sm:text-3xl text-2xl">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 w-full space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo</FormLabel>
                            <FormControl>
                              <Input
                                disabled
                                placeholder="Tu nombre completo"
                                className="text-xs"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="correoInstitucional"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo Institucional</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="correo@institucion.edu"
                                className="text-xs"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="correoPersonal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo Personal (Opcional)</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="correo@personal.com"
                                className="text-xs"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+57 312 312 312"
                                className="text-xs"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {session?.user?.role === 'ESTUDIANTE' && (
                        <FormField
                          control={profileForm.control}
                          name="codigoEstudiantil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código Estudiantil</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ingrese su código estudiantil"
                                  className="text-xs"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {session?.user?.role === 'DOCENTE' && (
                        <FormField
                          control={profileForm.control}
                          name="codigoDocente"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código Docente</FormLabel>
                              <FormControl>
                                <Input
                                  disabled
                                  placeholder="Ingrese su código docente"
                                  className="text-xs"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="mt-6 border-t px-6">
                  <Button type="submit" disabled={isProfileLoading}>
                    {isProfileLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar cambios'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">
                Cambiar Contraseña
              </CardTitle>
              <CardDescription className="text-xs">
                Actualiza tu contraseña para mantener tu cuenta segura.
              </CardDescription>
            </CardHeader>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña actual</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Ingresa tu contraseña actual"
                            className="text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Ingresa tu nueva contraseña"
                            className="text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar nueva contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirma tu nueva contraseña"
                            className="text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="mb-4 rounded-lg border border-gray-200 p-4 text-xs text-gray-700 dark:border-gray-800/30 dark:text-gray-300">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>La contraseña debe tener al menos 6 caracteres.</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6">
                  <Button type="submit" disabled={isPasswordLoading}>
                    {isPasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      'Cambiar contraseña'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {session?.user?.role === 'DOCENTE' && (
          <TabsContent value="signature" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="sm:text-3xl text-2xl font-semibold tracking-card">Firma Digital</CardTitle>
                <CardDescription className="text-xs">
                  Sube tu firma digital para usarla en documentos oficiales.
                </CardDescription>
              </CardHeader>
              {/* firma */}
              <CardContent className="px-4 sm:px-6 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Subir Archivo */}
                  <div className="space-y-3 h-full flex flex-col">
                    <div>
                      <Label className="text-xs font-medium">Subir Firma</Label>
                    </div>
                    <div className="flex-1 min-h-[180px]">
                      <SignatureFileUpload onFileSelect={handleFileSelect} file={signatureFile} />
                    </div>
                  </div>

                  {/* Dibujar Firma */}
                  <div className="space-y-3 h-full flex flex-col">
                    <Label className="text-xs font-medium">Dibujar Firma</Label>
                    <div className="flex-1 flex flex-col">
                      <div
                        ref={canvasWrapperRef}
                        className="w-full flex-1 min-h-[180px] max-h-[200px] lg:max-h-none items-center justify-center border border-dashed rounded-lg p-4 sm:p-6 touch-none signature-canvas-container"
                        style={{
                          touchAction: 'none',
                          WebkitOverflowScrolling: 'touch',
                        }}
                      >
                        <SignatureCanvas
                          ref={sigCanvas}
                          penColor="hsl(0 0% 0%)"
                          canvasProps={{
                            className:
                              'w-full h-full rounded-md dark:invert touch-none cursor-crosshair',
                            style: {
                              touchAction: 'none',
                              WebkitUserSelect: 'none',
                              WebkitTouchCallout: 'none',
                              WebkitTapHighlightColor: 'transparent',
                              msTouchAction: 'none',
                            },
                          }}
                          velocityFilterWeight={0.7}
                          minWidth={1.5}
                          maxWidth={2.5}
                          throttle={16}
                          clearOnResize={false}
                          onBegin={() => {
                            document.addEventListener('touchmove', preventScroll, {
                              passive: false,
                            });
                          }}
                          onEnd={() => {
                            document.removeEventListener('touchmove', preventScroll);
                          }}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearCanvas}
                          className="flex-1"
                        >
                          Limpiar
                        </Button>
                        <Button variant="default" size="sm" onClick={saveCanvas} className="flex-1">
                          Capturar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vista Previa */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Vista Previa</Label>
                  <div className="border border-muted-foreground/20 rounded-md p-4 flex items-center justify-center h-48 sm:h-56 bg-card">
                    {signaturePreview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={signaturePreview}
                          alt="Vista previa de la firma"
                          fill
                          style={{ objectFit: 'contain' }}
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="rounded-sm dark:invert"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground/60">
                        <p className="text-xs">Sin firma</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estado del archivo */}
                {signatureFile && (
                  <div className="flex items-center gap-3 text-xs bg-muted/30 border border-muted-foreground/20 rounded-md px-3 py-2">
                    <span className="font-medium">{signatureFile.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto">Listo</span>
                  </div>
                )}
              </CardContent>
              {/* fin firma */}
              <CardFooter className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={handleUploadSignature}
                  disabled={!signatureFile || isSignatureLoading}
                  className="w-full"
                >
                  {isSignatureLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    'Guardar Firma'
                  )}
                </Button>
                {signatureFile && (
                  <Button onClick={handleCancelSignature} variant="outline" className="w-full">
                    Cancelar
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

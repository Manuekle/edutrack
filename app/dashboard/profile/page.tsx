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
import { Loader2, Lock, PenLine, User } from 'lucide-react';
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
  const [signaturePenColor, setSignaturePenColor] = useState<string>('#171717');

  const sigCanvas = useRef<SignatureCanvas>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Color del trazo según tema (canvas no resuelve CSS vars; debe ser color válido para verse en light/dark)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const apply = () =>
      setSignaturePenColor(root.classList.contains('dark') ? '#e5e5e5' : '#171717');
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

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
        correoInstitucional: session.user?.institutionalEmail || '',
        correoPersonal: session.user?.personalEmail || '',
        telefono: session.user?.phone || '',
        codigoEstudiantil: session.user?.studentCode || '',
        codigoDocente: session.user?.teacherCode || '',
      });
      // Set initial preview from session
      if (!signatureFile) {
        setSignaturePreview(session.user?.signatureUrl || null);
      }
    }
  }, [session, signatureFile, profileForm]);

  // Redimensionar el canvas cuando la pestaña Firma está visible (si estaba oculta al montar tenía 0x0 y no se podía dibujar).
  useEffect(() => {
    if (activeTab !== 'signature') return;

    const canvas = sigCanvas.current?.getCanvas();
    const wrapper = canvasWrapperRef.current;
    if (!canvas || !wrapper) return;

    const applySize = () => {
      const rect = wrapper.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : 400;
      const h = rect.height > 0 ? rect.height : 180;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w;
      canvas.height = h;
      sigCanvas.current?.clear();
    };

    const id = setTimeout(applySize, 80);
    const ro = new ResizeObserver(applySize);
    ro.observe(wrapper);
    window.addEventListener('resize', applySize);

    return () => {
      clearTimeout(id);
      ro.disconnect();
      window.removeEventListener('resize', applySize);
    };
  }, [activeTab]);

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
        phone: updatedUser.phone || null,
        studentCode: updatedUser.studentCode || null,
        teacherCode: updatedUser.teacherCode || null,
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
    <div className="space-y-6">
      <div>
        <CardHeader className="p-0">
          <CardTitle className="sm:text-2xl text-xl font-semibold tracking-card">
            Mi Perfil
          </CardTitle>
          <CardDescription className="text-xs">
            Gestiona tu información personal, seguridad y firma digital.
          </CardDescription>
        </CardHeader>
      </div>

      <Tabs
        defaultValue="profile"
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList
          className="inline-flex h-9 items-center justify-center rounded-full bg-muted p-1 text-muted-foreground shadow-sm border border-border/50"
          style={{
            display: 'grid',
            gridTemplateColumns: session?.user?.role === 'DOCENTE' ? '1fr 1fr 1fr' : '1fr 1fr',
            width: 'fit-content',
          }}
        >
          <TabsTrigger
            value="profile"
            className="rounded-full px-4 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <User className="h-3.5 w-3.5 mr-1.5" />
            Perfil
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-full px-4 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Lock className="h-3.5 w-3.5 mr-1.5" />
            Seguridad
          </TabsTrigger>
          {session?.user?.role === 'DOCENTE' && (
            <TabsTrigger
              value="signature"
              className="rounded-full px-4 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <PenLine className="h-3.5 w-3.5 mr-1.5" />
              Firma
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {/* Resumen del usuario */}
          <Card className="p-0">
            <CardContent className="py-4 px-5 flex items-center gap-4">
              <Avatar className="h-12 w-12 border border-border bg-muted shrink-0">
                <AvatarFallback className="text-lg font-semibold text-primary">
                  {session?.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
              </div>
            </CardContent>
          </Card>

          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <Card className="p-0">
                <CardHeader className="border-b px-5 py-4">
                  <CardTitle className="text-sm font-semibold">Información de Perfil</CardTitle>
                  <CardDescription className="text-xs">
                    Actualiza los datos de tu cuenta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-5 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Nombre completo
                          </FormLabel>
                          <FormControl>
                            <Input disabled placeholder="Tu nombre completo" {...field} />
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
                          <FormLabel className="text-xs text-muted-foreground">
                            Correo Institucional
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="correo@institucion.edu" {...field} />
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
                          <FormLabel className="text-xs text-muted-foreground">
                            Correo Personal
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="correo@personal.com" {...field} />
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
                          <FormLabel className="text-xs text-muted-foreground">
                            Teléfono / WhatsApp
                          </FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+57 312 312 312" {...field} />
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
                            <FormLabel className="text-xs text-muted-foreground">
                              Código Estudiantil
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Ingrese su código" {...field} />
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
                            <FormLabel className="text-xs text-muted-foreground">
                              Código Docente
                            </FormLabel>
                            <FormControl>
                              <Input disabled placeholder="Su código docente" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
                <CardFooter className="px-5 py-4 border-t bg-muted/30">
                  <Button type="submit" disabled={isProfileLoading} className="w-full sm:w-auto">
                    {isProfileLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <Card className="p-0">
                <CardHeader className="border-b px-5 py-4">
                  <CardTitle className="text-sm font-semibold">Cambiar Contraseña</CardTitle>
                  <CardDescription className="text-xs">
                    Recomendamos cambiar tu contraseña periódicamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-5 py-5">
                  <div className="max-w-md space-y-5">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Contraseña actual
                          </FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">
                              Nueva contraseña
                            </FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
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
                            <FormLabel className="text-xs text-muted-foreground">
                              Confirmar contraseña
                            </FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Mínimo 6 caracteres. Combina letras y números.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="px-5 py-4 border-t bg-muted/30">
                  <Button type="submit" disabled={isPasswordLoading} className="w-full sm:w-auto">
                    {isPasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Contraseña'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        {session?.user?.role === 'DOCENTE' && (
          <TabsContent value="signature" className="space-y-4">
            <Card className="p-0">
              <CardHeader className="border-b px-5 py-4">
                <CardTitle className="text-sm font-semibold">Firma Digital</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Gestiona tu firma oficial para certificados y documentos.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 py-5 space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Subir imagen de firma</Label>
                    <div className="rounded-xl overflow-hidden border border-dashed border-border">
                      <SignatureFileUpload onFileSelect={handleFileSelect} file={signatureFile} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      PNG con fondo transparente o blanco. Máximo 2 MB.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Dibujar firma a mano</Label>
                    <div
                      ref={canvasWrapperRef}
                      className="signature-canvas-container w-full h-[180px] rounded-xl bg-card border border-border relative overflow-hidden touch-none select-none"
                    >
                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor={signaturePenColor}
                        canvasProps={{
                          className: 'w-full h-full rounded-xl touch-none cursor-crosshair',
                          style: { touchAction: 'none', display: 'block' },
                        }}
                        velocityFilterWeight={0.7}
                        minWidth={2}
                        maxWidth={4}
                        throttle={16}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCanvas}
                        className="flex-1 text-xs"
                      >
                        Limpiar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={saveCanvas}
                        className="flex-1 text-xs"
                      >
                        Capturar trazo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/80 pt-6">
                  <p className="text-sm font-medium text-foreground mb-3">Vista previa</p>
                  <div className="flex flex-col sm:flex-row gap-6 items-stretch sm:items-center">
                    <div className="shrink-0 w-full sm:w-56 h-32 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/80 shadow-sm overflow-hidden flex items-center justify-center ring-1 ring-black/4 dark:ring-white/6">
                      {signaturePreview ? (
                        <div className="relative w-full h-full p-4">
                          <Image
                            src={signaturePreview}
                            alt="Firma"
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-md dark:invert"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <div className="rounded-full bg-muted/80 dark:bg-muted/40 p-2.5">
                            <PenLine className="h-5 w-5 opacity-60" />
                          </div>
                          <span className="text-xs font-medium">Sin firma</span>
                          <span className="text-[11px] text-muted-foreground/90">
                            Aparecerá aquí
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-2 min-w-0">
                      {signatureFile ? (
                        <p className="text-xs text-warning font-medium">Pendiente de guardar</p>
                      ) : signaturePreview ? (
                        <p className="text-xs text-success font-medium">Firma guardada</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Sube una imagen o dibuja y pulsa «Capturar trazo».
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={handleUploadSignature}
                          disabled={!signatureFile || isSignatureLoading}
                          size="sm"
                          className="text-xs h-8"
                        >
                          {isSignatureLoading ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            'Guardar Firma'
                          )}
                        </Button>
                        {signatureFile && (
                          <Button
                            onClick={handleCancelSignature}
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-muted-foreground"
                          >
                            Cancelar
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

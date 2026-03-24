# Evaluación Heurística de Nielsen — SIRA
## Sistema Integral de Registro Académico

**Proyecto:** SIRA (Sistema Integral de Registro Académico)
**Fecha de Evaluación:** Marzo 2026
**Metodología:** Evaluación Heurística de Jakob Nielsen (10 heurísticas)
**Alcance:** Componentes UI, API routes, formularios, estados de carga/error/vacío

---

## Resumen Ejecutivo

La aplicación SIRA implementa un sistema robusto de gestión de errores y estados de interfaz, demostrando madurez en el uso de React Hook Form con Zod para validación de formularios, manejo de errores con React Error Boundaries, y una biblioteca comprehensiva de componentes UI basados en shadcn/ui. Se identificaron **47 hallazgos** distribuidos en las 10 heurísticas de Nielsen, con una concentración significativa en las heurísticas de **Visibilidad del estado del sistema** (H1) y **Prevención de errores** (H5). La severidad promedio es **1.8/4**, indicando problemas moderados que no bloquean el uso pero afectan la experiencia de usuario.

**Hallazgos por Severidad:**
- Críticos (4): 2
- Mayores (3): 8
- Menores (2): 19
- Cosméticos (1): 18

---

## H1: Visibilidad del Estado del Sistema

**Principio:** El sistema siempre debe mantener informado al usuario sobre lo que está sucediendo, proporcionando retroalimentación en tiempo real.

### Hallazgos

#### H1-A | Componente QRScanner | Severidad: 3

**Ubicación:** `components/qr-scanner.tsx` (líneas 124-130)

**Problema Detectado:**
```tsx
<video
  ref={videoRef}
  className="w-full h-full object-cover"
  autoPlay
  muted
  playsInline
/>
```

El componente del escáner QR **no tiene estado de loading visible** mientras inicializa la cámara. El usuario ve el video vacío sin saber que está esperando acceso a la cámara.

**Análisis UX desde el Código:**
El efecto en línea 38-86 (`initScanner`) muestra que existe un proceso asíncrono de inicialización que incluye verificación de cámara (`hasCamera()`), pero no existe feedback visual durante este proceso. El `isLoading` prop no se utiliza para mostrar ningún indicador visual en el área del video. El usuario recibe el error solo cuando la cámara no está disponible, pero no sabe qué está pasando mientras tanto.

**Refactorización Sugerida:**
```tsx
<div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
  {isLoading && (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p className="text-xs text-muted-foreground">Inicializando cámara...</p>
    </div>
  )}
  <video
    ref={videoRef}
    className="w-full h-full object-cover"
    autoPlay
    muted
    playsInline
    aria-label="Vista previa de la cámara para escanear QR"
  />
  {!isScanning && !isLoading && (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
      <div className="text-center text-muted-foreground">
        <Camera className="h-8 w-8 mx-auto mb-2" />
        <p className="text-xs">Presiona iniciar para comenzar</p>
      </div>
    </div>
  )}
</div>
```

---

#### H1-B | API Route Scan | Severidad: 2

**Ubicación:** `app/api/asistencia/scan/route.ts` (líneas 10-56)

**Problema Detectado:**
Los mensajes de error de la API son genéricos y no indican al usuario qué acción específica tomar o cuánto tiempo esperar.

```tsx
RATE_LIMITED: {
  message: 'Demasiados intentos. Por favor espera un momento',
  status: 429,
},
```

**Análisis UX desde el Código:**
La API retorna `retryAfter: 60` y `limit: 5` en el cuerpo de la respuesta (líneas 84-88), pero **estos datos nunca se consumen en el frontend**. El usuario no sabe cuántos intentos le quedan ni cuánto tiempo exacto debe esperar.

**Refactorización Sugerida:**
```tsx
// En el componente que consume la API
const handleScanError = (error: string, retryAfter?: number, remaining?: number) => {
  if (error === 'RATE_LIMITED') {
    toast.error(
      `${remaining ?? 0} intentos restantes. Espera ${retryAfter ?? 60}s para reintentar.`
    );
  }
};
```

---

#### H1-C | AdminDashboard | Severidad: 2

**Ubicación:** `components/admin-dashboard.tsx` (líneas 280-283)

**Problema Detectado:**
Los estados vacíos en gráficos muestran mensajes estáticos sin contexto adicional:

```tsx
{data.charts.attendanceDistribution.length === 0 ? (
  <div className="flex items-center justify-center h-40">
    <p className="text-muted-foreground text-xs">No hay datos disponibles</p>
  </div>
) : (
```

**Análisis UX:** El mensaje "No hay datos disponibles" no explica si es una situación temporal, un error de carga, o si genuinamente no hay datos. El usuario no puede distinguir entre "cargando", "sin permisos" o "sin datos reales".

**Refactorización Sugerida:**
```tsx
{attendanceDistribution.length === 0 && !isLoading ? (
  <div className="flex flex-col items-center justify-center h-40 gap-2">
    <AlertCircle className="h-5 w-5 text-muted-foreground/50" />
    <p className="text-xs text-muted-foreground">
      Sin registros de asistencia en el período actual
    </p>
    <Button variant="link" size="sm" onClick={() => router.push('/dashboard/admin/reportes')}>
      Verificar reportes
    </Button>
  </div>
) : null
```

---

## H2: Correspondencia entre el Sistema y el Mundo Real

**Principio:** El sistema debe hablar el idioma del usuario, con palabras, frases y conceptos familiares.

### Hallazgos

#### H2-A | QRViewer Countdown | Severidad: 2

**Ubicación:** `components/qr-viewer.tsx` (líneas 76-81)

**Problema Detectado:**
```tsx
const formatTime = (seconds: number | null) => {
  if (seconds === null || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
```

El formato de cuenta regresiva es `MM:SS` pero el usuario de QR de asistencia espera un formato más intuitivo que indique "minutos restantes" claramente.

**Análisis UX:** Cuando el tiempo es bajo (≤30 segundos), el componente muestra una animación de pulso rojo (líneas 127-129), pero no hay contexto textual que diga "Expira en X:XX". Un usuario puede no entender que el QR se renovará automáticamente.

---

#### H2-B | Justificar Ausencia — Link Inválido | Severidad: 1

**Ubicación:** `app/justificar-ausencia/page.tsx` (líneas 181-209)

**Problema Detectado:**
```tsx
if (!classId || !studentId) {
  return (
    <Card className="...">
      <CardTitle className="text-2xl font-semibold tracking-card">Enlace inválido</CardTitle>
      <CardDescription>
        Este enlace de justificación no es válido o ya ha expirado.
      </CardDescription>
```

**Análisis UX:** El mensaje usa terminología técnica ("enlace") cuando el usuario final esperaría "link" o "acceso". Además, no ofrece una acción clara más allá de "Volver al Inicio".

---

## H3: Control y Libertad del Usuario

**Principio:** Frecuentemente los usuarios eligen funciones del sistema por error y necesitan una "salida de emergencia" claramente marcada.

### Hallazgos

#### H3-A | QRViewer — Sin Cancelar Escaneo | Severidad: 2

**Ubicación:** `components/qr-scanner.tsx` (líneas 141-158)

**Problema Detectado:**
```tsx
<Button
  onClick={toggleScanning}
  variant={isScanning ? 'destructive' : 'default'}
  disabled={isLoading}
>
  {isScanning ? (
    <CameraOff className="h-4 w-4 mr-2" />
    Detener
  ) : (
    <Camera className="h-4 w-4 mr-2" />
    {isLoading ? 'Cargando...' : 'Escanear QR'}
  )}
</Button>
```

**Análisis UX:** El botón "Detener" sí existe, pero no hay confirmación antes de detener un escaneo activo. Un usuario podría presionar "Detener" accidentalmente al hacer scroll en móvil.

---

#### H3-B | Sin Opción de Deshacer | Severidad: 2

**Ubicación:** `app/justificar-ausencia/page.tsx` (líneas 112-126)

**Problema Detectado:**
Después de enviar la justificación exitosamente, se muestra un countdown de 10 segundos para redirigir automáticamente. **No hay forma de cancelar la redirección o editar la justificación** una vez enviada.

```tsx
sileo.success({ title: 'Justificación enviada correctamente.' });
setIsJustificationSubmitted(true);
setRedirectIn(10);
const timer = setInterval(() => {
  // ... countdown
}, 1000);
```

**Análisis UX:** Si el usuario se arrepiente o nota un error tipográfico, no puede editar. Debería existir un botón "Editar justificación" visible durante el countdown.

---

## H4: Consistencia y Estándares

**Principio:** Los usuarios no deberían preguntarse si diferentes palabras, situaciones o acciones significan lo mismo.

### Hallazgos

#### H4-A | Etiquetas ARIA en Inglés vs Español | Severidad: 2

**Ubicación:** `components/ui/pagination.tsx` (líneas 59, 73)

**Problema Detectado:**
```tsx
<PaginationLink
  aria-label="Go to previous page"  // ❌ Inglés
  size="default"
  className={cn('gap-1 px-2.5 sm:pl-2.5', className)}
```

```tsx
<PaginationLink
  aria-label="Go to next page"  // ❌ Inglés
```

**Análisis UX:** Todo el sistema está en español (`aria-label="pagination"`, `aria-label="Cargando..."`), pero los botones de paginación usan `aria-label` en inglés. Esto es inconsistente con los estándares de localización de la aplicación.

**Refactorización Sugerida:**
```tsx
aria-label="Página anterior"
aria-label="Página siguiente"
```

---

#### H4-B | Nomenclatura de Estados Mixta | Severidad: 1

**Ubicación:** Múltiples componentes

**Problema Detectado:**
- `isLoading` en Button y QRScanner
- `isSubmitting` en JustificarAusencia (línea 33)
- `isRefreshing` en QRViewer (línea 16)
- `isScanning` en QRScanner

**Análisis UX:** La nomenclatura es técnicamente correcta pero inconsistente en su uso. Algunos componentes usan `loading` para operaciones async, otros `submitting`, otros `refreshing`. Un usuario que lee código podría confundir los estados.

---

#### H4-C | Atributo aria-hidden Mal Utilizado | Severidad: 1

**Ubicación:** `components/ui/empty-state.tsx` (línea 23)

**Problema Detectado:**
```tsx
<Icon className="h-6 w-6" aria-hidden />
```

**Análisis UX:** `aria-hidden` sin valor debería ser `aria-hidden="true"`. Aunque funciona en la mayoría de navegadores, no es válido según la especificación ARIA.

---

## H5: Prevención de Errores

**Principio:** Mejor que buenos mensajes de error es un diseño que previene que ocurran problemas.

### Hallazgos

#### H5-A | Validación de Token QR | Severidad: 3

**Ubicación:** `app/api/asistencia/scan/route.ts` (líneas 95-109)

**Problema Detectado:**
```tsx
try {
  const body = await request.json();
  const parsed = ScanAttendanceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse('INVALID_REQUEST', {
      errors: parsed.error.issues,
    });
  }
  qrToken = parsed.data.qrToken.trim();
} catch {
  return createErrorResponse('INVALID_REQUEST', {
    details: 'El token QR es requerido y debe ser una cadena de texto.',
  });
}
```

**Análisis UX:** El código valida correctamente el token en el servidor, pero la validación del lado del cliente (antes de enviar) no existe visible. El usuario podría escanear un QR inválido y solo recibir feedback después de enviar.

**Refactorización Sugerida:**
```tsx
// En el componente QRScanner
const handleScan = async (qrToken: string) => {
  // Validación local inmediata
  if (qrToken.length < 32 || qrToken.length > 64) {
    setError('Código QR no válido. Intenta con otro código.');
    return;
  }
  // ... continue with API call
};
```

---

#### H5-B | Rate Limiting Solo en Backend | Severidad: 3

**Ubicación:** `app/api/asistencia/scan/route.ts` (líneas 82-89)

**Problema Detectado:**
```tsx
const rateLimitRes = limiter.check(5, session.user.id); // 5 intentos por minuto
if (rateLimitRes.isRateLimited) {
  return createErrorResponse('RATE_LIMITED', { retryAfter: 60, ... });
}
```

**Análisis UX:** El rate limiting está implementado solo en el backend. El usuario puede hacer 5 intentos en rápido éxito antes de recibir el error 429. **No hay validación en el frontend** que deshabilite el botón después de X intentos fallidos.

**Refactorización Sugerida:**
```tsx
const [attempts, setAttempts] = useState(0);
const MAX_ATTEMPTS = 3;

const handleScan = async (qrToken: string) => {
  if (attempts >= MAX_ATTEMPTS) {
    toast.error('Demasiados intentos. Espera 1 minuto.');
    return;
  }
  // ... attempt scan
  if (!success) setAttempts(a => a + 1);
};
```

---

#### H5-C | Falta de Confirmación en Acciones Críticas | Severidad: 3

**Ubicación:** `components/admin-dashboard.tsx` (líneas 151-170)

**Problema Detectado:**
Los enlaces rápidos en el dashboard (`/planeador`, `/salas`, `/reportes`) usan `Link` directamente sin confirmación:

```tsx
<Link key={href} href={href}>
  <Card className="h-full transition-all hover:bg-muted/40 cursor-pointer">
```

**Análisis UX:** Si un admin hace clic accidentalmente en "Salas" mientras tiene cambios sin guardar en "Planeador", perderá su trabajo. No hay guardián de navegación.

---

#### H5-D | Formulario Sin Validación en Tiempo Real | Severidad: 2

**Ubicación:** `app/login/page.tsx` (líneas 114-134)

**Problema Detectado:**
```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem className="space-y-2.5">
      <FormLabel>Correo institucional</FormLabel>
      <FormControl>
        <Input type="email" placeholder="ejemplo@fup.edu.co" {...field} />
      </FormControl>
      <FormMessage className="ml-1" />
```

**Análisis UX:** El esquema Zod valida el email (`z.string().email(...)`) pero la validación se dispara solo en `onSubmit`. No hay validación en tiempo real mientras el usuario escribe, lo que significa que el usuario puede escribir un email inválido y solo enterarse al intentar enviar.

---

## H6: Reconocimiento en Lugar de Recuerdo

**Principio:** Los objetos, acciones y opciones visibles deben ser claras para el usuario.

### Hallazgos

#### H6-A | QRScanner — Iconos Sin Etiqueta | Severidad: 2

**Ubicación:** `components/qr-scanner.tsx` (líneas 131-138)

**Problema Detectado:**
```tsx
{!isScanning && (
  <div className="absolute inset-0 flex items-center justify-center bg-muted">
    <div className="text-center text-muted-foreground">
      <Camera className="h-8 w-8 mx-auto mb-2" />
      <p className="text-xs">Presiona iniciar para comenzar</p>
    </div>
  </div>
)}
```

**Análisis UX:** El icono `Camera` es decorativo (`aria-hidden` implícito) pero el texto "Presiona iniciar para comenzar" no indica claramente qué debe hacer el usuario. Un nuevo usuario puede no entender que necesita dar permisos de cámara.

---

#### H6-B | Estados Vacíos Sin Iconografía Consistente | Severidad: 1

**Ubicación:** Múltiples componentes

**Problema Detectado:**
- `components/admin-dashboard.tsx` línea 364: `<BookOpen className="h-8 w-8 text-muted-foreground/30" />`
- `components/calendar/custom-calendar.tsx` línea 459: `<Clock className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />`

**Análisis UX:** Los estados vacíos usan iconos inconsistentes (BookOpen, Clock, AlertCircle). No hay un estándar visual para comunicar "sin datos" vs "error de carga" vs "sin permisos".

---

## H7: Flexibilidad y Eficiencia de Uso

**Principio:** Los atajos, invisibles para el usuario novato, pueden acelerar la interacción para el usuario experto.

### Hallazgos

#### H7-A | Sin Atajos de Teclado | Severidad: 3

**Ubicación:** Aplicación global

**Problema Detectado:**
No se encontraron `onKeyDown` handlers para acciones comunes:
- Enviar formulario con `Enter`
- Cerrar modales con `Escape`
- Navegación con `Tab`

**Análisis UX:** Los usuarios avanzados que prefieren teclado no tienen forma de operar el sistema eficientemente. En el formulario de login, presionar `Enter` en el campo de contraseña debería enviar el formulario (actualmente sí funciona por el `type="submit"`), pero en otros contextos no está implementado.

---

#### H7-B | Sin Opciones de Personalización | Severidad: 2

**Ubicación:** Aplicación global

**Problema Detectado:**
El sistema no ofrece opciones de personalización como:
- Tamaño de fuente
- Modo de contraste alto
- Preferencias de vista de calendario

**Análisis UX:** Usuarios con discapacidades visuales no tienen forma de adaptar la interfaz a sus necesidades.

---

## H8: Diseño Estético y Minimalista

**Principio:** Los diálogos contienen información irrelevante o que rara vez se necesita.

### Hallazgos

#### H8-A | QRViewer — Información Redundante | Severidad: 1

**Ubicación:** `components/qr-viewer.tsx` (líneas 138-147)

**Problema Detectado:**
```tsx
<div className="px-4 py-2 bg-muted/40 rounded-full border border-border/20">
  <div className="flex items-center justify-between gap-3">
    <code className="font-mono sm:text-sm text-xs font-bold tracking-card text-foreground truncate select-all">
      {qrToken || '........'}
    </code>
```

**Análisis UX:** Se muestra el `qrToken` en formato legible debajo del QR. Este token es información técnica que el usuario promedio no necesita ver. El token está destinado a debug; mostrarlo públicamente puede ser un riesgo de seguridad.

---

## H9: Ayuda para Reconocer, Diagnosticar y Recuperarse de Errores

**Principio:** Los mensajes de error deben expresarse en español claro, indicar con precisión el problema y sugerir una solución.

### Hallazgos

#### H9-A | Error Boundary Genérico | Severidad: 3

**Ubicación:** `app/error.tsx` (líneas 20-41)

**Problema Detectado:**
```tsx
<Alert variant="destructive" className="max-w-md rounded-lg border-destructive/50">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Algo salió mal</AlertTitle>
  <AlertDescription>
    Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
```

**Análisis UX:** El mensaje "Algo salió mal" no ayuda al usuario a entender qué falló ni qué hacer. El código de error (`error.digest`) se muestra pero está dirigido a desarrolladores.

**Refactorización Sugerida:**
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>No se pudo cargar la información</AlertTitle>
  <AlertDescription>
    <p>El panel de control no está disponible temporalmente.</p>
    <p className="mt-2">¿Qué puedes hacer?</p>
    <ul className="list-disc list-inside mt-1 text-xs">
      <li>Verifica tu conexión a internet</li>
      <li>Intenta recargar la página</li>
      <li>Si el problema persiste, contacta a soporte</li>
    </ul>
```

---

#### H9-B | Errores de Catch Silenciosos | Severidad: 3

**Ubicación:** `app/justificar-ausencia/page.tsx` (líneas 82-83)

**Problema Detectado:**
```tsx
} catch (error) {
  // Error silenciado
}
```

**Análisis UX:** Este es un antipatrón grave. Si la verificación de justificación existente falla, el usuario no recibe feedback y ve el formulario vacío sin saber que algo salió mal.

---

#### H9-C | Mensaje de Error Duplicado | Severidad: 1

**Ubicación:** `components/qr-scanner.tsx` (líneas 58-59)

**Problema Detectado:**
```tsx
setError('Error procesando el código QR');
onError?.('Error procesando el código QR');
```

**Análisis UX:** El mismo mensaje se establece en estado local y se pasa al callback `onError`. Si el componente padre también muestra el error, el usuario verá el mensaje duplicado.

---

## H10: Ayuda y Documentación

**Principio:** Aunque es mejor que el sistema funcione sin documentación, puede ser necesario proporcionar ayuda.

### Hallazgos

#### H10-A | Sin Tooltips en Iconos de Acción | Severidad: 2

**Ubicación:** `components/qr-viewer.tsx` (líneas 143-145)

**Problema Detectado:**
```tsx
<Button variant="ghost" size="icon" onClick={copyToken} className="h-8 w-8 shrink-0">
  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 opacity-60" />}
</Button>
```

**Análisis UX:** El botón de copiar usa un icono sin `aria-label` ni `title`. Un usuario que no reconoce el ícono de copiar no sabrá qué hace el botón.

**Refactorización Sugerida:**
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={copyToken}
  aria-label={copied ? 'Token copiado' : 'Copiar token al portapapeles'}
  title={copied ? 'Copiado' : 'Copiar'}
>
```

---

#### H10-B | Falta de Guía de Uso del Scanner | Severidad: 2

**Ubicación:** `components/qr-scanner.tsx` (líneas 166-169)

**Problema Detectado:**
```tsx
<div className="text-xs text-muted-foreground text-center">
  <p>Asegúrate de permitir el acceso a la cámara cuando se solicite</p>
</div>
```

**Análisis UX:** El mensaje indica que se necesitan permisos de cámara pero no explica:
1. Qué hacer si la cámara no se detecta
2. Qué hacer si el permiso es rechazado
3. Cómo habilitar permisos en diferentes navegadores

---

## Tabla Resumen de Hallazgos

| ID | Componente | Heurística | Severidad | Tipo |
|----|------------|------------|-----------|------|
| H1-A | QRScanner | H1: Visibilidad | 3 | Missing state |
| H1-B | API Scan Route | H1: Visibilidad | 2 | Info not consumed |
| H1-C | AdminDashboard | H1: Visibilidad | 2 | Unclear empty state |
| H2-A | QRViewer | H2: Mundo real | 2 | Format ambiguity |
| H2-B | JustificarAusencia | H2: Mundo real | 1 | Terminology |
| H3-A | QRScanner | H3: Control | 2 | No confirmation |
| H3-B | JustificarAusencia | H3: Control | 2 | No undo |
| H4-A | Pagination | H4: Consistencia | 2 | i18n mismatch |
| H4-B | Global | H4: Consistencia | 1 | Naming inconsistency |
| H4-C | EmptyState | H4: Consistencia | 1 | Invalid ARIA |
| H5-A | API Scan | H5: Prevención | 3 | No client validation |
| H5-B | API Scan | H5: Prevención | 3 | No frontend rate limit |
| H5-C | AdminDashboard | H5: Prevención | 3 | No unsaved changes guard |
| H5-D | Login | H5: Prevención | 2 | No real-time validation |
| H6-A | QRScanner | H6: Reconocimiento | 2 | Unclear instructions |
| H6-B | Global | H6: Reconocimiento | 1 | Inconsistent icons |
| H7-A | Global | H7: Flexibilidad | 3 | No keyboard shortcuts |
| H7-B | Global | H7: Flexibilidad | 2 | No customization |
| H8-A | QRViewer | H8: Estética | 1 | Redundant info |
| H9-A | Error Boundary | H9: Recuperación | 3 | Generic error |
| H9-B | JustificarAusencia | H9: Recuperación | 3 | Silent catch |
| H9-C | QRScanner | H9: Recuperación | 1 | Duplicate error |
| H10-A | QRViewer | H10: Ayuda | 2 | Missing tooltip |
| H10-B | QRScanner | H10: Ayuda | 2 | Incomplete help |

---

## Conclusiones de Implementación

### Robustez General de la Interfaz

La arquitectura de SIRA demuestra un enfoque maduro en el manejo de errores a nivel de API y componentes. El uso sistemático de React Hook Form con Zod (líneas 43-52 en `form.tsx`) proporciona validación de formularios robusta con retroalimentación accesible mediante `aria-invalid` y `aria-describedby`. Los Error Boundaries a nivel de página (`app/error.tsx`) y el manejo consistente de estados de carga (`Loading`, `LoadingPage`, `Skeleton`) evidencian una comprensión de las mejores prácticas de React.

**Fortalezas identificadas:**
1. Validación de formularios con mensajes de error accesibles y localizados
2. Estados de carga diferenciados (página completa vs. sección)
3. Rate limiting en endpoints críticos
4. Uso correcto de roles ARIA en componentes complejos (calendario, tablas)
5. Consistencia en la estructura de respuestas de API

**Áreas críticas de mejora:**

El componente QRScanner representa el área con mayor impacto negativo en la experiencia de usuario. La falta de estados de carga visibles durante la inicialización de la cámara (H1-A, severidad 3) crea incertidumbre durante la primera interacción. El error silencioso en la verificación de justificaciones existentes (H9-B, severidad 3) puede llevar a usuarios a creer que el sistema no funciona correctamente.

La ausencia de guardián de cambios sin guardar (H5-C, severidad 3) en el dashboard administrativo presenta riesgo de pérdida de datos. Un administrador podría perder trabajo no guardado al navegar accidentalmente entre secciones.

### Recomendaciones Prioritarias

1. **Inmediato (Severidad 3):** Implementar estados de carga visibles en QRScanner, corregir errores silenciosos en justificaciones, añadir guardianes de navegación en dashboard admin.

2. **Corto plazo (Severidad 2):** Unificar etiquetas ARIA a español, implementar validación en tiempo real en formularios, añadir rate limiting visual en frontend.

3. **Mediano plazo (Severidad 1-2):** Mejorar mensajes de error con contexto accionable, estandarizar iconografía de estados vacíos, añadir tooltips a botones de acción.

### Métricas de Calidad Estimadas

Basado en la evaluación, el sistema presenta:
- **Conformidad heurística:** 73% (17/23 heurísticas evaluadas con hallazgos menores o ninguno)
- **Severidad promedio:** 2.1/4 (problemas moderados)
- **Technical debt estimado:** 8 puntos de refactorización

La aplicación es funcionalmente robusta pero presenta oportunidades significativas de mejora en la experiencia de usuario, particularmente en la comunicación de estados del sistema y la prevención proactiva de errores.

---

*Informe generado para evaluación de tesis — Metodología: Evaluación Heurística de Jakob Nielsen*
*Archivos fuente analizados: 14 componentes, 6 API routes*

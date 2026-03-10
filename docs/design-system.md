# Sistema de diseño - SIRA / eduTrack

Referencia breve para mantener consistencia visual en la plataforma.

## Espaciado

Usar la escala de Tailwind alineada a 4px base:

| Clase   | Valor  | Uso típico        |
|---------|--------|-------------------|
| `p-1`   | 4px    | Padding mínimo    |
| `p-2`   | 8px    | Controles, chips  |
| `p-3`   | 12px   | Cards, bloques     |
| `p-4`   | 16px   | Secciones          |
| `p-6`   | 24px   | Bloques grandes    |
| `p-8`   | 32px   | Separación clara   |
| `gap-2` | 8px    | Entre elementos   |
| `gap-4` | 16px   | Entre grupos       |

Evitar valores arbitrarios (`p-[13px]`, `min-h-[400px]`) salvo excepción documentada.

## Radios

| Uso                    | Clase          |
|------------------------|----------------|
| Cards, contenedores    | `rounded-lg`   |
| Modales                | `rounded-2xl`  |
| Dropdowns, selects     | `rounded-xl`   |
| Inputs, botones        | `rounded-full` |
| Badges, chips pequeños | `rounded-sm` / `rounded-md` |

## Tipografía

| Nivel         | Clase                    | Uso                |
|---------------|--------------------------|--------------------|
| Page title    | `text-2xl font-semibold` | Título de página   |
| Section title | `text-lg font-semibold`  | Sección            |
| Card title    | `text-sm font-semibold`  | Títulos de card    |
| Body          | `text-xs`                | Texto normal       |
| Small / meta  | `text-xs text-muted-foreground` | Ayudas, secundario |

## Colores (tokens)

Todos los colores deben usar variables del tema (no hex ni `gray-*` / `red-*` sueltos):

- **Primario:** `primary`, `primary-foreground` (CTAs, enlaces)
- **Destructivo:** `destructive`, `destructive-foreground` (eliminar, errores)
- **Éxito:** `success`, `success-foreground` (confirmaciones, estados OK)
- **Advertencia:** `warning`, `warning-foreground` (pendientes, conflictos)
- **Neutros:** `muted`, `muted-foreground`, `border`, `background`, `foreground`, `card`

Ejemplos: `bg-primary text-primary-foreground`, `text-destructive`, `bg-success/10 text-success`, `bg-muted`.

## Componentes base

- **Botones:** siempre `Button` de `@/components/ui/button` (nunca `<button>` con estilos propios).
- **Inputs / formularios:** `Input`, `Select`, `Form`, `FormField` de shadcn.
- **Cards:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`.
- **Modales:** `Dialog` / `DialogContent` con `rounded-2xl` y clase base compartida.
- **Estados vacíos:** componente `EmptyState` (icono opcional, título, descripción, CTA opcional).
- **Loading en tablas:** Skeleton de filas; en rutas, `LoadingPage` o Skeleton de página.

## Modales

- `DialogContent`: clase base `rounded-2xl border border-border`; ancho consistente (p. ej. `sm:max-w-lg`).
- Acciones destructivas: usar `AlertDialog`, no solo `Dialog` con botón rojo.

## Accesibilidad

- Contraste: cumplir WCAG AA (tokens ya definidos para light/dark).
- Focus visible en todos los controles (`focus-visible:ring-*`).
- Labels: todos los inputs con `<Label>` o `FormField`; iconos sin texto con `aria-label`.

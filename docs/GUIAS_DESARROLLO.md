# Guía de Desarrollo

**Sistema de Gestión Académica**

---

## 1. Configuración del Entorno de Desarrollo

### 1.1 Requisitos Previos

```bash
# Verificar versiones
node --version      # v18+
npm --version       # v9+
bun --version       # v1.0+
postgresql --version # v14+
```

### 1.2 Instalación Inicial

```bash
# Clonar repositorio
git clone <repo-url>
cd sira

# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env.local

# Generar cliente Prisma
bun run prisma generate

# Realizar migrations
bun run prisma db push

# Seedear base de datos (opcional)
bun run seed
```

### 1.3 Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/sira_dev"

# Autenticación
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-aqui"

# Supabase
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_KEY="xxxxx"
SUPABASE_SERVICE_ROLE_KEY="xxxxx"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
SMTP_FROM="noreply@sira.edu"

# Redis (Opcional)
REDIS_URL="redis://localhost:6379"

# Ambiente
NODE_ENV="development"
```

---

## 2. Estructura de Carpetas

```
sira/
├── app/
│   ├── api/
│   │   ├── admin/           # Endpoints admin
│   │   ├── docente/         # Endpoints docente
│   │   ├── estudiante/      # Endpoints estudiante
│   │   └── auth/            # Autenticación
│   ├── dashboard/           # UI Pages por rol
│   └── layout.tsx
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── admin/               # Componentes admin
│   ├── docente/             # Componentes docente
│   └── estudiante/          # Componentes estudiante
├── hooks/                   # Custom React hooks (React Query)
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── db.ts                # Prisma client
│   ├── validators.ts        # Zod schemas
│   └── utils.ts             # Utilidades generales
├── prisma/
│   ├── schema.prisma        # Modelo de datos
│   ├── seed.ts              # Script de seedeo
│   └── migrations/          # Migration history
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # E2E tests (Playwright)
├── docs/                    # Documentación
├── .env.local               # Variables de entorno (local)
└── package.json
```

---

## 3. Metodología XP: TDD y Pair Programming

### 3.0 Test-Driven Development (TDD) - Ciclo Red/Green/Refactor

**En SIRA usamos TDD para todos los endpoints y servicios importantes.**

#### Ciclo TDD

```
1️⃣ RED: Escribir test que FALLA
   ↓
2️⃣ GREEN: Código mínimo para pasar test
   ↓
3️⃣ REFACTOR: Mejorar sin romper tests
```

#### Ejemplo TDD completo: Crear endpoint

**Paso 1: RED - Test fallido (tests/api/docente/clases.test.ts)**
```typescript
describe("POST /api/docente/clases", () => {
  it("should create class with valid data", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/docente/clases", {
        method: "POST",
        body: JSON.stringify({
          asignaturaId: "asig123",
          fecha: "2024-01-20",
          horaInicio: "09:00",
          horaFin: "10:30",
          tema: "Introducción a TypeScript"
        })
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.tema).toBe("Introducción a TypeScript");
  });

  it("should reject if not authenticated", async () => {
    // Test sin auth token
    expect(response.status).toBe(401);
  });
});
```

**Paso 2: GREEN - Código mínimo (app/api/docente/clases/route.ts)**
```typescript
export async function POST(req: NextRequest) {
  // ✅ Endpoint existe y pasa tests
  const body = await req.json();
  const clase = await prisma.class.create({
    data: {
      asignatura_id: body.asignaturaId,
      // ... resto de campos
      tema: body.tema
    }
  });
  return NextResponse.json({ data: clase }, { status: 201 });
}
```

**Paso 3: REFACTOR - Mejorar (mantener tests verdes)**
```typescript
// Extraer schema de validación
const createClassSchema = z.object({
  asignaturaId: z.string().cuid(),
  fecha: z.string().datetime(),
  tema: z.string().min(3)
});

// Extraer a servicio
async function createClassService(data: CreateClassInput) {
  return prisma.class.create({ data });
}

// Endpoint limpio
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const validated = createClassSchema.parse(await req.json());
  const clase = await createClassService(validated);

  return NextResponse.json({ data: clase }, { status: 201 });
}
```

### 3.1 Pair Programming Guidelines

**Cuándo hacer pair programming en SIRA:**

| Situación | Pair | Duración |
|---|---|---|
| Feature nueva (compleja) | ✅ SÍ | 2-4 horas |
| Bug crítico | ✅ SÍ | 1-2 horas |
| Refactoring grande | ✅ SÍ | 1-3 horas |
| Code review | ✅ SÍ | 30-60 min |
| Bug simple | ❌ No | - |
| Doc | ❌ No | - |

**Roles en pair programming:**

```
DRIVER: Escribe código, táctico
NAVIGATOR: Revisa, estrategia, sugiere refactor

↓ Cambiar roles cada 1-2 horas
```

**Usando VS Code Live Share:**
```bash
# En VS Code
# Instalar: Extension "Live Share"
# Ctrl+Shift+P → "Live Share: Start"
# Compartir link con navegador
```

---

## 3. Patrones de Desarrollo

### 3.1 Crear un Nuevo Endpoint API (con TDD)

**Pasos:**

1. **Crear la ruta:**
```typescript
// app/api/docente/clases/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClassSchema } from "./schema";

export async function POST(req: NextRequest) {
  try {
    // 1. Validar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "DOCENTE") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // 2. Validar y parsear body
    const body = await req.json();
    const data = createClassSchema.parse(body);

    // 3. Lógica de negocio
    const newClass = await prisma.class.create({
      data: {
        asignatura_id: data.asignatura_id,
        docente_id: session.user.id,
        fecha: new Date(data.fecha),
        hora_inicio: new Date(data.hora_inicio),
        hora_fin: new Date(data.hora_fin),
        tema: data.tema,
      },
    });

    // 4. Retornar éxito
    return NextResponse.json(
      {
        data: newClass,
        message: "Clase creada exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando clase:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

2. **Crear schema de validación:**
```typescript
// app/api/docente/clases/schema.ts
import { z } from "zod";

export const createClassSchema = z.object({
  asignatura_id: z.string().cuid(),
  fecha: z.string().datetime(),
  hora_inicio: z.string().datetime(),
  hora_fin: z.string().datetime(),
  tema: z.string().min(3).max(255),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
```

### 3.2 Crear un Nuevo Componente React

```typescript
// components/docente/ClassForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClassFormProps {
  asignaturaId: string;
  onSuccess?: () => void;
}

export function ClassForm({ asignaturaId, onSuccess }: ClassFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/docente/clases", {
        method: "POST",
        body: JSON.stringify({
          asignatura_id: asignaturaId,
          fecha: formData.get("fecha"),
          hora_inicio: formData.get("hora_inicio"),
          hora_fin: formData.get("hora_fin"),
          tema: formData.get("tema"),
        }),
      });

      if (!response.ok) throw new Error("Error creando clase");

      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      alert("Error al crear la clase");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        name="fecha"
        type="datetime-local"
        required
      />
      <Input
        name="tema"
        placeholder="Tema de la clase"
        required
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Crear Clase"}
      </Button>
    </form>
  );
}
```

### 3.3 Usar React Query para Fetching

```typescript
// hooks/use-classes.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useClasses(asignaturaId: string) {
  return useQuery({
    queryKey: ["classes", asignaturaId],
    queryFn: async () => {
      const res = await fetch(
        `/api/docente/clases?asignatura_id=${asignaturaId}`
      );
      if (!res.ok) throw new Error("Error fetching classes");
      return res.json();
    },
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/docente/clases", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error creating class");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
```

---

## 4. Convenciones de Código

### 4.1 Nombres y Nomenclatura

```typescript
// Variables y funciones: camelCase
const totalStudents = 25;
function calculateAttendancePercentage() {}

// Clases y tipos: PascalCase
class StudentService {}
interface IUser {}
type UserRole = "ADMIN" | "DOCENTE" | "ESTUDIANTE";

// Constantes: UPPER_SNAKE_CASE
const MAX_ATTENDANCE_PERCENTAGE = 80;
const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000;

// Componentes React: PascalCase
export function ClassForm() {}
export const StudentList = () => {};

// Archivos: kebab-case para componentes
// components/docente/class-form.tsx
// components/estudiante/attendance-list.tsx
```

### 4.2 Estructura de Error Handling

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "No autorizado") {
    super(message, 401, "UNAUTHORIZED");
  }
}

// Uso en endpoints
try {
  if (!class) throw new NotFoundError("Clase no encontrada");
} catch (error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
}
```

---

## 5. Testing

### 5.1 Unit Tests (Jest)

```typescript
// tests/unit/lib/time-utils.test.ts
import { calculateDuration, isClassOverlap } from "@/lib/time-utils";

describe("calculateDuration", () => {
  it("should calculate duration in minutes", () => {
    const start = new Date("2024-01-01 09:00");
    const end = new Date("2024-01-01 10:30");
    const result = calculateDuration(start, end);
    expect(result).toBe(90);
  });
});

describe("isClassOverlap", () => {
  it("should detect overlapping classes", () => {
    const class1 = { start: "09:00", end: "10:00" };
    const class2 = { start: "09:30", end: "10:30" };
    expect(isClassOverlap(class1, class2)).toBe(true);
  });
});
```

### 5.2 API Tests

```typescript
// tests/api/docente/clases.test.ts
import { createMocks } from "node-mocks-http";
import { POST } from "@/app/api/docente/clases/route";
import { getServerSession } from "next-auth";

jest.mock("next-auth");
jest.mock("@/lib/db");

describe("/api/docente/clases", () => {
  it("should create a class with valid data", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1", role: "DOCENTE" },
    });

    const { req, res } = createMocks({
      method: "POST",
      body: {
        asignatura_id: "subj1",
        fecha: "2024-01-15",
        tema: "Introducción a TypeScript",
      },
    });

    await POST(req as any);

    expect(res._getStatusCode()).toBe(201);
  });

  it("should reject without authentication", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({ method: "POST" });
    await POST(req as any);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

### 5.3 E2E Tests (Playwright)

```typescript
// tests/e2e/docente-workflow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Docente Workflow", () => {
  test("should create and manage a class", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', "docente@sira.edu");
    await page.fill('input[name="password"]', "password123");
    await page.click("button:has-text('Iniciar Sesión')");

    // Navigate to create class
    await page.goto("/docente/dashboard");
    await page.click("button:has-text('Nueva Clase')");

    // Fill form
    await page.fill('input[name="tema"]', "Clase de Prueba");
    await page.fill(
      'input[name="hora_inicio"]',
      "2024-01-15T09:00"
    );
    await page.click("button:has-text('Crear Clase')");

    // Verify
    await expect(page.locator("text=Clase de Prueba")).toBeVisible();
  });
});
```

---

## 6. Comandos Comunes

```bash
# Desarrollo
bun run dev              # Iniciar servidor (Bun + Next.js)
bun run build            # Build producción
bun run start            # Iniciar servidor built

# Base de datos
bun run prisma generate  # Regenerar cliente Prisma
bun run prisma db push   # Sincronizar schema con DB
bun run prisma studio    # GUI para explorar DB
bun run seed             # Seedear datos iniciales

# Testing
bun run test             # Ejecutar tests
bun run test:watch       # Tests en watch mode
bun run test:coverage    # Coverage report
bun run test:e2e         # E2E tests
bun run test:e2e:ui      # E2E en UI mode

# Linting y Formatting
bun run lint             # ESLint
bun run format           # Prettier
bun run type-check       # TypeScript check

# Deployment
bun run build            # Build para producción
bun run start            # Iniciar en modo producción
```

---

## 7. Git Workflow

### 7.1 Crear Feature Branch

```bash
# Crear branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/RF-ADM-001-crear-docentes

# Hacer cambios y commits
git add .
git commit -m "feat: Implementar creación de docentes (RF-ADM-001)"

# Push y crear PR
git push origin feature/RF-ADM-001-crear-docentes
```

### 7.2 Commit Messages

Usar formato Conventional Commits:

```
<tipo>(<scope>): <descripción>

<cuerpo opcional>

<footer opcional>
```

**Tipos válidos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `refactor`: Cambio de código sin cambiar funcionalidad
- `test`: Agregar o actualizar tests
- `docs`: Cambios en documentación
- `chore`: Cambios en build, deps, etc.

**Ejemplos:**
```
feat(docente): Implementar registro de asistencia por QR
fix(auth): Corregir validación de token JWT
test(estudiante): Agregar tests para consulta de asignaturas
docs: Actualizar guía de desarrollo
```

---

## 8. Debugging

### 8.1 Logs en Desarrollo

```typescript
// Usar console con prefix
const log = (msg: string) => console.log(`[DOCENTE] ${msg}`);

log("Registrando asistencia...");
```

### 8.2 Debug Mode

```bash
# Con Node.js
NODE_DEBUG=* bun run dev

# Con Prisma
DEBUG=prisma* bun run dev
```

### 8.3 Prisma Studio

```bash
bun run prisma studio
# Abre http://localhost:5555
```

---

## 9. Performance Tips

1. **Caching:**
   - Usar React Query para cacheo automático
   - Implementar ISR (Incremental Static Regeneration) en Next.js

2. **Database:**
   - Agregar índices en campos de búsqueda frecuente
   - Usar `.select()` en Prisma para obtener solo campos necesarios
   - Usar `.lean()` para queries que solo leen datos

3. **Frontend:**
   - Lazy loading de componentes
   - Code splitting automático en Next.js
   - Optimización de imágenes con `next/image`

---

**Última actualización:** 2026-03-13

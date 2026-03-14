# Guía de Testing

**Sistema de Gestión Académica**

---

## 1. XP Definition of Ready (DoR) y Definition of Done (DoD)

### 1.0 Definition of Ready (DoR)

**Un User Story está READY cuando:**

- ✅ Criterios de aceptación claros y verificables
- ✅ Test cases identificados (positivo, negativo, límite)
- ✅ Estimación SIGNED (story points)
- ✅ Dependencias identificadas y resueltas
- ✅ Aceptado por Product Owner
- ✅ No tiene bloqueos técnicos

**DoR Template:**
```markdown
## US-XXX: [Nombre]

### Criterios de Aceptación
- [ ] CA1
- [ ] CA2
- [ ] CA3

### Test Cases
- [ ] Caso positivo: ...
- [ ] Caso negativo: ...
- [ ] Caso límite: ...

### Estimación: [X] points

### Dependencias
- [ ] Nada
```

### 1.1 Definition of Done (DoD)

**Un User Story está DONE cuando:**

**Código:**
- ✅ Escrito con TDD (test primero)
- ✅ Code review aprobado (2+ aprobadores)
- ✅ Pair programming si es complejo
- ✅ Lint pasado: `bun run lint`
- ✅ Format pasado: `bun run format`
- ✅ TypeScript: `bun run type-check`

**Testing:**
- ✅ Unit tests >80% cobertura
- ✅ Integration tests si aplica
- ✅ E2E tests para flujos críticos
- ✅ Todos los tests ✅ pasan localmente
- ✅ Todos los tests ✅ pasan en CI

**Documentación:**
- ✅ Código comentado (funciones complejas)
- ✅ README actualizado (si cambios)
- ✅ Commit messages claros
- ✅ API documentada (API_REFERENCE.md)

**Seguridad:**
- ✅ Input validado (Zod)
- ✅ SQL Injection prevenida
- ✅ XSS prevenido
- ✅ Secrets NO en código
- ✅ RBAC verificado

**Despliegue:**
- ✅ Build producción ✅ pasa
- ✅ Deployado a staging
- ✅ QA aprobó en staging
- ✅ Pronto para producción

### 1.2 DoD Checklist para Developers

**Antes de Push:**
```bash
bun run lint          # ✅ Lint
bun run format        # ✅ Format
bun run type-check    # ✅ TypeScript
bun run test          # ✅ Tests pasan
bun run test:coverage # ✅ Cobertura >80%
bun run build         # ✅ Build OK
```

---

## 1. Estrategia de Testing

### 1.1 Pirámide de Testing

```
         /\
        /  \
       /E2E \           10% (Pruebas End-to-End)
      /______\
     /        \
    / Integr. \       30% (Pruebas de Integración)
   /___________\
  /            \
 /   Unit       \    60% (Unit Tests)
/________________\
```

### 1.2 Objetivos

| Tipo | Objetivo | Cobertura |
|---|---|---|
| **Unit** | Probar funciones aisladas | >80% |
| **Integración** | Probar módulos juntos | >60% |
| **E2E** | Probar flujos completos | Críticos |

---

## 2. Unit Testing (Jest)

### 2.1 Configuración de Jest

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["**/__tests__/**/*.ts", "**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "app/**/*.ts",
    "lib/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### 2.2 Ejemplo: Unit Test de Validación

```typescript
// lib/validators.ts
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function calculateAttendancePercentage(
  present: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

// tests/unit/lib/validators.test.ts
import {
  validateEmail,
  calculateAttendancePercentage,
} from "@/lib/validators";

describe("validateEmail", () => {
  it("should validate correct emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("admin@sira.edu")).toBe(true);
  });

  it("should reject invalid emails", () => {
    expect(validateEmail("invalid.email")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(validateEmail("")).toBe(false);
  });
});

describe("calculateAttendancePercentage", () => {
  it("should calculate percentage correctly", () => {
    expect(calculateAttendancePercentage(8, 10)).toBe(80);
    expect(calculateAttendancePercentage(15, 20)).toBe(75);
  });

  it("should return 0 when total is 0", () => {
    expect(calculateAttendancePercentage(5, 0)).toBe(0);
  });

  it("should round correctly", () => {
    expect(calculateAttendancePercentage(1, 3)).toBe(33); // 33.33... → 33
    expect(calculateAttendancePercentage(2, 3)).toBe(67); // 66.66... → 67
  });
});
```

### 2.3 Mocking con Jest

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// tests/unit/lib/user-service.test.ts
import { prisma } from "@/lib/prisma";
import { getUserById, createUser } from "@/lib/user-service";

// Mock Prisma
jest.mock("@/lib/prisma");

describe("User Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get user by ID", async () => {
    const mockUser = {
      id: "1",
      email: "user@example.com",
      nombre: "John",
      role: "DOCENTE",
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const result = await getUserById("1");

    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });

  it("should create user with hashed password", async () => {
    const userData = {
      email: "newuser@example.com",
      nombre: "Jane",
      contraseña: "password123",
    };

    (prisma.user.create as jest.Mock).mockResolvedValue({
      ...userData,
      id: "2",
      contraseña: undefined, // Password no se retorna
    });

    const result = await createUser(userData);

    expect(result.id).toBe("2");
    expect(result.email).toBe(userData.email);
    expect(prisma.user.create).toHaveBeenCalled();
  });
});
```

### 2.4 Ejecutar Unit Tests

```bash
# Ejecutar todos los tests
bun run test

# Watch mode (rerun on changes)
bun run test:watch

# Coverage report
bun run test:coverage

# Test específico
bun run test -- validators.test.ts

# Test con patrón
bun run test -- --testNamePattern="calculateAttendancePercentage"
```

---

## 3. Integration Testing

### 3.1 Setup de Integración

```typescript
// tests/integration/setup.ts
import { PrismaClient } from "@prisma/client";

// Usar BD de prueba
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || "postgresql://test:test@localhost:5432/sira_test",
    },
  },
});

beforeAll(async () => {
  // Aplicar migrations a BD de prueba
  await prisma.$executeRawUnsafe(
    `DROP DATABASE IF EXISTS sira_test;`
  );
  await prisma.$executeRawUnsafe(
    `CREATE DATABASE sira_test;`
  );
  // Ejecutar migrations...
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
```

### 3.2 Ejemplo: Integration Test de API

```typescript
// tests/integration/api/admin/docentes.test.ts
import { POST as createDocente } from "@/app/api/admin/docentes/route";
import { getServerSession } from "next-auth";

jest.mock("next-auth");

describe("POST /api/admin/docentes", () => {
  it("should create docente with valid data", async () => {
    // Mock session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin1", role: "ADMIN" },
    });

    // Preparar request
    const mockRequest = {
      json: async () => ({
        email: "nuevo.docente@sira.edu",
        nombre: "Carlos",
        apellido: "González",
        numeroEmpleado: "EMP001",
        departamento: "Ingeniería",
      }),
    } as any;

    // Ejecutar endpoint
    const response = await createDocente(mockRequest);
    const responseData = await response.json();

    // Validar
    expect(response.status).toBe(201);
    expect(responseData.data).toBeDefined();
    expect(responseData.data.email).toBe("nuevo.docente@sira.edu");
  });

  it("should reject if not admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1", role: "DOCENTE" },
    });

    const mockRequest = {
      json: async () => ({ email: "test@sira.edu" }),
    } as any;

    const response = await createDocente(mockRequest);

    expect(response.status).toBe(403);
  });

  it("should validate required fields", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin1", role: "ADMIN" },
    });

    const mockRequest = {
      json: async () => ({ nombre: "Carlos" }), // Falta email
    } as any;

    const response = await createDocente(mockRequest);

    expect(response.status).toBe(400);
  });
});
```

---

## 4. E2E Testing (Playwright)

### 4.1 Configuración de Playwright

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  webServer: {
    command: "bun run dev",
    reuseExistingServer: !process.env.CI,
    port: 3000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
```

### 4.2 Ejemplo: E2E Test de Flujo Completo

```typescript
// tests/e2e/docente-asistencia.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Docente Workflow - Registro de Asistencia", () => {
  test("should register attendance for a class", async ({ page }) => {
    // 1. Login como docente
    await page.goto("/login");
    await expect(page.locator("text=Iniciar Sesión")).toBeVisible();

    await page.fill('input[name="email"]', "docente@sira.edu");
    await page.fill('input[name="password"]', "docente123");
    await page.click("button:has-text('Iniciar Sesión')");

    // 2. Esperar redirección a dashboard
    await expect(page).toHaveURL("/dashboard/docente");
    await expect(page.locator("text=Mi Dashboard")).toBeVisible();

    // 3. Navegar a asignaturas
    await page.click("button:has-text('Mis Asignaturas')");
    await expect(page).toHaveURL(/\/dashboard\/docente\/asignaturas/);

    // 4. Seleccionar asignatura
    await page.click("text=Matemáticas I");
    await expect(page).toHaveURL(/\/asignaturas\/[a-zA-Z0-9]+/);

    // 5. Crear clase
    await page.click("button:has-text('Crear Clase')");
    await page.fill('input[name="tema"]', "Integrales Definidas");
    await page.fill('input[name="fecha"]', "2024-01-15");
    await page.click("button:has-text('Guardar Clase')");

    // 6. Registrar asistencia
    await page.click("button:has-text('Registrar Asistencia')");

    // Marcar estudiantes
    const students = page.locator("tr:has-text('Est') >> button");
    for (let i = 0; i < 5; i++) {
      await students.nth(i).click();
      await page.click("text=Presente");
    }

    // 7. Guardar
    await page.click("button:has-text('Guardar Asistencia')");
    await expect(
      page.locator("text=Asistencia registrada correctamente")
    ).toBeVisible();

    // 8. Verificar en reportes
    await page.click("button:has-text('Reportes')");
    await expect(
      page.locator("text=5 presentes de 5 estudiantes")
    ).toBeVisible();
  });

  test("should generate QR code for attendance", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "docente@sira.edu");
    await page.fill('input[name="password"]', "docente123");
    await page.click("button:has-text('Iniciar Sesión')");

    await page.click("button:has-text('Mis Asignaturas')");
    await page.click("text=Matemáticas I");
    await page.click("button:has-text('Generar QR')");

    // Verificar QR visible
    await expect(page.locator("canvas")).toBeVisible();

    // Verificar mensaje
    await expect(
      page.locator("text=Código QR generado exitosamente")
    ).toBeVisible();
  });

  test("should prevent unauthorized access", async ({ page }) => {
    // Intentar acceder a ruta protegida sin login
    await page.goto("/dashboard/docente");

    // Debe redirigir a login
    await expect(page).toHaveURL("/login");
  });
});
```

### 4.3 Ejecutar E2E Tests

```bash
# Ejecutar todos los E2E tests
bun run test:e2e

# Modo headless (sin GUI)
bun run test:e2e -- --headed=false

# Modo UI (viendo el navegador)
bun run test:e2e:ui

# Test específico
bun run test:e2e -- docente-asistencia.spec.ts

# Con debugging
bun run test:e2e -- --debug

# Generar reporte HTML
bun run test:e2e
# Abre playwright-report/index.html
```

---

## 5. Cobertura de Testing

### 5.1 Generar Report de Cobertura

```bash
# Ejecutar tests con cobertura
bun run test:coverage

# Salida esperada:
# =============================== Coverage summary ===============================
# Statements   : 78.5% ( 250/318 )
# Branches     : 72.3% ( 120/166 )
# Functions    : 81.2% ( 65/80 )
# Lines        : 79.4% ( 252/317 )
# ================================================================================
```

### 5.2 Ver Reporte Detallado

```bash
# Generar reporte HTML
bun run test:coverage

# Abrir en navegador
open coverage/lcov-report/index.html
# o
firefox coverage/lcov-report/index.html
```

### 5.3 Objetivos por Módulo

| Módulo | Objetivo | Actual |
|---|---|---|
| `lib/validators.ts` | >90% | 92% |
| `lib/auth.ts` | >85% | 88% |
| `app/api/docente/` | >80% | 81% |
| `app/api/estudiante/` | >80% | 79% |
| Promedio general | >75% | 81% |

---

## 6. Best Practices

### 6.1 Nombrado de Tests

```typescript
// ❌ Malo
test("works", () => {});
test("should work", () => {});

// ✅ Bien
test("should calculate attendance percentage correctly for valid input", () => {});
test("should return 0 when total students is 0", () => {});
test("should reject email without @ symbol", () => {});
```

### 6.2 AAA Pattern (Arrange-Act-Assert)

```typescript
test("should create user", async () => {
  // Arrange - Preparar datos
  const userData = {
    email: "test@sira.edu",
    nombre: "John",
    role: "DOCENTE",
  };

  // Act - Ejecutar función
  const result = await createUser(userData);

  // Assert - Verificar resultado
  expect(result.id).toBeDefined();
  expect(result.email).toBe("test@sira.edu");
});
```

### 6.3 Test Fixtures

```typescript
// tests/fixtures/users.ts
export const mockAdmin = {
  id: "admin1",
  email: "admin@sira.edu",
  role: "ADMIN",
  estado: true,
};

export const mockDocente = {
  id: "doc1",
  email: "docente@sira.edu",
  role: "DOCENTE",
  estado: true,
};

// Uso en test:
import { mockAdmin, mockDocente } from "@/tests/fixtures/users";

test("should allow admin action", () => {
  const user = mockAdmin;
  expect(user.role).toBe("ADMIN");
});
```

---

## 7. CI/CD Testing

### 7.1 GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: sira_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun run test

      - name: Run integration tests
        run: bun run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/sira_test

      - name: Run E2E tests
        run: bun run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 8. Debugging de Tests

### 8.1 Con VSCode

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": ["--runInBand"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 8.2 Con Playwright Inspector

```bash
# Ejecutar tests con Playwright Inspector
PWDEBUG=1 bun run test:e2e
```

---

## 9. Checklist de Testing

- ✅ Cobertura >75%
- ✅ Todos los happy paths cubiertos
- ✅ Todos los error paths cubiertos
- ✅ E2E para flujos críticos
- ✅ Tests pasan en CI/CD
- ✅ Documentación de tests actualizada

---

**Última actualización:** 2026-03-13
**Versión:** 1.0

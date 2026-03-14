# Metodología Extreme Programming (XP)

**Sistema de Gestión Académica - Guía de Prácticas XP**

---

## 1. Introducción a XP

**Extreme Programming** es una metodología ágil que enfatiza:
- 🎯 Calidad del código
- 🔄 Cambios continuos
- 👥 Colaboración del equipo
- ⚡ Entregas frecuentes
- 🧪 Testing exhaustivo

### Valores Fundamentales XP

| Valor | Descripción | En SIRA |
|---|---|---|
| **Comunicación** | Diálogo constante entre equipo y stakeholders | Daily standups, pair programming |
| **Simplicidad** | Diseños simples, no over-engineering | Code review, refactoring continuo |
| **Retroalimentación** | Tests, demos, stakeholders | Unit tests, E2E tests, sprints |
| **Coraje** | Refactorización sin miedo | Tests = seguridad para cambiar |
| **Respeto** | Confianza en el equipo | Pair programming, código compartido |

---

## 2. User Stories (Requerimientos como Historias)

### 2.1 Formato de User Story

```
Como [rol]
Quiero [funcionalidad]
Para que [beneficio/valor]

Criterios de Aceptación:
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3
```

### 2.2 User Stories en SIRA

#### **US-ADM-001: Crear Docente**
```
Como Administrador
Quiero crear nuevos docentes en el sistema
Para que puedan acceder y enseñar asignaturas

Criterios de Aceptación:
- [ ] Validar email único
- [ ] Hash contraseña con bcryptjs
- [ ] Enviar email de bienvenida
- [ ] Crear registro en BD
- [ ] Registrar en audit log
```

#### **US-DOC-002: Registrar Asistencia Manual**
```
Como Docente
Quiero marcar la asistencia de mis estudiantes manualmente
Para que quede registrada aunque el QR no funcione

Criterios de Aceptación:
- [ ] Seleccionar asignatura
- [ ] Seleccionar fecha de clase
- [ ] Ver lista de estudiantes matriculados
- [ ] Marcar estado (PRESENTE/AUSENTE/TARDE/JUSTIFICADO)
- [ ] Guardar en BD
- [ ] Mostrar confirmación
```

#### **US-DOC-003: Generar QR para Asistencia**
```
Como Docente
Quiero generar un código QR para que mis estudiantes registren asistencia automáticamente
Para que sea más rápido y sin errores

Criterios de Aceptación:
- [ ] Generar token único por clase
- [ ] Crear código QR con token
- [ ] QR válido solo 60 minutos
- [ ] Mostrar QR en pantalla
- [ ] Un QR activo por clase
```

#### **US-EST-001: Consultar Mi Asistencia**
```
Como Estudiante
Quiero ver mi registro de asistencia por asignatura
Para conocer mis porcentajes y alertas

Criterios de Aceptación:
- [ ] Ver todas mis asignaturas
- [ ] Filtrar por asignatura
- [ ] Ver tabla con fechas y estados
- [ ] Ver porcentaje total
- [ ] Alertas si < 80%
- [ ] Descargar reporte PDF
```

---

## 3. Test-Driven Development (TDD)

### 3.1 Ciclo TDD: Red → Green → Refactor

```
1️⃣ RED: Escribir test que falla
2️⃣ GREEN: Escribir código mínimo para pasar test
3️⃣ REFACTOR: Mejorar código manteniendo tests verdes
```

### 3.2 Ejemplo: Crear Endpoint de Docente

#### Paso 1️⃣ RED - Test Fallido

```typescript
// tests/api/admin/docentes.test.ts
describe("POST /api/admin/docentes", () => {
  it("should create docente with valid data", async () => {
    const response = await fetch("/api/admin/docentes", {
      method: "POST",
      headers: { "Authorization": "Bearer token" },
      body: JSON.stringify({
        email: "nuevo@sira.edu",
        nombre: "Juan",
        apellido: "García",
        numeroEmpleado: "DOC001",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.email).toBe("nuevo@sira.edu");
  });

  it("should reject duplicate email", async () => {
    // Test similar pero esperando 400
  });
});
```

**Resultado:** ❌ TEST FALLA (endpoint no existe)

#### Paso 2️⃣ GREEN - Código Mínimo

```typescript
// app/api/admin/docentes/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Crear docente
  const docente = await prisma.docente.create({
    data: {
      usuario: {
        create: {
          email: body.email,
          nombre: body.nombre,
          apellido: body.apellido,
          role: "DOCENTE",
          contraseña_hash: await hashPassword(body.password),
        },
      },
      numeroEmpleado: body.numeroEmpleado,
    },
    include: { usuario: true },
  });

  return NextResponse.json({ data: docente }, { status: 201 });
}
```

**Resultado:** ✅ TEST PASA

#### Paso 3️⃣ REFACTOR - Mejorar

```typescript
// Extraer validación
const docente_schema = z.object({
  email: z.string().email(),
  nombre: z.string().min(2),
  numeroEmpleado: z.string().unique(),
});

// Extraer lógica a servicio
export async function createDocente(data: CreateDocenteInput) {
  const hashed = await hashPassword(data.password);

  return prisma.docente.create({
    data: {
      usuario: { create: { ...data, contraseña_hash: hashed } },
      numeroEmpleado: data.numeroEmpleado,
    },
  });
}

// Endpoint limpio
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = docente_schema.parse(await req.json());
  const docente = await createDocente(body);

  return NextResponse.json({ data: docente }, { status: 201 });
}
```

**Resultado:** ✅ TEST AÚN PASA, código más limpio

### 3.3 Cobertura TDD en SIRA

| Componente | Cobertura | Tipo Test |
|---|---|---|
| **Validadores** | >95% | Unit |
| **Servicios** | >85% | Unit + Integration |
| **API Routes** | >80% | Integration |
| **Componentes React** | >70% | Unit |
| **Flujos Críticos** | 100% | E2E |

---

## 4. Pair Programming

### 4.1 Roles en Pair Programming

```
┌─────────────────────────────────────────────────┐
│  DRIVER                                         │
│  - Escribe código                               │
│  - Enfocado en detalles tácticos                │
│  - "¿Cómo lo escribo?"                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  NAVIGATOR                                      │
│  - Revisa código en tiempo real                 │
│  - Enfocado en estrategia                       │
│  - "¿Es correcto lo que hacemos?"               │
│  - Sugiere refactorización                      │
└─────────────────────────────────────────────────┘
```

### 4.2 Cuándo Usar Pair Programming en SIRA

| Tarea | Pair | Razón |
|---|---|---|
| Feature nueva (alta complejidad) | ✅ Sí | TDD + diseño |
| Bug crítico | ✅ Sí | Análisis + verificación |
| Refactoring grande | ✅ Sí | Cambios seguros |
| Code review normal | ✅ Sí | Aprendizaje |
| Bug simple | ❌ No | Un dev + tests |
| Documentación | ❌ No | Una persona |
| Configuración | ❌ No | Especialista |

### 4.3 Pair Programming Remoto

**Herramientas:**
- Visual Studio Code Live Share
- Screen sharing + video call
- Rotation cada 1-2 horas

**Protocolo:**
```
1. Start: Ambos entienden la tarea (5 min)
2. Code: Driver escribe, Navigator revisa (45 min)
3. Swap: Cambiar roles (intercambiar máquina o control)
4. Review: Verificar tests pasen (10 min)
5. Commit: Ambos revisan antes de push
```

---

## 5. Definition of Ready (DoR)

User Story está **READY** cuando:

- ✅ Criterios de aceptación claros y medibles
- ✅ Estimación SIGNED (story points)
- ✅ Dependencias identificadas
- ✅ Aceptado por Product Owner
- ✅ Tests identificados (test cases)
- ✅ Recursos necesarios disponibles

### Template DoR en SIRA

```markdown
## US-XXX: [Nombre de User Story]

### Criterios de Aceptación:
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

### Test Cases:
- [ ] Caso positivo: ...
- [ ] Caso negativo: ...
- [ ] Caso límite: ...

### Estimación: [X] points

### Dependencias:
- [ ] US-YYY debe estar completa
- [ ] API de Supabase disponible

### Notas Técnicas:
- Usar TDD
- Pair programming recomendado
- Code review obligatorio
```

---

## 6. Definition of Done (DoD)

Una User Story está **DONE** cuando:

### Código
- ✅ Código escrito con TDD
- ✅ Pair programming realizado
- ✅ Code review aprobado (2+ reviewers)
- ✅ Lint/format pasado (`bun run format && bun run lint`)
- ✅ TypeScript sin errores (`bun run type-check`)

### Testing
- ✅ Unit tests escritos (>80% cobertura)
- ✅ Integration tests si aplica
- ✅ E2E tests para flujos críticos
- ✅ Todos los tests pasan localmente
- ✅ Todos los tests pasan en CI

### Documentación
- ✅ Código comentado en secciones complejas
- ✅ README actualizado (si hay cambios de setup)
- ✅ Documentación inline en funciones complejas
- ✅ Commit messages claros (Conventional Commits)

### Seguridad
- ✅ Input validado (Zod schemas)
- ✅ SQL Injection prevenida (Prisma ORM)
- ✅ XSS prevenido (React escaping)
- ✅ CSRF protection verificada
- ✅ Secrets no en código

### Despliegue
- ✅ Build producción exitoso
- ✅ Deployado a staging
- ✅ QA aprobó en staging
- ✅ Listo para producción

### Operaciones
- ✅ Monitoreo configurado (Sentry alertas)
- ✅ Logs configurados
- ✅ Métricas tracked
- ✅ Rollback plan documentado

---

## 7. Integración Continua (CI)

### 7.1 Pipeline XP de CI en GitHub Actions

```yaml
# .github/workflows/ci.yml
name: XP CI Pipeline

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run format:check

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test
      - run: bun run test:coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v3
      - run: bun run test:integration

  build:
    runs-on: ubuntu-latest
    needs: [lint, type-check, unit-tests]
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v3
      - run: bun install
      - run: bun run test:e2e
```

### 7.2 Requisitos XP CI

- ✅ Todo commit va a rama de feature
- ✅ PR requiere 2 aprobaciones mínimo
- ✅ CI debe pasar (no se puede merjar si falla)
- ✅ Code coverage no puede bajar
- ✅ Build debe exitoso
- ✅ Tests deben pasar 100%

---

## 8. Refactoring Continuo

### 8.1 Cuándo Refactorizar

**Señales (Code Smells):**
- Función > 20 líneas → Extraer métodos
- Parámetros > 3 → Extraer objeto
- Variables temp → Extraer función
- Switch/if chain complejo → Polymorphism
- Duplicación → Extract method
- Nombres confusos → Rename

### 8.2 Refactoring Seguro (con Tests)

```typescript
// ❌ MAL: Refactorizar sin tests
function calculateAttendance(students) {
  let count = 0;
  for (let i = 0; i < students.length; i++) {
    if (students[i].present) count++;
  }
  return Math.round((count / students.length) * 100);
}

// ✅ BIEN: Tests primero, luego refactorizar
describe("calculateAttendance", () => {
  it("should return 80 when 4 of 5 present", () => {
    expect(calculateAttendance([
      { present: true },
      { present: true },
      { present: true },
      { present: true },
      { present: false },
    ])).toBe(80);
  });

  it("should return 0 when no students present", () => {
    expect(calculateAttendance([])).toBe(0);
  });
});

// Refactorizar con confianza
function calculateAttendance(students: Student[]): number {
  if (students.length === 0) return 0;

  const presentCount = students.filter(s => s.present).length;
  return Math.round((presentCount / students.length) * 100);
}
```

---

## 9. Planning & Velocidad (Velocity)

### 9.1 Planning Poker

```
Sprint Planning:
1. Product Owner presenta User Stories
2. Equipo discute cada historia
3. Equipo estima en story points:
   1 = Trivial (< 2h)
   2 = Pequeño (2-4h)
   3 = Medio (4-8h)
   5 = Grande (1-2 días)
   8 = Muy grande (2-3 días)
   13 = Epic (dividir)
4. Consenso en estimación
5. Commitment de velocidad
```

### 9.2 Tracking Velocidad en SIRA

| Sprint | Estimado | Completado | Velocidad | Trend |
|---|---|---|---|---|
| Sprint 1 | 40 pts | 32 pts | 32 | ↗️ Aprendizaje |
| Sprint 2 | 40 pts | 38 pts | 38 | ↗️ Mejorando |
| Sprint 3 | 40 pts | 40 pts | 40 | ✅ En ritmo |
| Sprint 4 | 42 pts | 40 pts | 40 | ➡️ Estable |

**Fórmula:** Velocidad = Story Points Completados / Sprint Duration

---

## 10. Daily Standup XP

### 10.1 Formato (15 minutos máximo)

```
Cada dev reporta:
1. ¿Qué hice ayer?
   "Implementé endpoint POST /api/docentes con tests"

2. ¿Qué hago hoy?
   "Implementar validación y documentation"

3. ¿Hay bloqueadores?
   "Espero feedback del PR del DB schema"
```

### 10.2 Kanban Board en SIRA

```
┌─────────────┬──────────────┬──────────────┬──────────┐
│   TODO      │ IN PROGRESS  │ IN REVIEW    │  DONE    │
├─────────────┼──────────────┼──────────────┼──────────┤
│ US-ADM-002  │ US-DOC-003   │ US-EST-001   │ US-ADM-01│
│ US-DOC-004  │ (50%)        │ (waiting PR) │          │
│ US-EST-002  │              │              │          │
│ (5 pts)     │ (8 pts)      │ (3 pts)      │ (13 pts) │
└─────────────┴──────────────┴──────────────┴──────────┘

Límite WIP: máximo 2 en desarrollo simultáneo
→ Evita context switching
→ Acelera delivery
```

---

## 11. Code Review XP

### 11.1 Checklist Code Review

- ✅ Tests unitarios presentes
- ✅ Tests pasan localmente
- ✅ Código sigue convenciones
- ✅ No hay console.log/debug
- ✅ Tipos TypeScript correctos
- ✅ Sin imports no utilizados
- ✅ Documentación clara
- ✅ Sin hardcoding de valores
- ✅ Sin secrets en código
- ✅ Commits atómicos con mensajes claros

### 11.2 Proceso PR en SIRA

```
1. Developer abre PR
   ├─ Descripción clara
   ├─ Vinculado a Issue/US
   └─ Screenshots si UI change

2. CI checks (automático)
   ├─ Lint ✅
   ├─ Tests ✅
   ├─ Build ✅
   └─ Coverage no baja ✅

3. Code Review (2+ reviewers)
   ├─ Revisor 1: Lógica
   ├─ Revisor 2: Arquitectura/Security
   └─ Cambios solicitados → Implement → Review nuevamente

4. Merge & Deploy
   ├─ Squash commits (historia limpia)
   └─ Auto-deploy a staging si es OK
```

---

## 12. Releases Frecuentes

### 12.1 Ciclo de Release XP

```
Semana 1-2: Desarrollo intenso
├─ Sprint planning
├─ Daily development
├─ Code reviews
└─ Continuous integration

Fin Semana 2: Sprint Review + Retrospectiva
├─ Demo a stakeholders
├─ Feedback collection
└─ Retrospectiva: ¿Qué salió bien? ¿Qué mejorar?

Inicio Semana 3: Release a Producción
├─ Release notes
├─ Despliegue
└─ Monitoreo 24/7

Semana 3-4: Hotfixes si es necesario
└─ Back to development next sprint
```

### 12.2 Release Checklist SIRA

```
Pre-Release:
- [ ] Versión bumped (semver)
- [ ] CHANGELOG.md actualizado
- [ ] Tests pasados 100%
- [ ] Build producción exitoso
- [ ] Deployment plan documentado

Release:
- [ ] Backup BD creado
- [ ] Deploy a staging verificado
- [ ] QA sign-off
- [ ] Deploy a producción
- [ ] Health checks pasados
- [ ] Monitoreo activo

Post-Release:
- [ ] Release notes publicadas
- [ ] Stakeholders notificados
- [ ] Logs monitoreados
- [ ] Rollback plan en standby
```

---

## 13. Retrospectivas XP

### 13.1 Formato Retrospectiva (60 minutos)

```
1. Qué salió bien (15 min)
   - Celebrate wins
   - Reconocer esfuerzo

2. Qué no salió bien (15 min)
   - Honest feedback
   - Root cause analysis

3. Qué mejorar (15 min)
   - Concrete actions
   - Owner asignado
   - Sprint siguiente

4. Action items (15 min)
   - Priorizar cambios
   - Commit del equipo
```

### 13.2 Retro Template SIRA

```markdown
## Retrospectiva Sprint 5

### ✅ Qué Salió Bien
- Implementamos 40 pts (velocidad target)
- Pair programming mejoró quality
- Code reviews detectaron 5 bugs antes de prod

### ❌ Qué No Salió Bien
- PR reviews lentos (48h promedio)
- Setup DB tomó 3h extra
- Falta claridad en criterios de aceptación

### 🚀 Qué Mejorar
- [ ] Asignar code reviewer en PR creation (owner: @dev1)
- [ ] Pre-check DB schema antes de sprint (owner: @dba)
- [ ] DoR más estricta (owner: @po)

### Velocidad Próximo Sprint
Target: 42 pts (basado en trending)
```

---

## 14. Métricas XP Importantes

| Métrica | Objetivo | Cálculo |
|---|---|---|
| **Velocidad** | 40±5 pts/sprint | Σ completados |
| **Cobertura Tests** | >80% | Líneas testeadas / Total |
| **Cycle Time** | <5 días | Idea → Producción |
| **Lead Time** | <2 semanas | Request → Delivery |
| **Defect Rate** | <2% | Bugs en 2 semanas / Features |
| **Code Review Time** | <24h | Tiempo promedio review |
| **Build Time** | <5 min | Compilación |
| **Deployment Frequency** | 2-3x/semana | Releases |

---

## 15. Herramientas XP en SIRA

| Herramienta | Uso | En SIRA |
|---|---|---|
| **GitHub** | Version control + PR | ✅ |
| **GitHub Projects** | Kanban board | ✅ |
| **Jest** | Unit testing | ✅ |
| **Playwright** | E2E testing | ✅ |
| **GitHub Actions** | CI/CD | ✅ |
| **Sentry** | Error tracking | ✅ |
| **Vercel** | CD automático | ✅ |
| **VS Code Live Share** | Pair programming | ✅ |

---

## 16. Anti-patrones XP a Evitar

| Anti-patrón | Problema | Solución |
|---|---|---|
| **Tests después** | No descubres bugs | TDD obligatorio |
| **PR mega-grandes** | Difícil review | Commits pequeños |
| **Sin pair prog** | Menos calidad | Pair en features complejas |
| **Refactor sin tests** | Introduces bugs | Tests primero |
| **Deployment manual** | Errores humanos | CI/CD automático |
| **Monitoreo inactivo** | Bugs en prod | Alerts configuradas |
| **Sprint sin retrospectiva** | No mejoras | Retro obligatoria |
| **User stories vagas** | Interpretación diferente | DoR estricta |

---

## 17. XP Checklist para Developers

### Antes de Empezar (Cada Mañana)

- ⬜ ¿Tengo DoR claro en mi US?
- ⬜ ¿Tengo test cases definidos?
- ⬜ ¿Pair programming scheduled? (si es feature grande)
- ⬜ ¿Bloqueadores de ayer resueltos?

### Durante Desarrollo (Cada Commit)

- ⬜ ¿Escribí test primero (TDD)?
- ⬜ ¿Todos los tests pasan?
- ⬜ ¿El código cumple DoD?
- ⬜ ¿Commit message es claro?

### Antes de PR (Code Complete)

- ⬜ ¿Lint pasado? (`bun run lint`)
- ⬜ ¿Tipo-check pasado? (`bun run type-check`)
- ⬜ ¿Tests unitarios >80% cobertura?
- ⬜ ¿Build local exitoso?
- ⬜ ¿Documentación actualizada?

### PR Review (Reviewer)

- ⬜ ¿Tests cubren casos positivo/negativo/límite?
- ⬜ ¿Código es simple y legible?
- ⬜ ¿Sin secrets hardcodeados?
- ⬜ ¿Commits están bien separados?

### After Merge (Code Complete)

- ⬜ ¿CI completó exitosamente?
- ⬜ ¿Desplegó a staging automático?
- ⬜ ¿Monitoreo está activo?
- ⬜ ¿Listo para next US?

---

**Última actualización:** 2026-03-13
**Versión:** 1.0
**Metodología:** Extreme Programming (XP)

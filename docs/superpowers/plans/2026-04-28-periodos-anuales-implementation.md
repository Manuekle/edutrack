# Gestión de Periodos por Año — Plan de Implementación

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan.

**Goal:** Agregar gestión de periodos académicos por año con sugerencia automática y rangos de fechas especiales (festivos, vacaciones, recesos).

**Architecture:** Se agregan dos modelos nuevos (`AcademicYear`, `SpecialRange`) a Prisma. `AcademicPeriod` recibe una relación opcional a `AcademicYear`. API routes REST para CRUD de años y rangos especiales. La UI existente se rediseña con selector de año, tabs y edición inline.

**Tech Stack:** Prisma 6 + MongoDB, Next.js App Router, Zod, shadcn/ui, date-fns, sileo (toasts).

---

## Chunk 1: Schema Prisma + Migración

**Files:**
- Modify: `prisma/schema.prisma:334-342`
- Create: `prisma/migrations/chunks/`

- [ ] **Step 1: Agregar enum SpecialType al schema**

Buscar el final de los enum en schema.prisma y agregar:

```prisma
enum SpecialType {
  VACATION
  HOLIDAY
  RECESS
}
```

- [ ] **Step 2: Agregar modelo AcademicYear antes de AcademicPeriod**

Buscar en schema.prisma la línea `model AcademicPeriod {` y agregar antes:

```prisma
model AcademicYear {
  id            String         @id @default(auto()) @map("_id") @db.ObjectId
  year          Int            @unique
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  specialRanges SpecialRange[]
  periods       AcademicPeriod[]
}

model SpecialRange {
  id          String       @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  type        SpecialType
  startDate   DateTime
  endDate     DateTime
  year        AcademicYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  yearId      String       @db.ObjectId
  createdAt   DateTime     @default(now())
}
```

- [ ] **Step 3: Agregar relación en AcademicPeriod**

En `model AcademicPeriod {}`, agregar al final (antes del `}`):

```prisma
  year       AcademicYear? @relation(fields: [yearId], references: [id])
  yearId     String?       @db.ObjectId
```

- [ ] **Step 4: Generar Prisma client**

Run: `pnpm prisma generate`
Expected: "Generated Prisma Client"

- [ ] **Step 5: Aplicar cambios a la DB**

Run: `pnpm prisma db push --accept-data-loss`
Expected: Schema applied without migration files (dev DB reset pattern)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add AcademicYear and SpecialRange models"
```

---

## Chunk 2: API Routes

**Files:**
- Modify: `app/api/admin/periodos/route.ts`
- Create: `app/api/admin/periodos/years/route.ts`
- Create: `app/api/admin/periodos/years/[id]/route.ts`
- Create: `app/api/admin/periodos/years/[id]/suggest/route.ts`
- Create: `app/api/admin/periodos/special-ranges/route.ts`
- Create: `app/api/admin/periodos/special-ranges/[id]/route.ts`

### 2a. Modificar route existente de periodos (CRUD básico ya existe, solo agregar PUT)

- [ ] **Step 1: Modificar `app/api/admin/periodos/route.ts`**

Agregar `PUT` al final del archivo para editar periodo:

```typescript
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, startDate, endDate, isActive, yearId } = body;

    const period = await db.academicPeriod.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(yearId !== undefined && { yearId }),
      },
    });

    return NextResponse.json(period);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Crear `app/api/admin/periodos/years/route.ts`**

```typescript
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const years = await db.academicYear.findMany({
      orderBy: { year: 'desc' },
      include: {
        specialRanges: { orderBy: { startDate: 'asc' } },
        periods: { orderBy: { name: 'asc' } },
      },
    });

    return NextResponse.json({ years });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { year } = await req.json();
    const existing = await db.academicYear.findUnique({ where: { year } });
    if (existing) {
      return NextResponse.json({ error: 'El año ya existe' }, { status: 409 });
    }

    const academicYear = await db.academicYear.create({ data: { year } });
    return NextResponse.json(academicYear);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Crear `app/api/admin/periodos/years/[id]/route.ts`**

```typescript
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const year = await db.academicYear.findUnique({
      where: { id: params.id },
      include: {
        specialRanges: { orderBy: { startDate: 'asc' } },
        periods: { orderBy: { name: 'asc' } },
      },
    });

    if (!year) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(year);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await db.academicYear.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Eliminado' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Crear `app/api/admin/periodos/years/[id]/suggest/route.ts`**

```typescript
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const year = await db.academicYear.findUnique({
      where: { id: params.id },
      include: { periods: true },
    });

    if (!year) return NextResponse.json({ error: 'Año no encontrado' }, { status: 404 });

    if (year.periods.length > 0) {
      return NextResponse.json({ error: 'Este año ya tiene periodos' }, { status: 409 });
    }

    const startYear = new Date(year.year, 0, 1); // Jan 1
    const midYear = new Date(year.year, 6, 1);   // Jul 1

    const [p1, p2] = await Promise.all([
      db.academicPeriod.create({
        data: {
          name: `${year.year}-1`,
          startDate: startYear,
          endDate: new Date(year.year, 5, 30), // Jun 30
          isActive: true,
          yearId: year.id,
        },
      }),
      db.academicPeriod.create({
        data: {
          name: `${year.year}-2`,
          startDate: midYear,
          endDate: new Date(year.year, 11, 31), // Dec 31
          isActive: false,
          yearId: year.id,
        },
      }),
    ]);

    return NextResponse.json({ periods: [p1, p2] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 5: Crear `app/api/admin/periodos/special-ranges/route.ts`**

```typescript
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ranges = await db.specialRange.findMany({
      orderBy: { startDate: 'asc' },
      include: { year: { select: { year: true } } },
    });

    return NextResponse.json({ ranges });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { yearId, name, type, startDate, endDate } = body;

    const range = await db.specialRange.create({
      data: {
        name,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        yearId,
      },
    });

    return NextResponse.json(range);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 6: Crear `app/api/admin/periodos/special-ranges/[id]/route.ts`**

```typescript
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, startDate, endDate } = body;

    const range = await db.specialRange.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
    });

    return NextResponse.json(range);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await db.specialRange.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Eliminado' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add app/api/admin/periodos/
git commit -m "feat: add AcademicYear and SpecialRange API routes"
```

---

## Chunk 3: UI de Periodos (rediseño completo)

**Files:**
- Modify: `app/dashboard/(roles)/admin/planeador/periodos/page.tsx`

- [ ] **Step 1: Reemplazar completamente la página**

Reescribir `periodos/page.tsx` completo con:
- Selector de año (dropdown que lista años existentes + crear nuevo)
- Dos tabs: "Periodos" y "Fechas Especiales"
- Tab Periodos: tabla con botones inline de editar (modal Dialog de shadcn)
- Tab Fechas Especiales: lista de rangos con form para agregar, badges de color por tipo
- Usar `useState` para año seleccionado, datos cargados
- Usar `useEffect` para recargar al cambiar año
- Integrar sileo para toasts de éxito/error

Componentes a usar de shadcn: `Dialog`, `Select`, `Tabs`, `Badge`, `Button`, `Input`, `Label`, `Card`, `Table`, `Skeleton`

Verificar: `npx shadcn@latest add dialog select tabs -y`

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/\(roles\)/admin/planeador/periodos/page.tsx
git commit -m "feat: redesign periodos page with year selector, tabs, and special ranges"
```

---

## Chunk 4: Seed actualizado

**Files:**
- Modify: `prisma/seed.ts:191-205`

- [ ] **Step 1: Actualizar creación de AcademicPeriods en seed**

Reemplazar el bloque de creación de AcademicPeriods con:

```typescript
// Create AcademicYear + AcademicPeriods
  for (const yearData of [
    { year: 2022, periods: [{ name: '2022-1', start: '2022-01-01', end: '2022-06-30', isActive: true }] },
    { year: 2026, periods: [{ name: '2026-1', start: '2026-01-01', end: '2026-06-30', isActive: true }] },
  ]) {
    const academicYear = await prisma.academicYear.create({ data: { year: yearData.year } });

    for (const p of yearData.periods) {
      await prisma.academicPeriod.create({
        data: {
          name: p.name,
          startDate: new Date(p.start),
          endDate: new Date(p.end),
          isActive: p.isActive,
          yearId: academicYear.id,
        },
      });
    }
  }
```

- [ ] **Step 2: Agregar SpecialRanges de ejemplo para 2026**

Después de crear los años:

```typescript
// Create special ranges for 2026
  const year2026 = await prisma.academicYear.findUnique({ where: { year: 2026 } });
  if (year2026) {
    const specialRanges = [
      { name: 'Semana Santa', type: 'HOLIDAY', start: '2026-04-10', end: '2026-04-13' },
      { name: 'Receso navideño', type: 'RECESS', start: '2026-12-20', end: '2026-12-31' },
    ];
    for (const sr of specialRanges) {
      await prisma.specialRange.create({
        data: { name: sr.name, type: sr.type as any, startDate: new Date(sr.start), endDate: new Date(sr.end), yearId: year2026.id },
      });
    }
  }
```

- [ ] **Step 3: Ejecutar seed**

Run: `pnpm seed`
Expected: Full seed complete

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: update seed with AcademicYear relation and special ranges"
```

---

## Chunk 5: Verificación

- [ ] **Step 1: Run typecheck**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: Build success

- [ ] **Step 3: Commit final**

```bash
git add -A && git commit -m "feat: complete AcademicYear and SpecialRange management feature"
```
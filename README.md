# SIRA

Sistema Integral de Registro Académico — Fundación Universitaria de Popayán.

Gestión de usuarios, asignaturas, asistencia por QR, planificación académica y reportes en PDF.

## Stack

- **Frontend/Backend**: Next.js 16 (App Router + API Routes), React 19, TypeScript
- **Base de datos**: MongoDB vía Prisma 6
- **Auth**: NextAuth.js 4 (JWT, 30 días)
- **UI**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Email**: Nodemailer + React Email
- **Almacenamiento**: Vercel Blob
- **Caché**: Redis/Upstash (opcional)
- **Testing**: Jest + React Testing Library + Playwright

## Requisitos

- Node.js >= 18
- pnpm >= 10
- MongoDB (Atlas o local)

## Instalación

```bash
git clone https://github.com/Manuekle/sira.git
cd sira
pnpm install
```

### Variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores reales:

```env
DATABASE_URL=""              # MongoDB connection string
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""           # openssl rand -base64 32

BLOB_READ_WRITE_TOKEN=""     # Vercel Blob token

# SMTP (requerido para emails)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

# Redis/Upstash (opcional — la app funciona sin esto)
KV_REST_API_URL=""
KV_REST_API_TOKEN=""
```

### Base de datos y seed

```bash
pnpm prisma generate
pnpm prisma db push
pnpm seed
```

### Servidor de desarrollo

```bash
pnpm dev
```

## Usuarios de prueba

El seed crea 3 usuarios. Todos usan contraseña `password123`:

| Rol        | Email                    |
|------------|--------------------------|
| Admin      | admin@fup.edu.co         |
| Docente    | docente@fup.edu.co       |
| Estudiante | estudiante@fup.edu.co    |

> **Primer login:** Cualquier usuario creado por el admin debe cambiar su contraseña en el primer ingreso. El sistema bloquea el dashboard hasta que lo haga.

## Roles

| Rol        | Acceso |
|------------|--------|
| **ADMIN**  | Usuarios, asignaturas, grupos, salones, períodos, carga masiva CSV |
| **DOCENTE**| Clases, asistencia QR, bitácoras, reportes PDF, firma digital |
| **ESTUDIANTE** | Horario, historial de asistencia, justificar ausencias |

## Comandos

```bash
pnpm dev              # Servidor de desarrollo (Turbopack)
pnpm build            # Build de producción
pnpm type-check       # Verificar tipos TypeScript
pnpm format           # Formatear código con Prettier
pnpm seed             # Poblar base de datos con datos de prueba
```

## Testing

```bash
pnpm test             # Jest (95 tests unitarios)
pnpm test:watch       # Jest en modo watch
pnpm test:coverage    # Jest con cobertura
pnpm test:api         # Tests de API específicos
pnpm test:e2e         # Playwright E2E (requiere servidor corriendo)
pnpm test:e2e:ui      # Playwright con UI
pnpm test:all         # Jest + Playwright
```

## Arquitectura

```
app/
  api/
    admin/        # Endpoints solo admin
    docente/      # Endpoints docente
    estudiante/   # Endpoints estudiante
    auth/         # NextAuth + reset/cambio de contraseña
    asistencia/   # Escaneo QR
  dashboard/
    (roles)/
      admin/
      docente/
      estudiante/
  login/

components/
  admin/ docente/ estudiante/  # Componentes por dominio
  ui/                          # Primitivos shadcn/ui (no modificar)

lib/
  auth.ts           # Configuración NextAuth + Redis cache
  prisma.ts         # Cliente Prisma
  cache.ts          # Capa de caché con Redis
  time-utils.ts     # Cálculos de horarios
  class-converters.ts

prisma/
  schema.prisma     # Modelos: User, Group, Class, Attendance, etc.
  seed.ts           # Datos de prueba
```

### Patrón de API routes

Todas las rutas siguen el mismo patrón:
1. Validar sesión con `getServerSession(authOptions)`
2. Parsear body con esquema Zod (en `schema.ts` del mismo directorio)
3. Query Prisma
4. Devolver `{ data, message }` o `{ error }` con HTTP status

## Documentación adicional

Ver carpeta [`docs/`](./docs/):

- [`INSTALACION_CONFIGURACION.md`](./docs/INSTALACION_CONFIGURACION.md)
- [`ARQUITECTURA.md`](./docs/ARQUITECTURA.md)
- [`API_REFERENCE.md`](./docs/API_REFERENCE.md)
- [`SEGURIDAD.md`](./docs/SEGURIDAD.md)
- [`TESTING.md`](./docs/TESTING.md)
- [`DESPLIEGUE_MANTENIMIENTO.md`](./docs/DESPLIEGUE_MANTENIMIENTO.md)

## Licencia

Privado — propiedad de la Fundación Universitaria de Popayán.

# EduTrack

Sistema de gestión de asistencia inteligente para la Fundación Universitaria de la Popayán.

## 🚀 Características Principales

### 👥 **Gestión de Usuarios**

- ✅ Registro y autenticación de usuarios (Admin, Docente, Estudiante, Coordinador)
- ✅ Gestión de perfiles y permisos
- ✅ Carga masiva de usuarios desde archivos Excel/CSV
- ✅ Gestión de roles y permisos

### 📚 **Gestión de Asignaturas**

- ✅ Creación y edición de asignaturas
- ✅ Asignación de docentes a asignaturas
- ✅ Matriculación de estudiantes
- ✅ Carga masiva de asignaturas desde archivos Excel/CSV
- ✅ Gestión de clases y horarios

### 📊 **Control de Asistencia**

- ✅ Registro de asistencia mediante código QR
- ✅ Escaneo de QR en tiempo real
- ✅ Justificación de ausencias
- ✅ Reportes de asistencia
- ✅ Estadísticas de asistencia por estudiante y asignatura

### 📅 **Eventos y Calendario**

- ✅ Creación y gestión de eventos (exámenes, trabajos, fechas límite)
- ✅ Visualización de eventos en calendario
- ✅ Notificaciones de eventos próximos

### 📈 **Dashboard y Reportes**

- ✅ Dashboard personalizado por rol
- ✅ Estadísticas de asistencia
- ✅ Reportes de asistencia en PDF
- ✅ Gráficos y visualizaciones de datos

### 🔔 **Comunicaciones y Notificaciones**

- ✅ Envío de correos a cuentas institucionales y personales.

### 🏫 **Gestión de Aulas y Recursos**

- ✅ Gestión de aulas y recursos
- ✅ Asignación de recursos a clases

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: MongoDB (con Prisma)
- **Autenticación**: NextAuth.js
- **UI Components**: Radix UI, shadcn/ui
- **Formularios**: React Hook Form, Zod
- **Estado**: React Query (TanStack Query)
- **Testing**: Jest, React Testing Library, Playwright
- **Estilos**: Tailwind CSS
- **Email**: Nodemailer, React Email
- **Almacenamiento**: Vercel Blob Storage
- **PDF**: @react-pdf/renderer
- **QR Codes**: qrcode.react
- **Caché**: Redis (Upstash)

## 📦 Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd edutrack
```

2. Instalar dependencias:
```bash
pnpm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Configurar la base de datos:
```bash
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
```

5. Ejecutar el servidor de desarrollo:
```bash
pnpm dev
```

## 🧪 Testing

### Tests Unitarios
```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Tests E2E con Playwright
```bash
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
```

### Ejecutar todos los tests
```bash
pnpm test:all
```

## 📝 Scripts Disponibles

- `pnpm dev` - Inicia el servidor de desarrollo
- `pnpm build` - Construye la aplicación para producción
- `pnpm start` - Inicia el servidor de producción
- `pnpm lint` - Ejecuta el linter
- `pnpm type-check` - Verifica los tipos de TypeScript
- `pnpm test` - Ejecuta tests unitarios
- `pnpm test:e2e` - Ejecuta tests E2E
- `pnpm test:all` - Ejecuta todos los tests

## 🔧 Configuración

### Variables de Entorno

Ver [Documentación de Variables de Entorno](./docs/ENV_VARIABLES.md) para más detalles.

### Redis (Opcional)

Para usar caché con Redis:
1. Configurar `KV_REST_API_URL` y `KV_REST_API_TOKEN` en `.env`
2. La aplicación funciona sin Redis, pero sin caché

## 📚 Documentación

- [README de Documentación](./docs/README.md)
- [Estado del Proyecto](./docs/06_PROJECT_STATUS.md)
- [Lista de Verificación](./docs/07_COMPLETION_CHECKLIST.md)
- [Resumen de Tareas Pendientes](./docs/08_PENDING_TASKS_SUMMARY.md)
- [Optimizaciones](./docs/05_OPTIMIZATIONS.md)

## 🚧 Estado del Proyecto

### ✅ Completado (95%)

- Gestión de usuarios y asignaturas
- Control de asistencia con QR
- Dashboard y reportes
- Sistema de eventos
- Notificaciones por email
- Carga masiva de datos (Excel/CSV)
- Optimizaciones de rendimiento
- Migración a React Query (30% - hooks creados, componentes migrados)
- Migración de formularios a react-hook-form (100%)
- Tests unitarios (53+ tests pasando)
- Tests de APIs con mocks completos (Prisma, Next.js, NextAuth)
- Tests E2E con Playwright (flujos principales configurados)

### 🚧 Funcionalidades en Desarrollo

- Notificaciones por email (parcialmente implementado - 60%)
- Testing automatizado completo (31 tests unitarios, tests E2E configurados)
- React Query para caché del lado del cliente (30% - hooks creados, falta migrar más componentes)
- Migración de formularios a react-hook-form (100% - completado)

### ⏳ Funcionalidades Pendientes

- Integración con WhatsApp Business
- Panel de gestión de suscripciones de notificaciones
- Integración con calendario Outlook
- Módulo de backup automático
- Autenticación de dos factores (2FA)
- API pública documentada
- Webhooks y auditoría de acciones
- WebSockets/Server-Sent Events para actualizaciones en tiempo real
- Mejoras de UX/UI (animaciones, accesibilidad, i18n)

Ver [Estado del Proyecto](./docs/06_PROJECT_STATUS.md) para más detalles sobre lo que falta para completar el proyecto al 100%.
Ver [Resumen de Tareas Pendientes](./docs/08_PENDING_TASKS_SUMMARY.md) para más detalles sobre lo que falta para completar el proyecto al 100%.

## 📄 Licencia

Este proyecto es privado y propiedad de la Fundación Universitaria de la Popayán.

## 👥 Contribuidores

- Equipo de desarrollo EduTrack

# Documentación Técnica - Sistema de Gestión Académica

Bienvenido a la documentación técnica completa del **Sistema de Gestión Académica** (SIRA). Esta documentación está diseñada para desarrolladores, arquitectos y personal técnico que trabaja con la aplicación.

🚀 **¿NUEVO EN EL PROYECTO?** → Comienza con [INDICE_RAPIDO.md](./INDICE_RAPIDO.md)

---

## 📑 Índice de Documentación

### 0. **[INDICE_RAPIDO.md](./INDICE_RAPIDO.md)** - Encuentra lo que Necesitas Rápido
   - Índice por rol
   - Búsqueda por palabra clave
   - Rutas de aprendizaje
   - Preguntas comunes

   **Para quién:** Todos (especialmente nuevos desarrolladores)
   **Tiempo de lectura:** 5 minutos

---

### 1. **[ARQUITECTURA.md](./ARQUITECTURA.md)** - Diseño General del Sistema
   - Requerimientos funcionales (15 HUs)
   - Atributos de calidad
   - Diagramas de flujo (Mermaid)
   - Arquitectura de capas
   - Endpoints de API por rol
   - Reglas de negocio
   - Diagramas de casos de uso, componentes y clases
   - Diseño de base de datos
   - Enums del sistema

   **Para quién:** Arquitectos, Lead Engineers, Nuevos desarrolladores
   **Tiempo de lectura:** 30 minutos

---

### 2. **[GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md)** - Estándares y Patrones de Código
   - Configuración del entorno de desarrollo
   - Estructura de carpetas
   - Patrones de desarrollo (API, componentes, React Query)
   - Convenciones de código
   - Testing (Unit, Integration, E2E)
   - Comandos comunes
   - Git workflow
   - Debugging

   **Para quién:** Todos los desarrolladores
   **Tiempo de lectura:** 45 minutos

---

### 3. **[INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md)** - Setup del Proyecto
   - Requisitos del sistema
   - Instalación paso a paso
   - Configuración de base de datos (PostgreSQL)
   - Variables de entorno
   - Prisma ORM
   - Integración con servicios externos (Supabase)
   - Verificación de instalación
   - Solución de problemas

   **Para quién:** Nuevos desarrolladores, DevOps
   **Tiempo de lectura:** 20 minutos

---

### 4. **[TESTING.md](./TESTING.md)** - Estrategia de Testing
   - Unit testing con Jest
   - Integration testing
   - E2E testing con Playwright
   - Cobertura de código
   - Best practices
   - CI/CD testing
   - Debugging de tests

   **Para quién:** QA Engineers, Desarrolladores
   **Tiempo de lectura:** 40 minutos

---

### 5. **[SEGURIDAD.md](./SEGURIDAD.md)** - Seguridad y Protección
   - Principios de seguridad
   - OWASP Top 10 mitigations
   - Autenticación y autorización (JWT, RBAC)
   - Protección de datos (hashing, encriptación)
   - Prevención de ataques (SQL Injection, XSS, CSRF)
   - Logging y auditoría
   - Secrets management
   - Compliance (GDPR)

   **Para quién:** Security Engineers, Líder técnico
   **Tiempo de lectura:** 35 minutos

---

### 6. **[DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md)** - Producción y Operaciones
   - Opciones de despliegue (Vercel, Railway, AWS)
   - Despliegue en Vercel (recomendado)
   - Variables de entorno en producción
   - Proceso de despliegue paso a paso
   - Monitoreo y observabilidad (Sentry)
   - Backups y recuperación
   - Mantenimiento preventivo
   - Plan de desastre
   - Checklist de despliegue

   **Para quién:** DevOps, Release Managers, Sysadmins
   **Tiempo de lectura:** 50 minutos

---

### 7. **[DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md)** - Esquema y Diagramas SQL
   - Diagrama Entidad-Relación (ER) completo
   - Esquema SQL de 9 tablas principales
   - Índices y optimización
   - Vistas SQL útiles para reporting
   - Consultas de análisis y mantenimiento
   - Diagrama de flujo de datos
   - Scripts de backup y recovery
   - Estadísticas y crecimiento de tablas

   **Para quién:** DBAs, Desarrolladores Backend, Arquitectos
   **Tiempo de lectura:** 30 minutos

---

### 8. **[API_REFERENCE.md](./API_REFERENCE.md)** - Documentación Completa de Endpoints
   - 25+ endpoints detallados con ejemplos
   - Endpoints por rol: Admin, Docente, Estudiante
   - Request y response completos con JSON
   - Códigos de error y manejo
   - Rate limiting
   - Paginación
   - Ejemplos con cURL
   - Headers requeridos

   **Para quién:** Desarrolladores Frontend, Mobile, Integradores
   **Tiempo de lectura:** 60 minutos

---

### 9. **[METODOLOGIA_XP.md](./METODOLOGIA_XP.md)** - Extreme Programming (XP) Practices
   - Valores fundamentales de XP
   - User Stories (HU como narrativas)
   - Test-Driven Development (TDD)
   - Pair Programming guidelines
   - Definition of Ready (DoR)
   - Definition of Done (DoD)
   - Continuous Integration (CI/CD)
   - Refactoring continuo
   - Daily Standups y Retros
   - Code Review process
   - Planning & Velocidad
   - Métricas XP
   - Kanban board

   **Para quién:** Todo el equipo (especialmente Tech Lead y Scrum Master)
   **Tiempo de lectura:** 45 minutos

---

## 🚀 Inicio Rápido

### Para Nuevos Desarrolladores

1. **Día 1:**
   - Leer [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md) - Setup
   - Ejecutar `bun install && bun run seed`
   - Acceder a http://localhost:3000

2. **Día 2:**
   - Leer [ARQUITECTURA.md](./ARQUITECTURA.md) - Entender la estructura
   - Revisar [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md) - Entender la BD
   - Explorar `/app/api` y `/components`

3. **Día 3:**
   - Leer [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md) - Patrones
   - Consultar [API_REFERENCE.md](./API_REFERENCE.md) para ver endpoints
   - Crear tu primer endpoint

4. **Semana 1:**
   - Leer [TESTING.md](./TESTING.md)
   - Leer [SEGURIDAD.md](./SEGURIDAD.md)
   - Comenzar a contribuir

### Para Desarrolladores Frontend/Mobile

1. Revisar [API_REFERENCE.md](./API_REFERENCE.md) - Todos los endpoints
2. Consultar [ARQUITECTURA.md](./ARQUITECTURA.md) - Entender modelos
3. Seguir ejemplos de requests y responses

### Para DBAs/Backend

1. Revisar [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md) - Esquema completo
2. Leer [ARQUITECTURA.md](./ARQUITECTURA.md) - Capa de datos
3. Revisar vistas SQL y consultas de reporting

### Para DevOps/Sysadmins

1. Leer [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md)
2. Revisar [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md) - Backups
3. Configurar CI/CD
4. Configurar monitoreo

---

## 🔗 Acceso Rápido a Documentos

**Por Rol:**
- 👨‍💼 **Admin/Arquitecto:** [METODOLOGIA_XP.md](./METODOLOGIA_XP.md) → [ARQUITECTURA.md](./ARQUITECTURA.md) → [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md)
- 👨‍💻 **Desarrollador Backend:** [METODOLOGIA_XP.md](./METODOLOGIA_XP.md) → [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md) → [API_REFERENCE.md](./API_REFERENCE.md)
- 🌐 **Desarrollador Frontend:** [METODOLOGIA_XP.md](./METODOLOGIA_XP.md) → [API_REFERENCE.md](./API_REFERENCE.md) → [ARQUITECTURA.md](./ARQUITECTURA.md#diagramas-de-componentes)
- 🔐 **Security Engineer:** [METODOLOGIA_XP.md](./METODOLOGIA_XP.md) → [SEGURIDAD.md](./SEGURIDAD.md) → [API_REFERENCE.md](./API_REFERENCE.md#códigos-de-error)
- 🚀 **DevOps/SRE:** [METODOLOGIA_XP.md](./METODOLOGIA_XP.md) → [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md) → [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md#backup-y-recovery)
- ✅ **QA/Tester:** [METODOLOGIA_XP.md](./METODOLOGIA_XP.md) → [TESTING.md](./TESTING.md) → [API_REFERENCE.md](./API_REFERENCE.md)
- 🎯 **Scrum Master/Tech Lead:** [METODOLOGIA_XP.md](./METODOLOGIA_XP.md) → [ARQUITECTURA.md](./ARQUITECTURA.md) → [TESTING.md](./TESTING.md)

---

## 🏗️ Estructura del Proyecto

```
sira/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── admin/           # Endpoints Admin
│   │   ├── docente/         # Endpoints Docente
│   │   ├── estudiante/      # Endpoints Estudiante
│   │   └── auth/            # Autenticación
│   └── dashboard/           # UI Pages
├── components/              # React Components
│   ├── ui/                  # shadcn/ui
│   ├── admin/
│   ├── docente/
│   └── estudiante/
├── hooks/                   # Custom React Hooks
├── lib/                     # Utilities y Services
│   ├── auth.ts              # NextAuth config
│   ├── db.ts                # Prisma client
│   ├── validators.ts        # Zod schemas
│   └── ...
├── prisma/                  # ORM Schema
│   ├── schema.prisma
│   └── seed.ts
├── tests/                   # Test Suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                    # Documentación (este directorio)
│   ├── ARQUITECTURA.md
│   ├── GUIAS_DESARROLLO.md
│   ├── INSTALACION_CONFIGURACION.md
│   ├── TESTING.md
│   ├── SEGURIDAD.md
│   ├── DESPLIEGUE_MANTENIMIENTO.md
│   └── README.md
└── package.json
```

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---|---|
| **Stack Principal** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **Backend Runtime** | Bun |
| **Base de Datos** | PostgreSQL 14+ |
| **ORM** | Prisma 6 |
| **Autenticación** | NextAuth.js + Supabase |
| **Endpoints API** | 25+ endpoints documentados |
| **Roles de Usuario** | 3 (Admin, Docente, Estudiante) |
| **Historias de Usuario** | 15 HUs |
| **Entidades de BD** | 9 tablas principales |
| **Vistas SQL** | 3 vistas de reporting |
| **Cobertura de Código** | >75% |
| **Package Manager** | Bun |
| **Páginas de Documentación** | 9 documentos |
| **Ejemplos de API** | 40+ ejemplos con cURL |
| **Total de líneas de docs** | 6000+ |
| **Diagramas incluidos** | 10+ Mermaid |

---

## 🔑 Conceptos Clave

### Roles de Usuario
- **ADMIN** - Gestiona usuarios, asignaturas y reportes globales
- **DOCENTE** - Crea clases, registra asistencia, genera reportes
- **ESTUDIANTE** - Consulta asistencia, asignaturas, calificaciones

### Entidades Principales
- **User** - Usuario del sistema (con rol específico)
- **Docente** - Extiende User, tiene asignaturas
- **Estudiante** - Extiende User, tiene matrículas
- **Subject** - Asignatura impartida por docente
- **Class** - Clase individual (sesión de asignatura)
- **Attendance** - Registro de asistencia de estudiante
- **Enrollment** - Matrícula de estudiante en asignatura

### Enums Principales
```typescript
RoleEnum: ADMIN | DOCENTE | ESTUDIANTE
AttendanceStatus: PRESENTE | AUSENTE | TARDE | JUSTIFICADO
ClassStatus: PROGRAMADA | EN_PROGRESO | FINALIZADA | CANCELADA
```

---

## 🛠️ Comandos Rápidos

```bash
# Desarrollo
bun run dev              # Iniciar servidor
bun run build            # Build producción
bun run type-check       # Verificar tipos

# Base de Datos
bun run prisma studio   # GUI para explorar BD
bun run seed            # Seedear datos iniciales
bun run prisma db push  # Aplicar schema

# Testing
bun run test            # Unit tests
bun run test:watch      # Watch mode
bun run test:e2e        # E2E tests

# Linting
bun run lint            # ESLint
bun run format          # Prettier
```

---

## 📚 Recursos Externos

### Documentación Oficial
- [Next.js 16](https://nextjs.org/docs)
- [React 19](https://react.dev)
- [Prisma](https://www.prisma.io/docs)
- [Bun](https://bun.sh/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Supabase](https://supabase.com/docs)

### Seguridad
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

### Testing
- [Jest](https://jestjs.io/)
- [Playwright](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/)

---

## 🗺️ Mapa de Temas

### Metodología XP
- **Guía completa XP:** [METODOLOGIA_XP.md](./METODOLOGIA_XP.md)
- **User Stories:** [METODOLOGIA_XP.md#2-user-stories-requerimientos-como-historias](./METODOLOGIA_XP.md#2-user-stories-requerimientos-como-historias)
- **TDD (Test-Driven Development):** [METODOLOGIA_XP.md#3-test-driven-development-tdd](./METODOLOGIA_XP.md#3-test-driven-development-tdd) y [GUIAS_DESARROLLO.md#30-test-driven-development-tdd](./GUIAS_DESARROLLO.md#30-test-driven-development-tdd)
- **Pair Programming:** [METODOLOGIA_XP.md#4-pair-programming](./METODOLOGIA_XP.md#4-pair-programming) y [GUIAS_DESARROLLO.md#31-pair-programming-guidelines](./GUIAS_DESARROLLO.md#31-pair-programming-guidelines)
- **Definition of Ready:** [METODOLOGIA_XP.md#5-definition-of-ready-dor](./METODOLOGIA_XP.md#5-definition-of-ready-dor)
- **Definition of Done:** [METODOLOGIA_XP.md#6-definition-of-done-dod](./METODOLOGIA_XP.md#6-definition-of-done-dod) y [TESTING.md#11-definition-of-done-dod](./TESTING.md#11-definition-of-done-dod)
- **Continuous Integration:** [METODOLOGIA_XP.md#7-integración-continua-ci](./METODOLOGIA_XP.md#7-integración-continua-ci) y [DESPLIEGUE_MANTENIMIENTO.md#50-pipeline-cicd-xp](./DESPLIEGUE_MANTENIMIENTO.md#50-pipeline-cicd-xp)
- **Code Review:** [METODOLOGIA_XP.md#11-code-review-xp](./METODOLOGIA_XP.md#11-code-review-xp)
- **Retrospectivas:** [METODOLOGIA_XP.md#13-retrospectivas-xp](./METODOLOGIA_XP.md#13-retrospectivas-xp)
- **Métricas XP:** [METODOLOGIA_XP.md#14-métricas-xp-importantes](./METODOLOGIA_XP.md#14-métricas-xp-importantes)

### Aprendizaje y Conceptos
- **Entender la arquitectura:** [ARQUITECTURA.md](./ARQUITECTURA.md#arquitectura-del-sistema)
- **Modelos de datos:** [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md)
- **Flujos de negocio:** [ARQUITECTURA.md](./ARQUITECTURA.md#flujos-de-procesos-de-la-lógica-de-negocio)
- **Reglas de negocio:** [ARQUITECTURA.md](./ARQUITECTURA.md#reglas-de-negocio)

### Desarrollo
- **Crear endpoints:** [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md#31-crear-un-nuevo-endpoint-api)
- **Crear componentes:** [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md#32-crear-un-nuevo-componente-react)
- **Patrones de código:** [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md#3-patrones-de-desarrollo)
- **Convenciones:** [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md#4-convenciones-de-código)

### Integración API
- **Todos los endpoints:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Admin endpoints:** [API_REFERENCE.md](./API_REFERENCE.md#admin-endpoints)
- **Docente endpoints:** [API_REFERENCE.md](./API_REFERENCE.md#docente-endpoints)
- **Estudiante endpoints:** [API_REFERENCE.md](./API_REFERENCE.md#estudiante-endpoints)
- **Autenticación:** [API_REFERENCE.md](./API_REFERENCE.md#autenticación)

### Seguridad
- **Guía de seguridad:** [SEGURIDAD.md](./SEGURIDAD.md)
- **Autenticación JWT:** [SEGURIDAD.md](./SEGURIDAD.md#22-jwt-configuration)
- **RBAC:** [SEGURIDAD.md](./SEGURIDAD.md#23-role-based-access-control-rbac)
- **Protección de datos:** [SEGURIDAD.md](./SEGURIDAD.md#3-protección-de-datos)

### Testing
- **Estrategia de testing:** [TESTING.md](./TESTING.md#1-estrategia-de-testing)
- **Unit tests:** [TESTING.md](./TESTING.md#2-unit-testing-jest)
- **E2E tests:** [TESTING.md](./TESTING.md#4-e2e-testing-playwright)
- **Cobertura:** [TESTING.md](./TESTING.md#5-cobertura-de-testing)

### Base de Datos
- **Esquema SQL:** [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md#2-esquema-sql-completo)
- **ER Diagram:** [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md#1-diagrama-entidad-relación-er)
- **Vistas de reporting:** [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md#3-vistas-sql-útiles)
- **Backups:** [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md#8-backup-y-recovery)

### Despliegue y Operaciones
- **Guía de despliegue:** [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md)
- **Despliegue en Vercel:** [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md#2-despliegue-en-vercel-recomendado)
- **Monitoreo:** [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md#6-monitoreo-y-observabilidad)
- **Plan de desastre:** [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md#9-plan-de-desastre)

### Instalación
- **Setup completo:** [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md)
- **Variables de entorno:** [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md#4-variables-de-entorno)
- **Troubleshooting:** [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md#10-solución-de-problemas)

---

## 🤝 Contribuir

### Antes de hacer cambios
1. Leer la documentación relevante
2. Crear una rama: `git checkout -b feature/RF-XXX-descripcion`
3. Seguir convenciones en [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md)

### Al hacer commit
```bash
# Formato: <tipo>(<scope>): <descripción>
git commit -m "feat(docente): Implementar registro de asistencia por QR"
```

### Antes de hacer PR
- ✅ Tests pasan: `bun run test:all`
- ✅ Build exitoso: `bun run build`
- ✅ Tipos correctos: `bun run type-check`
- ✅ Código formateado: `bun run format`

---

## 📞 Soporte

### Reportar Problemas
1. Verificar documentación relevante
2. Buscar en issues existentes
3. Crear issue con:
   - Descripción clara
   - Pasos para reproducir
   - Logs/screenshots
   - Entorno (OS, versiones)

### Preguntas Frecuentes

**P: ¿Cómo resetear la BD?**
```bash
bun run prisma migrate reset
bun run seed
```

**P: ¿Cómo generar un nuevo QR?**
```typescript
// Ver: ARQUITECTURA.md → Reglas de Negocio → RN-10
```

**P: ¿Cómo cambiar el puerto de desarrollo?**
```bash
bun run dev -- -p 3001
```

---

## 📝 Notas Importantes

### Seguridad
- ⚠️ **NUNCA** commitear `.env` con secrets
- ⚠️ Usar `bcryptjs` para contraseñas
- ⚠️ Validar entrada con Zod
- ⚠️ Verificar sesión en cada endpoint protegido

### Performance
- 📈 Usar React Query para caching
- 📈 Lazy load componentes
- 📈 Optimizar queries con índices
- 📈 Usar ISR en Next.js cuando sea posible

### Mantenibilidad
- 📋 Documentar funciones complejas
- 📋 Mantener tests actualizados
- 📋 Refactorizar con propósito
- 📋 Revisar código antes de merge

---

## 🔄 Historial de Documentación

| Versión | Fecha | Cambios |
|---|---|---|
| 1.2 | 2026-03-13 | Agregados: DIAGRAMA_BASE_DATOS.md, API_REFERENCE.md, README mejorado |
| 1.1 | 2026-03-13 | Documentación de seguridad, testing y despliegue completada |
| 1.0 | 2026-03-13 | Documentación inicial: Arquitectura, Guías y Instalación |

---

## ✅ Checklist Para Nuevas Contribuciones

- ✅ Leer documentación relevante
- ✅ Seguir patrones existentes
- ✅ Escribir tests
- ✅ Documentar cambios
- ✅ Pasar linting y tests
- ✅ Actualizar docs si aplica

---

**Última actualización:** 2026-03-13
**Mantenido por:** Development Team
**Estado:** Activo y en Desarrollo

---

## 📧 Contacto

Para preguntas sobre documentación:
1. Revisar los documentos
2. Buscar en issues/discussions
3. Contactar al team lead

**¡Gracias por contribuir al proyecto!**

---

## 📚 Resumen Visual de Documentación

```
docs/
├── 📋 README.md (este archivo - índice principal)
├── ⚡ INDICE_RAPIDO.md (búsqueda rápida)
├── 🎯 METODOLOGIA_XP.md (Extreme Programming)
│   ├── User Stories
│   ├── TDD
│   ├── Pair Programming
│   ├── DoR & DoD
│   ├── CI/CD
│   └── Retrospectivas
├── 🏗️  ARQUITECTURA.md
│   ├── Requerimientos funcionales (15 HUs)
│   ├── Atributos de calidad
│   ├── Diagramas Mermaid (5)
│   ├── Arquitectura en capas
│   ├── 25+ endpoints
│   ├── 10 reglas de negocio
│   └── Diseño de BD
├── 💻 GUIAS_DESARROLLO.md
│   ├── Configuración entorno
│   ├── Patrones de código
│   ├── Convenciones
│   ├── Testing
│   └── Git workflow
├── 🔧 INSTALACION_CONFIGURACION.md
│   ├── Instalación paso a paso
│   ├── Configuración BD
│   ├── Variables de entorno
│   ├── Integración Supabase
│   └── Troubleshooting
├── ✅ TESTING.md
│   ├── Jest (Unit)
│   ├── Playwright (E2E)
│   ├── 40+ ejemplos
│   └── Cobertura
├── 🔐 SEGURIDAD.md
│   ├── OWASP Top 10
│   ├── JWT + RBAC
│   ├── Protección de datos
│   ├── Auditoría
│   └── Compliance
├── 🚀 DESPLIEGUE_MANTENIMIENTO.md
│   ├── Vercel, Railway, AWS
│   ├── CI/CD
│   ├── Monitoreo
│   ├── Backups
│   └── Plan de desastre
├── 🗄️  DIAGRAMA_BASE_DATOS.md
│   ├── ER Diagram
│   ├── 9 tablas SQL
│   ├── Índices
│   ├── 3 vistas
│   └── Scripts backup/recovery
└── 📡 API_REFERENCE.md
    ├── 25+ endpoints
    ├── Auth + Admin + Docente + Estudiante
    ├── 40+ ejemplos cURL
    ├── Códigos de error
    └── Rate limiting
```

**Total:** 9 documentos, 6000+ líneas, 10+ diagramas Mermaid, 90+ ejemplos de código

---

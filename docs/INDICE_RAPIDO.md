# Índice Rápido de Documentación

**Encuentra rápidamente lo que necesitas**

---

## 🎯 Busco...

### Entender XP y prácticas ágiles
→ [METODOLOGIA_XP.md](./METODOLOGIA_XP.md) → Toda la guía

### Aprender TDD (Test-Driven Development)
→ [METODOLOGIA_XP.md#3-test-driven-development-tdd](./METODOLOGIA_XP.md#3-test-driven-development-tdd) O [GUIAS_DESARROLLO.md#30-test-driven-development-tdd](./GUIAS_DESARROLLO.md#30-test-driven-development-tdd)

### Configurar Pair Programming
→ [METODOLOGIA_XP.md#4-pair-programming](./METODOLOGIA_XP.md#4-pair-programming)

### Definition of Ready (DoR) para una HU
→ [METODOLOGIA_XP.md#5-definition-of-ready-dor](./METODOLOGIA_XP.md#5-definition-of-ready-dor)

### Definition of Done (DoD)
→ [METODOLOGIA_XP.md#6-definition-of-done-dod](./METODOLOGIA_XP.md#6-definition-of-done-dod)

### Entender cómo funciona el sistema
→ [ARQUITECTURA.md](./ARQUITECTURA.md) → Sección "Arquitectura del Sistema"

### Configurar mi entorno de desarrollo
→ [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md) → Sección "Instalación Paso a Paso"

### Crear un nuevo endpoint API
→ [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md#31-crear-un-nuevo-endpoint-api)

### Crear un componente React
→ [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md#32-crear-un-nuevo-componente-react)

### Ver todos los endpoints de la API
→ [API_REFERENCE.md](./API_REFERENCE.md)

### Entender el modelo de datos
→ [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md#1-diagrama-entidad-relación-er)

### Escribir tests para mi código
→ [TESTING.md](./TESTING.md)

### Asegurar que mi código es seguro
→ [SEGURIDAD.md](./SEGURIDAD.md)

### Desplegar la aplicación a producción
→ [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md)

### Resolver un problema específico
→ Usa Ctrl+F en los documentos para buscar keywords

---

## 📖 Documentos por Rol

### 👨‍💻 Desarrollador Backend
1. Lee [ARQUITECTURA.md](./ARQUITECTURA.md) (30 min)
2. Lee [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md) (45 min)
3. Consulta [API_REFERENCE.md](./API_REFERENCE.md) (30 min)
4. Lee [TESTING.md](./TESTING.md) (40 min)
5. Lee [SEGURIDAD.md](./SEGURIDAD.md) (35 min)

**Tiempo total:** ~3 horas

### 🌐 Desarrollador Frontend/Mobile
1. Consulta [API_REFERENCE.md](./API_REFERENCE.md) (30 min)
2. Lee [ARQUITECTURA.md](./ARQUITECTURA.md#1-requerimientos-funcionales) (15 min)
3. Lee [ARQUITECTURA.md](./ARQUITECTURA.md#7-actores-y-funcionalidades-principales) (10 min)

**Tiempo total:** ~1 hora

### 🔒 Security Engineer
1. Lee [SEGURIDAD.md](./SEGURIDAD.md) (35 min)
2. Revisa [API_REFERENCE.md](./API_REFERENCE.md#códigos-de-error) (15 min)
3. Revisa [ARQUITECTURA.md](./ARQUITECTURA.md#41-capa-de-presentación-frontend) (10 min)

**Tiempo total:** ~1 hora

### 🚀 DevOps Engineer
1. Lee [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md) (50 min)
2. Consulta [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md#8-backup-y-recovery) (10 min)
3. Revisa [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md#4-variables-de-entorno) (15 min)

**Tiempo total:** ~1.5 horas

### 🗄️ Database Administrator
1. Revisa [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md) (30 min)
2. Consulta [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md#8-mantenimiento-preventivo) (15 min)
3. Revisa [ARQUITECTURA.md](./ARQUITECTURA.md#5-capa-de-acceso-a-datos) (10 min)

**Tiempo total:** ~1 hora

### ✅ QA/Tester
1. Lee [TESTING.md](./TESTING.md) (40 min)
2. Consulta [API_REFERENCE.md](./API_REFERENCE.md) (30 min)
3. Revisa [ARQUITECTURA.md](./ARQUITECTURA.md#1-requerimientos-funcionales) (15 min)

**Tiempo total:** ~1.5 horas

### 👨‍💼 Project Manager / Tech Lead
1. Revisa [ARQUITECTURA.md](./ARQUITECTURA.md) (30 min)
2. Revisa [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md#10-checklist-de-despliegue) (10 min)
3. Revisa este documento (5 min)

**Tiempo total:** ~45 min

---

## 🔍 Búsqueda por Palabra Clave

### Authentication / Autenticación
- JWT Configuration: [SEGURIDAD.md#22-jwt-configuration](./SEGURIDAD.md#22-jwt-configuration)
- Login Endpoint: [API_REFERENCE.md#post-apiauthlogin](./API_REFERENCE.md#post-apiauthlogin)
- NextAuth Setup: [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md#23-verificación-de-sesión-en-endpoints)

### Database / Base de Datos
- Schema: [DIAGRAMA_BASE_DATOS.md#2-esquema-sql-completo](./DIAGRAMA_BASE_DATOS.md#2-esquema-sql-completo)
- ER Diagram: [DIAGRAMA_BASE_DATOS.md#1-diagrama-entidad-relación-er](./DIAGRAMA_BASE_DATOS.md#1-diagrama-entidad-relación-er)
- Migrations: [INSTALACION_CONFIGURACION.md#5-configuración-de-prisma](./INSTALACION_CONFIGURACION.md#5-configuración-de-prisma)
- Views: [DIAGRAMA_BASE_DATOS.md#3-vistas-sql-útiles](./DIAGRAMA_BASE_DATOS.md#3-vistas-sql-útiles)

### API / Endpoints
- All Endpoints: [API_REFERENCE.md](./API_REFERENCE.md)
- Admin Endpoints: [API_REFERENCE.md#admin-endpoints](./API_REFERENCE.md#admin-endpoints)
- Docente Endpoints: [API_REFERENCE.md#docente-endpoints](./API_REFERENCE.md#docente-endpoints)
- Estudiante Endpoints: [API_REFERENCE.md#estudiante-endpoints](./API_REFERENCE.md#estudiante-endpoints)
- Error Codes: [API_REFERENCE.md#códigos-de-error](./API_REFERENCE.md#códigos-de-error)

### Testing / Pruebas
- Unit Tests: [TESTING.md#2-unit-testing-jest](./TESTING.md#2-unit-testing-jest)
- Integration Tests: [TESTING.md#3-integration-testing](./TESTING.md#3-integration-testing)
- E2E Tests: [TESTING.md#4-e2e-testing-playwright](./TESTING.md#4-e2e-testing-playwright)
- Coverage: [TESTING.md#5-cobertura-de-testing](./TESTING.md#5-cobertura-de-testing)
- Examples: [TESTING.md#22-api-tests](./TESTING.md#22-api-tests)

### Security / Seguridad
- OWASP: [SEGURIDAD.md#12-owasp-top-10](./SEGURIDAD.md#12-owasp-top-10)
- SQL Injection Prevention: [SEGURIDAD.md#51-sql-injection](./SEGURIDAD.md#51-sql-injection)
- XSS Prevention: [SEGURIDAD.md#52-cross-site-scripting-xss](./SEGURIDAD.md#52-cross-site-scripting-xss)
- CSRF Protection: [SEGURIDAD.md#53-cross-site-request-forgery-csrf](./SEGURIDAD.md#53-cross-site-request-forgery-csrf)
- Rate Limiting: [SEGURIDAD.md#54-rate-limiting](./SEGURIDAD.md#54-rate-limiting)
- Secrets Management: [SEGURIDAD.md#7-secrets-management](./SEGURIDAD.md#7-secrets-management)

### Deployment / Despliegue
- Vercel: [DESPLIEGUE_MANTENIMIENTO.md#2-despliegue-en-vercel-recomendado](./DESPLIEGUE_MANTENIMIENTO.md#2-despliegue-en-vercel-recomendado)
- Railway: [DESPLIEGUE_MANTENIMIENTO.md#3-despliegue-en-railway](./DESPLIEGUE_MANTENIMIENTO.md#3-despliegue-en-railway)
- CI/CD: [DESPLIEGUE_MANTENIMIENTO.md#5-proceso-de-despliegue](./DESPLIEGUE_MANTENIMIENTO.md#5-proceso-de-despliegue)
- Monitoring: [DESPLIEGUE_MANTENIMIENTO.md#6-monitoreo-y-observabilidad](./DESPLIEGUE_MANTENIMIENTO.md#6-monitoreo-y-observabilidad)
- Backups: [DESPLIEGUE_MANTENIMIENTO.md#7-backups-y-recuperación](./DESPLIEGUE_MANTENIMIENTO.md#7-backups-y-recuperación)
- Disaster Recovery: [DESPLIEGUE_MANTENIMIENTO.md#9-plan-de-desastre](./DESPLIEGUE_MANTENIMIENTO.md#9-plan-de-desastre)

### Development / Desarrollo
- Creating Endpoints: [GUIAS_DESARROLLO.md#31-crear-un-nuevo-endpoint-api](./GUIAS_DESARROLLO.md#31-crear-un-nuevo-endpoint-api)
- Creating Components: [GUIAS_DESARROLLO.md#32-crear-un-nuevo-componente-react](./GUIAS_DESARROLLO.md#32-crear-un-nuevo-componente-react)
- React Query: [GUIAS_DESARROLLO.md#33-usar-react-query-para-fetching](./GUIAS_DESARROLLO.md#33-usar-react-query-para-fetching)
- Code Conventions: [GUIAS_DESARROLLO.md#4-convenciones-de-código](./GUIAS_DESARROLLO.md#4-convenciones-de-código)
- Commands: [GUIAS_DESARROLLO.md#6-comandos-comunes](./GUIAS_DESARROLLO.md#6-comandos-comunes)
- Git Workflow: [GUIAS_DESARROLLO.md#7-git-workflow](./GUIAS_DESARROLLO.md#7-git-workflow)

### Installation / Instalación
- Setup: [INSTALACION_CONFIGURACION.md#2-instalación-paso-a-paso](./INSTALACION_CONFIGURACION.md#2-instalación-paso-a-paso)
- Database: [INSTALACION_CONFIGURACION.md#3-configuración-de-base-de-datos](./INSTALACION_CONFIGURACION.md#3-configuración-de-base-de-datos)
- Environment: [INSTALACION_CONFIGURACION.md#4-variables-de-entorno](./INSTALACION_CONFIGURACION.md#4-variables-de-entorno)
- Supabase: [INSTALACION_CONFIGURACION.md#61-supabase-auth](./INSTALACION_CONFIGURACION.md#61-supabase-auth)
- Email: [INSTALACION_CONFIGURACION.md#62-configuración-de-email-gmail](./INSTALACION_CONFIGURACION.md#62-configuración-de-email-gmail)
- Troubleshooting: [INSTALACION_CONFIGURACION.md#10-solución-de-problemas](./INSTALACION_CONFIGURACION.md#10-solución-de-problemas)

---

## 🎓 Rutas de Aprendizaje

### 🟢 Ruta Rápida (2 horas)
1. [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md#2-instalación-paso-a-paso) - Setup (20 min)
2. [ARQUITECTURA.md](./ARQUITECTURA.md#requerimientos-funcionales) - Requisitos (20 min)
3. [ARQUITECTURA.md](./ARQUITECTURA.md#actores-y-funcionalidades-principales) - Actores (10 min)
4. [API_REFERENCE.md](./API_REFERENCE.md#autenticación) - Endpoints básicos (40 min)
5. Crear tu primer endpoint ([GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md#31-crear-un-nuevo-endpoint-api)) (30 min)

### 🟡 Ruta Intermedia (5 horas)
- Ruta Rápida anterior +
- [ARQUITECTURA.md](./ARQUITECTURA.md) - Arquitectura completa (45 min)
- [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md) - Base de datos (45 min)
- [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md) - Patrones (60 min)
- [TESTING.md](./TESTING.md#2-unit-testing-jest) - Unit tests (45 min)

### 🔴 Ruta Completa (10 horas)
Todos los documentos en orden:
1. [README.md](./README.md) (30 min)
2. [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md) (40 min)
3. [ARQUITECTURA.md](./ARQUITECTURA.md) (60 min)
4. [DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md) (60 min)
5. [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md) (90 min)
6. [API_REFERENCE.md](./API_REFERENCE.md) (120 min)
7. [TESTING.md](./TESTING.md) (90 min)
8. [SEGURIDAD.md](./SEGURIDAD.md) (90 min)
9. [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md) (120 min)

---

## 💡 Preguntas Comunes

**P: ¿Por dónde empiezo?**
→ Lee [README.md](./README.md) luego [ARQUITECTURA.md](./ARQUITECTURA.md)

**P: ¿Cómo creo un endpoint?**
→ [GUIAS_DESARROLLO.md#31-crear-un-nuevo-endpoint-api](./GUIAS_DESARROLLO.md#31-crear-un-nuevo-endpoint-api)

**P: ¿Cuál es el esquema de la BD?**
→ [DIAGRAMA_BASE_DATOS.md#2-esquema-sql-completo](./DIAGRAMA_BASE_DATOS.md#2-esquema-sql-completo)

**P: ¿Qué endpoints hay?**
→ [API_REFERENCE.md](./API_REFERENCE.md)

**P: ¿Cómo hago tests?**
→ [TESTING.md](./TESTING.md)

**P: ¿Cómo despliega a producción?**
→ [DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md)

**P: ¿Cuáles son las reglas de seguridad?**
→ [SEGURIDAD.md](./SEGURIDAD.md)

**P: ¿Cómo configuro el entorno?**
→ [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md)

---

## 📊 Documentación por Números

| Métrica | Cantidad |
|---|---|
| Total de documentos | 9 |
| Total de secciones | 80+ |
| Diagramas Mermaid | 10+ |
| Ejemplos de código | 50+ |
| Ejemplos de API | 40+ |
| Tablas | 100+ |
| Líneas de documentación | 6000+ |

---

**Última actualización:** 2026-03-13

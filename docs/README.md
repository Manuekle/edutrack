# 📚 Documentación Técnica - SIRA

## Sistema Integral de Registro Académico y Control de Asistencia

> **Documentación completa, bien organizada y lista para usar** de una aplicación web de gestión académica construida con **Next.js, Bun, PostgreSQL y Supabase**, usando metodología **Extreme Programming (XP)**.

---

## 🎯 ¿Por Dónde Empezar?

### 👉 **¿ERES NUEVO EN EL PROYECTO?**

```
1️⃣  Lee esto primero (5 min)         → INDICE_RAPIDO.md
2️⃣  Entiende la arquitectura (30m)   → ARQUITECTURA.md
3️⃣  Configura tu entorno (20m)       → INSTALACION_CONFIGURACION.md
4️⃣  Aprende a desarrollar (45m)      → GUIAS_DESARROLLO.md + METODOLOGIA_XP.md
5️⃣  ¡Empieza a codear!               → Crea tu primera HU con TDD
```

👉 **[VE AL ÍNDICE RÁPIDO →](./INDICE_RAPIDO.md)** (recomendado para nuevos)

---

## 📖 Documentos Principales

| Documento | Descripción | Tiempo | Para |
|-----------|-----------|--------|------|
| **[🎯 INDICE_RAPIDO.md](./INDICE_RAPIDO.md)** | Búsqueda rápida, FAQ, rutas de aprendizaje | 5 min | Todos |
| **[🎯 METODOLOGIA_XP.md](./METODOLOGIA_XP.md)** | Guía completa de Extreme Programming (TDD, Pair, DoR/DoD) | 45 min | Todo el equipo |
| **[🏗️ ARQUITECTURA.md](./ARQUITECTURA.md)** | Requerimientos, diagramas, endpoints, reglas de negocio | 30 min | Arquitectos, Backend |
| **[💻 GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md)** | Patrones de código, TDD, pair programming, git workflow | 45 min | Developers |
| **[🔧 INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md)** | Setup del proyecto, variables de entorno, troubleshooting | 20 min | Nuevos devs |
| **[🗄️ DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md)** | ER Diagram, schema SQL, vistas, queries, backups | 30 min | DBAs, Backend |
| **[📡 API_REFERENCE.md](./API_REFERENCE.md)** | 25+ endpoints con ejemplos cURL, error codes | 60 min | Frontend, Mobile |
| **[✅ TESTING.md](./TESTING.md)** | Unit/Integration/E2E tests, DoR, DoD, cobertura | 40 min | QA, Developers |
| **[🔐 SEGURIDAD.md](./SEGURIDAD.md)** | OWASP, JWT, RBAC, encriptación, auditoría, compliance | 35 min | Security Engineers |
| **[🚀 DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md)** | Vercel/Railway/AWS, CI/CD, monitoreo, backups, disaster recovery | 50 min | DevOps, SRE |

---

## 🚀 Rutas de Aprendizaje Recomendadas

### ⚡ **RUTA RÁPIDA (2-3 horas)**
Para empezar a desarrollar hoy mismo:
```
1. INDICE_RAPIDO.md (5 min)
2. INSTALACION_CONFIGURACION.md (20 min)
3. ARQUITECTURA.md - Sección "Requerimientos Funcionales" (15 min)
4. GUIAS_DESARROLLO.md - Sección "Crear Endpoint API" (30 min)
5. Crear primer endpoint con tests
```

### 📚 **RUTA INTERMEDIA (5-6 horas)**
Para entender la arquitectura y metodología:
```
1. Ruta Rápida anterior
2. METODOLOGIA_XP.md (45 min)
3. ARQUITECTURA.md - Completo (60 min)
4. DIAGRAMA_BASE_DATOS.md (45 min)
5. TESTING.md - TDD y DoD (40 min)
```

### 🎓 **RUTA COMPLETA (10-12 horas)**
Para maestría total:
```
1. Ruta Intermedia anterior
2. API_REFERENCE.md (60 min)
3. SEGURIDAD.md (35 min)
4. DESPLIEGUE_MANTENIMIENTO.md (50 min)
5. Leer todos los anti-patrones y mejores prácticas
```

---

## 🔍 Busca Rápidamente por Rol

<table>
<tr>
<td>

### 👨‍💼 Arquitecto / Tech Lead
- Leer: METODOLOGIA_XP.md
- Leer: ARQUITECTURA.md (todo)
- Revisar: DIAGRAMA_BASE_DATOS.md

**Objetivo:** Entender visión y asegurar calidad

</td>
<td>

### 👨‍💻 Desarrollador Backend
- Leer: METODOLOGIA_XP.md
- Leer: GUIAS_DESARROLLO.md
- Usar: DIAGRAMA_BASE_DATOS.md + API_REFERENCE.md
- Aplicar: TDD + Pair Programming

**Objetivo:** Código limpio y testeado

</td>
</tr>

<tr>
<td>

### 🌐 Desarrollador Frontend/Mobile
- Leer: METODOLOGIA_XP.md
- Usar: API_REFERENCE.md (todos los endpoints)
- Revisar: ARQUITECTURA.md (componentes)
- Aplicar: TDD en componentes

**Objetivo:** Consumir APIs correctamente

</td>
<td>

### 🔐 Security Engineer
- Leer: SEGURIDAD.md (toda)
- Revisar: API_REFERENCE.md (error codes)
- Revisar: METODOLOGIA_XP.md (DoD)
- Implementar: Auditoría en endpoints

**Objetivo:** Datos y usuarios protegidos

</td>
</tr>

<tr>
<td>

### 🚀 DevOps / SRE
- Leer: DESPLIEGUE_MANTENIMIENTO.md
- Revisar: METODOLOGIA_XP.md (CI/CD)
- Configurar: GitHub Actions
- Monitorear: Sentry + Health Checks

**Objetivo:** Deploy automático y confiable

</td>
<td>

### ✅ QA / Tester
- Leer: TESTING.md
- Leer: METODOLOGIA_XP.md (DoD)
- Usar: API_REFERENCE.md (test cases)
- Ejecutar: E2E tests con Playwright

**Objetivo:** Calidad garantizada en prod

</td>
</tr>

<tr>
<td>

### 🎯 Scrum Master / PM
- Leer: METODOLOGIA_XP.md (todo)
- Entender: Definition of Ready
- Entender: Definition of Done
- Monitorear: Velocidad del equipo

**Objetivo:** Equipo ágil y productivo

</td>
<td>

### 🎓 Estudiante / Aprendiz
- Empezar: INDICE_RAPIDO.md
- Seguir: INSTALACION_CONFIGURACION.md
- Aprender: GUIAS_DESARROLLO.md
- Practicar: TESTING.md + Crear features

**Objetivo:** Aprender desarrollo profesional

</td>
</tr>
</table>

---

## 📊 Estadísticas del Proyecto

```
📄 Documentos                    10
📝 Secciones principales         100+
📊 Tablas informativas          120+
🔗 Diagramas Mermaid             10+
💻 Ejemplos de código            90+
📡 Ejemplos de API             40+
📋 Checklists                    12+
📏 Líneas de documentación     6500+
💾 Tamaño total               192 KB
⏱️  Tiempo lectura completa   10-12h
```

### Stack del Proyecto

<table>
<tr>
<td align="center">
<b>Frontend</b><br/>
Next.js 16<br/>React 19<br/>TypeScript<br/>Tailwind CSS
</td>
<td align="center">
<b>Runtime</b><br/>
Bun<br/>Node.js compatible<br/>⚡ Súper rápido
</td>
<td align="center">
<b>Backend</b><br/>
API Routes<br/>TypeScript<br/>Bun runtime
</td>
<td align="center">
<b>Database</b><br/>
PostgreSQL 14+<br/>Prisma 6<br/>9 tablas
</td>
<td align="center">
<b>Auth</b><br/>
NextAuth.js<br/>Supabase<br/>JWT
</td>
</tr>
</table>

### Funcionalidades

| Módulo | Alcance |
|--------|---------|
| 🔐 **Autenticación** | JWT + NextAuth + Supabase |
| 👥 **Roles** | Admin, Docente, Estudiante (RBAC) |
| 📚 **Asignaturas** | Crear, editar, asignar estudiantes |
| 👨‍🎓 **Estudiantes** | Matrícula, consultar asistencia |
| 📝 **Clases** | Registrar, generar QR, actividades |
| ✅ **Asistencia** | Manual, QR, justificaciones |
| 📊 **Reportes** | Global, por asignatura, por estudiante |
| 🔔 **Notificaciones** | Email de alertas |

---

## 🗺️ Mapa Rápido de Temas

### XP & Metodología
🎯 **[METODOLOGIA_XP.md](./METODOLOGIA_XP.md)** - Guía integral de XP
- User Stories, TDD, Pair Programming
- Definition of Ready & Done
- CI/CD, Code Review, Retrospectivas
- Métricas y anti-patrones

### Arquitectura & Diseño
🏗️ **[ARQUITECTURA.md](./ARQUITECTURA.md)** - Diseño del sistema
- 15 requerimientos funcionales
- 4 capas (Presentación, Aplicación, Lógica, Datos)
- 25+ endpoints con tablas
- 10 reglas de negocio

🗄️ **[DIAGRAMA_BASE_DATOS.md](./DIAGRAMA_BASE_DATOS.md)** - Base de datos
- ER Diagram completo
- 9 tablas con schema SQL
- Vistas de reporting
- Scripts de backup/recovery

### Desarrollo & Coding
💻 **[GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md)** - Cómo codear
- TDD (Test-Driven Development)
- Pair Programming setup
- Patrones de código
- Git workflow y convenciones

📡 **[API_REFERENCE.md](./API_REFERENCE.md)** - Endpoints
- 25+ endpoints documentados
- 40+ ejemplos con cURL
- Códigos de error
- Rate limiting y paginación

### Testing & Calidad
✅ **[TESTING.md](./TESTING.md)** - Aseguranza de calidad
- Unit/Integration/E2E tests
- Definition of Ready & Done
- Cobertura (target >80%)
- CI/CD pipeline

### Seguridad & Compliance
🔐 **[SEGURIDAD.md](./SEGURIDAD.md)** - Proteger el sistema
- OWASP Top 10
- JWT + RBAC
- Prevención: SQL Injection, XSS, CSRF
- GDPR compliance

### Infraestructura & DevOps
🚀 **[DESPLIEGUE_MANTENIMIENTO.md](./DESPLIEGUE_MANTENIMIENTO.md)** - Ops
- Despliegue: Vercel, Railway, AWS
- CI/CD automation
- Monitoreo (Sentry)
- Disaster recovery

### Instalación & Setup
🔧 **[INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md)** - Start here
- Instalación step-by-step
- Variables de entorno
- Troubleshooting
- Primeros pasos

---

## ⚡ Quick Links

### Para Empezar YA
```bash
# 1. Clonar y instalar
git clone <repo>
cd sira
bun install

# 2. Configurar
cp .env.example .env.local
# Editar variables...

# 3. Base de datos
bun run prisma db push
bun run seed

# 4. Desarrollar
bun run dev
# Abrir http://localhost:3000
```

### Comandos Principales
```bash
bun run dev           # Iniciar servidor
bun run test          # Tests (TDD)
bun run lint          # Lint código
bun run build         # Build producción
```

👉 **[Ver todos los comandos →](./GUIAS_DESARROLLO.md#6-comandos-comunes)**

---

## 🎯 Características Destacadas

✨ **TDD Integrado**
- Todos los endpoints se escriben con tests primero
- Cobertura >80% obligatoria
- CI/CD falla si tests no pasan

✨ **Pair Programming**
- Recomendado para features complejas
- VS Code Live Share integrado
- Documentación de roles (Driver/Navigator)

✨ **Definition of Ready & Done**
- DoR: Antes de desarrollar
- DoD: Antes de mergear
- Checklists claros para cada uno

✨ **Diagramas Completos**
- ER Diagram de base de datos
- Casos de uso
- Componentes
- Clases
- Flujos de negocio

✨ **Documentación Exhaustiva**
- 10 documentos interconectados
- 90+ ejemplos de código
- 40+ ejemplos de API
- Búsqueda rápida incluida

✨ **Seguridad desde Día 1**
- JWT con refresh tokens
- RBAC por rol
- Input validation (Zod)
- Auditoría de cambios

---

## 📚 Índice Completo de Documentos

```
docs/
│
├── 📋 README.md (este archivo)
│   └── Tu guía para toda la documentación
│
├── ⚡ INDICE_RAPIDO.md
│   └── Búsquedas rápidas, FAQ, rutas de aprendizaje
│
├── 🎯 METODOLOGIA_XP.md ⭐ NUEVO
│   ├── Valores fundamentales
│   ├── User Stories (narrativas)
│   ├── TDD ciclo Red/Green/Refactor
│   ├── Pair Programming guidelines
│   ├── Definition of Ready & Done
│   ├── Continuous Integration
│   ├── Refactoring continuo
│   ├── Code Review proceso
│   ├── Daily Standups
│   ├── Retrospectivas
│   ├── Métricas XP
│   └── Anti-patrones a evitar
│
├── 🏗️ ARQUITECTURA.md
│   ├── 15 requerimientos funcionales (HUs)
│   ├── 6 atributos de calidad
│   ├── 2 diagramas de flujo (Mermaid)
│   ├── 4 capas arquitectónicas
│   ├── 25+ endpoints por rol
│   ├── 10 reglas de negocio
│   ├── 4 flujos de procesos
│   ├── Diagrama de casos de uso
│   ├── Diagrama de componentes
│   ├── Diagrama de clases
│   ├── Diseño de BD
│   └── 6 enums del sistema
│
├── 💻 GUIAS_DESARROLLO.md
│   ├── Configuración entorno ✅ ACTUALIZADA con XP
│   ├── TDD (Test-Driven Development) ⭐ NUEVO
│   ├── Pair Programming guidelines ⭐ NUEVO
│   ├── Patrones: Endpoints, Componentes, React Query
│   ├── Convenciones de código
│   ├── Git workflow
│   └── Debugging
│
├── 🔧 INSTALACION_CONFIGURACION.md
│   ├── Instalación paso a paso (3 SOs)
│   ├── Configuración PostgreSQL
│   ├── Variables de entorno
│   ├── Supabase setup
│   ├── Integración Email
│   └── Troubleshooting
│
├── 🗄️ DIAGRAMA_BASE_DATOS.md
│   ├── ER Diagram (Mermaid)
│   ├── 9 tablas SQL
│   ├── Índices optimizados
│   ├── 3 vistas de reporting
│   ├── Queries de análisis
│   ├── Scripts backup/recovery
│   └── Estadísticas de tablas
│
├── 📡 API_REFERENCE.md
│   ├── 25+ endpoints
│   ├── 40+ ejemplos cURL
│   ├── Autenticación
│   ├── Endpoints por rol
│   ├── Códigos de error
│   └── Rate limiting
│
├── ✅ TESTING.md ✅ ACTUALIZADO con XP
│   ├── Definition of Ready ⭐ NUEVO
│   ├── Definition of Done ⭐ NUEVO
│   ├── DoD Checklist ⭐ NUEVO
│   ├── Unit tests (Jest)
│   ├── Integration tests
│   ├── E2E tests (Playwright)
│   ├── Cobertura (>80%)
│   └── CI/CD pipeline
│
├── 🔐 SEGURIDAD.md
│   ├── OWASP Top 10
│   ├── JWT + RBAC
│   ├── Hashing de contraseñas
│   ├── Encriptación de datos
│   ├── Prevención: SQL Injection, XSS, CSRF
│   ├── Rate limiting
│   ├── Logging y auditoría
│   └── GDPR compliance
│
└── 🚀 DESPLIEGUE_MANTENIMIENTO.md ✅ ACTUALIZADO con XP
    ├── Comparativa: Vercel, Railway, AWS
    ├── Despliegue en Vercel (paso a paso)
    ├── CI/CD Pipeline XP ⭐ ACTUALIZADO
    ├── Variables de producción
    ├── Monitoreo (Sentry)
    ├── Backups automáticos
    ├── Health checks
    ├── Mantenimiento preventivo
    └── Plan de desastre
```

---

## 🤝 Contribuir

### Reportar Problemas
1. Revisar documentación relevante
2. Buscar en [issues existentes](https://github.com/your-org/sira/issues)
3. Crear issue con contexto claro

### Mejorar Documentación
1. Hacer fork del repo
2. Crear rama: `docs/tu-mejora`
3. Hacer cambios
4. Crear PR con explicación

### Estándares
- ✅ Usar Markdown limpio
- ✅ Agregar ejemplos si es posible
- ✅ Mantener tone técnico
- ✅ Revisar enlaces

---

## 📞 Ayuda & Soporte

### Preguntas Frecuentes
👉 **[VER FAQ →](./INDICE_RAPIDO.md#💡-preguntas-comunes)**

### Búsqueda Rápida
👉 **[VER ÍNDICE RÁPIDO →](./INDICE_RAPIDO.md)**

### Contacto
- 💬 Preguntas en issues del repo
- 📧 Email al team lead
- 🎯 Slack workspace

---

## 📈 Métricas de Documentación

| Métrica | Valor |
|---------|-------|
| Cobertura de temas | 100% |
| Ejemplos incluidos | 90+ |
| Diagramas | 10+ |
| Actualizaciones | Activo |
| Tiempo total lectura | 10-12h |
| Calidad | ⭐⭐⭐⭐⭐ |

---

## 📝 Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| **1.3** | 2026-03-13 | ✨ Metodología XP integrada en toda la documentación |
| **1.2** | 2026-03-13 | Agregados: DIAGRAMA_BASE_DATOS.md, API_REFERENCE.md |
| **1.1** | 2026-03-13 | Documentación de seguridad, testing y despliegue |
| **1.0** | 2026-03-13 | Documentación inicial: Arquitectura, Guías, Instalación |

---

## 🎓 Próximos Pasos

1. **Hoy:** Lee [INDICE_RAPIDO.md](./INDICE_RAPIDO.md) (5 min)
2. **Hoy:** Configura tu entorno → [INSTALACION_CONFIGURACION.md](./INSTALACION_CONFIGURACION.md)
3. **Mañana:** Entiende XP → [METODOLOGIA_XP.md](./METODOLOGIA_XP.md)
4. **Mañana:** Tu primer endpoint con TDD → [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md)
5. **Esta semana:** Lee arquitectura y seguridad

---

## 📄 Licencia

Esta documentación está bajo licencia CC-BY-4.0. Eres libre de:
- ✅ Compartir
- ✅ Adaptar
- ✅ Usar comercialmente

Solo requiere atribución.

---

<div align="center">

### ¡Bienvenido al Proyecto SIRA! 🎉

**Documentación Completa • Metodología XP • Código de Calidad**

[🚀 Empezar Ahora](./INDICE_RAPIDO.md) • [📖 Ver Índice](./README.md) • [🎯 Mi Rol](./INDICE_RAPIDO.md#-documentos-por-rol)

Made with ❤️ by the SIRA Team

</div>

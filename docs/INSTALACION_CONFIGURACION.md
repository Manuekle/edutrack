# Guía de Instalación y Configuración

**Sistema de Gestión Académica**

---

## 1. Requisitos del Sistema

### 1.1 Software Requerido

| Componente | Versión | Descripción |
|---|---|---|
| Node.js | v18+ | Runtime JavaScript |
| Bun | v1.0+ | Runtime rápido para Bun |
| PostgreSQL | v14+ | Base de datos relacional |
| npm/pnpm | v9+ | Package manager |
| Git | v2.30+ | Control de versiones |

### 1.2 Requisitos de Hardware (Mínimo)

- **CPU:** 2 cores
- **RAM:** 4 GB
- **Disco:** 10 GB disponibles
- **SO:** Windows 10+, macOS 10.14+, Linux (cualquier distro moderna)

---

## 2. Instalación Paso a Paso

### 2.1 Instalación de Dependencias del Sistema

#### En macOS (usando Homebrew)

```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node

# Instalar PostgreSQL
brew install postgresql@15

# Instalar Bun
curl -fsSL https://bun.sh/install | bash

# Iniciar PostgreSQL
brew services start postgresql@15
```

#### En Ubuntu/Debian

```bash
# Actualizar packages
sudo apt update
sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Bun
curl -fsSL https://bun.sh/install | bash

# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### En Windows (usando Chocolatey)

```powershell
# Instalar Chocolatey si no lo tienes
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar dependencias
choco install nodejs postgresql bun git

# Iniciar PostgreSQL (generalmente autostart)
```

### 2.2 Clonar y Configurar Repositorio

```bash
# Clonar repositorio
git clone https://github.com/your-org/sira.git
cd sira

# Usar Node 18+ (nvm recomendado)
nvm use 18
# o explícitamente
node --version  # Verificar v18+
```

### 2.3 Instalar Dependencias del Proyecto

```bash
# Instalar con Bun (recomendado)
bun install

# O con npm si prefieres
npm install
```

---

## 3. Configuración de Base de Datos

### 3.1 Crear Base de Datos PostgreSQL

```bash
# Conectarse a PostgreSQL como superuser
psql -U postgres

# Dentro de psql:
CREATE DATABASE sira_dev;
CREATE USER sira_user WITH PASSWORD 'sira_password_123';
ALTER ROLE sira_user SET client_encoding TO 'utf8';
ALTER ROLE sira_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE sira_user SET default_transaction_deferrable TO on;
ALTER ROLE sira_user SET default_transaction_read_committed TO on;
GRANT ALL PRIVILEGES ON DATABASE sira_dev TO sira_user;
\q
```

### 3.2 Verificar Conexión

```bash
# Conectarse a la BD con el nuevo usuario
psql -h localhost -U sira_user -d sira_dev

# Dentro de psql:
SELECT version();
\dt  # Listar tablas (estarán vacías al principio)
\q   # Salir
```

---

## 4. Variables de Entorno

### 4.1 Crear Archivo .env.local

```bash
# Copiar template
cp .env.example .env.local
```

### 4.2 Completar .env.local

```env
# ================================
# DATABASE
# ================================
DATABASE_URL="postgresql://sira_user:sira_password_123@localhost:5432/sira_dev"

# ================================
# AUTHENTICATION (NextAuth.js)
# ================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-super-largo-aqui-genera-uno-seguro"
# Generar: openssl rand -base64 32

# ================================
# SUPABASE (Autenticación)
# ================================
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_KEY="xxxxx.supabase.key"
SUPABASE_SERVICE_ROLE_KEY="xxxxx.supabase.key"

# ================================
# EMAIL (Nodemailer - Opcional)
# ================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"  # NO tu contraseña real
SMTP_FROM="noreply@sira.edu"
SMTP_FROM_NAME="SIRA System"

# ================================
# REDIS (Opcional - para caching)
# ================================
REDIS_URL="redis://localhost:6379"

# ================================
# ENVIRONMENT
# ================================
NODE_ENV="development"
LOG_LEVEL="debug"

# ================================
# API (si existe backend externo)
# ================================
# NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### 4.3 Generar NEXTAUTH_SECRET

```bash
# Opción 1: Con openssl
openssl rand -base64 32

# Opción 2: Con Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. Configuración de Prisma

### 5.1 Generar Cliente Prisma

```bash
bun run prisma generate
```

### 5.2 Aplicar Schema a Base de Datos

```bash
# Push del schema (para desarrollo)
bun run prisma db push

# O crear migration (para producción)
bun run prisma migrate dev --name init
```

### 5.3 Seedear Base de Datos (Opcional)

```bash
# Ejecutar script de seed
bun run seed

# Esto poblará la BD con datos iniciales:
# - 1 usuario Admin
# - 2 usuarios Docente
# - 5 usuarios Estudiante
# - 3 Asignaturas
# - Matrículas y clases de ejemplo
```

---

## 6. Configuración de Servicios Externos

### 6.1 Supabase Auth

**Pasos:**

1. Ir a https://supabase.com
2. Crear proyecto nuevo
3. Copiar credenciales:
   - Project URL → `SUPABASE_URL`
   - anon key → `SUPABASE_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
4. En Settings → Auth → Providers, habilitar "Email"

**Verificar:**
```bash
curl -H "Authorization: Bearer $SUPABASE_KEY" \
  https://xxxxx.supabase.co/rest/v1/ \
  -H "apikey: $SUPABASE_KEY"
```

### 6.2 Configuración de Email (Gmail)

**Pasos:**

1. Habilitar 2FA en tu cuenta Google
2. Generar App Password:
   - Ir a https://myaccount.google.com/apppasswords
   - Seleccionar "Mail" y "Windows Computer"
   - Copiar contraseña generada → `SMTP_PASS`
3. Actualizar `.env.local`:
   ```env
   SMTP_USER="tu-email@gmail.com"
   SMTP_PASS="xxxx xxxx xxxx xxxx"  # Contraseña de 16 caracteres
   ```

**Probar:**
```bash
# Usar un servicio como Mailhog localmente
npm install -g mailhog
mailhog
# Accede a http://localhost:1025
```

---

## 7. Iniciar Servidor de Desarrollo

### 7.1 Arrancar Servidor

```bash
bun run dev
```

**Salida esperada:**
```
> sira@1.0.0 dev
> next dev --turbopack

  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

  ✓ Ready in 2.1s
```

### 7.2 Verificar Instalación

```bash
# En otra terminal:

# 1. Verificar acceso a home
curl http://localhost:3000

# 2. Verificar acceso a login
curl http://localhost:3000/login

# 3. Verificar API
curl http://localhost:3000/api/health
```

---

## 8. Acceso Inicial

### 8.1 Credenciales por Defecto (Post-Seed)

| Rol | Email | Contraseña |
|---|---|---|
| **Admin** | admin@sira.edu | admin123 |
| **Docente** | docente@sira.edu | docente123 |
| **Estudiante** | estudiante@sira.edu | estudiante123 |

### 8.2 Primer Login

1. Ir a http://localhost:3000/login
2. Ingresar credenciales
3. Según rol, será redirigido a:
   - **Admin** → `/dashboard/admin`
   - **Docente** → `/dashboard/docente`
   - **Estudiante** → `/dashboard/estudiante`

---

## 9. Verificación de Instalación

### 9.1 Checklist

- ✅ Node.js `v18+` instalado: `node -v`
- ✅ Bun `v1+` instalado: `bun -v`
- ✅ PostgreSQL funcionando: `psql -U sira_user -d sira_dev`
- ✅ `.env.local` configurado
- ✅ Dependencias instaladas: `bun install`
- ✅ Prisma generado: `bun run prisma generate`
- ✅ BD sincronizada: `bun run prisma db push`
- ✅ Datos seedeados: `bun run seed`
- ✅ Servidor iniciado: `bun run dev` (puerto 3000)

### 9.2 Verificación Avanzada

```bash
# Verificar BD
bun run prisma studio
# Abre http://localhost:5555

# Verificar logs
NODE_DEBUG=* bun run dev

# Verificar salud de API
curl -i http://localhost:3000/api/health

# Verificar autenticación
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sira.edu","password":"admin123"}'
```

---

## 10. Solución de Problemas

### 10.1 Error: "Cannot find module '@prisma/client'"

```bash
# Regenerar cliente Prisma
bun run prisma generate

# Limpiar node_modules y reinstalar
rm -rf node_modules bun.lockb
bun install
```

### 10.2 Error: "ECONNREFUSED" en PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
# macOS:
brew services list

# Ubuntu:
sudo systemctl status postgresql

# Windows:
# Verificar en Servicios → postgresql-15
```

### 10.3 Error: "DATABASE_URL not found"

```bash
# Verificar .env.local existe
ls -la .env.local

# Si no existe, crear:
cp .env.example .env.local
# Editar con valores correctos
```

### 10.4 Error de Permiso en DB

```bash
# Reset permisos PostgreSQL
sudo -u postgres psql -d sira_dev -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sira_user;"
```

### 10.5 Puerto 3000 Ocupado

```bash
# En macOS/Linux:
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O usar puerto diferente
bun run dev -- -p 3001
```

---

## 11. Configuración para Desarrollo en Equipo

### 11.1 Sincronizar Schema

```bash
# Después de pull, si hay cambios en schema.prisma:
bun run prisma generate
bun run prisma db push
```

### 11.2 Sincronizar Migrations

```bash
# Si hay migrations nuevas:
bun run prisma migrate dev
```

### 11.3 Resetear BD de Desarrollo

```bash
# ⚠️ Cuidado: Elimina todos los datos
bun run prisma migrate reset

# O manualmente:
bun run prisma db push --force-reset
bun run seed
```

---

## 12. Próximos Pasos

1. Leer [ARQUITECTURA.md](./ARQUITECTURA.md) para entender la estructura
2. Leer [GUIAS_DESARROLLO.md](./GUIAS_DESARROLLO.md) para convenciones
3. Explorar `/app/api` para ver ejemplos de endpoints
4. Explorar `/components` para ver ejemplos de UI
5. Ejecutar tests: `bun run test`

---

**Última actualización:** 2026-03-13
**Versión:** 1.0

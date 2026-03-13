# Guía de Despliegue y Mantenimiento

**Sistema de Gestión Académica**

---

## 1. Opciones de Despliegue

### 1.1 Comparativa de Plataformas

| Plataforma | Costo | Scaling | Facilidad | Ideal para |
|---|---|---|---|---|
| **Vercel** | $20-100/mes | Auto | Muy alta | Next.js, Producción |
| **Railway** | $5-50/mes | Manual | Alta | PostgreSQL + Backend |
| **Heroku** | $7-50/mes | Manual | Media | Apps clásicas |
| **AWS** | Variable | Auto | Baja | Escalas grandes |
| **DigitalOcean** | $5-40/mes | Manual | Media | Control total |

### 1.2 Stack Recomendado para Producción

```
Frontend:        Vercel (Next.js)
Backend:         Railway/AWS (Bun app)
Base de Datos:   PostgreSQL en Railway/AWS RDS
Auth:            Supabase
Storage:         Supabase Storage o AWS S3
CDN:             Vercel Edge Network o Cloudflare
Monitoring:      Sentry + CloudWatch
Email:           Nodemailer + SendGrid
```

---

## 2. Despliegue en Vercel (Recomendado)

### 2.1 Pre-requisitos

```bash
# Instalar Vercel CLI
npm install -g vercel

# Verificar instalación
vercel --version
```

### 2.2 Configuración Inicial

**vercel.json:**
```json
{
  "buildCommand": "bun run build",
  "devCommand": "bun run dev",
  "installCommand": "bun install",
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "NEXTAUTH_URL": "@nextauth_url",
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_KEY": "@supabase_key"
  },
  "functions": {
    "app/api/**": {
      "maxDuration": 60
    }
  }
}
```

### 2.3 Despliegue

```bash
# Login a Vercel
vercel login

# Desplegar staging
vercel

# Desplegar a producción
vercel --prod

# Configurar variables de entorno
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... etc

# Ver despliegues
vercel list

# Monitorear logs
vercel logs
```

### 2.4 Configuración de CI/CD con GitHub

**Conectar repositorio en Vercel Dashboard:**

1. Ir a https://vercel.com/dashboard
2. Click "Import Project"
3. Seleccionar repositorio GitHub
4. Configurar:
   - Root Directory: `.` (raíz)
   - Build Command: `bun run build`
   - Install Command: `bun install`
5. Agregar variables de entorno
6. Click "Deploy"

**Despliegues automáticos:**
- `main` branch → Production
- Otros branches → Preview deployments

---

## 3. Despliegue en Railway

### 3.1 Crear Proyecto

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init
```

### 3.2 Configurar PostgreSQL

```bash
# Desde Railway Dashboard:
# 1. Click "Add Service"
# 2. Seleccionar "PostgreSQL"
# 3. Copiar DATABASE_URL
```

### 3.3 Desplegar Backend Bun

```bash
# Crear archivo railway.json
cat > railway.json << 'EOF'
{
  "builder": "nixpacks",
  "buildCommand": "bun install && bun run build",
  "startCommand": "bun run start"
}
EOF

# Desplegar
railway up

# Ver logs
railway logs
```

### 3.4 Conectar con Frontend

```env
# En Vercel, agregar:
API_URL="https://tu-railway-app.railway.app"
```

---

## 4. Variables de Entorno en Producción

### 4.1 Configuración Mínima

```env
# ===== DATABASE =====
DATABASE_URL="postgresql://user:password@host:5432/sira_prod"

# ===== AUTH =====
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="[64 caracteres aleatorios]"

# ===== SUPABASE =====
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_KEY="xxxxx"
SUPABASE_SERVICE_ROLE_KEY="xxxxx"

# ===== EMAIL =====
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxx"
SMTP_FROM="noreply@sira-prod.edu"

# ===== MONITORING =====
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
SENTRY_ENVIRONMENT="production"

# ===== ENVIRONMENT =====
NODE_ENV="production"
LOG_LEVEL="info"
```

### 4.2 Secretos Seguros

```bash
# Generar NEXTAUTH_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Guardar en: Vercel → Settings → Environment Variables
# NO guardar en código
```

---

## 5. CI/CD XP - Integración Continua y Despliegue Continuo

### 5.0 Pipeline CI/CD XP

**En SIRA**, todo commit automáticamente:

```
Commit → Lint → Tests → Type-check → Build → Deploy-Staging → Monitored
  ↓       ↓       ↓         ↓         ↓           ↓              ↓
 5s      10s     30s       10s       20s         30s            auto
```

**Si algo falla → STOP → Fix required**

### 5.1 GitHub Actions Workflow XP

```yaml
# .github/workflows/ci-cd.yml
name: XP CI/CD Pipeline

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
    # Fail fast: no continuar si falla lint

  type-check:
    runs-on: ubuntu-latest
    needs: lint  # Esperar a lint
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run type-check

  unit-tests:
    runs-on: ubuntu-latest
    needs: type-check
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test
      - run: bun run test:coverage
      - uses: codecov/codecov-action@v3
      - name: Fail if coverage < 80%
        run: |
          if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) -lt 80 ]; then
            echo "Coverage < 80%!"
            exit 1
          fi

  integration-tests:
    runs-on: ubuntu-latest
    needs: type-check
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:integration

  build:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - run: bun run test:e2e  # E2E con build prod

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging (Vercel)
        run: |
          vercel --token ${{ secrets.VERCEL_TOKEN }} \
                 --scope ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'  # Solo main va a prod
    steps:
      - name: Deploy to Production (Vercel)
        run: |
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

  monitor:
    runs-on: ubuntu-latest
    needs: deploy-production
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Health Check
        run: |
          curl -f https://tu-dominio.com/api/health || exit 1
      - name: Sentry Release
        run: |
          sentry-cli releases create -p tu-proyecto ${{ github.sha }}
```

### 5.2 XP Requisitos CI/CD

**NO se puede mergear a main si:**
- ❌ Lint falla
- ❌ TypeScript falla
- ❌ Tests fallan
- ❌ Coverage baja
- ❌ Build falla
- ❌ < 2 code reviews

**Merge automático cuando:**
- ✅ Todo pasa
- ✅ 2+ aprobaciones
- ✅ 0 cambios solicitados

---

## 5. Proceso de Despliegue

### 5.1 Pre-Deployment Checklist

```bash
# 1. Verificar tests pasan
bun run test
bun run test:e2e

# 2. Verificar tipos
bun run type-check

# 3. Lint
bun run lint

# 4. Build local
bun run build

# 5. Revisar cambios
git diff main..HEAD

# 6. Crear release
git tag -a v1.2.0 -m "Release v1.2.0"

# 7. Push a GitHub
git push origin main
git push origin v1.2.0
```

### 5.2 Despliegue Paso a Paso

```bash
# 1. Merge a main en GitHub
git checkout main
git pull origin main

# 2. Vercel automáticamente detecta y deploya
# (Puedes monitorear en https://vercel.com/dashboard)

# 3. Esperar a que pase las checks:
# - Build
# - Type-check
# - Tests (si están en CI)

# 4. Una vez pasado, está en producción

# 5. Verificar deploymen
curl https://tu-dominio.com/api/health
```

### 5.3 Rollback en Caso de Error

```bash
# Si algo sale mal:

# Opción 1: Revert en GitHub
git revert <commit-hash>
git push origin main

# Opción 2: Desplegar versión anterior en Vercel
# Vercel Dashboard → Deployments → Select → Redeploy

# Opción 3: Usar feature flags
export FEATURE_NEW_FEATURE=false
vercel env add FEATURE_NEW_FEATURE false
```

---

## 6. Monitoreo y Observabilidad

### 6.1 Sentry (Error Tracking)

```typescript
// lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // No enviar errores locales
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },
});

// Uso manual
try {
  // algo
} catch (error) {
  Sentry.captureException(error);
}
```

### 6.2 Logging Centralizado

```typescript
// lib/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    // En desarrollo
    ...(process.env.NODE_ENV !== "production"
      ? [new winston.transports.Console()]
      : []),
  ],
});

export default logger;
```

### 6.3 Monitoreo de Performance

```typescript
// lib/performance.ts
export async function measureQuery<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`[SLOW QUERY] ${name}: ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[QUERY ERROR] ${name}: ${duration}ms`, error);
    throw error;
  }
}

// Uso
const users = await measureQuery("fetch_all_users", () =>
  prisma.user.findMany()
);
```

---

## 7. Backups y Recuperación

### 7.1 Backup Automático de PostgreSQL

```bash
# En producción (Railway/AWS):
# - Backups automáticos diarios
# - Retention: 30 días
# - Verificar en dashboard del proveedor
```

### 7.2 Script de Backup Manual

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DB_NAME="sira_prod"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Crear backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Comprimir
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Subir a cloud storage
aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz" \
  s3://my-backups/sira/

# Limpiar backups locales mayores a 30 días
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completado: $TIMESTAMP"
```

### 7.3 Restaurar desde Backup

```bash
# Verificar backups disponibles
aws s3 ls s3://my-backups/sira/

# Descargar backup
aws s3 cp s3://my-backups/sira/backup_20240315_100000.sql.gz .

# Descomprimir
gunzip backup_20240315_100000.sql.gz

# Restaurar a BD
psql $DATABASE_URL < backup_20240315_100000.sql

echo "Restauración completada"
```

---

## 8. Mantenimiento Preventivo

### 8.1 Actualizaciones de Dependencias

```bash
# Verificar vulnerabilidades
bun run audit
npm audit

# Actualizar dependencias menores
bun update

# Actualizar major (cuidado)
bun install @latest

# Probar después de actualizar
bun run test
bun run build
```

### 8.2 Optimización de Base de Datos

```bash
# Análisis de queries lentas
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

# Recrear índices
REINDEX DATABASE sira_prod;

# Vacuum (liberar espacio)
VACUUM ANALYZE;

# Verificar integridad
VACUUM ANALYZE;
```

### 8.3 Limpieza de Logs

```bash
# Eliminar logs antiguos
find /var/log -name "*.log" -mtime +90 -delete

# Rotar logs
logrotate -f /etc/logrotate.conf
```

---

## 9. Plan de Desastre

### 9.1 Escenario: Base de Datos Corrupta

```
1. Alertas: Errores en queries, performance degrada
2. Diagnóstico:
   - Verificar Sentry
   - Ver error logs
   - Conectar a BD directamente
3. Acciones:
   - VACUUM ANALYZE para integridad
   - Si sigue corrupta: restore desde backup
4. Recovery:
   - Descargar backup más reciente
   - Restaurar a ambiente staging
   - Probar aplicación
   - Migrar a producción
5. Post-mortem:
   - Analizar causa raíz
   - Mejorar monitoreo
   - Implementar protecciones
```

### 9.2 Escenario: Ataque DDoS

```
1. Detectar:
   - Cloudflare/WAF alertas
   - Logs anormales
   - Tráfico anormal
2. Responder:
   - Activar DDoS protection
   - Rate limiting
   - Whitelist IPs conocidas
3. Mitigar:
   - Contactar proveedor
   - Aumentar recursos
   - Cache más agresivo
4. Recuperar:
   - Monitor del tráfico
   - Gradualmente normalizar
```

### 9.3 Escenario: Brecha de Seguridad

```
1. Contener:
   - Disable affected accounts
   - Rotate secrets
   - Patch vulnerability
2. Investigar:
   - Auditar logs
   - Determinar scope
   - Sentry analysis
3. Notificar:
   - Usuarios afectados
   - Reguladores (si aplica)
   - Equipo de seguridad
4. Recuperar:
   - Reset passwords
   - Audit completamente
   - Implementar controles
5. Aprender:
   - Post-mortem
   - Mejorar seguridad
   - Testing de penetración
```

---

## 10. Monitoreo de Salud del Sistema

### 10.1 Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Verificar BD
    const dbCheck = await prisma.$queryRaw`SELECT 1`;

    // Verificar externa services (opcional)
    // const supabaseCheck = await supabase.auth.getUser();

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        checks: {
          database: "ok",
          // supabase: "ok",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
```

### 10.2 Monitoreo de Uptime

```bash
# Usar servicio externo como Uptime Robot:
# URL: https://tu-dominio.com/api/health
# Frequency: Every 5 minutes
# Alert: Email si está down
```

### 10.3 Dashboards Útiles

```
Vercel Dashboard:
  - Deployments
  - Analytics
  - Performance
  - Error rates

Sentry Dashboard:
  - Error tracking
  - Performance
  - Releases
  - Team activity

PostgreSQL:
  - Connections
  - Query performance
  - Disk usage
  - Backups status
```

---

## 11. Escalabilidad para Futuro

### 11.1 Cuando Considerar Escalar

| Métrica | Límite | Acción |
|---|---|---|
| Usuarios activos | >5000 | Agregar caching (Redis) |
| Requests/segundo | >100 | Load balancing |
| Tamaño DB | >10GB | Read replicas |
| Latencia P95 | >500ms | Optimizar queries |
| Error rate | >0.1% | Investigar |

### 11.2 Estrategia de Escalado

```
Fase 1 (0-1000 usuarios):
  - Vercel + Railway estándar
  - PostgreSQL shared
  - Sin caching adicional

Fase 2 (1000-10000):
  - Vercel + Railway Pro
  - PostgreSQL dedicado
  - Redis para sessions
  - CDN optimizado

Fase 3 (10000+):
  - Multi-region
  - Load balancing
  - Database sharding
  - Microservicios
```

---

## 12. Checklist de Despliegue

- ✅ Todas las pruebas pasan (`bun run test:all`)
- ✅ Build local exitoso (`bun run build`)
- ✅ No hay warnings de TypeScript
- ✅ Variables de entorno configuradas
- ✅ Secrets rotados (si aplica)
- ✅ Backup de BD hecho
- ✅ Monitoreo habilitado (Sentry)
- ✅ Health checks funcionando
- ✅ SSL/HTTPS habilitado
- ✅ Logs centralizados
- ✅ Rate limiting activo
- ✅ CORS configurado
- ✅ WAF habilitado (si aplica)
- ✅ Runbook actualizado
- ✅ Team notificado

---

**Última actualización:** 2026-03-13
**Versión:** 1.0

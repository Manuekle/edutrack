# Guía de Seguridad

**Sistema de Gestión Académica**

---

## 1. Principios de Seguridad

### 1.1 Pilares de Seguridad

| Pilar | Descripción | Implementación |
|---|---|---|
| **Confidencialidad** | Solo usuarios autorizados acceden datos | RBAC, Encriptación, JWT |
| **Integridad** | Datos no son alterados sin autorización | Signatures, Hashes, Transacciones |
| **Disponibilidad** | Sistema accesible cuando se necesita | Backups, Redundancia, Monitoring |
| **Autenticación** | Verificar identidad del usuario | Email/Password + JWT |
| **Autorización** | Verificar permisos del usuario | Role-based access control |

### 1.2 OWASP Top 10

| Riesgo | Mitigación en SIRA |
|---|---|
| **A01: Broken Access Control** | RBAC, Verificación de session en cada endpoint |
| **A02: Cryptographic Failures** | Contraseñas con bcrypt, HTTPS obligatorio, JWT con expiración |
| **A03: Injection** | Prisma ORM (no SQL directo), Zod schemas |
| **A04: Insecure Design** | Arquitectura de capas, Separación de concerns |
| **A05: Security Misconfiguration** | .env.local no en repo, Headers de seguridad |
| **A06: Vulnerable Components** | npm audit, Dependencias actualizadas |
| **A07: Auth Failures** | JWT seguro, NextAuth.js, Rate limiting |
| **A08: Data Integrity** | HTTPS, Signed cookies, CSRF tokens |
| **A09: Logging Failures** | Audit logging, Monitoreo de errores |
| **A10: SSRF** | Whitelist de URLs, No follow redirects |

---

## 2. Autenticación y Autorización

### 2.1 Flujo de Autenticación

```
Usuario                 Frontend               Backend              Supabase Auth
  │                       │                      │                      │
  ├─ Email + Pass ────────>│                      │                      │
  │                        ├─ POST /api/login ──>│                      │
  │                        │                      ├─ Validate ────────>│
  │                        │                      │<─ User data ───────┤
  │                        │<─ JWT Token ────────┤                      │
  │                        ├─ Store in HttpOnly  │                      │
  │                        │   Cookie             │                      │
  │<─ Redirect ────────────┤                      │                      │
  │   /dashboard           │                      │                      │
```

### 2.2 JWT Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        // Validar con Supabase
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (error) {
          throw new Error("Email o contraseña incorrectos");
        }

        // Verificar en BD si usuario está activo
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.estado) {
          throw new Error("Usuario inactivo o no encontrado");
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          nombre: user.nombre,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string;
      session.user.id = token.id as string;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
};
```

### 2.3 Role-Based Access Control (RBAC)

```typescript
// lib/roles.ts
export enum Role {
  ADMIN = "ADMIN",
  DOCENTE = "DOCENTE",
  ESTUDIANTE = "ESTUDIANTE",
}

// Permisos por rol
export const rolePermissions = {
  ADMIN: [
    "manage_users",
    "manage_subjects",
    "manage_groups",
    "view_reports_global",
  ],
  DOCENTE: [
    "manage_own_classes",
    "manage_own_attendance",
    "view_own_subjects",
    "manage_own_reports",
  ],
  ESTUDIANTE: [
    "view_own_attendance",
    "view_own_subjects",
    "justify_absence",
  ],
};

// Middleware de verificación
export async function requireRole(
  session: Session | null,
  requiredRoles: Role[]
): Promise<void> {
  if (!session) {
    throw new UnauthorizedError("No autenticado");
  }

  if (!requiredRoles.includes(session.user.role as Role)) {
    throw new ForbiddenError("Acceso denegado");
  }
}
```

### 2.4 Verificación de Sesión en Endpoints

```typescript
// app/api/docente/clases/route.ts
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // 2. Verificar rol
    if (session.user.role !== "DOCENTE") {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    // 3. Verificar que el docente solo accede sus datos
    const asignatura = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (asignatura?.docente_id !== session.user.id) {
      return NextResponse.json(
        { error: "No puedes acceder esta asignatura" },
        { status: 403 }
      );
    }

    // Continuar...
  } catch (error) {
    // Error handling...
  }
}
```

---

## 3. Protección de Datos

### 3.1 Hasheo de Contraseñas

```typescript
// lib/auth-utils.ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Uso en creación de usuario
const hashedPassword = await hashPassword(userData.password);
await prisma.user.create({
  data: {
    email: userData.email,
    contraseña_hash: hashedPassword, // ← Guardar hash, NO la contraseña
    role: userData.role,
  },
});
```

### 3.2 Encriptación de Datos Sensibles

```typescript
// lib/encryption.ts
import crypto from "crypto";

const algorithm = "aes-256-cbc";
const key = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_KEY!)
  .digest();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(parts[1], "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

### 3.3 HTTPS y Secure Headers

```typescript
// next.config.js
module.exports = {
  // Forzar HTTPS en producción
  httpAgentOptions: {
    keepAlive: true,
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
          },
        ],
      },
    ];
  },
};
```

---

## 4. Validación de Entrada

### 4.1 Zod Schemas

```typescript
// lib/validators.ts
import { z } from "zod";

export const createUserSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  nombre: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Debe incluir mayúscula, minúscula y número"
    ),
  role: z.enum(["ADMIN", "DOCENTE", "ESTUDIANTE"]),
});

// Uso
const data = createUserSchema.parse(req.body);
```

### 4.2 Sanitización de Input

```typescript
// lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong"],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, "") // Remover caracteres peligrosos
    .substring(0, 255); // Limitar longitud
}
```

---

## 5. Prevención de Ataques Comunes

### 5.1 SQL Injection

```typescript
// ❌ MAL - Vulnerable a SQL injection
const result = await prisma.$queryRaw(
  `SELECT * FROM users WHERE email = '${email}'`
);

// ✅ BIEN - Prisma parametriza automáticamente
const result = await prisma.user.findUnique({
  where: { email: email },
});

// ✅ BIEN - Con raw queries (parametrizadas)
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;
```

### 5.2 Cross-Site Scripting (XSS)

```typescript
// ❌ MAL - Inyectar HTML directo
<div>{userInput}</div>

// ✅ BIEN - React escapa automáticamente
<div>{userInput}</div>

// ✅ BIEN - Si necesitas HTML seguro
import DOMPurify from "isomorphic-dompurify";

<div>{DOMPurify.sanitize(userInput)}</div>
```

### 5.3 Cross-Site Request Forgery (CSRF)

```typescript
// NextAuth.js maneja CSRF automáticamente
// Los tokens se validan en cada POST/PUT/DELETE

// Pero en formularios manuales:
<form method="POST" action="/api/action">
  {/* NextAuth automáticamente incluye token CSRF */}
  <input type="hidden" name="csrfToken" value={csrfToken} />
</form>
```

### 5.4 Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(10, "60 s"), // 10 requests por minuto
});

// Uso en endpoint
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429 }
    );
  }

  // Continuar...
}
```

---

## 6. Logging y Auditoría

### 6.1 Audit Logging

```typescript
// lib/audit.ts
import { prisma } from "@/lib/db";

export async function logAudit(
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  changes?: Record<string, any>
) {
  await prisma.auditLog.create({
    data: {
      usuario_id: userId,
      accion: action, // CREATE, UPDATE, DELETE
      recurso: resource, // USER, CLASS, ATTENDANCE
      recurso_id: resourceId,
      cambios: changes,
      timestamp: new Date(),
      ip_address: request.ip,
      user_agent: request.headers["user-agent"],
    },
  });
}

// Uso
await logAudit(
  session.user.id,
  "CREATE",
  "CLASS",
  newClass.id,
  { tema: "Clase de prueba" }
);
```

### 6.2 Error Logging

```typescript
// lib/logger.ts
export function logError(
  error: Error,
  context: string,
  severity: "low" | "medium" | "high" | "critical"
) {
  console.error(`[${severity.toUpperCase()}] ${context}:`, error);

  // Enviar a servicio de logging (Sentry, DataDog, etc.)
  if (severity === "critical") {
    // Alertar al equipo
    sendAlert(error, context);
  }
}
```

---

## 7. Secrets Management

### 7.1 Variables de Entorno

```bash
# ✅ BIEN - En .env.local (no en repo)
DATABASE_URL="postgresql://user:pass@localhost/db"
NEXTAUTH_SECRET="super-secret-key-64-characters"

# ❌ MAL - Hardcodeadas en código
const password = "admin123"; // NUNCA HACER ESTO

# ❌ MAL - Commiteadas al repo
# .env (con secrets) → Nunca hacer git add
```

### 7.2 .gitignore

```bash
# .gitignore
.env
.env.local
.env.*.local
.DS_Store
node_modules/
.next/
dist/
build/
*.log

# Secrets
secrets/
.env*.local
```

### 7.3 Secret Rotation

```bash
# En producción (Vercel, Heroku, etc.):
# 1. Generar nuevo NEXTAUTH_SECRET
openssl rand -base64 32

# 2. Actualizar en plataforma de hosting
# 3. Hacer deploy con nueva variable
# 4. Monitorear para errores de sesión
# 5. Después de 30 días, remover secret antiguo
```

---

## 8. Seguridad en Producción

### 8.1 Checklist Pre-Deployment

- ✅ HTTPS habilitado
- ✅ Headers de seguridad configurados
- ✅ NEXTAUTH_SECRET configurado y fuerte
- ✅ DATABASE_URL usa credenciales seguras
- ✅ No hay console.log sensibles
- ✅ Logs centralizados (Sentry, CloudWatch, etc.)
- ✅ Rate limiting habilitado
- ✅ CORS configurado correctamente
- ✅ CSP (Content Security Policy) habilitado
- ✅ SQL Injection testing realizado
- ✅ XSS testing realizado
- ✅ CSRF testing realizado

### 8.2 Configuración de Producción

```typescript
// next.config.js
module.exports = {
  productionBrowserSourceMaps: false, // No exponer source maps
  poweredByHeader: false, // No revelar tecnología

  // Compresión
  compress: true,

  // Timeout de funciones
  serverRuntimeConfig: {
    apiTimeout: 30000, // 30 segundos
  },
};
```

---

## 9. Compliance y Regulaciones

### 9.1 GDPR (General Data Protection Regulation)

Si el sistema maneja datos de estudiantes/docentes en EU:

```typescript
// Derecho al olvido
export async function deleteUserData(userId: string) {
  // Eliminar usuario
  await prisma.user.delete({ where: { id: userId } });

  // Eliminar datos relacionados
  await prisma.attendance.deleteMany({
    where: { estudiante_id: userId },
  });

  // Logs de auditoría: guardar por 90 días luego eliminar
  await prisma.auditLog.deleteMany({
    where: {
      usuario_id: userId,
      timestamp: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
  });

  // Notificar al usuario
  await sendEmail(user.email, "Tu cuenta ha sido eliminada");
}

// Portabilidad de datos
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const attendance = await prisma.attendance.findMany({
    where: { estudiante_id: userId },
  });

  return JSON.stringify({ user, attendance }, null, 2);
}
```

### 9.2 Data Retention Policy

```typescript
// Eliminar datos antiguos automáticamente
export async function cleanOldData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Eliminar logs
  await prisma.auditLog.deleteMany({
    where: { timestamp: { lt: thirtyDaysAgo } },
  });

  // Anonimizar datos antiguos
  await prisma.attendance.updateMany({
    where: { fecha_registro: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
    data: { justificacion: null }, // Anonimizar
  });
}
```

---

## 10. Recursos y Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CheatSheet Series](https://cheatsheetseries.owasp.org/)
- [NextAuth.js Security](https://next-auth.js.org/getting-started/example)
- [Prisma Security](https://www.prisma.io/docs/orm/more/security)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [Web Security Academy](https://portswigger.net/web-security)

---

**Última actualización:** 2026-03-13
**Versión:** 1.0

# Variables de Entorno

Este documento describe todas las variables de entorno necesarias para ejecutar la aplicación.

## Variables Requeridas

### Base de Datos

```env
DATABASE_URL="mongodb://localhost:27017/edutrack"
```
- **Descripción**: Cadena de conexión a MongoDB
- **Requerido**: Sí
- **Ejemplo**: `mongodb://usuario:contraseña@host:puerto/nombre_db`

### NextAuth.js

```env
NEXTAUTH_URL="http://localhost:3000"
```
- **Descripción**: URL base de la aplicación (sin trailing slash)
- **Requerido**: Sí
- **Ejemplo**: `https://edutrack-fup.vercel.app`

```env
NEXTAUTH_SECRET="your-secret-key-here"
```
- **Descripción**: Secreto para firmar tokens JWT
- **Requerido**: Sí
- **Generar**: `openssl rand -base64 32`

## Variables Opcionales (pero Recomendadas)

### Redis Cache

```env
KV_REST_API_URL="https://your-redis-instance.upstash.io"
```
- **Descripción**: URL de la API REST de Upstash Redis
- **Requerido**: No (la app funciona sin caché, pero con menor rendimiento)
- **Cómo obtener**: Crear una instancia en [Upstash](https://upstash.com/)

```env
KV_REST_API_TOKEN="your-redis-token-here"
```
- **Descripción**: Token de autenticación de Upstash Redis
- **Requerido**: No (solo si se usa Redis)
- **Cómo obtener**: Desde el dashboard de Upstash

**Nota**: Si Redis no está configurado, la aplicación funcionará normalmente pero sin caché, lo que resultará en tiempos de respuesta más lentos.

### Configuración de Email (SMTP)

```env
SMTP_HOST="smtp.gmail.com"
```
- **Descripción**: Host del servidor SMTP
- **Requerido**: No (por defecto: `smtp.gmail.com`)

```env
SMTP_PORT="587"
```
- **Descripción**: Puerto del servidor SMTP (587 para TLS, 465 para SSL)
- **Requerido**: No (por defecto: `587`)

```env
SMTP_SECURE="false"
```
- **Descripción**: Usar conexión segura (true para SSL, false para TLS)
- **Requerido**: No (por defecto: `false`)

```env
SMTP_USER="your-email@gmail.com"
```
- **Descripción**: Usuario del servidor SMTP
- **Requerido**: No

```env
SMTP_PASSWORD="your-app-password"
```
- **Descripción**: Contraseña del servidor SMTP (o App Password para Gmail)
- **Requerido**: No

```env
SMTP_FROM="noreply@fup.edu.co"
```
- **Descripción**: Email remitente por defecto
- **Requerido**: No (por defecto: `noreply@fup.edu.co`)

```env
SUPPORT_EMAIL="soporte@fup.edu.co"
```
- **Descripción**: Email de soporte para comunicaciones
- **Requerido**: No (por defecto: `soporte@fup.edu.co`)

## Variables de Entorno

```env
NODE_ENV="development"
```
- **Descripción**: Entorno de ejecución (development, production, test)
- **Requerido**: No (por defecto: `development`)

## Configuración de Ejemplo

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Base de Datos
DATABASE_URL="mongodb://localhost:27017/edutrack"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-aqui-generar-con-openssl-rand-base64-32"

# Redis Cache (Opcional pero recomendado)
KV_REST_API_URL="https://your-redis-instance.upstash.io"
KV_REST_API_TOKEN="your-redis-token-here"

# Email (Opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@fup.edu.co"
SUPPORT_EMAIL="soporte@fup.edu.co"

# Entorno
NODE_ENV="development"
```

## Configuración de Redis (Upstash)

1. Ve a [Upstash](https://upstash.com/) y crea una cuenta
2. Crea una nueva base de datos Redis
3. Copia la `REST API URL` y el `REST API TOKEN`
4. Agrega estas variables a tu archivo `.env.local`

**Importante**: Redis es opcional. Si no está configurado, la aplicación funcionará sin caché pero con menor rendimiento.

## Verificación

Para verificar que todas las variables están configuradas correctamente:

```bash
# Verificar variables de entorno
npm run dev
```

Si falta alguna variable requerida, la aplicación mostrará un error al iniciar.


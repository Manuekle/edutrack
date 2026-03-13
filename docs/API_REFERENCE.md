# API Reference

**Sistema de Gestión Académica**

Documentación completa de los endpoints de la API REST con ejemplos de requests y responses.

---

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Admin Endpoints](#admin-endpoints)
3. [Docente Endpoints](#docente-endpoints)
4. [Estudiante Endpoints](#estudiante-endpoints)
5. [Códigos de Error](#códigos-de-error)
6. [Rate Limiting](#rate-limiting)

---

## Autenticación

Todos los endpoints (excepto login) requieren un JWT token en el header:

```
Authorization: Bearer <jwt_token>
```

### POST /api/auth/login

**Descripción:** Iniciar sesión con email y contraseña

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "docente@sira.edu",
    "password": "docente123"
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "email": "docente@sira.edu",
      "nombre": "Juan",
      "apellido": "García",
      "role": "DOCENTE"
    },
    "expiresIn": 2592000
  },
  "message": "Inicio de sesión exitoso"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Email o contraseña incorrectos",
  "code": "INVALID_CREDENTIALS"
}
```

---

### POST /api/auth/logout

**Descripción:** Cerrar sesión (invalidar token)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "message": "Sesión cerrada correctamente"
}
```

---

### POST /api/auth/recuperar-contraseña

**Descripción:** Solicitar recuperación de contraseña

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/recuperar-contraseña \
  -H "Content-Type: application/json" \
  -d '{
    "email": "docente@sira.edu"
  }'
```

**Response (200 OK):**
```json
{
  "message": "Instrucciones de recuperación enviadas al email"
}
```

---

### POST /api/auth/resetear-contraseña

**Descripción:** Resetear contraseña con token

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/resetear-contraseña \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_xxx",
    "nuevaContraseña": "NewPassword123"
  }'
```

**Response (200 OK):**
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

---

## Admin Endpoints

### POST /api/admin/docentes

**Descripción:** Crear un nuevo docente

**Requerimientos:** Rol ADMIN

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/docentes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo.docente@sira.edu",
    "nombre": "Carlos",
    "apellido": "Pérez",
    "numeroEmpleado": "DOC001",
    "departamento": "Ingeniería de Sistemas",
    "password": "TempPassword123"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "docente123",
    "usuario": {
      "id": "user456",
      "email": "nuevo.docente@sira.edu",
      "nombre": "Carlos",
      "apellido": "Pérez",
      "role": "DOCENTE"
    },
    "numeroEmpleado": "DOC001",
    "departamento": "Ingeniería de Sistemas"
  },
  "message": "Docente creado exitosamente"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Email ya existe en el sistema",
  "code": "DUPLICATE_EMAIL"
}
```

---

### GET /api/admin/docentes

**Descripción:** Listar todos los docentes

**Requerimientos:** Rol ADMIN

**Query Parameters:**
- `page` (opcional): Página (default: 1)
- `limit` (opcional): Registros por página (default: 20)
- `buscar` (opcional): Buscar por nombre o email

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/docentes?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "docente123",
      "usuario": {
        "id": "user456",
        "email": "carlos.perez@sira.edu",
        "nombre": "Carlos",
        "apellido": "Pérez",
        "role": "DOCENTE",
        "estado": true
      },
      "numeroEmpleado": "DOC001",
      "departamento": "Ingeniería"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

### PUT /api/admin/docentes/:id

**Descripción:** Actualizar datos de un docente

**Requerimientos:** Rol ADMIN

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/docentes/docente123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos Andrés",
    "departamento": "Ingeniería de Software"
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "docente123",
    "usuario": {
      "nombre": "Carlos Andrés",
      "departamento": "Ingeniería de Software"
    }
  },
  "message": "Docente actualizado correctamente"
}
```

---

### DELETE /api/admin/docentes/:id

**Descripción:** Eliminar un docente

**Requerimientos:** Rol ADMIN

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/admin/docentes/docente123 \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "message": "Docente eliminado correctamente"
}
```

---

### POST /api/admin/asignaturas

**Descripción:** Crear una nueva asignatura

**Requerimientos:** Rol ADMIN

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/asignaturas \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Matemáticas Avanzadas",
    "codigo": "MAT301",
    "descripcion": "Cálculo diferencial e integral",
    "creditos": 4,
    "docenteId": "docente123"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "asignatura456",
    "nombre": "Matemáticas Avanzadas",
    "codigo": "MAT301",
    "descripcion": "Cálculo diferencial e integral",
    "creditos": 4,
    "docenteId": "docente123"
  },
  "message": "Asignatura creada exitosamente"
}
```

---

### POST /api/admin/asignaturas/:id/estudiantes

**Descripción:** Asignar estudiante a una asignatura

**Requerimientos:** Rol ADMIN

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/asignaturas/asignatura456/estudiantes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "estudianteId": "estudiante789"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "matricula001",
    "estudianteId": "estudiante789",
    "asignaturaId": "asignatura456",
    "fechaMatricula": "2024-01-15T10:30:00Z",
    "estado": "ACTIVA"
  },
  "message": "Estudiante asignado a la asignatura"
}
```

---

### GET /api/admin/reportes/asistencia

**Descripción:** Obtener reportes de asistencia global

**Requerimientos:** Rol ADMIN

**Query Parameters:**
- `desde` (opcional): Fecha inicio (YYYY-MM-DD)
- `hasta` (opcional): Fecha fin (YYYY-MM-DD)
- `asignaturaId` (opcional): Filtrar por asignatura

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/reportes/asistencia?desde=2024-01-01&hasta=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": {
    "periodo": {
      "desde": "2024-01-01",
      "hasta": "2024-01-31"
    },
    "resumen": {
      "totalClases": 120,
      "totalRegistros": 2400,
      "presentes": 2280,
      "ausentes": 80,
      "tardanzas": 40,
      "justificadas": 0,
      "porcentajeAsistencia": 95.0
    },
    "porAsignatura": [
      {
        "asignatura": "Matemáticas I",
        "codigo": "MAT101",
        "presentes": 450,
        "ausentes": 20,
        "tardanzas": 10,
        "porcentaje": 94.7
      }
    ]
  }
}
```

---

## Docente Endpoints

### GET /api/docente/asignaturas

**Descripción:** Listar asignaturas del docente autenticado

**Requerimientos:** Rol DOCENTE

**Request:**
```bash
curl -X GET http://localhost:3000/api/docente/asignaturas \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "asignatura456",
      "nombre": "Matemáticas Avanzadas",
      "codigo": "MAT301",
      "creditos": 4,
      "descripcion": "Cálculo diferencial e integral",
      "estudiantesMatriculados": 45,
      "clasesDictadas": 12,
      "clasesProximas": 3
    }
  ],
  "message": "Asignaturas obtenidas correctamente"
}
```

---

### GET /api/docente/asignaturas/:id/estudiantes

**Descripción:** Listar estudiantes de una asignatura

**Requerimientos:** Rol DOCENTE (debe ser el docente de la asignatura)

**Request:**
```bash
curl -X GET http://localhost:3000/api/docente/asignaturas/asignatura456/estudiantes \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "estudiante789",
      "codigoEstudiante": "EST001",
      "nombre": "Juan",
      "apellido": "Rodríguez",
      "email": "juan.rodriguez@sira.edu",
      "semestre": 3,
      "programa": "Ingeniería de Sistemas",
      "asistencias": {
        "total": 12,
        "presente": 11,
        "ausente": 1,
        "tardanzas": 0,
        "porcentaje": 91.7
      }
    }
  ],
  "total": 45
}
```

---

### POST /api/docente/clases

**Descripción:** Crear una nueva clase

**Requerimientos:** Rol DOCENTE

**Request:**
```bash
curl -X POST http://localhost:3000/api/docente/clases \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "asignaturaId": "asignatura456",
    "fecha": "2024-01-20",
    "horaInicio": "09:00",
    "horaFin": "10:30",
    "tema": "Introducción a Derivadas"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "clase001",
    "asignaturaId": "asignatura456",
    "docenteId": "docente123",
    "fecha": "2024-01-20",
    "horaInicio": "2024-01-20T09:00:00Z",
    "horaFin": "2024-01-20T10:30:00Z",
    "tema": "Introducción a Derivadas",
    "estado": "PROGRAMADA"
  },
  "message": "Clase creada exitosamente"
}
```

---

### POST /api/docente/clases/:id/generar-qr

**Descripción:** Generar código QR para registro de asistencia

**Requerimientos:** Rol DOCENTE

**Request:**
```bash
curl -X POST http://localhost:3000/api/docente/clases/clase001/generar-qr \
  -H "Authorization: Bearer <token>"
```

**Response (201 Created):**
```json
{
  "data": {
    "claseId": "clase001",
    "qrToken": "abc123def456ghi789",
    "qrExpiracion": "2024-01-20T10:30:00Z",
    "qrUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk...",
    "validoPor": "60 minutos"
  },
  "message": "Código QR generado exitosamente"
}
```

---

### POST /api/docente/clases/:id/asistencia/manual

**Descripción:** Registrar asistencia manual para estudiantes

**Requerimientos:** Rol DOCENTE

**Request:**
```bash
curl -X POST http://localhost:3000/api/docente/clases/clase001/asistencia/manual \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "asistencias": [
      {
        "estudianteId": "estudiante789",
        "estado": "PRESENTE"
      },
      {
        "estudianteId": "estudiante790",
        "estado": "AUSENTE",
        "justificacion": "Calamidad doméstica"
      }
    ]
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "claseId": "clase001",
    "registrosCreados": 2,
    "detalles": [
      {
        "id": "asistencia001",
        "estudianteId": "estudiante789",
        "estado": "PRESENTE",
        "fechaRegistro": "2024-01-20T10:30:00Z"
      }
    ]
  },
  "message": "Asistencia registrada correctamente"
}
```

---

### POST /api/docente/clases/:id/actividades

**Descripción:** Registrar actividades realizadas en la clase

**Requerimientos:** Rol DOCENTE

**Request:**
```bash
curl -X POST http://localhost:3000/api/docente/clases/clase001/actividades \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "TEORÍA",
    "descripcion": "Explicación de conceptos de derivadas. Se realizaron ejercicios prácticos."
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "actividad001",
    "claseId": "clase001",
    "tipo": "TEORÍA",
    "descripcion": "Explicación de conceptos de derivadas. Se realizaron ejercicios prácticos.",
    "fechaRegistro": "2024-01-20T10:30:00Z"
  },
  "message": "Actividad registrada correctamente"
}
```

---

### PUT /api/docente/clases/:id

**Descripción:** Finalizar clase

**Requerimientos:** Rol DOCENTE

**Request:**
```bash
curl -X PUT http://localhost:3000/api/docente/clases/clase001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "FINALIZADA"
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "clase001",
    "estado": "FINALIZADA",
    "resumen": {
      "estudiantes": 45,
      "presentes": 43,
      "ausentes": 2,
      "tardanzas": 0,
      "actividades": 2
    }
  },
  "message": "Clase finalizada correctamente"
}
```

---

### GET /api/docente/reportes/asistencia

**Descripción:** Obtener reporte de asistencia por asignatura

**Requerimientos:** Rol DOCENTE

**Query Parameters:**
- `asignaturaId` (requerido): ID de la asignatura
- `desde` (opcional): Fecha inicio (YYYY-MM-DD)
- `hasta` (opcional): Fecha fin (YYYY-MM-DD)

**Request:**
```bash
curl -X GET "http://localhost:3000/api/docente/reportes/asistencia?asignaturaId=asignatura456" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": {
    "asignatura": {
      "id": "asignatura456",
      "nombre": "Matemáticas Avanzadas",
      "codigo": "MAT301"
    },
    "periodo": {
      "desde": "2024-01-01",
      "hasta": "2024-01-31"
    },
    "resumen": {
      "totalClases": 12,
      "totalEstudiantes": 45,
      "porcentajePromedio": 92.5
    },
    "porEstudiante": [
      {
        "codigoEstudiante": "EST001",
        "nombre": "Juan Rodríguez",
        "presente": 11,
        "ausente": 1,
        "tardanzas": 0,
        "porcentaje": 91.7
      }
    ]
  }
}
```

---

## Estudiante Endpoints

### GET /api/estudiante/dashboard

**Descripción:** Obtener resumen del dashboard del estudiante

**Requerimientos:** Rol ESTUDIANTE

**Request:**
```bash
curl -X GET http://localhost:3000/api/estudiante/dashboard \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": {
    "estudiante": {
      "id": "estudiante789",
      "codigoEstudiante": "EST001",
      "nombre": "Juan",
      "apellido": "Rodríguez",
      "semestre": 3,
      "programa": "Ingeniería de Sistemas"
    },
    "asignaturas": {
      "total": 5,
      "activas": 5
    },
    "asistencia": {
      "porcentajePromedio": 92.5,
      "alertas": [
        {
          "asignatura": "Física II",
          "porcentaje": 68,
          "nivel": "CRÍTICA"
        }
      ]
    },
    "clasesProximas": [
      {
        "asignatura": "Matemáticas Avanzadas",
        "fecha": "2024-01-25",
        "hora": "09:00",
        "docente": "Carlos Pérez"
      }
    ]
  }
}
```

---

### GET /api/estudiante/asignaturas

**Descripción:** Listar asignaturas matriculadas

**Requerimientos:** Rol ESTUDIANTE

**Request:**
```bash
curl -X GET http://localhost:3000/api/estudiante/asignaturas \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "asignatura456",
      "nombre": "Matemáticas Avanzadas",
      "codigo": "MAT301",
      "creditos": 4,
      "docente": {
        "nombre": "Carlos",
        "apellido": "Pérez",
        "email": "carlos.perez@sira.edu"
      },
      "estado": "ACTIVA",
      "fechaMatricula": "2024-01-15"
    }
  ],
  "total": 5
}
```

---

### GET /api/estudiante/asistencia

**Descripción:** Obtener registro completo de asistencia

**Requerimientos:** Rol ESTUDIANTE

**Query Parameters:**
- `asignaturaId` (opcional): Filtrar por asignatura

**Request:**
```bash
curl -X GET http://localhost:3000/api/estudiante/asistencia \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "asignatura": {
        "id": "asignatura456",
        "nombre": "Matemáticas Avanzadas",
        "codigo": "MAT301"
      },
      "resumen": {
        "totalClases": 12,
        "presente": 11,
        "ausente": 1,
        "tardanzas": 0,
        "justificadas": 0,
        "porcentaje": 91.7
      },
      "detalles": [
        {
          "fecha": "2024-01-15",
          "hora": "09:00",
          "tema": "Introducción a Derivadas",
          "estado": "PRESENTE"
        }
      ]
    }
  ]
}
```

---

### GET /api/estudiante/asistencia/:asignaturaId

**Descripción:** Obtener asistencia detallada por asignatura

**Requerimientos:** Rol ESTUDIANTE

**Request:**
```bash
curl -X GET http://localhost:3000/api/estudiante/asistencia/asignatura456 \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": {
    "asignatura": {
      "id": "asignatura456",
      "nombre": "Matemáticas Avanzadas",
      "codigo": "MAT301",
      "docente": "Carlos Pérez",
      "creditos": 4
    },
    "resumen": {
      "totalClases": 12,
      "presente": 11,
      "ausente": 1,
      "tardanzas": 0,
      "justificadas": 0,
      "porcentaje": 91.7
    },
    "clases": [
      {
        "id": "clase001",
        "fecha": "2024-01-15",
        "horaInicio": "09:00",
        "horaFin": "10:30",
        "tema": "Introducción a Derivadas",
        "estado": "PRESENTE",
        "justificacion": null
      },
      {
        "id": "clase002",
        "fecha": "2024-01-17",
        "horaInicio": "09:00",
        "horaFin": "10:30",
        "tema": "Aplicaciones de Derivadas",
        "estado": "AUSENTE",
        "justificacion": null
      }
    ]
  }
}
```

---

### POST /api/estudiante/asistencia/:id/justificar

**Descripción:** Solicitar justificación de ausencia

**Requerimientos:** Rol ESTUDIANTE

**Request:**
```bash
curl -X POST http://localhost:3000/api/estudiante/asistencia/asistencia002/justificar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "razon": "Cita médica de urgencia",
    "documento": "certificado_medico.pdf",
    "descripcion": "Asistí al médico por emergencia dental"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "justificacion001",
    "asistenciaId": "asistencia002",
    "razon": "Cita médica de urgencia",
    "estado": "PENDIENTE",
    "fechaSolicitud": "2024-01-25T10:30:00Z",
    "documentoUrl": "https://storage.sira.edu/justificaciones/..."
  },
  "message": "Solicitud de justificación enviada"
}
```

---

### POST /api/estudiante/asistencia/qr

**Descripción:** Registrar asistencia mediante escaneo de QR

**Requerimientos:** Rol ESTUDIANTE, QR válido

**Request:**
```bash
curl -X POST http://localhost:3000/api/estudiante/asistencia/qr \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "qrToken": "abc123def456ghi789"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "asistencia003",
    "claseId": "clase001",
    "asignatura": "Matemáticas Avanzadas",
    "fecha": "2024-01-20",
    "hora": "09:30",
    "estado": "PRESENTE",
    "mensaje": "Asistencia registrada exitosamente"
  },
  "message": "Tu asistencia ha sido registrada"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Código QR inválido o expirado",
  "code": "INVALID_QR_CODE"
}
```

---

### GET /api/estudiante/calificaciones

**Descripción:** Obtener calificaciones por asignatura

**Requerimientos:** Rol ESTUDIANTE

**Request:**
```bash
curl -X GET http://localhost:3000/api/estudiante/calificaciones \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "asignatura": {
        "id": "asignatura456",
        "nombre": "Matemáticas Avanzadas",
        "codigo": "MAT301",
        "creditos": 4
      },
      "calificaciones": {
        "parcial1": 4.5,
        "parcial2": 4.2,
        "parcial3": 4.8,
        "trabajos": 4.5,
        "promedio": 4.5,
        "estado": "APROBADO"
      }
    }
  ]
}
```

---

## Códigos de Error

### Errores de Autenticación (4xx)

| Código | Status | Descripción |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Email o contraseña incorrectos |
| `UNAUTHORIZED` | 401 | No autenticado |
| `FORBIDDEN` | 403 | Acceso denegado (permisos insuficientes) |
| `TOKEN_EXPIRED` | 401 | Token expirado |
| `INVALID_TOKEN` | 401 | Token inválido |

### Errores de Validación (400)

| Código | Status | Descripción |
|---|---|---|
| `INVALID_INPUT` | 400 | Input inválido (campos requeridos faltantes) |
| `DUPLICATE_EMAIL` | 400 | Email ya existe |
| `INVALID_EMAIL` | 400 | Formato de email inválido |
| `WEAK_PASSWORD` | 400 | Contraseña muy débil |
| `INVALID_QR_CODE` | 400 | Código QR inválido o expirado |

### Errores de No Encontrado (404)

| Código | Status | Descripción |
|---|---|---|
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `USER_NOT_FOUND` | 404 | Usuario no encontrado |
| `SUBJECT_NOT_FOUND` | 404 | Asignatura no encontrada |
| `CLASS_NOT_FOUND` | 404 | Clase no encontrada |

### Errores de Servidor (5xx)

| Código | Status | Descripción |
|---|---|---|
| `INTERNAL_ERROR` | 500 | Error interno del servidor |
| `DATABASE_ERROR` | 500 | Error en la base de datos |
| `SERVICE_UNAVAILABLE` | 503 | Servicio no disponible |

### Respuesta de Error Estándar

```json
{
  "error": "Descripción del error",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Email inválido"
  }
}
```

---

## Rate Limiting

Todos los endpoints tienen rate limiting:

**Límites:**
- Usuarios autenticados: 100 requests/minuto
- Login: 5 intentos/minuto por IP
- Registros QR: 10 por minuto

**Headers de respuesta:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642099200
```

**Response cuando se excede límite (429):**
```json
{
  "error": "Demasiadas solicitudes",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Paginación

Endpoints que retornan listas usan paginación:

**Query Parameters:**
```
?page=1&limit=20&sort=nombre&order=asc
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Headers Requeridos

| Header | Valor | Requerido Para |
|---|---|---|
| `Authorization` | `Bearer <token>` | Endpoints protegidos |
| `Content-Type` | `application/json` | POST, PUT, PATCH |
| `Accept` | `application/json` | Todos |

---

## Ejemplos Completos con cURL

### Login y obtener token

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "docente@sira.edu",
    "password": "docente123"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"

# Usar token en siguiente request
curl -X GET http://localhost:3000/api/docente/asignaturas \
  -H "Authorization: Bearer $TOKEN"
```

### Crear y usar una clase

```bash
# Crear clase
CLASE_ID=$(curl -s -X POST http://localhost:3000/api/docente/clases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asignaturaId": "asignatura456",
    "fecha": "2024-01-20",
    "horaInicio": "09:00",
    "horaFin": "10:30",
    "tema": "Introducción a Derivadas"
  }' | jq -r '.data.id')

echo "Clase creada: $CLASE_ID"

# Generar QR
curl -X POST http://localhost:3000/api/docente/clases/$CLASE_ID/generar-qr \
  -H "Authorization: Bearer $TOKEN"
```

---

**Última actualización:** 2026-03-13
**Versión:** 1.0

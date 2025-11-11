# API Specification

Este documento proporciona una especificación detallada de los endpoints de la API para el Sistema de Gestión de Asistencia Docente.

---

## 1. Asistencia

### 1.1. Registrar Asistencia por QR

- **Endpoint:** `POST /api/asistencia/scan`
- **Descripción:** Permite a un estudiante registrar su asistencia a una clase escaneando un código QR.
- **Autenticación:** Requerida (rol: ESTUDIANTE).

- **Cuerpo de la Solicitud (Request Body):**

  ```json
  {
    "qrToken": "string"
  }
  ```

- **Respuesta Exitosa (Success Response):**

  - **Código:** `201 Created`
  - **Contenido:**

    ```json
    {
      "data": {
        "id": "string",
        "status": "PRESENTE",
        "recordedAt": "string (ISO 8601)",
        "subject": "string",
        "class": "string"
      },
      "message": "Asistencia registrada con éxito"
    }
    ```

- **Respuestas de Error (Error Responses):**

  - **Código:** `400 Bad Request` (QR inválido, clase no iniciada/finalizada, solicitud inválida).
  - **Código:** `401 Unauthorized` (El usuario no ha iniciado sesión).
  - **Código:** `403 Forbidden` (El usuario no es un estudiante o no está matriculado en la asignatura).
  - **Código:** `409 Conflict` (La asistencia para esa clase ya fue registrada).
  - **Código:** `429 Too Many Requests` (Se ha superado el límite de intentos).
  - **Código:** `500 Internal Server Error` (Error inesperado en el servidor).

---

## 2. Autenticación

### 2.1. Solicitar Restablecimiento de Contraseña

- **Endpoint:** `POST /api/auth/forgot-password`
- **Descripción:** Inicia el proceso de restablecimiento de contraseña. Genera un token único y lo envía al correo del usuario.
- **Autenticación:** No requerida.

- **Cuerpo de la Solicitud (Request Body):**

  ```json
  {
    "correo": "string"
  }
  ```

- **Respuesta Exitosa (Success Response):**

  - **Código:** `200 OK`
  - **Contenido:**

    ```json
    {
      "message": "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña."
    }
    ```

- **Respuestas de Error (Error Responses):**

  - **Código:** `400 Bad Request` (El correo es requerido).
  - **Código:** `404 Not Found` (No se encontró un usuario con ese correo).
  - **Código:** `500 Internal Server Error` (Error al enviar el correo o error interno).

### 2.2. Restablecer Contraseña

- **Endpoint:** `POST /api/auth/reset-password`
- **Descripción:** Finaliza el proceso de restablecimiento de contraseña utilizando el token y la nueva contraseña proporcionada.
- **Autenticación:** No requerida.

- **Cuerpo de la Solicitud (Request Body):**

  ```json
  {
    "token": "string",
    "password": "string"
  }
  ```

- **Respuesta Exitosa (Success Response):**

  - **Código:** `200 OK`
  - **Contenido:**

    ```json
    {
      "message": "Contraseña restablecida con éxito. Ahora puedes iniciar sesión con tu nueva contraseña."
    }
    ```

- **Respuestas de Error (Error Responses):**

  - **Código:** `400 Bad Request` (Faltan parámetros, la contraseña es muy corta, o el token es inválido/expirado).
  - **Código:** `500 Internal Server Error` (Error interno del servidor).

### 2.3. Verificar Token de Restablecimiento

- **Endpoint:** `GET /api/auth/verify-reset-token`
- **Descripción:** Verifica si un token de restablecimiento de contraseña es válido y no ha expirado.
- **Autenticación:** No requerida.

- **Parámetros de Consulta (Query Parameters):**

  - `token` (string): El token de restablecimiento a verificar.

- **Respuesta Exitosa (Success Response):**

  - **Código:** `200 OK`
  - **Contenido:**

    ```json
    {
      "valid": true,
      "message": "Token válido",
      "correoInstitucional": "string",
      "correoPersonal": "string"
    }
    ```

- **Respuestas de Error (Error Responses):**

  - **Código:** `400 Bad Request` (Token no proporcionado, inválido o expirado).
  - **Código:** `500 Internal Server Error` (Error interno del servidor).

---

## 3. Docente

### 3.1. Dashboard del Docente

- **Endpoint:** `GET /api/docente/dashboard`
- **Descripción:** Devuelve un resumen de las asignaturas del docente, su progreso y las próximas clases.
- **Autenticación:** Requerida (rol: DOCENTE).

- **Respuesta Exitosa (Success Response):**

  - **Código:** `200 OK`
  - **Contenido:**

    ```json
    {
      "subjects": [
        {
          "id": "string",
          "name": "string",
          "code": "string",
          "totalClasses": 10,
          "completedClasses": 4,
          "nextClass": {
            "id": "string",
            "date": "2025-08-05T09:00:00.000Z",
            "topic": "string"
          }
        }
      ],
      "upcomingClasses": [
        {
          "id": "string",
          "subjectId": "string",
          "subjectName": "string",
          "subjectCode": "string",
          "date": "2025-08-05T09:00:00.000Z",
          "topic": "string"
        }
      ]
    }
    ```

- **Respuestas de Error (Error Responses):**

  - **Código:** `401 Unauthorized` (El usuario no ha iniciado sesión o no es DOCENTE).
  - **Código:** `500 Internal Server Error` (Error interno del servidor).

### 3.2. Gestión de Clases

#### 3.2.1. Obtener Detalles de una Clase

- **Endpoint:** `GET /api/docente/clases/[classId]`
- **Descripción:** Obtiene los detalles de una clase específica.
- **Autenticación:** Requerida (rol: DOCENTE).

- **Respuesta Exitosa:**

  - **Código:** `200 OK`
  - **Contenido:**

    ```json
    {
      "data": {
        "id": "string",
        "subjectId": "string",
        "date": "2025-08-04T07:00:00.000Z",
        "topic": "string",
        "status": "PROGRAMADA | REALIZADA | CANCELADA",
        "subject": {
          "id": "string",
          "name": "string",
          "code": "string",
          "teacherId": "string"
        }
      }
    }
    ```

- **Respuestas de Error:**

  - **Código:** `403 Forbidden` (Sin permiso).
  - **Código:** `404 Not Found` (Clase no encontrada).
  - **Código:** `500 Internal Server Error`.

#### 3.2.2. Actualizar una Clase

- **Endpoint:** `PUT /api/docente/clases/[classId]`
- **Descripción:** Actualiza la información de la clase; si se cancela, notifica por correo a los estudiantes.
- **Autenticación:** Requerida (rol: DOCENTE).

- **Cuerpo de la Solicitud (Request Body):**

  ```json
  {
    "date": "2025-08-10T07:00:00.000Z",
    "topic": "string",
    "status": "CANCELADA",
    "reason": "string"
  }
  ```

- **Respuesta Exitosa:** `200 OK` (Misma estructura que el GET de detalles).

- **Respuestas de Error:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.

#### 3.2.3. Eliminar una Clase

- **Endpoint:** `DELETE /api/docente/clases/[classId]`
- **Descripción:** Elimina la clase indicada.
- **Autenticación:** Requerida (rol: DOCENTE).

- **Respuesta Exitosa:**

  ```json
  {
    "data": { /* detalles */ },
    "message": "Clase eliminada con éxito"
  }
  ```

- **Respuestas de Error:** `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.

### 3.3. Generar QR para Asistencia

- **Endpoint:** `POST /api/docente/clases/[classId]/generar-qr`
- **Descripción:** Genera un token QR con expiración de 5 minutos para que los estudiantes registren su asistencia.
- **Autenticación:** Requerida (rol: DOCENTE).

- **Respuesta Exitosa:**

  ```json
  {
    "data": {
      "qrUrl": "string",
      "qrToken": "string",
      "expiresAt": "2025-08-04T12:00:00.000Z"
    },
    "message": "Token QR generado correctamente"
  }
  ```

- **Respuestas de Error:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`.

### 3.4. Gestión de Asistencia de una Clase

#### 3.4.1. Obtener Lista de Asistencia

- **Endpoint:** `GET /api/docente/clases/[classId]/asistencia`
- **Descripción:** Devuelve la lista de estudiantes matriculados en la asignatura y su estado de asistencia.
- **Autenticación:** Requerida (rol: DOCENTE).

- **Respuesta Exitosa:**

  ```json
  {
    "data": [
      {
        "studentId": "string",
        "name": "string",
        "email": "string",
        "status": "PRESENTE | AUSENTE | EXCUSADO"
      }
    ]
  }
  ```

- **Respuestas de Error:** `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

#### 3.4.2. Guardar o Actualizar Asistencia

- **Endpoint:** `POST /api/docente/clases/[classId]/asistencia`
- **Descripción:** Registra o actualiza masivamente el estado de asistencia de los estudiantes para una clase.
- **Autenticación:** Requerida (rol: DOCENTE).

- **Cuerpo de la Solicitud (Request Body):**

  ```json
  {
    "attendances": [
      {
        "studentId": "string",
        "status": "PRESENTE | AUSENTE | EXCUSADO"
      }
    ]
  }
  ```

- **Respuesta Exitosa:**

  ```json
  {
    "message": "Asistencia guardada con éxito"
  }
  ```

- **Respuestas de Error:** `400 Bad Request`, `403 Forbidden`, `500 Internal Server Error`.

---

## 4. Admin

### 4.1. Cargar Estudiantes a Asignaturas (Excel)

- **Endpoint:** `POST /api/admin/cargar-estudiantes-asignaturas?preview=true`
- **Descripción:** Previsualiza un archivo Excel para cargar estudiantes a asignaturas. Devuelve detalles de validación sin modificar la base de datos.
- **Autenticación:** Requerida (rol: ADMIN).
- **Request (multipart/form-data):** campo `file` con un `.xlsx`.
- **Respuesta Exitosa:** `200 OK` con un arreglo `previewData` que indica, por asignatura, qué estudiantes se crearán/avisos de error.

#### 4.1.1. Confirmar Carga

- **Endpoint:** `POST /api/admin/cargar-estudiantes-asignaturas`
- **Descripción:** Recibe el `previewData` previamente validado y actualiza las asignaturas agregando los estudiantes.
- **Request Body:**

  ```json
  {
    "previewData": [
      {
        "codigoAsignatura": "INF101",
        "estudiantes": [
          {
            "doc": "123",
            "status": "success",
            "message": "Listo para inscribir"
          }
        ]
      }
    ]
  }
  ```

- **Respuestas:** `200 OK` (resumen de cambios), `400 Bad Request` (formato inválido), `401/403` no autorizado, `500` error de servidor.

### 4.2. Cargar Usuarios Masivamente (Excel)

- **Endpoint:** `POST /api/admin/cargar-usuarios?preview=true`
- **Descripción:** Previsualiza un Excel con usuarios a crear. Devuelve validaciones sin persistir.
- **Confirmación:** `POST /api/admin/cargar-usuarios` con `{ "previewData": [...] }` para crear y enviar correos.
- **Errores:** `400` formato inválido, `401/403` no autorizado, `409` correos duplicados, `500` interno.

### 4.3. Gestión de Solicitudes de Desmatriculación

#### 4.3.1. Listar Solicitudes Pendientes

- **Endpoint:** `GET /api/admin/solicitudes`
- **Descripción:** Obtiene todas las solicitudes de desmatriculación con estado *PENDIENTE*.
- **Respuesta Exitosa:**

  ```json
  [
    {
      "id": "string",
      "student": { "id": "string", "name": "string" },
      "subject": { "id": "string", "name": "string" },
      "requestedBy": { "name": "string" },
      "createdAt": "ISO 8601"
    }
  ]
  ```

#### 4.3.2. Aprobar / Rechazar Solicitud

- **Endpoint:** `POST /api/admin/solicitudes`
- **Request Body:**

  ```json
  {
    "requestId": "string",
    "action": "approve | reject",
    "reason": "string" // obligatorio si reject
  }
  ```

- **Respuesta:** `200 OK` con la solicitud actualizada. Errores comunes: `400` datos faltantes, `401/403`, `404` no encontrada, `500`.

### 4.4. Gestión de Usuarios

#### 4.4.1. Listar Usuarios

- **Endpoint:** `GET /api/admin/users`
- **Query Params:** `role` (opcional) filtra por rol.
- **Respuesta:** `200 OK` con lista de usuarios (sin contraseñas).

#### 4.4.2. Crear Usuario

- **Endpoint:** `POST /api/admin/users`
- **Request Body:**

  ```json
  {
    "name": "string",
    "password": "string",
    "role": "ADMIN | DOCENTE | ESTUDIANTE",
    "document": "string",
    "correoPersonal": "string", // opcional si se provee institucional
    "correoInstitucional": "string" // opcional si se provee personal
  }
  ```

- **Respuestas:** `201 Created`, `400` faltan campos, `403` no autorizado, `409` correo duplicado, `500`.

#### 4.4.3. Actualizar Usuario

- **Endpoint:** `PATCH /api/admin/users/[userId]`
- **Descripción:** Modifica campos permitidos de un usuario.
- **Respuesta Exitosa:** `200 OK` con usuario actualizado.
- **Errores:** `400` validación, `403` no autorizado, `409` correos duplicados, `500`.

#### 4.4.4. Eliminar Usuario

- **Endpoint:** `DELETE /api/admin/users/[userId]`
- **Descripción:** Elimina un usuario; no se permite que un admin se elimine a sí mismo.
- **Respuestas:** `200 OK` éxito, `400` intento de auto-eliminación, `403` no autorizado, `409` registros asociados, `500`.

---

## 5. Estudiante

### 5.1. Dashboard del Estudiante

- **Endpoint:** `GET /api/estudiante/dashboard`
- **Descripción:** Devuelve estadísticas generales de asistencia, un resumen por asignatura y eventos o clases próximas.
- **Autenticación:** Requerida (rol: ESTUDIANTE).

- **Respuesta Exitosa:**

```json
{
  "cards": {
    "totalClasses": 50,
    "attendedClasses": 45,
    "globalAttendancePercentage": 90,
    "subjectsAtRisk": 1,
    "weeklyAttendanceAverage": 85
  },
  "subjects": [
    {
      "id": "string",
      "name": "Matemática I",
      "code": "MAT101",
      "teacher": "Prof. Juan Pérez",
      "nextClass": {
        "name": "Clase de Matemática I",
        "date": "2025-08-10",
        "timeUntil": "En 2 días",
        "topic": "Derivadas"
      },
      "attendancePercentage": 88,
      "totalClasses": 16,
      "attendedClasses": 14
    }
  ],
  "upcomingItems": [
    {
      "id": "string",
      "title": "Examen Parcial",
      "code": "MAT101",
      "type": "EXAMEN",
      "date": "2025-08-12",
      "startTime": "10:00",
      "endTime": "12:00",
      "location": "Aula 201",
      "teacher": "Prof. Juan Pérez",
      "subjectName": "Matemática I",
      "description": "Primer parcial",
      "isEvent": true
    }
  ]
}
```

- **Respuestas de Error:** `401 Unauthorized`, `500 Internal Server Error`.

### 5.2. Clase Actual

- **Endpoint:** `GET /api/estudiante/current-class`
- **Descripción:** Devuelve la clase en curso (o que inicia/finaliza ±30 min) junto con estadísticas de asistencia en tiempo real.
- **Autenticación:** Requerida (rol: ESTUDIANTE).

- **Respuesta Exitosa:**

```json
{
  "liveClass": {
    "id": "string",
    "subjectName": "Matemática I",
    "teacherName": "Prof. Juan Pérez",
    "topic": "Derivadas",
    "date": "2025-08-04",
    "startTime": "10:00",
    "endTime": "12:00",
    "qrToken": "abcd1234",
    "attendanceStats": {
      "present": 20,
      "absent": 3,
      "late": 2,
      "justified": 1
    },
    "totalStudents": 26,
    "myStatus": "PRESENTE",
    "classroom": "Aula 201"
  }
}
```

Si no hay clase vigente:

```json
{
  "liveClass": null
}
```

- **Respuestas de Error:** `401 Unauthorized`, `500 Internal Server Error`.

### 5.3. Historial de Asistencias

- **Endpoint:** `GET /api/estudiante/historial`
- **Descripción:** Devuelve el historial completo de asistencias del estudiante.
- **Autenticación:** Requerida (rol: ESTUDIANTE).

- **Respuesta Exitosa:**

```json
{
  "message": "Historial obtenido correctamente",
  "data": [
    {
      "id": "string",
      "status": "PRESENTE | AUSENTE | TARDANZA | JUSTIFICADO",
      "recordedAt": "2025-08-03T10:05:00Z",
      "class": {
        "id": "string",
        "topic": "Introducción",
        "date": "2025-08-03",
        "subject": {
          "name": "Matemática I"
        }
      }
    }
  ]
}
```

- **Respuestas de Error:** `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.

---

## Optimizaciones de Rendimiento

### Caché Redis

Los siguientes endpoints utilizan caché Redis para mejorar el rendimiento:

- `GET /api/estudiante/dashboard` - TTL: 5 minutos
- `GET /api/docente/dashboard` - TTL: 5 minutos

**Invalidación de Caché**: El caché se invalida automáticamente cuando se actualizan datos relevantes:
- Crear/actualizar/eliminar eventos (`POST/PUT/DELETE /api/docente/eventos`)
- Crear/actualizar/eliminar clases (`POST/PUT/DELETE /api/docente/clases`)
- Actualizar asistencias (`POST /api/docente/clases/[classId]/asistencia`)
- Escanear QR para asistencia (`POST /api/asistencia/scan`)
- Justificar ausencias (`POST /api/justificar-ausencia`)

**Nota**: Si Redis no está configurado, los endpoints funcionarán normalmente pero sin caché, resultando en tiempos de respuesta más lentos.

### Índices de Base de Datos

Se han agregado índices en las siguientes tablas para optimizar las queries:

- **Class**: `[subjectId, status, date]`, `[subjectId, date]`, `[status, date]`, `[qrToken]`
- **Attendance**: `[studentId, status]`, `[classId, status]`
- **Subject**: `[teacherId]`

**Impacto**: Queries hasta 10x más rápidas en colecciones grandes.

Ver [Documentación de Optimizaciones](./05_OPTIMIZATIONS.md) para más detalles.

---

## Notas Adicionales

- Todos los endpoints requieren autenticación excepto los de autenticación y recuperación de contraseña.
- Las respuestas de error incluyen un campo `message` con una descripción del error.
- Los tokens JWT expiran después de 30 días.
- Las fechas se manejan en formato ISO 8601.
- Los endpoints de dashboard utilizan caché Redis para mejorar el rendimiento (opcional).
- Los índices de base de datos mejoran significativamente el rendimiento de las queries más frecuentes.

---

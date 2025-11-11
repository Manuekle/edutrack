# Diagrama de Secuencia - Flujo Completo de Asistencia QR

Este documento describe el flujo completo para la gestión de asistencia, desde que el docente inicia la clase hasta que el estudiante registra su asistencia.

## 1. Generación del Código QR

Este diagrama muestra cómo el docente inicia una clase y el sistema genera el código QR correspondiente.

```mermaid
sequenceDiagram
    participant D as Docente
    participant S as Sistema
    participant DB as Base de Datos

    D->>S: Iniciar Clase (POST /api/docente/clases/[id]/generar-qr)
    S->>DB: Actualizar estado de la clase a "ACTIVA"
    S->>S: Generar token QR único y con tiempo de expiración
    S->>DB: Guardar token QR asociado a la clase
    S-->>D: Mostrar código QR en la interfaz
```

## 2. Registro de Asistencia del Estudiante

Este diagrama muestra el proceso cuando un estudiante escanea el código QR para registrar su asistencia.

```mermaid
sequenceDiagram
    participant E as Estudiante
    participant FE as Frontend
    participant BE as Backend (API)
    participant Cache as Redis Cache
    participant DB as Base de Datos

    E->>FE: Escanea Código QR
    FE->>BE: POST /api/asistencia/scan (con token del QR)
    BE->>Cache: Verificar caché (opcional)
    Cache-->>BE: No encontrado en caché
    BE->>DB: Buscar token QR en la base de datos
    alt Token Válido y Activo
        DB-->>BE: Token encontrado y válido
        BE->>DB: Verificar inscripción del estudiante en la asignatura
        DB-->>BE: Estudiante inscrito
        BE->>DB: Registrar asistencia como "PRESENTE"
        BE->>Cache: Invalidar caché del dashboard del estudiante
        BE->>Cache: Invalidar caché del dashboard del docente
        DB-->>BE: Confirmación de registro
        BE-->>FE: Respuesta de Éxito (200)
        FE-->>E: Mostrar mensaje de confirmación
    else Token Inválido o Expirado
        DB-->>BE: Token no encontrado o expirado
        BE-->>FE: Respuesta de Error (400/403)
        FE-->>E: Mostrar mensaje de error (QR inválido, etc.)
    end
```

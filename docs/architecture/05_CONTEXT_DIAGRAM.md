# Diagrama de Contexto

```mermaid
graph TD
    %% Usuarios del Sistema
    A[Estudiante] -->|Interactúa con| B(Interfaz Web)
    C[Docente] -->|Interactúa con| B
    D[Administrador] -->|Administra| B
    
    %% Interacciones principales
    B -->|API Requests| E{Servidor Next.js}
    E -->|Autenticación| F[NextAuth]
    E -->|Datos| G[Prisma ORM]
    G -->|Persistencia| H[(MongoDB Atlas)]
    
    %% Servicios Externos
    E -->|Envío de emails| I[Email Queue]
    I -->|Procesa cola| J[Nodemailer]
    E -->|Generación de PDFs| K[PDFKit]
    E -->|Generación de QR| L[QR Code]
    E -->|Caché| M[Redis]
    
    %% Subsistemas
    subgraph "Aplicación Web (Vercel)"
        B[Next.js Frontend]
        E[API Routes]
        F
        G
    end
    
    subgraph "Servicios Externos"
        I
        J
        K
        M
    end
    
    subgraph "Almacenamiento"
        H
        M
    end
```

## Descripción de las Interacciones

1. **Usuarios**:
   - **Estudiantes**: Registran asistencia, consultan su historial.
   - **Docentes**: Gestionan clases, generan códigos QR, revisan asistencias.
   - **Administradores**: Gestionan usuarios, asignaturas y reportes.

2. **Servicios Principales**:
   - **Autenticación**: Gestionada por NextAuth con soporte para múltiples proveedores.
   - **API Routes**: Endpoints RESTful para operaciones del sistema.
   - **ORM**: Prisma como capa de abstracción sobre MongoDB.

3. **Integraciones Externas**:
   - **Email Queue**: Sistema de cola de correos con reintentos automáticos.
   - **Nodemailer**: Para envío de notificaciones por correo.
   - **PDFKit**: Generación de reportes en formato PDF.
   - **QR Code**: Generación de códigos QR para registro de asistencia.
   - **Redis**: Sistema de caché para optimizar rendimiento (dashboards, autenticación).

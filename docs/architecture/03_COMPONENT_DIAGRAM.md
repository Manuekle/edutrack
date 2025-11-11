# Diagrama de Componentes

```mermaid
graph TD
    subgraph "Frontend (Next.js App Router)"
        A["Componentes UI (shadcn)"]
        B["Páginas y Layouts"]
        C["Hooks y Contextos"]
        D["Servicios API (cliente)"]
        
        A --> B
        B --> C
        B --> D
    end

    subgraph "Backend (API Routes)"
        E["Autenticación (NextAuth)"]
        F["Gestión de Usuarios"]
        G["Gestión de Asistencias"]
        H["Gestión de Clases"]
        I["Generación de Reportes"]
        J["Gestión de Asignaturas"]
        
        F --> E
        G --> E
        H --> E
        I --> E
        J --> E
    end

    subgraph "Capa de Datos"
        K["Prisma Client"]
        L["Modelos de Datos"]
        M["Consultas y Mutaciones"]
        
        K --> L
        M --> K
    end
    
    subgraph "Servicios Externos"
        N["Nodemailer (Emails)"]
        O["PDFKit (Reportes)"]
        P["QR Code (Generación)"]
        Q["Redis (Caché)"]
        R["Email Queue (Cola de Correos)"]
    end
    
    %% Conexiones entre capas
    D --> E
    D --> F
    D --> G
    D --> H
    D --> I
    D --> J
    
    E --> K
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    
    I --> O
    G --> P
    F --> N
    F --> R
    R --> N
    E --> Q
    F --> Q
    G --> Q
    H --> Q
    I --> Q
    J --> Q
    
    A -- "Se usan en" --> B
    C -- "Manejan estado en" --> B
    B -- "Realizan peticiones a" --> D
    D -- "Usan" --> E
    D -- "Acceden a datos vía" --> F
    F -- "Se basa en" --> G
    G -- "Define la estructura de" --> H
```

## Descripción de los Componentes

### Frontend

- **Componentes UI**: Biblioteca de componentes reutilizables de shadcn/ui
- **Páginas y Layouts**: Estructura de rutas y plantillas de la aplicación
- **Hooks y Contextos**: Gestión de estado global (autenticación, temas, etc.)
- **Servicios API**: Cliente para consumir los endpoints del backend

### Backend

- **Autenticación**: Gestión de sesiones y autorización
- **Gestión de Usuarios**: CRUD de usuarios, roles y permisos
- **Gestión de Asistencias**: Registro y consulta de asistencias
- **Gestión de Clases**: Programación y seguimiento de clases
- **Generación de Reportes**: Creación de informes en PDF
- **Gestión de Asignaturas**: Administración de materias y matrículas

### Capa de Datos

- **Prisma Client**: ORM para interactuar con MongoDB
- **Modelos de Datos**: Definición de entidades y relaciones
- **Consultas y Mutaciones**: Operaciones específicas de la base de datos

### Servicios Externos

- **Nodemailer**: Envío de notificaciones por correo electrónico
- **PDFKit**: Generación de documentos PDF para reportes
- **QR Code**: Generación de códigos QR para registro de asistencia
- **Redis**: Sistema de caché para optimizar rendimiento (dashboards, autenticación)
- **Email Queue**: Sistema de cola de correos con reintentos automáticos

## Base de Datos

El sistema utiliza **MongoDB** como base de datos principal, accedida a través de Prisma ORM. Los datos se almacenan en **MongoDB Atlas** en la nube.

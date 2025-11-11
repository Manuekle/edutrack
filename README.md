# 🎓 Sistema de Gestión de Asistencias (FUP)

<div align="center">
  <img src="https://fup.edu.co/wp-content/uploads/brand-white.svg" alt="Logo FUP" width="150"/>
  <p>
    <strong>Proyecto de Grado para la Fundación Universitaria de Popayán</strong>
  </p>
  <p>
    Una solución moderna para automatizar el seguimiento de la asistencia estudiantil mediante roles, QR dinámicos y reportes en tiempo real.
  </p>
</div>

---

## 🎯 Objetivo del Proyecto

Digitalizar y automatizar el proceso de registro de asistencia en la FUP, eliminando el registro manual tradicional y proporcionando herramientas analíticas para el seguimiento académico estudiantil.

---

## ✨ Características Principales

### 👤 **Gestión por Roles**

- ✅ Sistema de autenticación y autorización con 3 niveles (Admin, Docente, Estudiante).
- ✅ Paneles de control personalizados para cada rol.
- ✅ Gestión segura de perfiles y credenciales.

### 📚 **Gestión Académica**

- ✅ Creación y administración de asignaturas.
- ✅ Inscripción de estudiantes.
- ✅ Programación y gestión de clases.
- ✅ Cronograma académico integrado.

### 📱 **Sistema QR Inteligente**

- ✅ Generación automática de códigos QR únicos por clase.
- ✅ Validación temporal para evitar fraudes.
- ✅ Regeneración dinámica para mayor seguridad.

### 📊 **Registro, Dashboard y Analíticas**

- ✅ Marcado automático de asistencia vía escaneo QR.
- ✅ Ajustes y registros manuales para casos especiales.
- ✅ Dashboard de cumplimiento (docentes al día vs. en mora).
- ✅ Porcentaje de bitácoras completadas y conteo de temas impartidos.
- ✅ Reportes estadísticos descargables (PDF, Excel) para docentes y administradores.

### 🔔 **Comunicaciones y Notificaciones**

- ✅ Envío de correos a cuentas institucionales y personales.

### 🏫 **Gestión de Aulas y Recursos**

- ✅ Sistema de reserva de aulas con calendario interactivo
- ✅ Gestión de inventario de recursos tecnológicos (proyectores, equipos, etc.)
- ✅ Validación de disponibilidad en tiempo real
- ✅ Notificaciones automáticas de reservas
- ✅ Panel de administración de solicitudes

### 🛠️ **Herramientas y Utilidades**

- ✅ Módulo de carga masiva de datos (CSV/Excel) con validación y rollback.
- ✅ Sistema de observaciones para clases canceladas o no impartidas.
- ✅ Integración con Outlook para sincronizar eventos académicos.

---

## 📚 Documentación Completa

Toda la documentación detallada del proyecto, incluyendo la visión, arquitectura, historias de usuario y especificaciones de la API, se encuentra centralizada en la carpeta `/docs`.

### **[➡️ Documentación Completa](./docs/README.md)**

---

## 📋 Estado del Desarrollo - ACTUALIZADO

### 📊 Progreso del Proyecto  
  
| Fase                       | Progreso | Estado         |  
| -------------------------- | -------- | -------------- |  
| **1. Planeación**          | 100%     | ✅ Completado  |  
| **2. Desarrollo Backend**  | 98%      | ✅ Casi completo |  
| **3. Desarrollo Frontend** | 95%      | ✅ Casi completo |  
| **4. Optimizaciones**      | 90%      | ✅ Completado  |  
| **5. Testing**             | 45%      | 🚧 En progreso |  
| **6. Despliegue**          | 70%      | 🚧 En progreso |  
  
### 🎯 Funcionalidades Completadas  
  
#### ✅ Panel de Administración (100%)  

- Gestión completa de usuarios (CRUD)  
- Carga masiva de datos  
- Dashboard con analíticas  
- Reportes administrativos
- Gestión de aulas y recursos tecnológicos
- Aprobación de solicitudes de reserva
- Calendario general de ocupación  
  
#### ✅ Panel Docente (95%)  

- Generación de códigos QR  
- Control de asistencia manual  
- Generación de reportes PDF  
- Dashboard con estadísticas
- Solicitud de reserva de aulas y recursos
- Calendario personal de reservas
- Historial de solicitudes  
  
#### ✅ Panel Estudiante (90%)  

- Escaneo de códigos QR  
- Historial de asistencias  
- Visualización de estadísticas personales
- Dashboard con próximas clases y eventos

#### ✅ Optimizaciones de Rendimiento (90%)

- **Sistema de caché Redis** para dashboards (TTL: 5 minutos)
- **Eliminación de N+1 queries** en APIs críticas
- **Índices de base de datos** para mejorar rendimiento
- **Separación de componentes React** para mejor mantenibilidad
- **Optimización de polling** (reducción del 80% en requests)
- **Persistencia de tema** (modo oscuro/claro)
- **Invalidación automática de caché** cuando se actualizan datos
- **Soporte para 200+ usuarios simultáneos**

**Métricas de Rendimiento**:
- Reducción del 90% en tiempo de respuesta (con caché)
- Reducción del 80% en requests al servidor
- Reducción del 95% en queries a la base de datos

Ver [Documentación de Optimizaciones](./docs/05_OPTIMIZATIONS.md) para más detalles.

#### 🚧 Funcionalidades en Desarrollo  

- Notificaciones por email (parcialmente implementado)
- Integración con calendario Outlook  
- Testing automatizado completo  

#### ⏳ Funcionalidades Pendientes

- Módulo de backup automático
- React Query para caché del lado del cliente
- Paginación en listas grandes
- WebSockets/Server-Sent Events para actualizaciones en tiempo real

Ver [Estado del Proyecto](./docs/06_PROJECT_STATUS.md) para más detalles sobre lo que falta para completar el proyecto al 100%.

---

## ⚙️ Stack Tecnológico

| Categoría         | Tecnología / Herramienta                              |
| ----------------- | ----------------------------------------------------- |
| **Frontend**      | Next.js 14, React, TypeScript, Tailwind CSS           |
| **UI Components** | shadcn/ui                                             |
| **Backend**       | Next.js API Routes                                    |
| **Base de Datos** | MongoDB Atlas                                         |
| **ORM**           | Prisma ORM (importado como 'db' desde '@/lib/prisma') |
| **Autenticación** | NextAuth.js (JWT)                                     |
| **Formularios**   | Zod + React Hook Form                                 |
| **Deployment**    | Vercel                                                |
| **Testing**       | Jest, Cypress                                         |
| **CI/CD**         | GitHub Actions                                        |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Base de       │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   Datos         │
│                 │    │                 │    │   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   Business      │    │   Data Layer    │
│   shadcn/ui     │    │   Logic         │    │   Prisma ORM    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚦 Inicio Rápido  
  
### **Prerrequisitos**  
  
- Node.js (v18+)  
- npm (v9+)  
- Una cuenta de MongoDB Atlas  
  
### **Instalación**  
  
1. **Clonar el repositorio:**  

    ```bash  
    git clone https://github.com/Manuekle/edutrack.git  
    cd edutrack  
    ```  
  
2. **Instalar dependencias:**  

    ```bash  
    npm install  
    ```  
  
3. **Configurar variables de entorno:**  

    ```bash  
    cp .env.example .env.local  
    ```  
  
4. **Sincronizar la base de datos:**  

    ```bash  
    npx prisma db push  
    npx prisma db seed  
    ```  
  
5. **Ejecutar el proyecto:**  

    ```bash  
    npm run dev  
    ```  
  
---  

## 🤝 Contribución

Este es un proyecto académico, pero las sugerencias son bienvenidas.

1. Fork del repositorio.
2. Crear una nueva rama para tu feature (`git checkout -b feature/AmazingFeature`).
3. Realizar un commit con tus cambios (`git commit -m 'feat: Add some AmazingFeature'`).
4. Hacer push a la rama (`git push origin feature/AmazingFeature`).
5. Abrir un Pull Request.

---

## 📞 Soporte y Contacto

**Desarrollador Principal**: Manuel Esteban Erazo Medina  
**Email**: <manuel.erazo@estudiante.fup.edu.co>  
**Institución**: Fundación Universitaria de Popayán (FUP)  
**Proyecto**: Trabajo de Grado - Ingeniería de Sistemas

**Repositorio**: [Manuekle/edutrack](https://github.com/Manuekle/edutrack)  
**Issues**: [Reportar un Bug o Solicitar una Feature](https://github.com/Manuekle/edutrack/issues)
**Documentación**: [Documentación del Proyecto](https://deepwiki.com/Manuekle/edutrack/)

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

> **Nota**: Este es un proyecto académico desarrollado como trabajo de grado para la FUP.

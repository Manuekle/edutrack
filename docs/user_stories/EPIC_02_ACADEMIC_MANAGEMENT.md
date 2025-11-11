# Epic 2: 📚 Gestión Académica Avanzada

## Descripción

Sistema integral para la gestión de asignaturas, docentes y estudiantes, facilitando la administración académica y mejorando la experiencia educativa.

## Historias de Usuario

### HU-004: Carga Masiva de Asignaturas

**Como** administrador académico  
**Quiero** cargar asignaturas de forma masiva  
**Para** organizar la oferta académica de la institución

**Criterios de Aceptación:**

- [x] Carga masiva mediante archivo CSV/Excel con plantilla descargable
- [x] Validación de datos (formato, duplicados, integridad) antes del procesamiento
- [x] Vista previa de datos antes de confirmar carga
- [x] Campos obligatorios: código, nombre, créditos
- [x] Asignación de programas académicos y semestres
- [ ] Horas teóricas/prácticas (pendiente - no implementado en el modelo)
- [ ] Temas (pendiente - no implementado en el modelo)

**Requisitos Técnicos:**

- Código único por asignatura
- Integración con el catálogo académico
- Historial de cambios

**Prioridad:** Alta  
**Story Points:** 8  
**Sprint:** 2  
**Dependencias:** HU-002

---

### HU-005: Dashboard Académico Docente

**Como** docente  
**Quiero** un panel de control centralizado  
**Para** gestionar eficientemente mis asignaturas

**Criterios de Aceptación:**

- [x] Vista resumida de asignaturas activas
- [x] Calendario de clases y eventos (próximas clases y eventos)
- [x] Indicadores clave (asistencia, clases programadas, eventos próximos)
- [x] Accesos rápidos a funciones frecuentes
- [x] Vista móvil optimizada (responsive design)
- [ ] Calificaciones (pendiente - no implementado en el sistema)

**Requisitos de UX:**

- Carga rápida de datos
- Interfaz intuitiva

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 2  
**Dependencias:** HU-004

---

### HU-006: Gestión de Estudiantes por Asignatura

**Como** docente  
**Quiero** administrar estudiantes en mis asignaturas  
**Para** mantener actualizada la matrícula

**Criterios de Aceptación:**

- [x] Listado de estudiantes matriculados
- [x] Búsqueda y filtrado avanzado (parcialmente implementado)
- [x] Inscripción/desinscripción de estudiantes (carga masiva)
- [x] Carga masiva desde archivo (CSV/Excel)
- [x] Solicitudes de desmatriculación (UnenrollRequest)
- [ ] Historial académico por estudiante (pendiente - solo asistencias)
- [ ] Comunicación directa con estudiantes (pendiente)
- [x] Exportación de listados (reportes PDF)

**Requisitos de Seguridad:**

- Control de acceso basado en roles
- Registro de operaciones
- Validación de prerrequisitos

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 3  
**Dependencias:** HU-004

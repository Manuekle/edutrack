# Epic 3: 🕐 Programación y Control de Clases

## Descripción

Sistema completo para la planificación, programación y control de clases, permitiendo una gestión eficiente del tiempo académico y facilitando la coordinación entre docentes y estudiantes.

## Historias de Usuario

### HU-007: Programación de Clases

**Como** docente  
**Quiero** programar mis clases  
**Para** organizar eficientemente mi calendario académico

**Criterios de Aceptación:**

- [x] Creación de clases individuales
- [ ] Clases recurrentes (pendiente)
- [x] Configuración de horarios (startTime, endTime)
- [x] Configuración de aulas (classroom - campo de texto)
- [ ] Modalidad (presencial/virtual) (pendiente - no implementado)
- [ ] Validación de disponibilidad de aulas (pendiente - Epic 9 no implementado)
- [x] Asignación de temas (topic) y descripción
- [ ] Objetivos de aprendizaje (pendiente - no implementado)
- [ ] Configuración de políticas de asistencia (pendiente)
- [x] Vista de calendario de clases
- [x] Notificaciones automáticas a estudiantes (parcialmente implementado - email)

**Requisitos Técnicos:**

- Integración con el sistema de aulas
- Validación de conflictos de horario
- Exportación a formatos estándar (iCal, Google Calendar)

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 3  
**Dependencias:** HU-004, HU-005

---

### HU-008: Control de Asistencia en Tiempo Real

**Como** docente  
**Quiero** gestionar la asistencia de mis clases  
**Para** mantener un registro preciso de participación

**Criterios de Aceptación:**

- [x] Inicio de sesión de asistencia (generación de QR)
- [x] Cierre de sesión de asistencia (marcar clase como REALIZADA o CANCELADA)
- [x] Registro manual de asistencia
- [x] Escaneo de códigos QR para registro automático
- [x] Control de retrasos (estado TARDANZA) y justificaciones (estado JUSTIFICADO)
- [x] Vista en tiempo real de asistencias/ausencias
- [x] Exportación de reportes de asistencia (PDF)
- [ ] Historial de cambios en registros (pendiente - no hay auditoría detallada)

**Requisitos de UX:**

- Interfaz intuitiva para registro rápido
- Retroalimentación visual inmediata
- Modo fuera de línea con sincronización posterior

**Prioridad:** Alta  
**Story Points:** 8  
**Sprint:** 3  
**Dependencias:** HU-007

---

### HU-009: Visualización de Cronograma Académico

**Criterios de Aceptación:**

- [x] Vista semanal/mensual de clases programadas (dashboard)
- [x] Filtros por asignatura (en dashboard de docente)
- [ ] Filtros por tipo de clase (pendiente)
- [x] Indicadores de estado (PROGRAMADA, REALIZADA, CANCELADA)
- [x] Detalles de cada clase con un clic
- [ ] Sincronización con calendarios externos (pendiente - Outlook, Google Calendar)
- [x] Notificaciones de próximas clases (parcialmente implementado - email)
- [x] Vista móvil optimizada (responsive design)

**Requisitos Técnicos:**

- API para integración con otras plataformas
- Sincronización bidireccional con Google/Outlook
- Soporte para modo fuera de línea

**Prioridad:** Media  
**Story Points:** 8  
**Sprint:** 4  
**Dependencias:** HU-007

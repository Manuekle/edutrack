# Epic 3: 🕐 Programación y Control de Clases

## Descripción

Sistema completo para la planificación, programación y control de clases, permitiendo una gestión eficiente del tiempo académico y facilitando la coordinación entre docentes y estudiantes.

## Historias de Usuario

### HU-007: Programación de Clases

**Como** docente  
**Quiero** programar mis clases  
**Para** organizar eficientemente mi calendario académico

**Criterios de Aceptación:**

- [x] Creación de clases con horarios y aulas
- [x] Asignación de temas y descripción
- [x] Vista de calendario de clases
- [x] Notificaciones automáticas a estudiantes
- [ ] Clases recurrentes (pendiente)
- [ ] Validación de disponibilidad de aulas (pendiente)

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

- [x] Generación de códigos QR para asistencia
- [x] Registro manual de asistencia
- [x] Registro automático vía QR
- [x] Control de retrasos y justificaciones
- [x] Vista en tiempo real de asistencias
- [x] Exportación de reportes (PDF)

**Prioridad:** Alta  
**Story Points:** 8  
**Sprint:** 3  
**Dependencias:** HU-007

---

### HU-009: Visualización de Cronograma Académico

**Como** estudiante o docente  
**Quiero** visualizar el cronograma académico  
**Para** planificar mis actividades y clases

**Criterios de Aceptación:**

- [x] Vista de calendario de clases programadas
- [x] Filtros por asignatura
- [x] Indicadores de estado (PROGRAMADA, REALIZADA, CANCELADA)
- [x] Detalles de cada clase
- [x] Notificaciones de próximas clases
- [x] Vista móvil optimizada
- [ ] Sincronización con calendarios externos (pendiente)

**Prioridad:** Media  
**Story Points:** 8  
**Sprint:** 4  
**Dependencias:** HU-007

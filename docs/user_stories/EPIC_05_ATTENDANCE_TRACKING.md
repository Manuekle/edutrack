# Epic 5: ✅ Registro y Gestión de Asistencias

## Descripción

Sistema integral para el registro, seguimiento y gestión de asistencias, ofreciendo herramientas tanto para estudiantes como docentes con el fin de mantener un control preciso y confiable de la asistencia a clases.

## Historias de Usuario

### HU-013: Registro de Asistencia para Estudiantes

**Como** estudiante  
**Quiero** registrar mi asistencia de forma sencilla  
**Para** confirmar mi participación en la clase

**Criterios de Aceptación:**

- [x] Escaneo de código QR de la clase
- [x] Confirmación visual del registro exitoso
- [x] Visualización de mi estado de asistencia (dashboard estudiante)
- [x] Historial personal de asistencias
- [x] Notificaciones de registro exitoso/fallido
- [ ] Funcionalidad sin conexión con sincronización posterior (pendiente)
- [x] Soporte para diferentes dispositivos móviles (responsive design)

**Requisitos Técnicos:**

- API para registro de asistencias
- Almacenamiento local para modo offline
- Sincronización en segundo plano

**Prioridad:** Alta  
**Story Points:** 8  
**Sprint:** 5  
**Dependencias:** HU-010, HU-012

---

### HU-014: Panel de Control de Asistencias

**Como** docente  
**Quiero** gestionar las asistencias de mis clases  
**Para** mantener un registro preciso de participación

**Criterios de Aceptación:**

- [x] Vista en tiempo real de asistencias/ausencias
- [x] Filtros por fecha, estudiante o estado (en página de clase)
- [x] Indicadores visuales de estado (PRESENTE, AUSENTE, TARDANZA, JUSTIFICADO)
- [x] Estadísticas de asistencia por clase (métricas en tiempo real)
- [x] Exportación de reportes en PDF
- [ ] Exportación en múltiples formatos (CSV pendiente)
- [x] Búsqueda rápida de estudiantes
- [x] Vista móvil optimizada (responsive design)

**Requisitos de UX:**

- Actualización en tiempo real
- Interfaz intuitiva y responsiva
- Accesos rápidos a funciones comunes

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 5  
**Dependencias:** HU-008, HU-013

---

### HU-015: Gestión de Asistencias Manuales

**Como** docente  
**Quiero** realizar ajustes manuales en las asistencias  
**Para** corregir registros o manejar casos especiales

**Criterios de Aceptación:**

- [x] Modificación individual de estados de asistencia
- [x] Registro de justificaciones detalladas (campo justification)
- [ ] Historial de cambios con marca de tiempo y usuario (pendiente - no hay auditoría detallada)
- [ ] Notificaciones automáticas a estudiantes afectados (pendiente)
- [ ] Diferenciación clara entre registros automáticos y manuales (pendiente)
- [ ] Aprobación requerida para ciertos cambios (pendiente)
- [x] Reporte de modificaciones realizadas (reportes PDF incluyen asistencias)

**Requisitos de Seguridad:**

- Control de acceso basado en roles
- Registro de auditoría detallado
- Validación de permisos en tiempo real

**Prioridad:** Media  
**Story Points:** 8  
**Sprint:** 5  
**Dependencias:** HU-014

---

### HU-031: Sistema de Observación de Clases Canceladas

**Como** docente o coordinador académico
**Quiero** registrar observaciones cuando una clase no se imparte o se cancela
**Para** llevar un control y justificar ausencias ante auditorías

**Criterios de Aceptación:**

- [x] Formulario para detallar motivo de cancelación/ausencia (campo cancellationReason)
- [x] Registro de motivo de cancelación al marcar clase como CANCELADA
- [x] Notificaciones automáticas a estudiantes cuando se cancela una clase
- [ ] Adjuntar evidencias (documentos, capturas) (pendiente)
- [ ] Flujo de aprobación/rechazo de observación (pendiente - solo docentes pueden cancelar)
- [x] Estado de clase: PROGRAMADA, REALIZADA, CANCELADA
- [ ] Reporte exportable de observaciones (pendiente - reportes incluyen clases canceladas pero no específicamente observaciones)

**Requisitos Técnicos:**

- Estado de clase con motivo de cancelación
- Notificaciones automáticas a estudiantes (email)

**Prioridad:** Alta  
**Story Points:** 5  
**Sprint:** 5  
**Dependencias:** HU-013, HU-014

**Nota**: Funcionalidad parcialmente implementada. Existe el campo `cancellationReason` en el modelo Class y se envían notificaciones automáticas, pero no hay un sistema completo de observaciones con aprobación/rechazo por coordinadores.

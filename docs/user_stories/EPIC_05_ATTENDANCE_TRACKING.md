# Epic 5: ✅ Registro y Gestión de Asistencias

## Descripción

Sistema integral para el registro, seguimiento y gestión de asistencias, ofreciendo herramientas tanto para estudiantes como docentes con el fin de mantener un control preciso y confiable de la asistencia a clases.

## Historias de Usuario

### HU-013: Registro de Asistencia para Estudiantes

**Como** estudiante  
**Quiero** registrar mi asistencia de forma sencilla  
**Para** confirmar mi participación en la clase

**Criterios de Aceptación:**

- [x] Escaneo de código QR para registrar asistencia
- [x] Confirmación visual del registro
- [x] Visualización de estado de asistencia y historial
- [x] Notificaciones de registro exitoso/fallido
- [x] Soporte para dispositivos móviles

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
- [x] Filtros por fecha, estudiante o estado
- [x] Indicadores visuales de estado (PRESENTE, AUSENTE, TARDANZA, JUSTIFICADO)
- [x] Estadísticas de asistencia por clase
- [x] Exportación de reportes (PDF)
- [x] Búsqueda de estudiantes
- [x] Vista móvil optimizada

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
- [x] Registro de justificaciones
- [x] Inclusión en reportes PDF

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

- [x] Registro de motivo de cancelación al marcar clase como CANCELADA
- [x] Notificaciones automáticas a estudiantes
- [x] Estados de clase: PROGRAMADA, REALIZADA, CANCELADA
- [ ] Flujo de aprobación/rechazo por coordinadores (pendiente)
- [ ] Adjuntar evidencias (pendiente)

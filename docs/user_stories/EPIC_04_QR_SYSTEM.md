# Epic 4: 📱 Sistema QR Inteligente y Seguro

## Descripción

Sistema avanzado de generación y validación de códigos QR para el registro de asistencia, garantizando seguridad, precisión y facilidad de uso en el proceso de marcación.

## Historias de Usuario

### HU-010: Generación de Códigos QR Seguros

**Como** docente  
**Quiero** generar códigos QR seguros  
**Para** controlar el acceso a mis clases

**Criterios de Aceptación:**

- [x] Generación automática de códigos QR al iniciar clase
- [x] Códigos únicos con tiempo de validez configurable
- [x] Regeneración manual
- [x] Información visible: asignatura, hora, docente

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 4  
**Dependencias:** HU-007, HU-008

---

### HU-011: Validación de Códigos QR

**Como** sistema  
**Quiero** validar códigos QR escaneados  
**Para** garantizar la autenticidad de las asistencias

**Criterios de Aceptación:**

- [x] Validación de token QR y tiempo de expiración
- [x] Verificación de estudiante matriculado
- [x] Prevención de reutilización de códigos

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 4  
**Dependencias:** HU-010

---

### HU-012: Interfaz de Escaneo de Códigos

**Como** estudiante  
**Quiero** escanear códigos QR fácilmente  
**Para** registrar mi asistencia de forma rápida

**Criterios de Aceptación:**

- [x] Lector de códigos QR en tiempo real
- [x] Retroalimentación visual inmediata
- [x] Funcionamiento en dispositivos móviles
- [x] Notificación de registro exitoso/fallido

**Prioridad:** Media  
**Story Points:** 5  
**Sprint:** 4  
**Dependencias:** HU-010

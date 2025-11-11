# Epic 4: 📱 Sistema QR Inteligente y Seguro

## Descripción

Sistema avanzado de generación y validación de códigos QR para el registro de asistencia, garantizando seguridad, precisión y facilidad de uso en el proceso de marcación.

## Historias de Usuario

### HU-010: Generación de Códigos QR Seguros

**Como** docente  
**Quiero** generar códigos QR seguros  
**Para** controlar el acceso a mis clases

**Criterios de Aceptación:**

- [x] Generación automática al iniciar la clase (endpoint para generar QR)
- [x] Códigos únicos con tokens seguros
- [x] Tiempo de validez configurable (5 minutos por defecto, configurable)
- [x] Regeneración manual con un clic
- [x] Información visible: asignatura, hora, docente (en la interfaz)
- [ ] Códigos de respaldo generados automáticamente (pendiente)
- [x] Integración con el sistema de registro de clases

**Requisitos de Seguridad:**

- Tokens JWT firmados
- Rotación de claves de cifrado
- Registro de auditoría de generación

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

- [x] Verificación de token QR válido
- [x] Validación de ventana temporal (qrTokenExpiresAt)
- [x] Comprobación de estudiante matriculado (verificación de inscripción)
- [x] Prevención de reutilización de códigos (registro único por estudiante/clase)
- [ ] Validación opcional por geolocalización (pendiente)
- [x] Registro detallado de intentos de validación (logs de error)
- [ ] Notificaciones de intentos sospechosos (pendiente)

**Requisitos Técnicos:**

- API REST segura para validación
- Caché distribuido para verificación rápida
- Monitoreo en tiempo real de validaciones

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
- [x] Retroalimentación visual inmediata (toast notifications)
- [x] Funcionamiento en dispositivos móviles (responsive)
- [ ] Modo de cámara optimizado para baja luz (pendiente - depende del navegador)
- [x] Historial de asistencias recientes (dashboard estudiante)
- [x] Notificación de registro exitoso/fallido
- [ ] Soporte para códigos dañados o parciales (pendiente - validación básica implementada)

**Requisitos de UX:**

- Interfaz intuitiva con guía visual
- Tiempo de respuesta < 1 segundo
- Funcionalidad sin conexión con sincronización posterior

**Prioridad:** Media  
**Story Points:** 5  
**Sprint:** 4  
**Dependencias:** HU-010

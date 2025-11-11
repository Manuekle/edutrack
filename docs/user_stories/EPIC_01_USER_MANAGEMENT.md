# Epic 1: 🔐 Gestión de Usuarios y Autenticación

## Descripción

Sistema completo para la gestión de usuarios, autenticación segura y administración de perfiles, asegurando un control de acceso robusto y una experiencia de usuario fluida.

## Historias de Usuario

### HU-001: Registro Masivo de Usuarios

**Como** administrador del sistema  
**Quiero** poder registrar usuarios de forma individual o masiva  
**Para** agilizar el proceso de onboarding institucional

**Criterios de Aceptación:**

- [x] Carga masiva mediante archivo CSV/Excel con plantilla descargable
- [x] Validación de datos (formato, duplicados, integridad) antes del procesamiento
- [x] Vista previa de datos antes de confirmar carga
- [x] Generación automática de credenciales temporales seguras
- [x] Notificación por correo electrónico con instrucciones de primer acceso (parcialmente implementado)

**Requisitos Técnicos:**

- Límite de 1000 registros por lote
- Soporte para codificación UTF-8
- Validación de dominios de correo institucionales

**Prioridad:** Alta  
**Story Points:** 8  
**Sprint:** 1  
**Dependencias:** Ninguna

---

### HU-002: Autenticación Segura Multi-Factor

**Como** usuario del sistema  
**Quiero** autenticarme de forma segura  
**Para** proteger mi cuenta y datos académicos

**Criterios de Aceptación:**

- [x] Formulario de inicio de sesión con validación
- [ ] Autenticación en dos pasos (2FA) opcional (pendiente)
- [x] Mecanismo de recuperación de cuenta seguro (forgot password / reset password)
- [ ] Registro de actividad sospechosa (pendiente)
- [ ] Bloqueo temporal tras 5 intentos fallidos (pendiente)

**Requisitos de Seguridad:**

- Encriptación de contraseñas con bcrypt
- Tokens JWT con expiración corta
- Protección contra ataques de fuerza bruta

**Prioridad:** Crítica  
**Story Points:** 13  
**Sprint:** 1  
**Dependencias:** HU-001

---

### HU-003: Gestión de Perfil de Usuario

**Como** usuario autenticado  
**Quiero** gestionar mi perfil personal  
**Para** mantener mi información actualizada y segura

**Criterios de Aceptación:**

- [x] Edición de información personal (nombre, correo, teléfono)
- [x] Cambio de contraseña con requisitos de seguridad
- [x] Firma digital del usuario (signatureUrl)
- [ ] Validación de correo electrónico (pendiente - verificación por email)

**Requisitos de UX:**

- Interfaz intuitiva y responsiva
- Validación en tiempo real
- Confirmación para acciones críticas

**Prioridad:** Alta  
**Story Points:** 5  
**Sprint:** 2  
**Dependencias:** HU-002

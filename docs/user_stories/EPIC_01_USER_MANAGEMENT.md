# Epic 1: 🔐 Gestión de Usuarios y Autenticación

## Descripción

Sistema completo para la gestión de usuarios, autenticación segura y administración de perfiles, asegurando un control de acceso robusto y una experiencia de usuario fluida.

## Historias de Usuario

### HU-001: Registro Masivo de Usuarios

**Como** administrador del sistema  
**Quiero** poder registrar usuarios de forma individual o masiva  
**Para** agilizar el proceso de onboarding institucional

**Criterios de Aceptación:**

- [x] Carga masiva mediante archivo CSV/Excel
- [x] Validación de datos y vista previa antes de confirmar
- [x] Generación automática de credenciales
- [x] Notificación por correo electrónico

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

- [x] Inicio de sesión con validación
- [x] Recuperación de contraseña (forgot password / reset password)
- [ ] Autenticación en dos pasos (2FA) (pendiente)

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
- [x] Cambio de contraseña
- [x] Firma digital del usuario
- [ ] Validación de correo electrónico (pendiente)

**Prioridad:** Alta  
**Story Points:** 5  
**Sprint:** 2  
**Dependencias:** HU-002

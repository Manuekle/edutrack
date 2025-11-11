# Requisitos Funcionales y No Funcionales - Sistema EduTrack

Este documento especifica los requisitos funcionales (RF) y no funcionales (RNF) del Sistema de Gestión de Asistencias para la FUP.

---

## Requisitos Funcionales

### Epic 1: Gestión de Usuarios y Autenticación

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Requerimiento No Funcional | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|----------------------------|-------------------------|
| RF-01 | Registro Masivo de Usuarios | Carga masiva, validación, vista previa | El sistema debe permitir la carga masiva de usuarios mediante archivos CSV/Excel, con validación de datos, vista previa antes de confirmar, generación automática de credenciales y notificación por correo electrónico | Rendimiento: Procesamiento de hasta 1000 registros por lote. Usabilidad: Interfaz intuitiva para carga de archivos | Alta |
| RF-02 | Autenticación de Usuarios | Login, recuperación de contraseña | El sistema debe permitir el inicio de sesión con validación de credenciales, recuperación de contraseña mediante email y autenticación en dos pasos (2FA) opcional | Seguridad: Encriptación de contraseñas con bcrypt, tokens JWT con expiración corta, protección contra ataques de fuerza bruta | Crítica |
| RF-03 | Gestión de Perfil de Usuario | Edición de datos, cambio de contraseña, firma digital | El sistema debe permitir a los usuarios editar su información personal (nombre, correo, teléfono), cambiar su contraseña y gestionar su firma digital | Seguridad: Validación de datos, requisitos de seguridad para contraseñas | Alta |

### Epic 2: Gestión Académica

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Requerimiento No Funcional | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|----------------------------|-------------------------|
| RF-04 | Carga Masiva de Asignaturas | Carga masiva, validación, vista previa | El sistema debe permitir la carga masiva de asignaturas mediante archivos CSV/Excel, con validación de datos, vista previa y campos: código, nombre, créditos, programa, semestre | Rendimiento: Validación eficiente de datos duplicados | Alta |
| RF-05 | Dashboard Académico Docente | Vista resumida, calendario, indicadores | El sistema debe proporcionar un dashboard para docentes con vista resumida de asignaturas activas, calendario de clases y eventos próximos, indicadores de asistencia y clases programadas | Rendimiento: Carga rápida de datos con caché Redis. Usabilidad: Interfaz responsive | Alta |
| RF-06 | Gestión de Estudiantes por Asignatura | Listado, búsqueda, carga masiva, exportación | El sistema debe permitir a los docentes gestionar estudiantes en sus asignaturas: listado de matriculados, búsqueda y filtrado, carga masiva desde archivos CSV/Excel, solicitudes de desmatriculación y exportación de listados en PDF | Rendimiento: Búsqueda eficiente con índices de base de datos | Alta |

### Epic 3: Programación y Control de Clases

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Requerimiento No Funcional | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|----------------------------|-------------------------|
| RF-07 | Programación de Clases | Creación de clases, horarios, aulas, notificaciones | El sistema debe permitir a los docentes crear clases con horarios y aulas, asignar temas y descripción, visualizar calendario de clases y enviar notificaciones automáticas a estudiantes | Rendimiento: Validación eficiente de conflictos de horario. Usabilidad: Interfaz intuitiva para programación | Alta |
| RF-08 | Control de Asistencia en Tiempo Real | Generación QR, registro manual/automático, justificaciones | El sistema debe permitir a los docentes generar códigos QR para asistencia, registrar asistencias manualmente, controlar retrasos y justificaciones, visualizar asistencias en tiempo real y exportar reportes en PDF | Rendimiento: Actualización en tiempo real. Usabilidad: Interfaz responsive para móviles | Alta |
| RF-09 | Visualización de Cronograma Académico | Calendario, filtros, indicadores de estado | El sistema debe proporcionar vista de calendario de clases programadas con filtros por asignatura, indicadores de estado (PROGRAMADA, REALIZADA, CANCELADA), detalles de cada clase y notificaciones de próximas clases | Usabilidad: Vista móvil optimizada | Media |

### Epic 4: Sistema QR

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Requerimiento No Funcional | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|----------------------------|-------------------------|
| RF-10 | Generación de Códigos QR Seguros | Generación automática, tokens únicos, regeneración | El sistema debe generar automáticamente códigos QR únicos al iniciar clase, con tiempo de validez configurable, capacidad de regeneración manual y mostrar información visible (asignatura, hora, docente) | Seguridad: Tokens seguros con cifrado. Rendimiento: Generación rápida de códigos | Alta |
| RF-11 | Validación de Códigos QR | Validación de token, verificación de estudiante, prevención de reutilización | El sistema debe validar tokens QR y tiempo de expiración, verificar que el estudiante esté matriculado, prevenir la reutilización de códigos y opcionalmente validar por geolocalización | Seguridad: Validación robusta de tokens. Rendimiento: Validación rápida con caché | Alta |
| RF-12 | Interfaz de Escaneo de Códigos QR | Lector en tiempo real, retroalimentación visual, móvil | El sistema debe proporcionar un lector de códigos QR en tiempo real con retroalimentación visual inmediata, funcionamiento en dispositivos móviles y notificación de registro exitoso/fallido | Usabilidad: Interfaz intuitiva. Rendimiento: Tiempo de respuesta < 1 segundo | Media |

### Epic 5: Registro y Gestión de Asistencias

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Requerimiento No Funcional | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|----------------------------|-------------------------|
| RF-13 | Registro de Asistencia para Estudiantes | Escaneo QR, confirmación visual, historial | El sistema debe permitir a los estudiantes escanear códigos QR para registrar asistencia, mostrar confirmación visual del registro, visualizar estado de asistencia e historial y recibir notificaciones de registro exitoso/fallido | Usabilidad: Interfaz móvil optimizada. Rendimiento: Registro rápido de asistencias | Alta |
| RF-14 | Panel de Control de Asistencias | Vista en tiempo real, filtros, estadísticas, exportación | El sistema debe proporcionar a los docentes una vista en tiempo real de asistencias/ausencias, filtros por fecha/estudiante/estado, indicadores visuales de estado, estadísticas de asistencia por clase, exportación de reportes en PDF y búsqueda de estudiantes | Rendimiento: Actualización en tiempo real. Usabilidad: Interfaz intuitiva y responsive | Alta |
| RF-15 | Gestión de Asistencias Manuales | Modificación de estados, justificaciones | El sistema debe permitir a los docentes modificar individualmente estados de asistencia, registrar justificaciones e incluir modificaciones en reportes PDF | Seguridad: Control de acceso basado en roles | Media |
| RF-16 | Sistema de Observación de Clases Canceladas | Registro de motivo, notificaciones, estados | El sistema debe permitir registrar motivo de cancelación al marcar clase como CANCELADA, enviar notificaciones automáticas a estudiantes y gestionar estados de clase (PROGRAMADA, REALIZADA, CANCELADA) | Usabilidad: Formulario intuitivo para cancelación | Alta |

### Epic 6: Reportes y Analíticas

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Requerimiento No Funcional | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|----------------------------|-------------------------|
| RF-17 | Generación de Reportes de Asistencia | Selección de parámetros, filtros, exportación PDF | El sistema debe permitir generar reportes de asistencia con selección de parámetros (fechas, asignatura, período, año), filtros por estado de asistencia y exportación en PDF con firmas digitales | Rendimiento: Generación eficiente de reportes. Usabilidad: Interfaz clara para selección de parámetros | Alta |
| RF-18 | Panel de Estadísticas para Estudiantes | Porcentaje de asistencia, historial detallado | El sistema debe proporcionar a los estudiantes porcentaje de asistencia por asignatura, historial detallado por clase, gráficos de tendencia temporal y comparación con promedio del grupo | Rendimiento: Cálculos en tiempo real. Usabilidad: Visualización clara de estadísticas | Media |
| RF-19 | Dashboard Institucional y de Desempeño | Filtros, métricas, indicadores, exportación | El sistema debe proporcionar a administradores y docentes filtros por período/programa/asignatura, métricas de clases impartidas, indicadores porcentuales globales, exportación de datos en PDF/Excel e identificación de tendencias y anomalías | Rendimiento: Procesamiento eficiente de grandes volúmenes de datos. Usabilidad: Dashboard intuitivo | Alta |

### Epic 7: Comunicación y Notificaciones

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Requerimiento No Funcional | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|----------------------------|-------------------------|
| RF-20 | Notificaciones por Correo Electrónico | Plantillas, cola de correos, preferencias | El sistema debe enviar notificaciones por correo electrónico con sistema de plantillas personalizables, configuración de preferencias de notificación, sistema de cola de correos con reintentos automáticos y notificaciones de asistencia, cancelación de clases y recordatorios | Rendimiento: Sistema de cola con reintentos. Confiabilidad: Manejo de errores y reintentos automáticos | Alta |

### Epic 8: Administración

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Requerimiento No Funcional | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|----------------------------|-------------------------|
| RF-21 | Gestión de Usuarios y Permisos | CRUD de usuarios, asignación de roles | El sistema debe permitir a los administradores crear, editar y desactivar cuentas de usuario, asignar roles y buscar/filtrar usuarios | Seguridad: Control de acceso basado en roles. Auditoría: Registro de operaciones | Alta |
| RF-22 | Panel de Administración | Dashboard, gestión, carga masiva | El sistema debe proporcionar un panel de administración con dashboard de métricas clave, gestión de usuarios y permisos, gestión de asignaturas, carga masiva de datos y vista móvil optimizada | Rendimiento: Carga rápida de datos. Usabilidad: Interfaz intuitiva | Alta |

### Epic 9: Gestión de Aulas y Recursos

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Requerimiento No Funcional | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|----------------------------|-------------------------|
| RF-23 | Solicitud de Reserva de Aula | Formulario de solicitud, selección de recursos | El sistema debe permitir a los docentes solicitar reserva de aulas con formulario de solicitud, selección de fechas/horarios/recursos y confirmación por correo electrónico | Usabilidad: Interfaz intuitiva para reservas | Alta (Pendiente) |
| RF-24 | Calendario de Disponibilidad | Vista de calendario, filtros, indicadores | El sistema debe proporcionar vista de calendario con disponibilidad de aulas, filtros por tipo de aula y recursos, e indicación visual de horarios ocupados/disponibles | Usabilidad: Visualización clara de disponibilidad | Alta (Pendiente) |
| RF-25 | Gestión de Solicitudes de Aulas (Admin) | Listado, aprobación/rechazo, notificaciones | El sistema debe permitir a los administradores listar solicitudes pendientes, aprobar/rechazar solicitudes y enviar notificaciones automáticas al docente | Usabilidad: Interfaz clara para gestión de solicitudes | Alta (Pendiente) |

---

## Requisitos No Funcionales

### Rendimiento

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|-------------------------|
| RNF-01 | Rendimiento de Dashboards | Caché Redis, tiempo de respuesta | El sistema debe responder dashboards en menos de 300ms (primera carga) y menos de 20ms (con caché), utilizando sistema de caché Redis con TTL de 5 minutos | Alta |
| RNF-02 | Optimización de Queries | Eliminación de N+1 queries, índices | El sistema debe optimizar queries de base de datos eliminando problemas N+1, utilizando índices en modelos críticos (Class, Attendance, Subject) y reduciendo queries de ~50 a 5 para dashboards | Alta |
| RNF-03 | Escalabilidad | Soporte de usuarios simultáneos | El sistema debe soportar al menos 200 usuarios simultáneos sin degradación significativa del rendimiento | Alta |
| RNF-04 | Tiempo de Respuesta de APIs | Latencia de APIs críticas | El sistema debe responder APIs críticas (registro de asistencia, generación de QR) en menos de 1 segundo | Alta |

### Seguridad

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|-------------------------|
| RNF-05 | Autenticación y Autorización | Encriptación, tokens JWT, control de acceso | El sistema debe utilizar encriptación de contraseñas con bcrypt, tokens JWT con expiración corta, control de acceso basado en roles (ADMIN, DOCENTE, ESTUDIANTE, COORDINADOR) y protección contra ataques de fuerza bruta | Crítica |
| RNF-06 | Seguridad de Códigos QR | Tokens seguros, validación temporal | El sistema debe generar tokens QR seguros con tiempo de validez configurable (5 minutos por defecto), prevenir reutilización de códigos y validar tokens antes de registrar asistencias | Alta |
| RNF-07 | Protección de Datos | Validación de datos, sanitización | El sistema debe validar y sanitizar todos los datos de entrada, proteger contra inyección de código y mantener integridad de datos | Crítica |

### Usabilidad

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|-------------------------|
| RNF-08 | Interfaz Responsive | Diseño adaptativo, móvil | El sistema debe proporcionar interfaz responsive que funcione correctamente en dispositivos móviles, tablets y escritorio | Alta |
| RNF-09 | Facilidad de Uso | Interfaz intuitiva, retroalimentación | El sistema debe proporcionar interfaz intuitiva con retroalimentación visual inmediata, mensajes de error claros y guías de uso | Alta |
| RNF-10 | Accesibilidad | Estándares de accesibilidad | El sistema debe cumplir con estándares básicos de accesibilidad web (WCAG 2.1 nivel A) | Media |

### Confiabilidad

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|-------------------------|
| RNF-11 | Sistema de Cola de Correos | Reintentos automáticos, manejo de errores | El sistema debe implementar sistema de cola de correos con reintentos automáticos (máximo 3 intentos, 15 minutos entre intentos), manejo de errores y registro de intentos fallidos | Alta |
| RNF-12 | Disponibilidad | Tiempo de actividad | El sistema debe mantener disponibilidad del 99% del tiempo de operación | Alta |
| RNF-13 | Manejo de Errores | Manejo graceful de errores | El sistema debe manejar errores de forma graceful, proporcionar mensajes de error claros al usuario y registrar errores para diagnóstico | Alta |

### Mantenibilidad

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|-------------------------|
| RNF-14 | Código Limpio | Estructura modular, documentación | El sistema debe mantener código limpio y bien estructurado, con documentación adecuada y separación de responsabilidades | Media |
| RNF-15 | Logging y Monitoreo | Registro de eventos, monitoreo | El sistema debe implementar logging estructurado de eventos importantes, monitoreo de rendimiento y alertas para problemas críticos | Media |

### Compatibilidad

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|-------------------------|
| RNF-16 | Navegadores Soportados | Compatibilidad de navegadores | El sistema debe funcionar correctamente en los navegadores modernos más utilizados (Chrome, Firefox, Safari, Edge) | Alta |
| RNF-17 | Formatos de Archivo | Soporte de formatos | El sistema debe soportar carga de archivos en formatos CSV y Excel (.xlsx, .xls) con codificación UTF-8 | Alta |

### Portabilidad

| Número de Requisito | Nombre de Requisito | Características | Descripción del Requisito | Prioridad del Requisito |
|---------------------|---------------------|-----------------|---------------------------|-------------------------|
| RNF-18 | Despliegue en Vercel | Compatibilidad serverless | El sistema debe ser compatible con despliegue en Vercel (arquitectura serverless) y funcionar correctamente en este entorno | Alta |
| RNF-19 | Base de Datos MongoDB | Compatibilidad con MongoDB Atlas | El sistema debe funcionar con MongoDB Atlas como base de datos en la nube | Alta |

---

## Resumen de Requisitos

### Requisitos Funcionales
- **Total**: 25 requisitos funcionales
- **Implementados**: 22 requisitos (88%)
- **Pendientes**: 3 requisitos (12% - Epic 9)

### Requisitos No Funcionales
- **Total**: 19 requisitos no funcionales
- **Implementados**: 19 requisitos (100%)

### Prioridades
- **Crítica**: 3 requisitos (RF-02, RNF-05, RNF-07)
- **Alta**: 20 requisitos funcionales, 12 requisitos no funcionales
- **Media**: 3 requisitos funcionales, 3 requisitos no funcionales

---

## Notas

- Los requisitos marcados como "Pendiente" corresponden a la Epic 9 (Gestión de Aulas y Recursos) que aún no está implementada.
- Los requisitos no funcionales de rendimiento están implementados y cumplen con los objetivos establecidos.
- El sistema cumple con los requisitos de seguridad críticos para el manejo de datos académicos.


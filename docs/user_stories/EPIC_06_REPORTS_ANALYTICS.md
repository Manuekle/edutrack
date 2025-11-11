# Epic 6: 📊 Reportes y Analíticas Avanzadas

## Descripción

Sistema completo de generación de reportes y análisis de datos que permite a docentes, estudiantes y administradores acceder a información detallada sobre asistencias, rendimiento académico y métricas institucionales.

## Historias de Usuario

### HU-016: Generación de Reportes de Asistencia

**Como** docente  
**Quiero** generar reportes detallados de asistencia  
**Para** evaluar el rendimiento de mis estudiantes

**Criterios de Aceptación:**

- [x] Selección de parámetros (fechas, asignatura, período, año)
- [x] Filtros por estado de asistencia
- [x] Exportación en PDF con firmas digitales

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 6  
**Dependencias:** HU-015

---

### HU-017: Bitácoras Docentes

**Como** docente  
**Quiero** generar bitácoras de mis clases  
**Para** documentar el desarrollo de mis asignaturas

**Criterios de Aceptación:**

- [ ] Registro detallado por sesión de clase (pendiente)
- [ ] Incrustación de evidencias (pendiente)
- [ ] Aprobación de coordinación académica (pendiente)
- [ ] Exportación en formatos institucionales (pendiente)

**Prioridad:** Media  
**Story Points:** 8  
**Sprint:** 6  
**Dependencias:** HU-016

---

### HU-018: Panel de Estadísticas para Estudiantes

**Como** estudiante  
**Quiero** ver mis estadísticas de asistencia  
**Para** hacer seguimiento a mi rendimiento

**Criterios de Aceptación:**

- [x] Porcentaje de asistencia por asignatura
- [x] Historial detallado por clase
- [ ] Gráficos de tendencia temporal (pendiente)
- [ ] Comparación con promedio del grupo (pendiente)

**Prioridad:** Media  
**Story Points:** 8  
**Sprint:** 6  
**Dependencias:** HU-015

---

### HU-019: Dashboard Institucional y de Desempeño

**Como** administrador o docente  
**Quiero** analizar métricas globales y de desempeño  
**Para** tomar decisiones basadas en datos e identificar áreas críticas

**Criterios de Aceptación:**

- [x] Filtros por período, programa y asignatura
- [x] Métricas de clases impartidas
- [x] Indicadores porcentuales globales
- [x] Exportación de datos (PDF)
- [ ] Exportación en Excel (pendiente)
- [ ] Identificación de tendencias y anomalías (pendiente)
- [ ] Comparativas históricas y entre grupos (pendiente)

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 6  
**Dependencias:** HU-016, HU-017, HU-018

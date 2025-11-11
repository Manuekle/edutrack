# Diagrama de Estados - Flujo de Asistencia

Este diagrama muestra los estados posibles de una asistencia según el enum `AttendanceStatus` definido en el schema de Prisma.

## Estados de Asistencia

- **PRESENTE**: El estudiante asistió a la clase
- **AUSENTE**: El estudiante no asistió a la clase
- **TARDANZA**: El estudiante llegó tarde a la clase
- **JUSTIFICADO**: La ausencia o tardanza fue justificada

## Diagrama de Estados

```mermaid
stateDiagram-v2
    [*] --> PRESENTE: Estudiante escanea QR
    [*] --> AUSENTE: No registrado o tiempo expirado
    [*] --> TARDANZA: Estudiante llega tarde
    
    PRESENTE --> JUSTIFICADO: Docente justifica
    AUSENTE --> JUSTIFICADO: Docente justifica
    TARDANZA --> JUSTIFICADO: Docente justifica
    
    PRESENTE --> AUSENTE: Docente modifica manualmente
    PRESENTE --> TARDANZA: Docente modifica manualmente
    AUSENTE --> PRESENTE: Docente modifica manualmente
    AUSENTE --> TARDANZA: Docente modifica manualmente
    TARDANZA --> PRESENTE: Docente modifica manualmente
    TARDANZA --> AUSENTE: Docente modifica manualmente
    JUSTIFICADO --> PRESENTE: Docente modifica manualmente
    JUSTIFICADO --> AUSENTE: Docente modifica manualmente
    JUSTIFICADO --> TARDANZA: Docente modifica manualmente
```

## Notas

- Los estados iniciales dependen de cómo se registra la asistencia (QR automático, registro manual del docente, etc.)
- Un docente puede modificar manualmente cualquier estado a otro estado válido
- Una vez justificada una asistencia, puede seguir siendo modificada por el docente si es necesario

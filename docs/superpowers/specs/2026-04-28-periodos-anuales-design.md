# Spec: Gestión de Periodos Académicos por Año

## 1. Overview

Permitir que el admin gestione periodos académicos organizados por año, con sugerencia automática de periodos (ej: 2026-1 y 2026-2) y rangos de fechas especiales (festivos, vacaciones, recesos) que se muestran en el calendario del planeador.

## 2. Modelo de datos

### Nuevos modelos en Prisma

```prisma
model AcademicYear {
  id            String   @id @default(cuid())
  year          Int      @unique
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  specialRanges SpecialRange[]
  periods       AcademicPeriod[]
}

model SpecialRange {
  id          String       @id @default(cuid())
  name        String
  type        SpecialType
  startDate   DateTime
  endDate     DateTime
  year        AcademicYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  yearId      String
  createdAt   DateTime     @default(now())
}

enum SpecialType {
  VACATION
  HOLIDAY
  RECESS
}

model AcademicPeriod {
  // existente + relación:
  year       AcademicYear? @relation(fields: [yearId], references: [id])
  yearId     String?
}
```

## 3. API routes

### `GET /api/admin/periodos/years`
Lista todos los AcademicYear con sus specialRanges.

### `POST /api/admin/periodos/years`
Crea un AcademicYear. Acepta `{ year }`. Retorna el año creado.

### `GET /api/admin/periodos/years/[yearId]`
Detalle de un año con sus periodos y specialRanges.

### `POST /api/admin/periodos/years/[yearId]/suggest`
Sugiere crear `YYYY-1` y `YYYY-2` para el año dado, calculando fechas base de 16 semanas.

### `POST /api/admin/periodos/special-ranges`
Crea un SpecialRange.

### `PUT /api/admin/periodos/special-ranges/[id]`
Edita un SpecialRange.

### `DELETE /api/admin/periodos/special-ranges/[id]`
Elimina un SpecialRange.

### `PUT /api/admin/periodos/[id]` (actualizar existente)
Permite editar nombre, startDate, endDate, isActive de un periodo.

## 4. UI — Página de Periodos

### Layout
- Selector de año en la parte superior (dropdown + crear año)
- Dos tabs: **Periodos** y **Fechas Especiales**
- Botón para crear año nuevo si no existe

### Tab Periodos
- Tabla con columnas: Nombre, Fecha Inicio, Fecha Fin, Estado, Acciones
- Botón "Sugerir periodos" (solo si no existen para ese año)
- Al hacer clic en editar, inline o modal para editar fechas y estado
- Al guardar, calcula automáticamente si las fechas cambiaron

### Tab Fechas Especiales
- Lista de rangos con nombre, tipo (badge con color), fechas, acciones
- Formulario para agregar: nombre, tipo (select), fecha inicio, fecha fin
- Badges de color por tipo: VACATION (azul), HOLIDAY (rojo), RECESS (amarillo)

### Comportamiento
- Crear año nuevo → abre automáticamente el tab Periodos con sugerencia
- Los dias especiales son **informativos**, no excluyen semanas del conteo
- Al editar un periodo, se actualiza en la BD

## 5. Compatibilidad hacia atrás

- Los AcademicPeriod existentes sin yearId siguen funcionando
- La página de planeación sigue mostrando el error si no hay fechas de periodo
- Se migrarán los periodos existentes del seed al nuevo modelo si aplica

## 6. Seed

- Agregar AcademicYear para 2022 y 2026
- Agregar SpecialRange de ejemplo (Semana Santa, Receso navideño)
import { z } from 'zod';

// Enum for event types, aligned with Prisma schema
export const EventTypeEnum = z.enum(['EXAMEN', 'TRABAJO', 'LIMITE', 'ANUNCIO', 'INFO']);

// Schema for querying events
export const DocenteEventosQuerySchema = z.object({
  subjectId: z
    .string({ message: 'El ID de la asignatura debe ser un texto.' })
    .min(1, 'El ID de la asignatura no puede estar vacío.'),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().default(10),
  sortBy: z.enum(['date', 'title']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Schema for updating an event
export const DocenteEventoUpdateSchema = z.object({
  title: z.string().min(1, 'El título no puede estar vacío.').optional(),
  description: z.string().optional().nullable(),
  date: z.coerce.date({ message: 'La fecha no es válida.' }).optional(),
  type: EventTypeEnum.optional(),
});

// Schema for detailed event view
export const DocenteEventoDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  date: z.date(),
  type: EventTypeEnum,
  subjectId: z.string(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

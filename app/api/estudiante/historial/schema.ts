import { z } from 'zod';

export const EstudianteHistorialItemSchema = z.object({
  id: z.string(),
  status: z.string(),
  createdAt: z.coerce.date(),
  class: z.object({
    id: z.string(),
    topic: z.string().nullable(),
    date: z.date(),
    subject: z.object({
      name: z.string(),
    }),
  }),
});

export const EstudianteHistorialArraySchema = z.array(EstudianteHistorialItemSchema);

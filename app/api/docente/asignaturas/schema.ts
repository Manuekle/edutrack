import { z } from 'zod';

export const DocenteSubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  group: z.string().nullable().optional(),
  program: z.string().nullable().optional(),
  semester: z.coerce.number().nullable().optional(),
  credits: z.coerce.number().nullable().optional(),
  teacherId: z.string(),
  createdAt: z.date().or(z.string().datetime()),
});

export type DocenteSubject = z.infer<typeof DocenteSubjectSchema>;

export const DocenteSubjectQuerySchema = z.object({
  sortBy: z.enum(['createdAt', 'name', 'code']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DocenteSubjectQuery = z.infer<typeof DocenteSubjectQuerySchema>;

export const DocenteSubjectCreateSchema = DocenteSubjectSchema.omit({
  id: true,
  teacherId: true,
});
export const DocenteSubjectUpdateSchema = DocenteSubjectSchema.omit({
  teacherId: true,
});

import { z } from 'zod';

export const DocenteMatriculaEstudianteSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  institutionalEmail: z.string().nullable().optional(),
  personalEmail: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const DocenteMatriculaEstudianteArraySchema = z.array(DocenteMatriculaEstudianteSchema);

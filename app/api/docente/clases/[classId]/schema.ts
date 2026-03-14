import { z } from 'zod';

export const ClassStatusEnum = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'SIGNED']);

export const DocenteClaseDetailSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  date: z.coerce.date(),
  startTime: z.coerce.date().nullable().optional(),
  endTime: z.coerce.date().nullable().optional(),
  topic: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: ClassStatusEnum,
  classroom: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  subject: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string().optional(),
    program: z.string().nullable().optional(),
    semester: z.number().nullable().optional(),
    credits: z.number().nullable().optional(),
    teacherIds: z.array(z.string()).optional(),
  }).passthrough(),
  group: z.object({
    id: z.string(),
    teacherIds: z.array(z.string()).optional(),
  }).passthrough().optional(),
}).passthrough();

export const DocenteClaseUpdateSchema = z.object({
  date: z.string().optional(), // Accept date as string in YYYY-MM-DD format
  startTime: z.string().optional(), // Accept time as string in HH:MM format
  endTime: z.string().optional(), // Accept time as string in HH:MM format
  topic: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: ClassStatusEnum.optional(),
  reason: z.string().optional(),
});

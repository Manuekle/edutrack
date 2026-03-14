import { z } from 'zod';

export const DocenteClaseSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  topic: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  classroom: z.string().nullable().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'SIGNED']).default('SCHEDULED'),
  cancellationReason: z.string().nullable().optional(),

  totalStudents: z.number().optional(),
  presentCount: z.number().optional(),
  absentCount: z.number().optional(),
  lateCount: z.number().optional(),
  justifiedCount: z.number().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  subjectName: z.string().optional(),
  subjectCode: z.string().optional(),
});

export const DocenteClaseQuerySchema = z.object({
  subjectId: z.string(),
  fetch: z.enum(['classes', 'events']).optional().default('classes'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['date', 'createdAt', 'startTime']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const DocenteEventoSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  date: z.coerce.date(),
  type: z.string(),
  createdById: z.string(),
  createdAt: z.coerce.date().optional(),
});

export const DocenteClaseCreateSchema = z.object({
  subjectId: z.string(),
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  topic: z.string().nullable().optional(),
  classroom: z.string().nullable().optional(),
});

export const DocenteEventoCreateSchema = z.object({
  subjectId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  date: z.coerce.date(),
  type: z.string(),
});

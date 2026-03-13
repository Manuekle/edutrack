import { z } from 'zod';
import { Role } from '@prisma/client';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  institutionalEmail: z.string().email().nullable(),
  personalEmail: z.string().email().nullable().optional(),
  role: z.nativeEnum(Role),
});

export type User = z.infer<typeof UserSchema>;

export const UserSearchQuerySchema = z.object({
  search: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['name', 'institutionalEmail', 'personalEmail']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;

export const UserCreateSchema = z
  .object({
    name: z.string().min(1),
    institutionalEmail: z.string().email(),
    personalEmail: z.string().email().optional(),
    password: z.string().min(6),
    role: z.nativeEnum(Role),
    document: z.string().optional(),
    phone: z.string().optional(),
    studentCode: z.string().optional(),
    teacherCode: z.string().optional(),
  })
  .refine(data => data.institutionalEmail || data.personalEmail, {
    message: 'Al menos un correo debe ser proporcionado',
    path: ['institutionalEmail'],
  });

export type UserCreate = z.infer<typeof UserCreateSchema>;

export const UserUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  institutionalEmail: z.string().email().optional(),
  personalEmail: z.string().email().optional().nullable(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(Role).optional(),
  document: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  studentCode: z.string().optional().nullable(),
  teacherCode: z.string().optional().nullable(),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

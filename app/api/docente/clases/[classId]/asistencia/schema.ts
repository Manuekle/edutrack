import { z } from 'zod';

export const AttendanceStatusEnum = z.enum(['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED']);

export const StudentAttendanceSchema = z.object({
  studentId: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  status: AttendanceStatusEnum,
});

export const AttendanceListResponseSchema = z.array(StudentAttendanceSchema);

export const AttendanceUpsertSchema = z.object({
  attendances: z.array(
    z.object({
      studentId: z.string(),
      status: AttendanceStatusEnum,
    })
  ),
});

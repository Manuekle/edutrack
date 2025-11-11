import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { limiter } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { ScanAttendanceRequestSchema, ScanAttendanceResponseSchema } from './schema';

// Constantes para mensajes de error
const ERROR_MESSAGES = {
  UNAUTHORIZED: {
    message: 'Por favor inicia sesión para continuar',
    status: 401,
    code: 'UNAUTHORIZED',
  },
  FORBIDDEN: {
    message: 'No tienes permiso para realizar esta acción',
    status: 403,
    code: 'FORBIDDEN',
  },
  INVALID_TOKEN: {
    message: 'El código QR no es válido o ha expirado',
    status: 400,
    code: 'INVALID_QR_CODE',
  },
  NOT_ENROLLED: {
    message: 'No estás inscrito en esta asignatura',
    status: 403,
    code: 'NOT_ENROLLED',
  },
  ALREADY_RECORDED: {
    message: 'Ya has registrado tu asistencia para esta clase',
    status: 409,
    code: 'ATTENDANCE_ALREADY_RECORDED',
  },
  CLASS_NOT_STARTED: {
    message: 'La clase aún no ha comenzado',
    status: 400,
    code: 'CLASS_NOT_STARTED',
  },
  CLASS_ENDED: {
    message: 'La clase ya ha finalizado',
    status: 400,
    code: 'CLASS_ENDED',
  },
  RATE_LIMITED: {
    message: 'Demasiados intentos. Por favor espera un momento',
    status: 429,
    code: 'RATE_LIMITED',
  },
  INVALID_REQUEST: {
    message: 'Solicitud inválida',
    status: 400,
    code: 'INVALID_REQUEST',
  },
};

// Función para crear respuestas de error consistentes
function createErrorResponse(
  errorKey: keyof typeof ERROR_MESSAGES,
  additionalData: Record<string, unknown> = {}
) {
  const error = ERROR_MESSAGES[errorKey];
  return NextResponse.json(
    {
      message: error.message,
      error: error.code,
      ...additionalData,
    },
    { status: error.status }
  );
}

export async function POST(request: Request) {
  try {
    // 1. Validar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED');
    }
    // 2. Aplicar rate limiting
    const rateLimitRes = limiter.check(5, session.user.id); // 5 intentos por minuto
    if (rateLimitRes.isRateLimited) {
      return createErrorResponse('RATE_LIMITED', {
        retryAfter: 60,
        limit: rateLimitRes.limit,
        remaining: rateLimitRes.remaining,
      });
    }
    // 3. Validar rol de estudiante
    if (session.user.role !== 'ESTUDIANTE') {
      return createErrorResponse('FORBIDDEN');
    }
    // 4. Validar y parsear el cuerpo de la solicitud con Zod
    let qrToken: string;
    try {
      const body = await request.json();
      const parsed = ScanAttendanceRequestSchema.safeParse(body);
      if (!parsed.success) {
        return createErrorResponse('INVALID_REQUEST', {
          errors: parsed.error.issues,
        });
      }
      qrToken = parsed.data.qrToken.trim();
    } catch {
      return createErrorResponse('INVALID_REQUEST', {
        details: 'El token QR es requerido y debe ser una cadena de texto.',
      });
    }
    // 5. Buscar la clase asociada al token QR
    const classRecord = await db.class.findFirst({
      where: {
        qrToken: qrToken,
        qrTokenExpiresAt: { gt: new Date() },
      },
    });
    if (!classRecord) {
      return createErrorResponse('INVALID_TOKEN');
    }
    // 5b. Buscar la asignatura para obtener los IDs de los estudiantes
    const subject = await db.subject.findUnique({
      where: { id: classRecord.subjectId },
      select: { id: true, name: true, studentIds: true },
    });
    if (!subject) {
      return createErrorResponse('INVALID_TOKEN', {
        details: 'La asignatura asociada a la clase no fue encontrada.',
      });
    }
    // 6. Validar horario de la clase
    const now = new Date();
    const classStart = classRecord.startTime || classRecord.date;
    const classEnd = classRecord.endTime || new Date(classStart.getTime() + 2 * 60 * 60 * 1000);
    if (now < classStart) {
      const minutesUntilClass = Math.ceil((classStart.getTime() - now.getTime()) / (60 * 1000));
      return createErrorResponse('CLASS_NOT_STARTED', {
        startsIn: minutesUntilClass,
        classStartsAt: classStart.toISOString(),
      });
    }
    if (now > classEnd) {
      return createErrorResponse('CLASS_ENDED', {
        classEndedAt: classEnd.toISOString(),
      });
    }
    // 7. Verificar si el estudiante está matriculado en la asignatura
    const isEnrolled = subject.studentIds.includes(session.user.id);
    if (!isEnrolled) {
      return createErrorResponse('NOT_ENROLLED');
    }
    // 8. Verificar si ya existe una asistencia para esta clase
    const existingAttendance = await db.attendance.findFirst({
      where: {
        classId: classRecord.id,
        studentId: session.user.id,
      },
      select: { id: true },
    });
    if (existingAttendance) {
      return createErrorResponse('ALREADY_RECORDED');
    }
    // 9. Crear el registro de asistencia
    const newAttendance = await db.attendance.create({
      data: {
        classId: classRecord.id,
        studentId: session.user.id,
        status: 'PRESENTE',
        recordedAt: new Date(),
      },
    });

    // CACHE: Invalidate cache for this subject (affects student and teacher)
    const { clearSubjectCache } = await import('@/lib/cache');
    await clearSubjectCache(subject.id);

    // Validar respuesta con Zod
    const attendanceResponse = {
      id: newAttendance.id,
      status: newAttendance.status,
      recordedAt: newAttendance.recordedAt,
      subject: subject.name,
      class: classRecord.topic || classRecord.date.toISOString().split('T')[0],
    };
    const validated = ScanAttendanceResponseSchema.safeParse(attendanceResponse);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Asistencia registrada pero error de validación en la respuesta',
          errors: validated.error.issues,
        },
        { status: 201 }
      );
    }
    return NextResponse.json(
      { data: validated.data, message: 'Asistencia registrada con éxito' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

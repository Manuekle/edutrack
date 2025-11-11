import ClassNotifyEmail from '@/app/emails/ClassNotifyEmail';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { GenerarQRResponseSchema } from './schema';

// Endpoint para generar un token QR para una clase específica
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  if (!classId) {
    return NextResponse.json({ message: 'El ID de la clase es requerido' }, { status: 400 });
  }

  // 1. Verificar que la clase pertenece al docente y cargar la relación con subject
  const classToUpdate = await db.class.findFirst({
    where: {
      id: classId,
      subject: {
        teacherId: session.user.id,
      },
    },
    include: {
      subject: {
        select: {
          id: true,
          code: true,
          name: true,
          studentIds: true, // Incluir studentIds en la consulta
        },
      },
    },
  });

  if (!classToUpdate) {
    return NextResponse.json(
      { message: 'Clase no encontrada o no pertenece al docente' },
      { status: 404 }
    );
  }

  // 2. Verificar si ya se envió una notificación para esta clase
  const shouldSendNotification = !classToUpdate.notificationSentAt;

  // 3. Generar un token seguro de 32 caracteres
  const generateSecureToken = (): string => {
    // Generar 16 bytes (32 caracteres hexadecimales)
    // Usar crypto.getRandomValues para mayor seguridad
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const token = generateSecureToken();
  // Establecer tiempo de expiración (5 minutos desde ahora)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  // 4. Actualizar la clase con el nuevo token y marca de notificación
  try {
    await db.class.update({
      where: { id: classId },
      data: {
        qrToken: token,
        qrTokenExpiresAt: expiresAt,
        // Solo actualizar notificationSentAt si es la primera vez
        ...(shouldSendNotification && { notificationSentAt: new Date() }),
      },
    });

    // 5. Enviar notificación por correo si es la primera vez
    if (shouldSendNotification) {
      try {
        // Obtener todos los estudiantes matriculados en la materia
        const students = await db.user.findMany({
          where: {
            id: { in: classToUpdate.subject.studentIds },
            role: 'ESTUDIANTE',
            isActive: true,
          },
          select: {
            id: true,
            correoInstitucional: true,
            name: true,
          },
        });

        // Enviar correo a cada estudiante
        const sendEmailPromises = students
          .filter(
            (
              student
            ): student is { id: string; correoInstitucional: string; name: string | null } =>
              !!student.correoInstitucional
          )
          .map(async student => {
            const justificationLink = `${process.env.NEXTAUTH_URL}/justificar-ausencia?classId=${classId}&studentId=${student.id}`;

            await sendEmail({
              to: student.correoInstitucional!,
              subject: `Inicio de clase: ${classToUpdate.subject.name} - ${classToUpdate.topic || 'Sin tema específico'}`,
              react: ClassNotifyEmail({
                className: classToUpdate.topic || 'Sin tema específico',
                subjectName: classToUpdate.subject.name,
                startTime:
                  classToUpdate.startTime?.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) || '--:--',
                endTime:
                  classToUpdate.endTime?.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) || '--:--',
                date: classToUpdate.date.toISOString(),
                justificationLink,
                supportEmail: process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co',
                studentName: student.name || undefined,
              }),
            });
          });

        // Ejecutar todos los envíos en paralelo
        await Promise.all(sendEmailPromises);
      } catch (emailError) {
        // No fallar la operación si hay error en el envío de correos
      }
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al guardar el token QR en la base de datos' },
      { status: 500 }
    );
  }

  let baseUrl = process.env.NEXTAUTH_URL || 'https://edutrack-fup.vercel.app';
  // Ensure the URL has a protocol
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  const qrUrl = `${baseUrl}/dashboard/estudiante/escanear/${token}`;

  // Validar que el token cumple con los requisitos
  if (token.length !== 32) {
    return NextResponse.json(
      {
        message: 'Error al generar el token QR: token inválido',
        error: 'INVALID_TOKEN_LENGTH',
        tokenLength: token.length,
        requiredLength: 32,
      },
      { status: 500 }
    );
  }

  // Crear el objeto de respuesta
  const responseData = {
    qrUrl,
    qrToken: token,
    expiresAt: expiresAt.toISOString(),
  };

  // Validar la respuesta contra el esquema
  const validation = GenerarQRResponseSchema.safeParse(responseData);

  if (!validation.success) {
    return NextResponse.json(
      {
        message: 'Error en el formato de la respuesta',
        error: 'VALIDATION_ERROR',
        details: validation.error.issues,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      data: validation.data,
      message: 'Token QR generado correctamente',
    },
    { status: 200 }
  );
}

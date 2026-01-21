import UnenrollRequestEmail from '@/app/emails/UnenrollRequestEmail';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import React from 'react';

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga el rol de docente
    if (session.user.role !== 'DOCENTE') {
      return NextResponse.json(
        { message: 'No tienes permiso para realizar esta acción' },
        { status: 403 }
      );
    }

    // Obtener datos de la solicitud
    const { studentId, subjectId, reason } = await request.json();

    // Validar datos requeridos
    if (!studentId || !subjectId || !reason) {
      return NextResponse.json({ message: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verificar que la asignatura exista y pertenezca al docente
    const subject = await db.subject.findUnique({
      where: {
        id: subjectId,
        teacherId: session.user.id,
      },
    });

    if (!subject) {
      return NextResponse.json(
        { message: 'Asignatura no encontrada o no tienes permiso para acceder a ella' },
        { status: 404 }
      );
    }

    // Checking for 12-day rule
    const firstClass = await db.class.findFirst({
        where: { subjectId: subjectId },
        orderBy: { date: 'asc' }
    });

    if (firstClass) {
        const daysSinceStart = (new Date().getTime() - new Date(firstClass.date).getTime()) / (1000 * 3600 * 24);
        if (daysSinceStart > 12) {
             return NextResponse.json(
                { message: 'El periodo de desmatriculación (12 días desde el inicio) ha finalizado.' },
                { status: 400 }
            );
        }
    }

    // Verificar que el estudiante exista
    const student = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true },
    });

    if (!student) {
      return NextResponse.json({ message: 'Estudiante no encontrado' }, { status: 404 });
    }

    // Verificar si ya existe una solicitud pendiente para este estudiante y asignatura
    const existingRequest = await db.unenrollRequest.findFirst({
      where: {
        studentId,
        subjectId,
        status: 'PENDIENTE',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { message: 'Ya existe una solicitud de desmatriculación pendiente para este estudiante' },
        { status: 400 }
      );
    }

    // Crear la solicitud de desmatriculación

    try {
      // Crear la solicitud de desmatriculación usando el modelo extendido
      const unenrollRequest = await db.unenrollRequest.create({
        data: {
          student: { connect: { id: studentId } },
          subject: { connect: { id: subjectId } },
          reason,
          requestedBy: { connect: { id: session.user.id } },
          status: 'PENDIENTE',
        },
        include: {
          student: {
            select: { name: true, correoInstitucional: true },
          },
          requestedBy: {
            select: { name: true },
          },
        },
      });

      // Notificar al administrador por correo electrónico
      try {
        const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co';
        const adminEmail = process.env.ADMIN_EMAIL || 'elustondo129@gmail.com';

        // Get subject name from the database
        const subject = await db.subject.findUnique({
          where: { id: unenrollRequest.subjectId },
          select: { name: true },
        });

        // Send email to admin
        await sendEmail({
          to: adminEmail,
          subject: `Solicitud de Desmatriculación - ${subject?.name || 'Asignatura'}`,
          react: React.createElement(UnenrollRequestEmail, {
            studentName: unenrollRequest.student?.name || 'Estudiante',
            studentEmail: unenrollRequest.student?.correoInstitucional || 'No especificado',
            subjectName: subject?.name || 'Asignatura',
            reason: unenrollRequest.reason,
            requestDate: unenrollRequest.createdAt.toISOString(),
            supportEmail: supportEmail,
          }),
        });
      } catch (emailError) {}

      return NextResponse.json({
        success: true,
        data: unenrollRequest,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al crear la solicitud de desmatriculación',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

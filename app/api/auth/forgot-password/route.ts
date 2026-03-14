import ResetPasswordEmail from '@/app/emails/ResetPasswordEmail';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';

export async function POST(request: NextRequest) {
  try {
    const { correo } = await request.json();

    if (!correo) {
      return NextResponse.json({ message: 'El correo electrónico es requerido' }, { status: 400 });
    }

    // Buscar usuario por correo institucional o personal
    const user = await db.user.findFirst({
      where: {
        OR: [{ institutionalEmail: correo }, { personalEmail: correo }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'No se encontró un usuario con ese correo electrónico' },
        { status: 404 }
      );
    }

    // Generar token de reset
    const resetToken = crypto.randomUUID();
    // Sync with ResetPasswordEmail.tsx which says 24 hours
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Guardar token en la base de datos
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Renderizar y enviar el correo electrónico
    try {
      const emailResult = await sendEmail({
        to: correo,
        subject: 'Restablece tu contraseña - Sistema de Asistencias FUP',
        react: React.createElement(ResetPasswordEmail, {
          resetUrl: `${process.env.NEXTAUTH_URL}/reset-password/${resetToken}`,
          userEmail: user.institutionalEmail || user.personalEmail || '',
          supportEmail: process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co',
        }),
      });

      if (!emailResult.success) {
        throw new Error('Email sending failed unexpectedly');
      }
    } catch (error) {
      console.error('Detailed error in forgot-password email sending:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        correo,
        userId: user.id,
      });

      return NextResponse.json(
        {
          message: 'Error al enviar el correo de restablecimiento',
          // Incluimos más detalles en desarrollo
          debug: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Critical error in forgot-password POST:', error);
    return NextResponse.json(
      {
        message: 'Error interno del servidor',
        debug: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

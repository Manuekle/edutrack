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
        OR: [{ correoInstitucional: correo }, { correoPersonal: correo }],
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
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

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
      await sendEmail({
        to: correo,
        subject: 'Restablece tu contraseña - Sistema de Asistencias FUP',
        react: React.createElement(ResetPasswordEmail, {
          resetUrl: `${process.env.NEXTAUTH_URL}/reset-password/${resetToken}`,
          userEmail: user.correoInstitucional || user.correoPersonal || '',
          supportEmail: process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co',
        }),
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Error al enviar el correo de restablecimiento' },
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
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

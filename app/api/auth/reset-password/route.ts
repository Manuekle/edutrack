import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Token y nueva contraseña son requeridos' }, { status: 400 });
    }

    // Validar longitud mínima de la contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Buscar usuario con el token de restablecimiento
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Verificar que el token no haya expirado
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'El token de restablecimiento no es válido o ha expirado.' },
        { status: 400 }
      );
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar la contraseña y limpiar el token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json(
      {
        message:
          'Contraseña restablecida con éxito. Ahora puedes iniciar sesión con tu nueva contraseña.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

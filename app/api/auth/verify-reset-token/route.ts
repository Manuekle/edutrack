import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ message: 'Token no proporcionado' }, { status: 400 });
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

    const maskEmail = (email: string | null | undefined) => {
      if (!email) return null;
      const [local, domain] = email.split('@');
      if (!domain) return null;
      const visible = local.slice(0, 2);
      return `${visible}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
    };

    return NextResponse.json(
      {
        valid: true,
        message: 'Token válido',
        institutionalEmail: maskEmail(user.institutionalEmail || user.personalEmail),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in verify-reset-token:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

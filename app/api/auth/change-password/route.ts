import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Se requieren tanto la contraseña actual como la nueva' },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        correoPersonal: true,
        correoInstitucional: true,
      },
    });

    if (!user?.password) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    // Invalidate user cache
    const emails = [user.correoPersonal, user.correoInstitucional].filter(Boolean) as string[];
    // @ts-ignore - Dynamic import
    const { clearAllUserCache } = await import('@/lib/cache');
    await clearAllUserCache(session.user.id, emails);

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cambiar la contraseña' }, { status: 500 });
  }
}

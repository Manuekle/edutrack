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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true, personalEmail: true, institutionalEmail: true },
    });

    if (!user?.mustChangePassword) {
      return NextResponse.json({ error: 'Este endpoint solo aplica al primer inicio de sesión' }, { status: 403 });
    }

    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    // Invalidate cache
    const emails = [user.personalEmail, user.institutionalEmail].filter(Boolean) as string[];
    const { clearAllUserCache } = await import('@/lib/cache');
    await clearAllUserCache(session.user.id, emails);

    return NextResponse.json({ message: 'Contraseña establecida exitosamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al establecer la contraseña' }, { status: 500 });
  }
}

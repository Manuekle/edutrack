import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const session = await getServerSession(authOptions);

    // Validate session
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código de asignatura no proporcionado' },
        { status: 400 }
      );
    }

    // Find the subject with the given code
    const subject = await db.subject.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        name: true,
        studentIds: true,
      },
    });

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asignatura no encontrada',
          code: code,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subject,
    });
  } catch (error) {
    console.error('Error al buscar la asignatura:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

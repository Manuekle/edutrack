import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const document = searchParams.get('document');

  // Validate session
  if (!session) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  // Validate input
  if (!document) {
    return NextResponse.json(
      { success: false, error: 'Se requiere el documento del estudiante' },
      { status: 400 }
    );
  }

  try {
    // Find the student by document number
    const student = await db.user.findFirst({
      where: {
        document,
        role: 'ESTUDIANTE',
      },
      select: {
        id: true,
        name: true,
        document: true,
        correoInstitucional: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
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

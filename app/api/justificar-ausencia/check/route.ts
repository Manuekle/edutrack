import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const studentId = searchParams.get('studentId');

  if (!classId || !studentId) {
    return NextResponse.json({ message: 'Se requieren classId y studentId' }, { status: 400 });
  }

  try {
    // Verificar si ya existe una justificación para esta clase y estudiante
    const existingJustification = await db.attendance.findFirst({
      where: {
        classId,
        studentId,
        status: 'JUSTIFICADO',
      },
      select: {
        id: true,
        justification: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      exists: !!existingJustification,
      justification: existingJustification,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error al verificar justificación' }, { status: 500 });
  }
}

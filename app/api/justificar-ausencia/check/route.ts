import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const studentId = searchParams.get('studentId');

  if (!classId || !studentId) {
    return NextResponse.json({ message: 'Se requieren classId y studentId' }, { status: 400 });
  }

  const role = session.user.role;
  const isOwner = session.user.id === studentId;

  if (role === Role.ESTUDIANTE && !isOwner) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  if (role === Role.DOCENTE) {
    const cls = await db.class.findUnique({
      where: { id: classId },
      include: { group: { select: { teacherIds: true } } },
    });
    if (!cls?.group?.teacherIds.includes(session.user.id)) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
  }

  try {
    const existingJustification = await db.attendance.findFirst({
      where: {
        classId,
        studentId,
        status: 'JUSTIFIED',
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
  } catch {
    return NextResponse.json({ message: 'Error al verificar justificación' }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Retornar asignaturas que tienen grupo asignado
    const subjects = await db.subject.findMany({
      where: { group: { not: null } },
      select: {
        id: true,
        code: true,
        name: true,
        group: true,
        shift: true,
        academicPeriod: true,
        program: true,
        teachers: { select: { id: true, name: true } },
        _count: { select: { classes: true } },
      },
      orderBy: [{ academicPeriod: 'desc' }, { code: 'asc' }],
    });

    return NextResponse.json({ groups: subjects });
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo grupos' }, { status: 500 });
  }
}

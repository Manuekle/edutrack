import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await req.json();
    const group = await db.group.update({
      where: { id },
      data: {
        ...(body.codigo && { code: body.codigo }),
        ...(body.subjectId && { subjectId: body.subjectId }),
        ...(body.periodoAcademico && { academicPeriod: body.periodoAcademico }),
        ...(body.docenteIds && { teacherIds: body.docenteIds }),
        ...(body.horarioId !== undefined && { scheduleId: body.horarioId }),
        ...(body.salaId !== undefined && { roomId: body.salaId }),
      },
    });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    await db.group.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

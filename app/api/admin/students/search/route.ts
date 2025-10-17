import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const whereClause: Prisma.UserWhereInput = {
      role: Role.ESTUDIANTE,
      ...(query
        ? {
            OR: [
              { document: { contains: query, mode: Prisma.QueryMode.insensitive } },
              { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
              {
                correoInstitucional: {
                  contains: query,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {}),
    };

    const students = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        document: true,
        correoInstitucional: true,
        codigoEstudiantil: true,
      },
      take: 50,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('Error al buscar estudiantes:', error);
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

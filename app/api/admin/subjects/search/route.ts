import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Validate session and admin role
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // Search subjects by code, name, or teacher name
    const whereClause: Prisma.SubjectWhereInput = query
      ? {
          OR: [
            { code: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
            {
              teachers: {
                some: {
                  name: { contains: query, mode: Prisma.QueryMode.insensitive },
                },
              },
            },
          ],
        }
      : {};

    const subjects = await db.subject.findMany({
      where: whereClause,
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            correoInstitucional: true,
          },
        },
      },
      take: 50,
      orderBy: {
        code: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      subjects: subjects.map(subject => ({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        program: subject.program,
        semester: subject.semester,
        credits: subject.credits,
        teacher: subject.teachers[0]
          ? {
              id: subject.teachers[0].id,
              name: subject.teachers[0].name,
            }
          : null,
        studentCount: subject.studentIds.length,
      })),
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

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const role = req.nextUrl.searchParams.get('role');
    const search = req.nextUrl.searchParams.get('search') ?? '';

    const users = await db.user.findMany({
      where: {
        ...(role ? { role: role as 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE' } : {}),
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { institutionalEmail: { contains: search, mode: 'insensitive' } },
                { teacherCode: { contains: search, mode: 'insensitive' } },
                { studentCode: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        document: true,
        institutionalEmail: true,
        personalEmail: true,
        teacherCode: true,
        studentCode: true,
        role: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

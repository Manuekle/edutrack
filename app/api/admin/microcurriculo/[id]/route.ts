import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  program: z.string().optional().nullable(),
  semester: z.number().int().min(1).max(10).optional().nullable(),
  directHours: z.number().int().min(0).optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const existing = await db.subject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Asignatura no encontrada' }, { status: 404 });
    }

    // Check code uniqueness if it changed
    if (parsed.data.code !== existing.code) {
      const codeConflict = await db.subject.findFirst({
        where: { code: parsed.data.code, id: { not: id } },
      });
      if (codeConflict) {
        return NextResponse.json(
          { error: 'Ya existe una asignatura con ese código' },
          { status: 409 }
        );
      }
    }

    const updated = await db.subject.update({
      where: { id },
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        program: parsed.data.program ?? null,
        semester: parsed.data.semester ?? null,
        directHours: parsed.data.directHours ?? null,
      },
    });

    return NextResponse.json({ success: true, subject: updated });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.subject.findUnique({
      where: { id },
      include: { _count: { select: { groups: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Asignatura no encontrada' }, { status: 404 });
    }

    if (existing._count.groups > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: la asignatura tiene ${existing._count.groups} grupo(s) asociado(s)`,
        },
        { status: 409 }
      );
    }

    await db.subject.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

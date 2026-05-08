import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const UpdateSchema = z.object({
  codigo: z.string().min(1).max(50),
  version: z.string().min(1).max(20),
  fecha: z.string().min(1).max(60),
});

async function getOrCreateSettings() {
  const existing = await db.bitacoraSettings.findFirst();
  if (existing) return existing;
  return db.bitacoraSettings.create({ data: {} });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const settings = await getOrCreateSettings();
    return NextResponse.json({
      codigo: settings.codigo,
      version: settings.version,
      fecha: settings.fecha,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const current = await getOrCreateSettings();
    const updated = await db.bitacoraSettings.update({
      where: { id: current.id },
      data: parsed.data,
    });
    return NextResponse.json({
      codigo: updated.codigo,
      version: updated.version,
      fecha: updated.fecha,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

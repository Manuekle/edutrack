import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CreateSchema = z.object({
  periodId: z.string().min(1),
  number: z.number().int().min(1).max(52),
  name: z.string().max(100).optional().nullable(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

const GenerateSchema = z.object({
  periodId: z.string().min(1),
  count: z.number().int().min(1).max(52).default(16),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get('periodId');
    if (!periodId) {
      return NextResponse.json({ error: 'periodId requerido' }, { status: 400 });
    }
    const weeks = await db.periodWeek.findMany({
      where: { periodId },
      orderBy: { number: 'asc' },
    });
    return NextResponse.json({ weeks });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const body = await req.json();

    if (body.action === 'generate') {
      const parsed = GenerateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      }
      const period = await db.academicPeriod.findUnique({ where: { id: parsed.data.periodId } });
      if (!period) {
        return NextResponse.json({ error: 'Periodo no encontrado' }, { status: 404 });
      }
      await db.periodWeek.deleteMany({ where: { periodId: parsed.data.periodId } });
      const start = new Date(period.startDate);
      const weeksToCreate = Array.from({ length: parsed.data.count }).map((_, i) => {
        const ws = new Date(start);
        ws.setUTCDate(ws.getUTCDate() + i * 7);
        const we = new Date(ws);
        we.setUTCDate(we.getUTCDate() + 6);
        return {
          periodId: parsed.data.periodId,
          number: i + 1,
          startDate: ws,
          endDate: we,
        };
      });
      await db.periodWeek.createMany({ data: weeksToCreate });
      const weeks = await db.periodWeek.findMany({
        where: { periodId: parsed.data.periodId },
        orderBy: { number: 'asc' },
      });
      return NextResponse.json({ weeks });
    }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    const week = await db.periodWeek.create({
      data: {
        periodId: parsed.data.periodId,
        number: parsed.data.number,
        name: parsed.data.name ?? null,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
      },
    });
    return NextResponse.json({ week }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

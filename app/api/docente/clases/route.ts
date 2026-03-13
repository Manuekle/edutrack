import { authOptions } from '@/lib/auth';
import { clearSubjectCache } from '@/lib/cache';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DocenteClaseCreateSchema,
  DocenteClaseQuerySchema,
  DocenteClaseSchema,
} from './schema';

// Definir manualmente el enum Role para evitar problemas de importación
enum Role {
  ADMIN = 'ADMIN',
  DOCENTE = 'DOCENTE',
  COORDINADOR = 'COORDINADOR',
}

// Limpieza de parámetros: null, 'null', '' => undefined
function clean(val: string | null | undefined): string | undefined {
  if (val === null || val === undefined || val === '' || val === 'null') return undefined;
  return val;
}

// GET /api/docente/clases?subjectId=...
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const query = DocenteClaseQuerySchema.parse({
      subjectId: clean(searchParams.get('subjectId')),
      fetch: clean(searchParams.get('fetch')),
      sortBy: clean(searchParams.get('sortBy')),
      sortOrder: clean(searchParams.get('sortOrder')),
    });

    // Security check: Verify the teacher owns the subject or the group
    let subjectIdRef = query.subjectId;
    let grupoIdRef: string | undefined = undefined;

    let subject = await db.subject.findFirst({
      where: {
        id: query.subjectId,
        teacherIds: { has: session.user.id },
      },
    });

    if (!subject) {
      // Si no es asignatura, probar con Grupo
      const grupo = await db.grupo.findFirst({
        where: {
          id: query.subjectId,
          docenteIds: { has: session.user.id },
        },
        include: { subject: true },
      });

      if (grupo && grupo.subject) {
        subject = grupo.subject;
        subjectIdRef = grupo.subject.id;
        grupoIdRef = grupo.id;
      }
    }

    if (!subject) {
      return NextResponse.json(
        { message: 'Asignatura o Grupo no encontrado o no pertenece al docente' },
        { status: 404 }
      );
    }

    // Clases: filtrado por grupo si es aplicable
    const classes = await db.class.findMany({
      where: {
        subjectId: subjectIdRef,
        ...(grupoIdRef ? { grupoId: grupoIdRef } : {}),
      },
      orderBy: [
        { date: 'asc' }, 
        { startTime: 'asc' }, 
      ],
      include: {
        subject: { select: { name: true, code: true } },
      },
    });
    const now = new Date();

    const classesToUpdate: string[] = [];
    const formatted = classes.map(cls => {
      const classEndTime = cls.endTime || cls.startTime || cls.date;
      const isPast = new Date(classEndTime) < now;

      if (isPast && !cls.status) {
        classesToUpdate.push(cls.id);
      }

      return {
        id: cls.id,
        subjectId: cls.subjectId,
        date: cls.date,
        startTime: cls.startTime,
        endTime: cls.endTime,
        topic: cls.topic,
        description: cls.description,
        classroom: cls.classroom,
        status: (isPast && !cls.status ? 'REALIZADA' : cls.status) || 'PROGRAMADA',
        cancellationReason: cls.cancellationReason,
        totalStudents: cls.totalStudents,
        presentCount: cls.presentCount,
        absentCount: cls.absentCount,
        lateCount: cls.lateCount,
        justifiedCount: cls.justifiedCount,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
        subjectName: cls.subject?.name,
        subjectCode: cls.subject?.code,
      };
    });

    if (classesToUpdate.length > 0) {
      await db.class.updateMany({
        where: { id: { in: classesToUpdate } },
        data: { status: 'REALIZADA' },
      });
    }

    const validados = z.array(DocenteClaseSchema).safeParse(formatted);
    if (!validados.success) {
      return NextResponse.json(
        { message: 'Error de validación en la respuesta', errors: validados.error.issues },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: validados.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de consulta inválidos', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/docente/clases
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const data = DocenteClaseCreateSchema.parse(body);

    let subjectIdToUse = data.subjectId;
    let grupoIdToUse: string | null = null;

    let subject = await db.subject.findFirst({
      where: { id: data.subjectId, teacherIds: { has: session.user.id } },
    });

    if (!subject) {
      const grupo = await db.grupo.findFirst({
        where: { id: data.subjectId, docenteIds: { has: session.user.id } },
      });
      if (grupo) {
        subjectIdToUse = grupo.subjectId;
        grupoIdToUse = grupo.id;
        subject = await db.subject.findUnique({ where: { id: subjectIdToUse } });
      }
    }

    if (!subject) {
      return NextResponse.json(
        { message: 'Asignatura o Grupo no encontrado o no pertenece al docente' },
        { status: 404 }
      );
    }

    const classDate = new Date(data.date);
    const dayStart = new Date(classDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(classDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingClasses = await db.class.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: 'PROGRAMADA',
        OR: [
          { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
          { startTime: { lt: data.endTime }, endTime: { gte: data.endTime } },
          { startTime: { gte: data.startTime }, endTime: { lte: data.endTime } },
        ],
      },
      select: {
        subjectId: true,
        classroom: true,
        subject: { select: { teacherIds: true } },
      },
    });

    const teacherCollision = (existingClasses as any[]).find(cls =>
      cls.subject?.teacherIds?.includes(session.user.id)
    );
    if (teacherCollision) {
      return NextResponse.json(
        { message: 'El docente ya tiene otra clase programada en este horario' },
        { status: 400 }
      );
    }

    const classroomCollision = (existingClasses as any[]).find(
      cls => cls.classroom && data.classroom && cls.classroom === data.classroom
    );
    if (classroomCollision) {
      return NextResponse.json(
        { message: 'El salón ya está ocupado en este horario' },
        { status: 400 }
      );
    }

    const newClass = await db.class.create({
      data: {
        subjectId: subjectIdToUse,
        grupoId: grupoIdToUse,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        topic: data.topic || null,
        classroom: data.classroom || null,
      },
    });
    const validado = DocenteClaseSchema.safeParse({
      ...newClass,
      subjectName: subject.name,
      subjectCode: subject.code,
    });
    if (!validado.success) {
      return NextResponse.json(
        { message: 'Error de validación en la respuesta', errors: validado.error.issues },
        { status: 500 }
      );
    }

    await clearSubjectCache(subjectIdToUse);

    return NextResponse.json(
      { data: validado.data, message: 'Clase creada correctamente' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

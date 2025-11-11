import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DocenteSubjectCreateSchema,
  DocenteSubjectQuerySchema,
  DocenteSubjectSchema,
  DocenteSubjectUpdateSchema,
} from './schema';

// Helper function to get period from a date (1: Jan-Jun, 2: Jul-Dec)
const getPeriodFromDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // getMonth() is 0-indexed
  const period = month <= 6 ? '1' : '2';
  return `${year}-${period}`;
};

// HU-004: Ver Asignaturas Creadas
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    // Validar parámetros de consulta
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const query = DocenteSubjectQuerySchema.parse({
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    // Build the where clause with proper TypeScript types
    const where: {
      teacherId: string;
      OR?: Array<{ code: { contains: string } }>;
    } = { teacherId: session.user.id };

    const subjects = await db.subject.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
    });

    // Filter by period if provided, otherwise include all subjects
    const filteredSubjects = period
      ? subjects.filter(subject => {
          const subjectPeriod = getPeriodFromDate(subject.createdAt);
          return subjectPeriod === period;
        })
      : subjects;
    const validados = z.array(DocenteSubjectSchema).safeParse(filteredSubjects);
    if (!validados.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validados.error.issues,
        },
        { status: 500 }
      );
    }

    // Add period information to each subject based on createdAt
    const subjectsWithPeriods = validados.data.map(subject => {
      const period = getPeriodFromDate(subject.createdAt);
      return {
        ...subject,
        period,
      };
    });

    return NextResponse.json({
      data: subjectsWithPeriods,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de consulta inválidos', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}

// HU-004: Creación Inteligente de Asignaturas
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = DocenteSubjectCreateSchema.parse(body);
    // Validar unicidad del código
    const existingSubject = await db.subject.findUnique({
      where: { code: data.code },
    });
    if (existingSubject) {
      return NextResponse.json(
        { message: 'El código de la asignatura ya está en uso' },
        { status: 409 }
      );
    }
    const newSubject = await db.subject.create({
      data: {
        ...data,
        semester: data.semester === undefined ? null : data.semester,
        credits: data.credits === undefined ? null : data.credits,
        teacherId: session.user.id,
      },
    });
    const validado = DocenteSubjectSchema.safeParse(newSubject);
    if (!validado.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validado.error.issues,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { data: validado.data, message: 'Asignatura creada correctamente' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}

// HU-004: Editar Asignatura
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = DocenteSubjectUpdateSchema.parse(body);
    const subjectToUpdate = await db.subject.findUnique({
      where: { id: data.id },
    });
    if (!subjectToUpdate || subjectToUpdate.teacherId !== session.user.id) {
      return NextResponse.json(
        {
          message: 'Asignatura no encontrada o no tienes permiso para editarla',
        },
        { status: 404 }
      );
    }
    const updatedSubject = await db.subject.update({
      where: { id: data.id },
      data: {
        name: data.name,
        code: data.code,
        program: data.program,
        semester: data.semester === undefined ? null : data.semester,
        credits: data.credits === undefined ? null : data.credits,
      },
    });
    const validado = DocenteSubjectSchema.safeParse(updatedSubject);
    if (!validado.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validado.error.issues,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      data: validado.data,
      message: 'Asignatura actualizada correctamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}

// HU-004: Eliminar Asignatura
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const schema = z.object({ id: z.string() });
    const { id } = schema.parse(body);
    const subjectToDelete = await db.subject.findUnique({ where: { id } });
    if (!subjectToDelete || subjectToDelete.teacherId !== session.user.id) {
      return NextResponse.json(
        {
          message: 'Asignatura no encontrada o no tienes permiso para eliminarla',
        },
        { status: 404 }
      );
    }
    await db.subject.delete({ where: { id } });
    return NextResponse.json({ message: 'Asignatura eliminada con éxito' }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}

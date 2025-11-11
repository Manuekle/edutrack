import { authOptions } from '@/lib/auth';
import { clearSubjectCache } from '@/lib/cache';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// HU-010: Obtener lista de estudiantes para pasar lista
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');

  if (!classId) {
    return NextResponse.json({ message: 'El ID de la clase es requerido' }, { status: 400 });
  }

  try {
    // 1. Verificar que el docente es dueño de la clase
    const classWithSubject = await db.class.findFirst({
      where: {
        id: classId,
        subject: { teacherId: session.user.id },
      },
      include: { subject: true },
    });

    if (!classWithSubject) {
      return NextResponse.json(
        { message: 'Clase no encontrada o no tienes permiso' },
        { status: 404 }
      );
    }

    // 2. Obtener los IDs de los estudiantes inscritos en la asignatura
    const studentIds = classWithSubject.subject.studentIds;

    if (studentIds.length === 0) {
      return NextResponse.json([]);
    }

    // 3. Obtener los datos de los estudiantes
    const students = await db.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, correoInstitucional: true },
    });

    // 4. Obtener la asistencia ya registrada para esta clase
    const attendances = await db.attendance.findMany({
      where: { classId: classId },
    });

    const attendanceMap = new Map(attendances.map(a => [a.studentId, a.status]));

    // 5. Combinar la lista de estudiantes con su estado de asistencia
    const studentsWithAttendance = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.correoInstitucional,
      status: attendanceMap.get(student.id) || 'Ausente', // Por defecto 'Ausente'
    }));

    return NextResponse.json(studentsWithAttendance);
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// HU-010: Guardar/actualizar la asistencia para una clase
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { classId, attendances } = body; // attendances es un array de { studentId, status }

    if (!classId || !Array.isArray(attendances)) {
      return NextResponse.json({ message: 'Datos de asistencia inválidos' }, { status: 400 });
    }

    // Verificar que el docente es dueño de la clase
    const classWithSubject = await db.class.findFirst({
      where: { id: classId, subject: { teacherId: session.user.id } },
    });

    if (!classWithSubject) {
      return NextResponse.json(
        { message: 'Clase no encontrada o no tienes permiso' },
        { status: 404 }
      );
    }

    // Usar transacciones para asegurar que todas las actualizaciones se completen
    const updatePromises = attendances.map(({ studentId, status }) =>
      db.attendance.upsert({
        where: { studentId_classId: { studentId, classId } },
        update: { status },
        create: { studentId, classId, status },
      })
    );

    await db.$transaction(updatePromises);

    // CACHE: Invalidate cache for this subject (affects all students and teacher)
    await clearSubjectCache(classWithSubject.subjectId);

    return NextResponse.json({ message: 'Asistencia guardada con éxito' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// HU-015: Actualizar la asistencia de un solo estudiante
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { classId, studentId, status } = body;

    if (!classId || !studentId || !status) {
      return NextResponse.json(
        { message: 'Faltan datos para actualizar la asistencia' },
        { status: 400 }
      );
    }

    // 1. Verificar que el docente es dueño de la clase
    const classWithSubject = await db.class.findFirst({
      where: {
        id: classId,
        subject: { teacherId: session.user.id },
      },
    });

    if (!classWithSubject) {
      return NextResponse.json(
        { message: 'Clase no encontrada o no tienes permiso' },
        { status: 404 }
      );
    }

    // 2. Actualizar o crear el registro de asistencia para el estudiante
    const updatedAttendance = await db.attendance.upsert({
      where: { studentId_classId: { studentId, classId } },
      update: { status },
      create: { studentId, classId, status },
    });

    // CACHE: Invalidate cache for this subject (affects all students and teacher)
    await clearSubjectCache(classWithSubject.subjectId);

    return NextResponse.json(updatedAttendance, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

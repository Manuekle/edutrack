import { authOptions } from '@/lib/auth';
import { clearSubjectCache } from '@/lib/cache';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { AttendanceListResponseSchema, AttendanceUpsertSchema } from './schema';

// Función para verificar que el docente es dueño de la clase
async function verifyTeacherOwnership(classId: string, teacherId: string) {
  const classWithSubject = await db.class.findUnique({
    where: { id: classId },
    include: { subject: true },
  });
  return classWithSubject?.subject.teacherId === teacherId;
}

// GET: Obtener la lista de estudiantes de una clase con su estado de asistencia
export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const teacherId = session.user.id;
  if (!(await verifyTeacherOwnership(classId, teacherId))) {
    return NextResponse.json({ message: 'No tienes permiso para ver esta clase' }, { status: 403 });
  }
  try {
    // 1. Obtener la información de la clase y la asignatura con sus estudiantes
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      select: {
        subject: {
          select: {
            id: true,
            name: true,
            studentIds: true,
          },
        },
      },
    });
    if (!classInfo || !classInfo.subject) {
      return NextResponse.json({ message: 'Clase o asignatura no encontrada' }, { status: 404 });
    }
    const { subject } = classInfo;
    // 2. Obtener los detalles de los estudiantes matriculados
    const students = await db.user.findMany({
      where: { id: { in: subject.studentIds } },
      select: { id: true, name: true, correoInstitucional: true },
    });
    // 3. Obtener las asistencias ya registradas para esta clase
    const attendances = await db.attendance.findMany({ where: { classId } });
    const attendanceMap = new Map(attendances.map(att => [att.studentId, att.status]));
    // 4. Combinar la lista de estudiantes con su estado de asistencia
    const studentAttendanceList = students.map(student => ({
      studentId: student.id,
      name: student.name,
      email: student.correoInstitucional,
      status: attendanceMap.get(student.id) || 'AUSENTE',
    }));
    const validated = AttendanceListResponseSchema.safeParse(studentAttendanceList);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validated.error.issues,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: validated.data });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Guardar/Actualizar la asistencia de los estudiantes para una clase
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  const teacherId = session.user.id;
  if (!(await verifyTeacherOwnership(classId, teacherId))) {
    return NextResponse.json(
      { message: 'No tienes permiso para modificar esta asistencia' },
      { status: 403 }
    );
  }
  try {
    const body = await request.json();
    const parsed = AttendanceUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Datos de asistencia inválidos',
          errors: parsed.error.issues,
        },
        { status: 400 }
      );
    }
    const { attendances } = parsed.data;

    // Get subject ID before updating attendance
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      select: { subjectId: true },
    });

    const upsertOperations = attendances.map(({ studentId, status }) =>
      db.attendance.upsert({
        where: { studentId_classId: { studentId, classId } },
        update: { status },
        create: { studentId, classId, status },
      })
    );
    await db.$transaction(upsertOperations);

    // CACHE: Invalidate cache for this subject (affects all students and teacher)
    if (classInfo) {
      await clearSubjectCache(classInfo.subjectId);
    }

    return NextResponse.json({ message: 'Asistencia guardada con éxito' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

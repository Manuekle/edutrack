/**
 * SIRA - Class Management API
 * Fixed: Resolving Turbopack parsing error by cleaning structure.
 */

import ClassCancellationEmail from '@/app/emails/ClassCancellationEmail';
import { authOptions } from '@/lib/auth';
import { clearSubjectCache } from '@/lib/cache';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import React from 'react';
import { DocenteClaseDetailSchema, DocenteClaseUpdateSchema } from './schema';

// --- Helpers ---

async function verifyTeacherOwnership(classId: string, teacherId: string) {
  const classWithRelations = await db.class.findUnique({
    where: { id: classId },
    include: { 
      subject: { select: { teacherIds: true } },
      group: { select: { teacherIds: true } }
    },
  });

  if (!classWithRelations) return false;

  const inSubject = classWithRelations.subject?.teacherIds?.includes(teacherId) || false;
  const inGroup = classWithRelations.group?.teacherIds?.includes(teacherId) || false;

  return inSubject || inGroup;
}

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const combineDateTime = (date: Date, timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
};

// --- Handlers ---

// GET: Obtener los detalles de una clase específica
export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  
  const teacherId = session.user.id;

  try {
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      include: {
        subject: { select: { id: true, name: true, code: true, teacherIds: true } },
        group: { select: { id: true, teacherIds: true } },
      },
    });

    const hasAccess = 
      classInfo && 
      (classInfo.subject?.teacherIds?.includes(teacherId) || 
       classInfo.group?.teacherIds?.includes(teacherId));

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Clase no encontrada o no pertenece al docente' },
        { status: 404 }
      );
    }

    const validated = DocenteClaseDetailSchema.safeParse(classInfo);
    if (!validated.success) {
      return NextResponse.json(
        { message: 'Error de validación en la respuesta', errors: validated.error.issues },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: validated.data });
  } catch (error) {
    console.error(`[API] Error in GET class ${classId}:`, error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Actualizar una clase
export async function PUT(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const hasPermission = await verifyTeacherOwnership(classId, session.user.id);
  if (!hasPermission) {
    return NextResponse.json(
      { message: 'No tienes permiso para editar esta clase' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const result = DocenteClaseUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { date, startTime, endTime, topic, description, status, reason } = result.data;

    let parsedDate: Date | undefined;
    let parsedStartTime: Date | undefined;
    let parsedEndTime: Date | undefined;

    if (date) {
      parsedDate = parseLocalDate(date);
      if (startTime) parsedStartTime = combineDateTime(parsedDate, startTime);
      if (endTime) parsedEndTime = combineDateTime(parsedDate, endTime);
    } else if (startTime || endTime) {
      const existingClass = await db.class.findUnique({
        where: { id: classId },
        select: { date: true },
      });
      if (existingClass) {
        if (startTime) parsedStartTime = combineDateTime(existingClass.date, startTime);
        if (endTime) parsedEndTime = combineDateTime(existingClass.date, endTime);
      }
    }

    // Email Notification logic
    if (status === 'CANCELLED' && reason) {
      const classToCancel = await db.class.findUnique({
        where: { id: classId },
        include: {
          group: { select: { studentIds: true } },
          subject: { include: { teachers: { select: { name: true } } } },
        },
      });

      if (classToCancel) {
        const allStudentIds = new Set([
          ...(classToCancel.subject.studentIds || []),
          ...(classToCancel.group?.studentIds || []),
        ]);

        if (allStudentIds.size > 0) {
          const students = await db.user.findMany({
            where: { id: { in: Array.from(allStudentIds) } },
            select: { institutionalEmail: true, personalEmail: true },
          });

          const studentEmails = students
            .map(s => s.institutionalEmail || s.personalEmail)
            .filter((e): e is string => !!e);

          if (studentEmails.length > 0) {
            console.log(`[API] Notifying ${studentEmails.length} students about cancellation`);
            const teacherName = classToCancel.subject.teachers[0]?.name || 'El docente';
            const emailComponent = React.createElement(ClassCancellationEmail, {
              subjectName: classToCancel.subject.name,
              teacherName,
              classDate: classToCancel.date.toISOString(),
              reason,
              supportEmail: process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co',
              loginUrl: `${process.env.NEXTAUTH_URL}/login`,
            });

            const emailPromises = studentEmails.map(to =>
              sendEmail({
                to,
                subject: `Clase Cancelada: ${classToCancel.subject.name}`,
                react: emailComponent,
              }).catch(err => {
                console.error(`[API] Failed email to ${to}:`, err);
                return { success: false };
              })
            );
            await Promise.all(emailPromises);
          }
        }
      }
    }

    const updatedClass = await db.class.update({
      where: { id: classId },
      data: {
        ...(parsedDate && { date: parsedDate }),
        ...(parsedStartTime && { startTime: parsedStartTime }),
        ...(parsedEndTime && { endTime: parsedEndTime }),
        ...(topic !== undefined && { topic }),
        ...(description !== undefined && { description }),
        ...(status && { status: status as any }),
        ...(status === 'CANCELLED' && reason && { cancellationReason: reason }),
      },
      include: { subject: true, group: true },
    });

    const validated = DocenteClaseDetailSchema.safeParse(updatedClass);
    if (!validated.success) {
      return NextResponse.json(
        { message: 'Error de validación en la respuesta', errors: validated.error.issues },
        { status: 500 }
      );
    }

    await clearSubjectCache(updatedClass.subject.id);
    const revalidateId = updatedClass.groupId || updatedClass.subjectId;
    if (revalidateId) {
      revalidatePath(`/dashboard/docente/grupos/${revalidateId}`);
      revalidatePath(`/dashboard/docente/grupos/${revalidateId}/preview`);
    }

    return NextResponse.json({ data: validated.data });
  } catch (error) {
    console.error(`[API] Error updating class ${classId}:`, error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar una clase
export async function DELETE(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const hasPermission = await verifyTeacherOwnership(classId, session.user.id);
  if (!hasPermission) {
    return NextResponse.json({ message: 'No tienes permiso' }, { status: 403 });
  }

  try {
    const classToDelete = await db.class.findUnique({
      where: { id: classId },
      select: { subjectId: true },
    });

    const deleted = await db.class.delete({
      where: { id: classId },
      include: { subject: true },
    });

    if (classToDelete) {
      await clearSubjectCache(classToDelete.subjectId);
    }

    return NextResponse.json({ message: 'Clase eliminada con éxito' });
  } catch (error) {
    console.error(`[API] Error deleting class ${classId}:`, error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

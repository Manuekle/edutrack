import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@/lib/roles';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// PATCH: Actualizar un usuario existente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();

    const normalizeEmail = (val?: string | null) => {
      if (typeof val !== 'string') return undefined;
      const clean = val.trim().toLowerCase();
      return clean === '' ? undefined : clean;
    };

    const sanitize = (val?: string | null) => {
      if (typeof val !== 'string') return undefined;
      const clean = val.trim();
      return clean === '' ? undefined : clean;
    };

    const name = body?.name;
    const role = body?.role;
    const isActive = body?.isActive;
    const document = body?.document;
    const phone = body?.phone;
    const personalEmail = body?.personalEmail ?? body?.correoPersonal;
    const institutionalEmail = body?.institutionalEmail ?? body?.correoInstitucional;
    const studentCode = body?.studentCode;
    const teacherCode = body?.teacherCode;

    const normalizedPersonalEmail = normalizeEmail(personalEmail);
    const normalizedInstitutionalEmail = normalizeEmail(institutionalEmail);

    console.log('[PATCH USER] BODY:', body);
    console.log('[PATCH USER] userId:', userId);
    console.log('[PATCH USER] normalizedPersonalEmail:', normalizedPersonalEmail);
    console.log('[PATCH USER] normalizedInstitutionalEmail:', normalizedInstitutionalEmail);

    const sendingEmails =
      'personalEmail' in body ||
      'institutionalEmail' in body ||
      'correoPersonal' in body ||
      'correoInstitucional' in body;

    if (
      sendingEmails &&
      !normalizedPersonalEmail &&
      !normalizedInstitutionalEmail
    ) {
      return NextResponse.json(
        { message: 'El usuario debe tener al menos un correo electrónico.' },
        { status: 400 }
      );
    }

    const emailsToCheck = [
      normalizedPersonalEmail,
      normalizedInstitutionalEmail,
    ].filter(Boolean) as string[];

    if (emailsToCheck.length > 0) {
      const existingUser = await db.user.findFirst({
        where: {
          id: { not: userId },
          OR: [
            { personalEmail: { in: emailsToCheck } },
            { institutionalEmail: { in: emailsToCheck } },
          ],
        },
        select: {
          id: true,
          name: true,
          personalEmail: true,
          institutionalEmail: true,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: 'Uno de los correos electrónicos ya está en uso.' },
          { status: 409 }
        );
      }
    }

    const beforeUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        personalEmail: true,
        institutionalEmail: true,
      },
    });

    console.log('[PATCH USER] BEFORE:', beforeUser);

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = sanitize(name) ?? name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (document !== undefined) updateData.document = sanitize(document);
    if (phone !== undefined) updateData.phone = sanitize(phone);
    if (studentCode !== undefined) updateData.studentCode = sanitize(studentCode);
    if (teacherCode !== undefined) updateData.teacherCode = sanitize(teacherCode);

    if (
      'personalEmail' in body ||
      'correoPersonal' in body
    ) {
      updateData.personalEmail = normalizedPersonalEmail ?? null;
    }

    if (
      'institutionalEmail' in body ||
      'correoInstitucional' in body
    ) {
      updateData.institutionalEmail = normalizedInstitutionalEmail ?? null;
    }

    console.log('[PATCH USER] UPDATE DATA:', updateData);

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData as Prisma.UserUpdateInput,
      select: {
        id: true,
        name: true,
        personalEmail: true,
        institutionalEmail: true,
        role: true,
        isActive: true,
        createdAt: true,
        document: true,
        phone: true,
        studentCode: true,
        teacherCode: true,
      },
    });

    console.log('[PATCH USER] AFTER:', updatedUser);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[PATCH /api/admin/users/[userId]] Error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'Uno de los correos electrónicos ya está en uso.' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { userId } = await params;

    if (session.user.id === userId) {
      return NextResponse.json(
        { message: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      { message: 'Usuario eliminado con éxito' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          {
            message:
              'No se puede eliminar el usuario porque tiene registros asociados (ej. asignaturas, asistencias).',
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
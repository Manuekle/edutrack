import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import bcrypt from 'bcryptjs';

interface UserPreview {
  name: string;
  document: string;
  email: string;
  subjectCode: string;
  groupCode: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

const generatePassword = (length: number = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(req.url, `https://${req.headers.get('host')}`);
    const forceRole = url.searchParams.get('forceRole') as Role | null;

    if (!forceRole || (forceRole !== Role.DOCENTE && forceRole !== Role.ESTUDIANTE)) {
       return NextResponse.json({ error: 'Debe especificar forceRole=DOCENTE o forceRole=ESTUDIANTE' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Se espera multipart/form-data con un archivo CSV' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const isPreview = formData.get('preview') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);

    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json(
        { error: 'El archivo CSV tiene un formato inválido' },
        { status: 400 }
      );
    }

    const headers = parsed.meta.fields || [];

    // Header mapping
    const headerMap: Record<string, string[]> = {
      name: ['nombre', 'name', 'nombrecompleto', 'nombres'],
      document: ['documento', 'document', 'cedula', 'identificacion', 'id'],
      email: ['correo', 'email', 'correopersonal', 'correoinstitucional'],
      subjectCode: ['asignatura', 'codigoasignatura', 'subject', 'codigo_asignatura', 'codigo'],
      groupCode: ['grupo', 'group', 'codigogrupo'],
    };

    const findHeader = (variants: string[]): string | undefined => {
      for (const variant of variants) {
        const normalized = variant.toLowerCase().replace(/[\s_]+/g, '');
        const found = headers.find(h => h.toLowerCase().replace(/[\s_]+/g, '') === normalized);
        if (found) return found;
      }
      return undefined;
    };

    const getValue = (row: Record<string, string>, header: string | undefined): string => {
      if (!header) return '';
      return (row[header] || '').trim();
    };

    const nameH = findHeader(headerMap.name);
    const documentH = findHeader(headerMap.document);
    const emailH = findHeader(headerMap.email);
    const subjectCodeH = findHeader(headerMap.subjectCode);
    const groupCodeH = findHeader(headerMap.groupCode);

    if (!nameH || !documentH || !emailH || !subjectCodeH || !groupCodeH) {
      return NextResponse.json(
        {
          error:
            'El CSV debe incluir al menos las columnas: nombre, documento, correo, asignatura y grupo. Columnas encontradas: ' +
            headers.join(', '),
        },
        { status: 400 }
      );
    }

    // Pre-fetch all groups and subjects for validation
    const groups = await db.group.findMany({
      include: { subject: true }
    });

    // Map for quick group lookup: `${subjectCode}_${groupCode}` -> groupId
    const groupLookup = new Map<string, string>();
    const subjectLookup = new Map<string, string>();

    groups.forEach(g => {
       const key = `${g.subject.code}_${g.code}`.toLowerCase();
       groupLookup.set(key, g.id);
       subjectLookup.set(g.subject.code.toLowerCase(), g.subject.id);
    });

    const existingUsers = await db.user.findMany({ select: { document: true, personalEmail: true, id: true, role: true } });
    const existingDocs = new Map(existingUsers.map(u => [u.document?.toLowerCase() || '', u]));
    const existingEmails = new Map(existingUsers.map(u => [u.personalEmail?.toLowerCase() || '', u]));

    const previews: (UserPreview & { groupId?: string, subjectId?: string, existingUserId?: string })[] = [];
    
    // To check for duplicates within the file itself
    const processedKeys = new Set<string>();

    for (const row of parsed.data) {
      const name = getValue(row, nameH);
      const documentStr = getValue(row, documentH);
      const email = getValue(row, emailH);
      const subjectCode = getValue(row, subjectCodeH);
      const groupCode = getValue(row, groupCodeH);

      if (!name || !documentStr || !email || !subjectCode || !groupCode) {
        previews.push({
          name, document: documentStr, email, subjectCode, groupCode,
          status: 'error',
          message: 'Faltan campos requeridos en la fila',
        });
        continue;
      }

      const lookupKey = `${subjectCode}_${groupCode}`.toLowerCase();
      const groupId = groupLookup.get(lookupKey);
      const subjectId = subjectLookup.get(subjectCode.toLowerCase());

      if (!groupId || !subjectId) {
        previews.push({
          name, document: documentStr, email, subjectCode, groupCode,
          status: 'error',
          message: `La asignatura '${subjectCode}' con el grupo '${groupCode}' no existe en el sistema.`,
        });
        continue;
      }

      // Check for file duplicates
      const fileKey = `${documentStr}_${lookupKey}`.toLowerCase();
      if (processedKeys.has(fileKey)) {
          previews.push({
            name, document: documentStr, email, subjectCode, groupCode,
            status: 'error',
            message: 'Registro duplicado en este mismo archivo.',
          });
          continue;
      }
      processedKeys.add(fileKey);

      // Check if user exists
      const existingUserByDoc = existingDocs.get(documentStr.toLowerCase());
      const existingUserByEmail = existingEmails.get(email.toLowerCase());

      let existingUserId = null;
      if (existingUserByDoc || existingUserByEmail) {
         const user = existingUserByDoc || existingUserByEmail;
         // Ensure role matches what we're uploading
         if (user?.role !== forceRole) {
             previews.push({
                name, document: documentStr, email, subjectCode, groupCode,
                status: 'error',
                message: `El usuario ya existe pero tiene rol ${user?.role}.`,
             });
             continue;
         }
         existingUserId = user?.id;
      }

      previews.push({
        name, document: documentStr, email, subjectCode, groupCode,
        status: existingUserId ? 'warning' : 'success',
        message: existingUserId ? 'El usuario existe. Se añadirá a este grupo.' : 'Listo para crear y asignar.',
        groupId,
        subjectId,
        existingUserId
      });
    }

    if (isPreview) {
      return NextResponse.json({ success: true, previewData: previews });
    }

    // Confirm mode: creation
    const validItems = previews.filter(p => p.status === 'success' || p.status === 'warning');
    
    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'No hay filas válidas para crear' },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let mappedCount = 0;
    let errorCount = 0;

    await db.$transaction(async (tx) => {
      for (const item of validItems) {
        try {
            let userId = item.existingUserId;

            if (!userId) {
                // Must create the user
                const hashedPassword = await bcrypt.hash(generatePassword(12), 12);
                const newUser = await tx.user.create({
                    data: {
                        name: item.name,
                        document: item.document,
                        personalEmail: item.email,
                        institutionalEmail: item.email || undefined,
                        password: hashedPassword,
                        role: forceRole,
                        isActive: true
                    }
                });
                userId = newUser.id;
                createdCount++;
            } else {
                mappedCount++;
            }

            // Map to group and subject
            if (forceRole === Role.DOCENTE) {
               // Update group
               await tx.group.update({
                  where: { id: item.groupId! },
                  data: { teachers: { connect: { id: userId } } }
               });
               // Update subject
               await tx.subject.update({
                  where: { id: item.subjectId! },
                  data: { teachers: { connect: { id: userId } } }
               });
            } else { // ESTUDIANTE
               await tx.group.update({
                  where: { id: item.groupId! },
                  data: { students: { connect: { id: userId } } }
               });
               await tx.subject.update({
                  where: { id: item.subjectId! },
                  data: { studentIds: { push: userId } } 
               });
            }
        } catch (e) {
            console.error(e);
            errorCount++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: previews.length,
        created: createdCount,
        mapped: mappedCount,
        errors: errorCount,
        skipped: previews.length - createdCount - mappedCount - errorCount,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

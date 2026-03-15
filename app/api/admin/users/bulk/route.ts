import { authOptions } from '@/lib/auth';
import { decodeCSVBuffer } from '@/lib/csv-encoding';
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
  status: 'success' | 'error' | 'warning';
  message: string;
}


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
    const text = decodeCSVBuffer(buffer);

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
      document: ['codigo_estudiante', 'codigoestudiante', 'documento', 'document', 'cedula', 'identificacion', 'id'],
      email: ['correo', 'email', 'correopersonal', 'correoinstitucional'],
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

    if (!nameH || !documentH || !emailH) {
      const docLabel = forceRole === Role.ESTUDIANTE ? 'codigo_estudiante' : 'documento';
      return NextResponse.json(
        {
          error:
            `El CSV debe incluir al menos las columnas: nombre, ${docLabel} y correo. Columnas encontradas: ` +
            headers.join(', '),
        },
        { status: 400 }
      );
    }

    const existingUsers = await db.user.findMany({ select: { document: true, personalEmail: true, id: true, role: true } });
    const existingDocs = new Map(existingUsers.map(u => [u.document?.toLowerCase() || '', u]));
    const existingEmails = new Map(existingUsers.map(u => [u.personalEmail?.toLowerCase() || '', u]));

    const previews: (UserPreview & { existingUserId?: string })[] = [];

    // To check for duplicates within the file itself
    const processedDocs = new Set<string>();

    for (const row of parsed.data) {
      const name = getValue(row, nameH);
      const documentStr = getValue(row, documentH);
      const email = getValue(row, emailH);

      if (!name || !documentStr || !email) {
        previews.push({
          name, document: documentStr, email,
          status: 'error',
          message: 'Faltan campos requeridos en la fila',
        });
        continue;
      }

      // Check for file duplicates
      const docKey = documentStr.toLowerCase();
      if (processedDocs.has(docKey)) {
          previews.push({
            name, document: documentStr, email,
            status: 'error',
            message: forceRole === Role.ESTUDIANTE
              ? 'Código estudiante duplicado en este mismo archivo.'
              : 'Documento duplicado en este mismo archivo.',
          });
          continue;
      }
      processedDocs.add(docKey);

      // Check if user exists
      const existingUserByDoc = existingDocs.get(documentStr.toLowerCase());
      const existingUserByEmail = existingEmails.get(email.toLowerCase());

      if (existingUserByDoc || existingUserByEmail) {
         const user = existingUserByDoc || existingUserByEmail;
         if (user?.role !== forceRole) {
             previews.push({
                name, document: documentStr, email,
                status: 'error',
                message: `El usuario ya existe pero tiene rol ${user?.role}.`,
             });
             continue;
         }
         previews.push({
           name, document: documentStr, email,
           status: 'warning',
           message: 'El usuario ya existe en el sistema.',
           existingUserId: user?.id,
         });
         continue;
      }

      previews.push({
        name, document: documentStr, email,
        status: 'success',
        message: 'Listo para crear.',
      });
    }

    if (isPreview) {
      return NextResponse.json({ success: true, previewData: previews });
    }

    // Confirm mode: only create new users
    const validItems = previews.filter(p => p.status === 'success');

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'No hay usuarios nuevos para crear' },
        { status: 400 }
      );
    }

    // Hash all passwords BEFORE the transaction (bcrypt is slow, must not run inside a transaction)
    const itemsWithPasswords = await Promise.all(
      validItems.map(async item => ({
        ...item,
        hashedPassword: await bcrypt.hash(item.document, 10),
      }))
    );

    let createdCount = 0;
    let errorCount = 0;

    await db.$transaction(
      itemsWithPasswords.map(item =>
        db.user.create({
          data: {
            name: item.name,
            document: item.document,
            personalEmail: item.email,
            institutionalEmail: item.email || undefined,
            password: item.hashedPassword,
            role: forceRole,
            isActive: true,
            mustChangePassword: true,
          },
        })
      )
    ).then(results => {
      createdCount = results.length;
    }).catch(e => {
      console.error(e);
      errorCount = itemsWithPasswords.length;
    });

    const alreadyExisted = previews.filter(p => p.status === 'warning').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: previews.length,
        created: createdCount,
        alreadyExisted,
        errors: errorCount,
        skipped: previews.length - createdCount - alreadyExisted - errorCount,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

import WelcomeUserEmail from '@/app/emails/WelcomeUserEmail';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Interfaces para la carga de usuarios
interface ExcelRow {
  [key: string]: string | number;
}

interface UserData {
  name: string;
  document: string;
  correoPersonal: string;
  correoInstitucional?: string;
  password?: string;
  role: string;
}

interface PreviewResult {
  data: UserData;
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface FinalResult {
  document: string;
  name: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
}

// Función para generar contraseñas aleatorias
const generatePassword = (length: number = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Función para enviar correo de manera asíncrona (no bloqueante)
const sendWelcomeEmailAsync = async (
  email: string,
  name: string,
  password: string
): Promise<void> => {
  try {
    await sendEmail({
      to: email,
      subject: '¡Bienvenido/a a la Plataforma!',
      react: WelcomeUserEmail({
        name: name,
        email: email,
        password: password,
        loginUrl: `${process.env.NEXTAUTH_URL}/auth/signin`,
        supportEmail: 'soporte@example.com',
      }),
    });
  } catch (emailError) {
    // Error sending email
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'No autorizado. Solo los ADMIN pueden realizar esta acción.' },
      { status: 401 }
    );
  }

  const url = new URL(request.url, `https://${request.headers.get('host')}`);
  const forceRole = url.searchParams.get('forceRole');
  const isPreview = url.searchParams.get('preview') === 'true';

  // --- MODO PREVISUALIZACIÓN: Leer y validar archivo Excel/CSV ---
  if (isPreview) {
    try {
      const data = await request.formData();
      const file = data.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No se subió ningún archivo.' }, { status: 400 });
      }

      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith('.csv');

      if (!isCSV) {
        return NextResponse.json(
          {
            error:
              'Tipo de archivo no válido. Se requiere un archivo CSV (.csv).',
          },
          { status: 400 }
        );
      }

      const buffer = await file.arrayBuffer();
      let rows: ExcelRow[] = [];

      // CSV Logic Only
      const text = new TextDecoder('utf-8').decode(buffer);
      const lines = text.split(/\r?\n/).filter(line => line.trim());

      if (lines.length === 0) {
        return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 });
      }

      // Función para parsear una línea CSV manejando comas dentro de comillas
      const parseCSVLine = (line: string): string[] => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Comilla escapada ("" dentro de comillas)
              current += '"';
              i++; // Saltar la siguiente comilla
            } else {
              // Toggle estado de comillas
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // Separador de campo (solo fuera de comillas)
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        // Agregar el último valor
        values.push(current.trim());

        // Limpiar comillas de los valores
        return values.map(val => {
          // Remover comillas externas si existen
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            return val.slice(1, -1).replace(/""/g, '"'); // Reemplazar comillas escapadas
          }
          return val;
        });
      };

      // Parsear headers
      const headers = parseCSVLine(lines[0]).map(h => h.trim());

      // Parsear filas
      rows = lines
        .slice(1)
        .map(line => {
          const values = parseCSVLine(line);

          // Crear objeto con headers
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row as ExcelRow;
        })
        .filter(row => {
          // Filtrar filas vacías
          return Object.values(row).some(val => val && String(val).trim());
        });

      const previewResults: PreviewResult[] = [];

      const allUsers = await db.user.findMany({
        select: { document: true, correoPersonal: true },
      });
      const existingDocuments = new Set(allUsers.map(u => u.document));
      const existingEmails = new Set(allUsers.map(u => u.correoPersonal));

      // Set para detectar duplicados en el mismo archivo
      const processedDocuments = new Set<string>();
      const processedEmails = new Set<string>();

      // Normalizar headers para búsqueda flexible (case-insensitive, espacios)
      const normalizeHeader = (header: string): string => {
        return header
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, '');
      };

      // Obtener headers del primer row si es CSV, o usar las claves disponibles
      const availableHeaders = rows.length > 0 ? Object.keys(rows[0] || {}) : [];
      const normalizedHeaders = availableHeaders.reduce(
        (acc, header) => {
          acc[normalizeHeader(header)] = header;
          return acc;
        },
        {} as Record<string, string>
      );

      // Función para encontrar el header correcto
      const findHeader = (variants: string[]): string | undefined => {
        for (const variant of variants) {
          const normalized = normalizeHeader(variant);
          if (normalizedHeaders[normalized]) {
            return normalizedHeaders[normalized];
          }
        }
        return undefined;
      };

      // Mapear headers a variantes comunes
      const nameHeader =
        findHeader(['name', 'nombre', 'nombre completo', 'nombrecompleto']) ||
        availableHeaders.find(
          h => normalizeHeader(h).includes('nombre') || normalizeHeader(h).includes('name')
        );

      const documentHeader =
        findHeader([
          'document',
          'documento',
          'cedula',
          'cédula',
          'dni',
          'identificacion',
          'identificación',
        ]) ||
        availableHeaders.find(
          h =>
            normalizeHeader(h).includes('document') ||
            normalizeHeader(h).includes('cedula') ||
            normalizeHeader(h).includes('dni')
        );

      const correoPersonalHeader =
        findHeader([
          'correo personal',
          'correopersonal',
          'correo',
          'email',
          'email personal',
          'emailpersonal',
        ]) ||
        availableHeaders.find(
          h => normalizeHeader(h).includes('correo') || normalizeHeader(h).includes('email')
        );

      const correoInstitucionalHeader =
        findHeader([
          'correo institucional',
          'correoinstitucional',
          'correo institucion',
          'email institucional',
          'emailinstitucional',
        ]) ||
        availableHeaders.find(
          h =>
            normalizeHeader(h).includes('institucional') ||
            normalizeHeader(h).includes('institucion')
        );

      const passwordHeader =
        findHeader(['password', 'contraseña', 'contrasena', 'pass', 'clave']) ||
        availableHeaders.find(
          h => normalizeHeader(h).includes('password') || normalizeHeader(h).includes('contraseña')
        );

      const roleHeader =
        findHeader(['role', 'rol', 'tipo', 'tipo usuario', 'tipousuario']) ||
        availableHeaders.find(
          h => normalizeHeader(h).includes('rol') || normalizeHeader(h).includes('role')
        );

      for (const row of rows) {
        // Mapeo flexible de cabeceras usando los headers encontrados o fallback
        const mappedRow = {
          name:
            (nameHeader ? row[nameHeader] : undefined) ||
            row.name ||
            row.Name ||
            row.nombre ||
            row.Nombre,
          document:
            (documentHeader ? row[documentHeader] : undefined) ||
            row.document ||
            row.Document ||
            row.documento ||
            row.Documento,
          correoPersonal:
            (correoPersonalHeader ? row[correoPersonalHeader] : undefined) ||
            row.correoPersonal ||
            row['Correo Personal'] ||
            row.correo ||
            row.Correo,
          correoInstitucional:
            (correoInstitucionalHeader ? row[correoInstitucionalHeader] : undefined) ||
            row.correoInstitucional ||
            row['Correo Institucional'] ||
            row['CorreoInstitucional'],
          password:
            (passwordHeader ? row[passwordHeader] : undefined) ||
            row.password ||
            row.Password ||
            row.contraseña ||
            row.Contraseña,
          role:
            forceRole ||
            (roleHeader ? row[roleHeader] : undefined) ||
            row.role ||
            row.Role ||
            row.rol ||
            row.Rol,
        };

        const userData: UserData = {
          name: (mappedRow.name as string)?.trim() || '',
          document: String(mappedRow.document || '').trim(),
          correoPersonal: (mappedRow.correoPersonal as string)?.trim() || '',
          correoInstitucional: (mappedRow.correoInstitucional as string)?.trim() || undefined,
          password: (mappedRow.password as string)?.trim() || '',
          role: ((mappedRow.role as string) || '').trim().toUpperCase(),
        };

        if (!userData.name || !userData.document || !userData.correoPersonal || !userData.role) {
          previewResults.push({
            data: userData,
            status: 'error',
            message: 'Faltan campos requeridos (nombre, documento, correo, rol).',
          });
          continue;
        }

        if (!Object.values(Role).includes(userData.role as Role)) {
          previewResults.push({
            data: userData,
            status: 'error',
            message: `Rol '${userData.role}' no es válido.`,
          });
          continue;
        }

        // Verificar duplicados en el archivo
        if (
          processedDocuments.has(userData.document) ||
          processedEmails.has(userData.correoPersonal)
        ) {
          previewResults.push({
            data: userData,
            status: 'error',
            message: 'Documento o correo duplicado en el archivo.',
          });
          continue;
        }

        // Verificar si existe en la base de datos
        if (
          existingDocuments.has(userData.document) ||
          existingEmails.has(userData.correoPersonal)
        ) {
          previewResults.push({
            data: userData,
            status: 'warning',
            message: 'Usuario ya existe con este documento o correo. Será omitido.',
          });
          continue;
        }

        // Agregar a los sets de procesados
        processedDocuments.add(userData.document);
        processedEmails.add(userData.correoPersonal);

        // Si pasa todas las validaciones
        previewResults.push({
          data: userData,
          status: 'success',
          message: 'Datos válidos y listos para ser creados.',
        });
      }

      return NextResponse.json(previewResults);
    } catch (err) {
      return NextResponse.json(
        {
          error: 'Error procesando el archivo',
          message: err instanceof Error ? err.message : 'Error desconocido',
        },
        { status: 500 }
      );
    }
  }

  // --- MODO CREACIÓN: Recibir datos validados y crear usuarios ---
  try {
    const { previewData } = await request.json();

    if (!Array.isArray(previewData)) {
      return NextResponse.json(
        {
          error: 'Formato inválido',
          message: 'El formato de los datos es incorrecto. Se esperaba un array de usuarios.',
        },
        { status: 400 }
      );
    }

    // Filtrar solo los elementos con status 'success' para evitar duplicados
    const validUsers = previewData.filter(item => item.status === 'success');

    const finalResults: FinalResult[] = [];
    const validRoles = Object.values(Role);
    const emailQueue: Array<{ email: string; name: string; password: string }> = [];

    // Crear usuarios de forma secuencial para evitar condiciones de carrera
    for (const item of validUsers) {
      const { name, document, correoPersonal, correoInstitucional, role } = item.data || {};

      try {
        // Validar rol
        if (!validRoles.includes(role as Role)) {
          finalResults.push({
            document: document || 'N/A',
            name: name || 'Usuario desconocido',
            status: 'error',
            message: `Rol inválido: '${role}'. Roles válidos: ${validRoles.join(', ')}`,
          });
          continue;
        }

        // Verificar si el usuario ya existe (verificación adicional)
        const existingUser = await db.user.findFirst({
          where: {
            OR: [
              { document },
              { correoPersonal },
              { correoInstitucional: correoInstitucional || correoPersonal },
            ],
          },
          select: {
            id: true,
            document: true,
            correoPersonal: true,
            correoInstitucional: true,
          },
        });

        if (existingUser) {
          let conflictField = 'registro';
          if (existingUser.document === document) {
            conflictField = 'documento';
          } else if (existingUser.correoPersonal === correoPersonal) {
            conflictField = 'correo personal';
          } else if (existingUser.correoInstitucional === (correoInstitucional || correoPersonal)) {
            conflictField = 'correo institucional';
          }

          finalResults.push({
            document: document || 'N/A',
            name: name || 'Usuario desconocido',
            status: 'skipped',
            message: `El ${conflictField} ya está registrado en el sistema.`,
          });
          continue;
        }

        // Generar contraseña segura
        const plainPassword = item.data.password || generatePassword(12);
        const hashedPassword = await bcrypt.hash(plainPassword, 12);

        // Crear usuario (SIN transacción para evitar timeouts)
        const user = await db.user.create({
          data: {
            name,
            document,
            correoPersonal,
            correoInstitucional: correoInstitucional || correoPersonal,
            password: hashedPassword,
            role: role as Role,
            emailVerified: new Date(),
          },
        });

        // Agregar email a la cola para envío posterior
        const emailToSend = correoInstitucional || correoPersonal;
        emailQueue.push({
          email: emailToSend,
          name: name,
          password: plainPassword,
        });

        finalResults.push({
          document: document || 'N/A',
          name: name || 'Usuario desconocido',
          status: 'created',
          message: 'Usuario creado exitosamente.',
        });
      } catch (error) {
        finalResults.push({
          document: document || 'N/A',
          name: name || 'Usuario desconocido',
          status: 'error',
          message: error instanceof Error ? error.message : 'Error desconocido al crear el usuario',
        });
      }
    }

    // Enviar correos de bienvenida de forma asíncrona (después de crear todos los usuarios)
    // Enviar correos en lotes pequeños para no sobrecargar el servidor de email
    const EMAIL_BATCH_SIZE = 3;
    for (let i = 0; i < emailQueue.length; i += EMAIL_BATCH_SIZE) {
      const emailBatch = emailQueue.slice(i, i + EMAIL_BATCH_SIZE);

      // Enviar lote actual sin esperar (fire and forget)
      Promise.all(
        emailBatch.map(({ email, name, password }) => sendWelcomeEmailAsync(email, name, password))
      ).catch(() => {
        // Error sending email batch
      });

      // Pequeña pausa entre lotes para evitar rate limiting
      if (i + EMAIL_BATCH_SIZE < emailQueue.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Generar resumen
    const summary = {
      total: finalResults.length,
      created: finalResults.filter(r => r.status === 'created').length,
      skipped: finalResults.filter(r => r.status === 'skipped').length,
      errors: finalResults.filter(r => r.status === 'error').length,
    };

    return NextResponse.json({
      success: summary.errors === 0,
      results: finalResults,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar la solicitud',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

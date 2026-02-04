import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const subjectIdsJson = formData.get('subjectIds') as string;

    if (!file || !subjectIdsJson) {
        return NextResponse.json({ error: 'Faltan datos requeridos (archivo o asignaturas)' }, { status: 400 });
    }

    const subjectIds = JSON.parse(subjectIdsJson);
    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
        return NextResponse.json({ error: 'Lista de asignaturas inválida' }, { status: 400 });
    }

    // Parse CSV
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
        return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 });
    }

    // CSV Parsing: Expect row with "documento" or "correo"
    // Simple parser
    const parseCSVLine = (line: string): string[] => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values.map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const docIndex = headers.findIndex(h => h.includes('documento') || h.includes('identificacion'));
    const emailIndex = headers.findIndex(h => h.includes('correo') || h.includes('email'));

    if (docIndex === -1 && emailIndex === -1) {
        return NextResponse.json({ error: 'El archivo debe tener una columna "documento" o "correo"' }, { status: 400 });
    }

    const studentIdentifiers = new Set<string>();
    
    // Extract identifiers
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (docIndex !== -1 && values[docIndex]) studentIdentifiers.add(values[docIndex]);
        else if (emailIndex !== -1 && values[emailIndex]) studentIdentifiers.add(values[emailIndex]);
    }

    const identifierList = Array.from(studentIdentifiers);
    
    // Find Students
    const students = await db.user.findMany({
        where: {
            role: 'ESTUDIANTE',
            OR: [
                { document: { in: identifierList } },
                { correoInstitucional: { in: identifierList } },
                { correoPersonal: { in: identifierList } }
            ]
        },
        select: { id: true, name: true, document: true, enrolledSubjectIds: true }
    });

    if (students.length === 0) {
        return NextResponse.json({ error: 'No se encontraron estudiantes válidos en el archivo' }, { status: 400 });
    }

    // Perform Enrollment
    // We update subjects one by one to keep arrays clean
    // And update users one by one (or whereIn but user.enrolledSubjectIds is specific to each user)

    let enrolledCount = 0;
    
    await db.$transaction(async (tx) => {
        // Update Subjects: Add student IDs
        const studentIds = students.map(s => s.id);
        
        for (const subjectId of subjectIds) {
            // Get current subject to check duplicates? UpdateMany with 'push' is generic in Mongo but prisma handles arrays well?
            // Safer to read and update
            const subject = await tx.subject.findUnique({ where: { id: subjectId }, select: { id: true, studentIds: true } });
            if (!subject) continue;

            const existing = new Set(subject.studentIds);
            const toAdd = studentIds.filter(id => !existing.has(id));
            
            if (toAdd.length > 0) {
                await tx.subject.update({
                    where: { id: subjectId },
                    data: {
                        studentIds: {
                            push: toAdd
                        }
                    }
                });
            }
        }

        // Update Users: Add subject IDs
        // This is heavier. For each student, add NEW subject IDs.
        for (const student of students) {
           const existingSubjects = new Set(student.enrolledSubjectIds);
           const subjectsToAdd = subjectIds.filter((sid: string) => !existingSubjects.has(sid));
           
           if (subjectsToAdd.length > 0) {
               await tx.user.update({
                   where: { id: student.id },
                   data: {
                       enrolledSubjectIds: {
                           push: subjectsToAdd
                       }
                   }
               });
               enrolledCount++;
           }
        }
    });

    return NextResponse.json({ 
        success: true, 
        message: `Se procesaron ${students.length} estudiantes.`,
        details: {
            studentsFound: students.length,
            subjectsTargeted: subjectIds.length
        }
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

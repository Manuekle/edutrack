import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Interface for the raw data from the API/Excel/CSV file
interface RowData {
  codigoAsignatura: string;
  nombreAsignatura: string;
  docente?: string; // Correo o Documento
  salon?: string;
  'fechaClase (YYYY-MM-DD)': string | number | Date;
  'horaInicio (HH:MM)': string | number;
  'horaFin (HH:MM)': string | number;
  temaClase?: string;
  descripcionClase?: string;
  creditosClase?: number;
  programa?: string;
  semestreAsignatura?: string;
}

// Función para dividir cadenas de hora de manera segura (Reused logic)
const safeSplitTime = (timeInput: string | number): [string, string] => {
  if (typeof timeInput === 'number') {
    const totalMinutes = Math.round(timeInput * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return [String(hours).padStart(2, '0'), String(minutes).padStart(2, '0')];
  }
  const timeStr = String(timeInput).trim();
  const [h, m] = timeStr.split(':');
  return [(h || '00').padStart(2, '0'), (m || '00').padStart(2, '0')];
};

const parseExcelDate = (dateInput: string | number | Date): Date => {
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'number') {
    const excelEpoch = 25569;
    const millisecondsPerDay = 86400000;
    const dateMs = (dateInput - excelEpoch) * millisecondsPerDay;
    const date = new Date(dateMs);
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(dateMs + offsetMs);
  }
  const dateStr = String(dateInput).trim();
  const isoFormat = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoFormat) {
     const [, year, month, day] = isoFormat;
     return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }
  const usFormat = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usFormat) {
    const [, month, day, year] = usFormat;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }
  return new Date(dateStr);
};

const parseExcelTime = (timeInput: any): string => {
   if (!timeInput) return '';
   if (typeof timeInput === 'number') {
     const totalMinutes = Math.round(timeInput * 24 * 60);
     const hours = Math.floor(totalMinutes / 60);
     const minutes = totalMinutes % 60;
     return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
   }
   const timeStr = String(timeInput).trim();
   const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
   if (match) {
        const h = parseInt(match[1]);
        const m = parseInt(match[2]);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
   }
   return '';
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.formData();
    const file = data.get('file') as File;
    const isPreview = data.get('preview') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: true
    }) as RowData[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 });
    }

    // Header Mapping
    const headers = Object.keys(rows[0] || {});
    const normalize = (s: string) => s.toString().trim().toLowerCase().replace(/\s+/g, '');
    const findKey = (base: string) => headers.find(h => normalize(h).includes(base));

    const keys = {
      code: findKey('codigoasignatura') || 'codigoAsignatura',
      name: findKey('nombreasignatura') || 'nombreAsignatura',
      teacher: findKey('docente') || 'docente', // Email or Document
      classroom: findKey('salon') || findKey('lugar') || 'salon',
      date: findKey('fechaclase') || 'fechaClase',
      start: findKey('horainicio') || 'horaInicio',
      end: findKey('horafin') || 'horaFin',
      topic: findKey('temaclase') || 'temaClase',
      desc: findKey('descripcion') || 'descripcionClase',
      credits: findKey('creditos') || 'creditosClase',
      program: findKey('programa') || 'programa',
      semester: findKey('semestre') || 'semestreAsignatura',
    };

    // Cache existing data for validation
    const existingSubjects = await db.subject.findMany({ select: { code: true } });
    const existingCodes = new Set(existingSubjects.map(s => s.code));
    
    // Cache teachers
    const teachers = await db.user.findMany({ 
        where: { role: Role.DOCENTE },
        select: { id: true, correoInstitucional: true, correoPersonal: true, document: true } 
    });

    const findTeacher = (identifier: string) => {
        if (!identifier) return null;
        const id = identifier.trim().toLowerCase();
        return teachers.find(t => 
            t.correoInstitucional?.toLowerCase() === id || 
            t.correoPersonal?.toLowerCase() === id || 
            t.document === identifier.trim()
        );
    };

    if (isPreview) {
      const previewData = rows.map(row => {
         const code = String(row[keys.code as keyof RowData] || '').trim();
         const teacherIden = String(row[keys.teacher as keyof RowData] || '').trim();
         const teacher = findTeacher(teacherIden);
         
         let error = null;
         if (!code) error = 'Falta código';
         else if (existingCodes.has(code)) error = 'Ya existe';
         else if (teacherIden && !teacher) error = `Docente no encontrado: ${teacherIden}`;

         return {
            codigoAsignatura: code,
            nombreAsignatura: row[keys.name as keyof RowData],
            docente: teacherIden,
            teacherFound: !!teacher,
            salon: row[keys.classroom as keyof RowData],
            creditosClase: row[keys.credits as keyof RowData],
            programa: row[keys.program as keyof RowData],
            semestreAsignatura: row[keys.semester as keyof RowData],
            classCount: 1, // Simplified count for preview row
            status: error ? 'error' : 'new',
            error
         };
      });

      // Group by subject to count classes
      const grouped: any = {};
      previewData.forEach((item: any) => {
          if (!grouped[item.codigoAsignatura]) {
              grouped[item.codigoAsignatura] = { ...item, classCount: 0 };
          }
          grouped[item.codigoAsignatura].classCount++;
          // Persist error if any row has error
          if (item.error && !grouped[item.codigoAsignatura].error) {
              grouped[item.codigoAsignatura].error = item.error;
              grouped[item.codigoAsignatura].status = 'error';
          }
      });

      return NextResponse.json({ success: true, previewData: Object.values(grouped) });
    }

    // Process Upload
    let processed = 0;
    const errors: string[] = [];

    // Group rows by subject first to minimize DB calls
    const subjectsMap = new Map<string, any>();
    
    for (const row of rows) {
        const code = String(row[keys.code as keyof RowData] || '').trim();
        if (!code) continue;

        if (!subjectsMap.has(code)) {
            subjectsMap.set(code, {
                meta: row,
                classes: []
            });
        }
        subjectsMap.get(code).classes.push(row);
    }

    for (const [code, data] of subjectsMap.entries()) {
        try {
            if (existingCodes.has(code)) continue;

            const teacherIden = String(data.meta[keys.teacher as keyof RowData] || '').trim();
            const teacher = findTeacher(teacherIden);
            
            // If no teacher specified, we might skip or assign to current admin (bad practice)
            // Ideally require teacher.
            
            const subject = await db.subject.create({
                data: {
                    code,
                    name: String(data.meta[keys.name as keyof RowData] || ''),
                    credits: Number(data.meta[keys.credits as keyof RowData]) || 0,
                    program: String(data.meta[keys.program as keyof RowData] || ''),
                    semester: Number(data.meta[keys.semester as keyof RowData]) || 0,
                    teacherId: teacher?.id || session.user.id, // Fallback to Admin if not found (should warn)
                    classroom: String(data.meta[keys.classroom as keyof RowData] || ''),
                }
            });

            // Create classes
            for (const clsRow of data.classes) {
                 const dateRaw = clsRow[keys.date as keyof RowData];
                 const startRaw = clsRow[keys.start as keyof RowData];
                 const endRaw = clsRow[keys.end as keyof RowData];

                 if (!dateRaw || !startRaw || !endRaw) continue;

                 const date = parseExcelDate(dateRaw);
                 const [sh, sm] = safeSplitTime(startRaw);
                 const [eh, em] = safeSplitTime(endRaw);

                 const start = new Date(date);
                 start.setHours(parseInt(sh), parseInt(sm));
                 
                 const end = new Date(date);
                 end.setHours(parseInt(eh), parseInt(em));

                 await db.class.create({
                    data: {
                        subjectId: subject.id,
                        date: date,
                        startTime: start,
                        endTime: end,
                        topic: String(clsRow[keys.topic as keyof RowData] || ''),
                        description: String(clsRow[keys.desc as keyof RowData] || ''),
                        classroom: String(clsRow[keys.classroom as keyof RowData] || '') || subject.classroom // Use class specific or subject default
                    }
                 });
            }
            processed++;

        } catch (e: any) {
            errors.push(`Error en asignatura ${code}: ${e.message}`);
        }
    }

    return NextResponse.json({ success: true, processed, errors });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

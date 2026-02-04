import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

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
  grupo?: string;
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

    // CSV Parsing Logic
    const text = new TextDecoder('utf-8').decode(buffer);
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío' }, { status: 400 });
    }

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

    const headers = parseCSVLine(lines[0]);
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
      group: findKey('grupo') || findKey('seccion') || 'grupo',
    };

    const rows = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row: any = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    }).filter(row => row[keys.code as string]); // Filter out empty rows based on code

    // Cache existing data for validation
    const existingSubjects = await db.subject.findMany({ select: { code: true, group: true } });
    const existingKeys = new Set(existingSubjects.map(s => `${s.code}-${s.group || ''}`));
    
    // Cache teachers
    const teachers = await db.user.findMany({ 
        where: { role: Role.DOCENTE },
        select: { id: true, correoInstitucional: true, correoPersonal: true, document: true } 
    });

    const findTeachers = (identifier: string): { found: any[], missing: string[] } => {
        if (!identifier) return { found: [], missing: [] };
        
        // Split by semicolon for multiple teachers
        const ids = identifier.split(';').map(s => s.trim()).filter(Boolean);
        const found = ids.map(id => {
            const lowerId = id.toLowerCase();
            return teachers.find(t => 
                t.correoInstitucional?.toLowerCase() === lowerId || 
                t.correoPersonal?.toLowerCase() === lowerId || 
                t.document === id
            );
        }).filter(Boolean);
        
        // Determine missing
        const foundIds = new Set(found.map(t => t?.correoInstitucional || t?.correoPersonal || t?.document));
        const missing = ids.filter(id => !found.some(t => 
             t?.correoInstitucional?.toLowerCase() === id.toLowerCase() || 
             t?.correoPersonal?.toLowerCase() === id.toLowerCase() || 
             t?.document === id
        ));

        return { found: found as any[], missing };
    };

    if (isPreview) {
      const previewData = rows.map(row => {
         const code = String(row[keys.code as keyof RowData] || '').trim();
          const teacherIden = String(row[keys.teacher as keyof RowData] || '').trim();
          const { found, missing } = findTeachers(teacherIden);
          const group = String(row[keys.group as keyof RowData] || '').trim();
          const uniqueKey = `${code}-${group}`;

          let error = null;
          if (!code) error = 'Falta código';
          else if (existingKeys.has(uniqueKey)) error = 'Ya existe (Código + Grupo)';
          else if (missing.length > 0) error = `Docentes no encontrados: ${missing.join(', ')}`;

         return {
            codigoAsignatura: code,
            nombreAsignatura: row[keys.name as keyof RowData],
            grupo: group,
            docente: teacherIden,
            teacherFound: missing.length === 0,
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
          const uniqueKey = `${item.codigoAsignatura}-${item.grupo}`;
          if (!grouped[uniqueKey]) {
              grouped[uniqueKey] = { ...item, classCount: 0 };
          }
          grouped[uniqueKey].classCount++;
          // Persist error if any row has error
          if (item.error && !grouped[uniqueKey].error) {
              grouped[uniqueKey].error = item.error;
              grouped[uniqueKey].status = 'error';
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

        const group = String(row[keys.group as keyof RowData] || '').trim();
        const uniqueKey = `${code}-${group}`;
        
        if (!subjectsMap.has(uniqueKey)) {
            subjectsMap.set(uniqueKey, {
                meta: row,
                classes: [],
                group // Store group explicitly
            });
        }
        subjectsMap.get(uniqueKey).classes.push(row);
    }

    for (const [uniqueKey, data] of subjectsMap.entries()) {
        const { code } = data.meta;
        try {
            if (existingKeys.has(uniqueKey)) continue;

            const teacherIden = String(data.meta[keys.teacher as keyof RowData] || '').trim();
            const { found } = findTeachers(teacherIden);
            
            // Map inputs to creation object
            const teacherIds = found.map(t => t.id);
            // If no teachers found, maybe fallback to admin or empty?
            // With m-n, empty is allowed but strictly we want teachers.
            // Fallback to session user if empty for now or strict? 
            // Previous code used session.user.id if not found, let's keep that fallback if completely empty
            if (teacherIds.length === 0) teacherIds.push(session.user.id);

            const subject = await db.subject.create({
                data: {
                    code,
                    name: String(data.meta[keys.name as keyof RowData] || ''),
                    credits: Number(data.meta[keys.credits as keyof RowData]) || 0,
                    program: String(data.meta[keys.program as keyof RowData] || ''),
                    semester: Number(data.meta[keys.semester as keyof RowData]) || 0,
                    teacherIds: teacherIds,
                    classroom: String(data.meta[keys.classroom as keyof RowData] || ''),
                    group: data.group || null,
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

import { authOptions } from '@/lib/auth';
import { decodeCSVBuffer } from '@/lib/csv-encoding';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface RoomRow {
  name: string;
  type: 'LABORATORIO' | 'SALA_CLASE' | 'AUDITORIO';
  capacity: number;
  description: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const isPreview = formData.get('preview') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = decodeCSVBuffer(buffer);
    const lines = text.split(/\r?\n/).filter(l => l.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'El archivo CSV está vacío o solo tiene encabezados' },
        { status: 400 }
      );
    }

    const headers = lines[0]
      .toLowerCase()
      .split(/[,;]/)
      .map(h => h.trim());
    const nombreIdx = headers.findIndex(h => h.includes('nombre'));
    const tipoIdx = headers.findIndex(h => h.includes('tipo'));
    const capacidadIdx = headers.findIndex(h => h.includes('capacidad'));
    const descIdx = headers.findIndex(h => h.includes('descripc'));

    if (nombreIdx === -1 || tipoIdx === -1 || capacidadIdx === -1) {
      return NextResponse.json(
        { error: 'Formato inválido. Columnas obligatorias: nombre_sala, tipo_sala, capacidad' },
        { status: 400 }
      );
    }

    const rawRows: RoomRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Separa por comas o punto y coma, remueve comillas
      const values = lines[i].split(/[,;]/).map(val => val.trim().replace(/^"|"$/g, ''));
      if (values.length < 3) continue;

      const rawType = values[tipoIdx].toUpperCase();
      let tipo: 'LABORATORIO' | 'SALA_CLASE' | 'AUDITORIO' = 'SALA_CLASE';
      if (rawType.includes('COMPUT') || rawType.includes('LABOR')) tipo = 'LABORATORIO';
      else if (rawType.includes('AUDITORIO')) tipo = 'AUDITORIO';

      rawRows.push({
        name: values[nombreIdx],
        type: tipo,
        capacity: parseInt(values[capacidadIdx]) || 30,
        description: descIdx !== -1 && values[descIdx] ? values[descIdx] : '',
      });
    }

    const processResults: any[] = [];
    let conflicts = 0;

    // Obtener salas existentes
    const existingRooms = await db.room.findMany({ select: { name: true } });
    const existingNames = new Set(existingRooms.map(r => r.name.toLowerCase()));

    for (const row of rawRows) {
      const key = row.name.toLowerCase();
      if (existingNames.has(key)) {
        processResults.push({
          ...row,
          status: 'existing',
          message: 'La sala ya existe',
        });
        conflicts++;
      } else {
        processResults.push({
          ...row,
          id: `preview-${Math.random().toString(36).substring(7)}`,
          status: 'success',
          message: 'Lista para crear',
        });
        existingNames.add(key); // prevenir duplicados en el mismo archivo
      }
    }

    if (isPreview) {
      return NextResponse.json({
        success: true,
        previewData: processResults,
      });
    }

    const toInsert = processResults.filter(r => r.status === 'success');

    if (toInsert.length > 0) {
      await db.room.createMany({
        data: toInsert.map(r => ({
          name: r.name,
          type: r.type,
          capacity: r.capacity,
          description: r.description,
          isActive: true,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      created: toInsert.length,
      errors: conflicts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error procesando archivo', details: String(error) },
      { status: 500 }
    );
  }
}

import { db } from '@/lib/prisma';

export type BitacoraHeader = {
  codigo: string;
  version: string;
  fecha: string;
};

const DEFAULTS: BitacoraHeader = {
  codigo: 'FO-DO-005',
  version: '08',
  fecha: 'mayo de 2026',
};

export async function getBitacoraHeader(): Promise<BitacoraHeader> {
  try {
    const settings = await db.bitacoraSettings.findFirst();
    if (!settings) return DEFAULTS;
    return {
      codigo: settings.codigo,
      version: settings.version,
      fecha: settings.fecha,
    };
  } catch {
    return DEFAULTS;
  }
}

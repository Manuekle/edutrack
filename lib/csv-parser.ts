export interface CSVRow {
  [key: string]: string;
}

export interface ParseResult<T> {
  success: boolean;
  data: T[];
  errors: { row: number; message: string }[];
}

export function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  return ',';
}

export function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());

  return values.map(val => {
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      return val.slice(1, -1).replace(/""/g, '"');
    }
    return val;
  });
}

export function normalizeHeader(header: string): string {
  return header
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\w\u00C0-\u024F]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function findHeader(headers: string[], variants: string[]): string | undefined {
  const normalizedHeaders = headers.reduce(
    (acc, h) => {
      acc[normalizeHeader(h)] = h;
      return acc;
    },
    {} as Record<string, string>
  );

  for (const variant of variants) {
    const normalized = normalizeHeader(variant);
    if (normalizedHeaders[normalized]) {
      return normalizedHeaders[normalized];
    }
  }
  return undefined;
}

export function parseCSV<T extends CSVRow>(
  text: string,
  headerMapping: Record<string, string[]>
): ParseResult<T> {
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter(line => line.trim());

  if (lines.length === 0) {
    return { success: false, data: [], errors: [{ row: 0, message: 'Archivo vacío' }] };
  }

  const headers = parseCSVLine(lines[0], delimiter);
  const data: T[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);

    if (!values.some(v => v.trim())) continue;

    const row: Record<string, string> = {};
    let hasRequiredFields = true;

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    for (const [field, variants] of Object.entries(headerMapping)) {
      const actualHeader = findHeader(headers, variants);
      if (actualHeader) {
        (row as Record<string, string>)[field] = row[actualHeader];
      } else {
        if (field === 'required') {
          hasRequiredFields = false;
          errors.push({ row: i + 1, message: `Falta campo requerido` });
        }
      }
    }

    if (hasRequiredFields) {
      data.push(row as T);
    }
  }

  return { success: errors.length === 0, data, errors };
}

export function validateCSVHeaders(
  headers: string[],
  requiredHeaders: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const required of requiredHeaders) {
    const found = findHeader(headers, [required]);
    if (!found) {
      missing.push(required);
    }
  }

  return { valid: missing.length === 0, missing };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Decodifica un buffer CSV detectando la codificación automáticamente.
 * Maneja UTF-8 BOM (exportado desde Excel) y fallback a Windows-1252
 * para caracteres especiales del español (ñ, tildes, etc.).
 */
export function decodeCSVBuffer(buffer: ArrayBuffer): string {
  const rawBytes = new Uint8Array(buffer);

  // Strip UTF-8 BOM if present (Excel exports often include it)
  const hasBOM =
    rawBytes.length >= 3 &&
    rawBytes[0] === 0xef &&
    rawBytes[1] === 0xbb &&
    rawBytes[2] === 0xbf;
  const bytes = hasBOM ? rawBytes.slice(3) : rawBytes;

  // Try UTF-8 first (with fatal: true so it throws on invalid sequences)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // Fallback to Windows-1252 (superset of Latin-1, handles ñ, á, é, ó, ü, etc.)
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

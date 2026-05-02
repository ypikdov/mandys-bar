import fs from 'fs';

/**
 * Valida los magic bytes (firma binaria) de un archivo de imagen.
 * Más fiable que validar solo MIME/extensión.
 * Soporta JPEG, PNG, GIF, WebP.
 */
export const isValidImageBuffer = (buffer: Buffer): boolean => {
  const signature = buffer.subarray(0, 12);
  const hex = signature.toString('hex').toUpperCase();
  if (hex.startsWith('FFD8FF')) return true; // JPEG
  if (hex.startsWith('89504E47')) return true; // PNG
  if (hex.startsWith('47494638')) return true; // GIF
  if (hex.startsWith('52494646') && hex.substring(16, 24) === '57454250') return true; // WEBP
  return false;
};

export const isValidImageMagicBytes = (filePath: string): boolean => {
  let fd: number | null = null;
  try {
    const buffer = Buffer.alloc(12);
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    return isValidImageBuffer(buffer);
  } catch {
    return false;
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch { /* ignore */ }
    }
  }
};

/**
 * Borra el archivo de manera segura, ignorando errores.
 */
export const safeUnlink = (filePath: string): void => {
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }
};

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Convierte cualquier imagen soportada a WebP.
 * Si ya es .webp, la retorna sin cambios.
 *
 * @param filePath  Ruta absoluta al archivo subido
 * @param quality   Calidad WebP (1-100), default 80
 * @returns         Nueva ruta absoluta con extensión .webp
 */
export async function convertToWebp(
  filePath: string,
  quality = 80,
): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  // Ya es WebP — nada que hacer
  if (ext === '.webp') return filePath;

  const webpPath = filePath.replace(/\.[^.]+$/, '.webp');

  await sharp(filePath)
    .webp({ quality })
    .toFile(webpPath);

  // Eliminar original
  await fs.unlink(filePath);

  return webpPath;
}

export async function convertBufferToWebp(
  buffer: Buffer,
  quality = 80,
): Promise<Buffer> {
  return sharp(buffer)
    .webp({ quality })
    .toBuffer();
}

/**
 * Servicio API — Subida de Archivos
 *
 * Centraliza la subida de imágenes (perfil y otros flujos de cliente).
 * Normaliza formatos HEIC/HEIF a JPEG antes de enviarlos al backend.
 */

import { apiUpload } from '@/lib/api';

interface UploadResponse {
  url: string;
}

type HeicConvertModule = {
  default?: (options: Record<string, unknown>) => Promise<Blob | ArrayBuffer | Uint8Array>;
};

const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_UPLOAD_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif';

const isHeicLikeFile = (file: File) => {
  const normalizedType = file.type.toLowerCase();
  return HEIC_MIME_TYPES.has(normalizedType) || /\.(heic|heif)$/i.test(file.name);
};

const readUploadError = async (response: Response) => {
  const payload = await response.clone().json().catch(() => null) as { error?: string; details?: string } | null;
  return payload?.error || payload?.details || 'No se pudo subir la imagen.';
};

const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    const module = await import('heic-convert/browser') as HeicConvertModule;
    const convert = module.default;

    if (!convert) {
      throw new Error('No se pudo inicializar el conversor HEIC.');
    }

    const converted = await convert({
      buffer: new Uint8Array(await file.arrayBuffer()),
      format: 'JPEG',
      quality: 0.92,
    });

    const blobPart = converted instanceof Uint8Array
      ? new Uint8Array(converted)
      : converted;

    const blob = converted instanceof Blob
      ? converted
      : new Blob([blobPart], { type: 'image/jpeg' });

    const normalizedName = file.name.replace(/\.(heic|heif)$/i, '') || `imagen-${Date.now()}`;

    return new File([blob], `${normalizedName}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } catch {
    throw new Error('No se pudo convertir la imagen HEIC/HEIF. Usa JPG, PNG, GIF o WebP.');
  }
};

const normalizeUploadFile = async (file: File) => {
  const normalizedFile = isHeicLikeFile(file)
    ? await convertHeicToJpeg(file)
    : file;

  if (normalizedFile.size > MAX_UPLOAD_BYTES) {
    throw new Error('La imagen no debe superar 5 MB.');
  }

  return normalizedFile;
};

/**
 * Sube una imagen al servidor y devuelve su URL.
 * Ruta backend: POST /api/upload
 */
export async function uploadImage(file: File, token: string): Promise<string> {
  const normalizedFile = await normalizeUploadFile(file);
  const formData = new FormData();
  formData.append('image', normalizedFile, normalizedFile.name);

  const response = await apiUpload('/api/upload', formData, token);
  if (!response.ok) {
    throw new Error(await readUploadError(response));
  }

  const data: UploadResponse = await response.json();

  if (!data.url) {
    throw new Error('El servidor no devolvió una URL de imagen.');
  }

  return data.url;
}

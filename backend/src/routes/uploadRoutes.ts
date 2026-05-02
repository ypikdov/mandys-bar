import { randomUUID } from 'node:crypto';
import { NextFunction, Router, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, AuthRequest } from '../middlewares/auth.js';
import {
  isImageBucket,
  isSupabaseStorageConfigured,
  type ImageBucket,
  uploadImageBuffer,
} from '../lib/supabaseStorage.js';
import { convertBufferToWebp } from '../utils/convertToWebp.js';
import { isValidImageBuffer } from '../utils/imageValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local uploads directory (backend)
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');

// Ensure the directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = file.mimetype.startsWith('image/');
    if (ext && mimeOk) return cb(null, true);
    cb(new Error('Solo se permiten archivos de imagen'));
  }
});

const router = Router();

const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 120 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).user?.userId;
    return userId ? `user:${userId}` : ipKeyGenerator(req.ip ?? '');
  },
  message: { error: 'Demasiadas subidas de imagen. Intenta nuevamente en unos minutos.' },
});

const canUploadToBucket = (req: AuthRequest, bucket: ImageBucket) => {
  const role = req.user?.role;
  if (bucket === 'users-avatars') return Boolean(req.user);
  return role === 'ADMIN' || role === 'MANAGER';
};

const getRequestedBucket = (req: AuthRequest): ImageBucket | null => {
  const rawBucket = req.query.bucket ?? 'product-images';
  return isImageBucket(rawBucket) ? rawBucket : null;
};

const saveDevelopmentFallback = (buffer: Buffer) => {
  const webpFilename = `${Date.now()}_${randomUUID()}.webp`;
  const filePath = path.join(UPLOAD_DIR, webpFilename);
  fs.writeFileSync(filePath, buffer);
  return {
    url: `/uploads/${webpFilename}`,
    filename: webpFilename,
    bucket: 'local-dev',
    path: webpFilename,
  };
};

const handleImageUpload = (req: AuthRequest, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen no debe superar 5 MB.'
        : 'No se pudo procesar la imagen subida.';
      return res.status(400).json({ error: message });
    }

    return res.status(400).json({
      error: 'Formato no soportado. Usa JPG, PNG, GIF o WebP.',
    });
  });
};

router.post(
  '/',
  authenticate,
  uploadRateLimiter,
  handleImageUpload,
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibio ningun archivo' });
    }

    const bucket = getRequestedBucket(req);
    if (!bucket) {
      return res.status(400).json({ error: 'Bucket de imagen no permitido.' });
    }

    if (!canUploadToBucket(req, bucket)) {
      return res.status(403).json({ error: 'No tienes permisos para subir imagenes a este recurso.' });
    }

    // Check magic bytes (no fiarse de extension/MIME)
    if (!isValidImageBuffer(req.file.buffer)) {
      return res.status(400).json({ error: 'El archivo subido no es una imagen valida' });
    }

    try {
      // Convertir a WebP para optimizacion
      const webpBuffer = await convertBufferToWebp(req.file.buffer);

      if (isSupabaseStorageConfigured()) {
        const uploaded = await uploadImageBuffer(bucket, webpBuffer);
        return res.json(uploaded);
      }

      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Storage de imagenes no configurado.' });
      }

      return res.json(saveDevelopmentFallback(webpBuffer));
    } catch (err) {
      console.error('[Upload] Error procesando imagen:', err);
      return res.status(500).json({ error: 'No se pudo procesar la imagen.' });
    }
  }
);

export default router;

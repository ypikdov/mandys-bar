import { Router } from 'express';
import multer from 'multer';
import {
  createReservation,
  getReservations,
  getUserReservations,
  confirmReservation,
  cancelReservation,
  getEventPrices,
} from './reservations.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

const uploadAnulacion = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imagenes (JPEG, PNG, WebP, GIF). Maximo 5MB.'));
    }
  },
});

// Client endpoints (require auth)
router.post('/', authenticate, createReservation as any);
router.get('/prices', getEventPrices);
router.get('/me', authenticate, getUserReservations as any);

// Admin endpoints (require auth)
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER', 'VENTAS']), getReservations as any);
router.put('/confirm/:id', authenticate, authorize(['ADMIN', 'MANAGER', 'VENTAS']), confirmReservation as any);
router.put('/cancel/:id', authenticate, authorize(['ADMIN', 'MANAGER', 'VENTAS']), uploadAnulacion.single('imagen_anulacion'), cancelReservation as any);

export default router;

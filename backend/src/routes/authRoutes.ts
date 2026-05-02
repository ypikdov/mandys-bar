import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login } from '../controllers/authController.js';

const router = Router();

// Rate limiter configurable por entorno:
// - Desarrollo: 100 req/15min para no bloquear pruebas y validaciones
// - Producción (o entorno no identificado): 5 req/15min como política segura
const isDevEnvironment = process.env.NODE_ENV === 'development';
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevEnvironment ? 100 : 5,
  message: { error: 'Demasiados intentos desde esta IP, por favor intente de nuevo en 15 minutos.' }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

export default router;

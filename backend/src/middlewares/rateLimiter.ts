import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const getRequestIdentity = (body: unknown) => {
  if (!body || typeof body !== 'object') return 'anonymous';

  const payload = body as Record<string, unknown>;
  const rawIdentity = payload.correo ?? payload.email ?? payload.username;

  return typeof rawIdentity === 'string' && rawIdentity.trim()
    ? rawIdentity.trim().toLowerCase()
    : 'anonymous';
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limitar cada IP a 10 intentos de login/registro por ventana
  message: {
    message: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
  keyGenerator: (req) => {
    // Identity-based limit: IP + correo/email/username. Login uses `correo`.
    const identity = getRequestIdentity(req.body);
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
    return `${ip}_${identity}`;
  }
});

export const orderRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 200, // Aumentado a 200 para permitir operaciones administrativas intensivas
  message: {
    message: 'Límite de operaciones de pedidos excedido. Intente de nuevo más tarde o contacte a soporte.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
  keyGenerator: (req: any) => {
    // Identity-based limit: UserID (if logged) or IP
    const identity = req.user?.userId || 'anonymous';
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
    return `${ip}_${identity}`;
  }
});

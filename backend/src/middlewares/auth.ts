import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSigningSecret } from '../lib/jwtSecret.js';

const JWT_SIGNING_SECRET = getJwtSigningSecret();

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email?: string;
  };
}

// Authenticate JWT Token
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'NO_TOKEN',
      error: 'No se proporciono un token de autenticacion',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SIGNING_SECRET) as { userId: string, role: string, email?: string };
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        code: 'TOKEN_EXPIRED',
        error: 'La sesion expiro. Ingresa de nuevo.',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        code: 'TOKEN_INVALID',
        error: 'Token invalido.',
      });
    }

    return res.status(401).json({
      code: 'TOKEN_INVALID',
      error: 'Token invalido.',
    });
  }
};

// Authorize based on roles
// Usage: router.get('/admin', authenticate, authorize(['ADMIN']), controller)
type Role = 'ADMIN' | 'MANAGER' | 'VENTAS' | 'USER';

export const authorize = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 'NO_TOKEN', error: 'Autenticacion requerida' });
    }

    const userRole = req.user.role as Role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Permisos insuficientes. Roles requeridos: [${roles.join(', ')}]`
      });
    }

    next();
  };
};

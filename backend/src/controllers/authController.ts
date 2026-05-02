import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { getJwtSigningSecret } from '../lib/jwtSecret.js';
import { isDatabaseUnavailableError } from '../lib/databaseDiagnostics.js';

const loginSchema = z.object({
  correo: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

const JWT_SIGNING_SECRET = getJwtSigningSecret();
// Expiracion configurable por entorno: en desarrollo local se puede usar '30d' via .env.
// Si no esta definido, se usa '24h' como valor seguro por defecto.
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '24h') as SignOptions['expiresIn'];

export const register = async (_req: Request, res: Response) => {
  return res.status(403).json({
    error: 'El registro publico esta deshabilitado. Solicite que un administrador cree la cuenta desde el panel.'
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: 'Datos invalidos', details: validatedData.error.issues });
    }
    const { correo, password } = validatedData.data;

    const user = await prisma.user.findUnique({ where: { correo } });
    if (!user) {
      return res.status(401).json({ error: 'Correo o contrasena invalidos' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Correo o contrasena invalidos' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.correo },
      JWT_SIGNING_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Sesion iniciada correctamente',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        telefono: user.telefono,
        role: user.role,
        genero: user.genero,
        fecha_nac: user.fecha_nac,
        tipo_documento: user.tipo_documento,
        num_documento: user.num_documento,
        provincia: user.provincia,
        canton: user.canton,
        distrito: user.distrito,
        foto_perfil: user.foto_perfil
      }
    });
  } catch (error) {
    console.error(error);
    if (isDatabaseUnavailableError(error)) {
      return res.status(503).json({ error: 'Servicio de autenticacion no disponible temporalmente' });
    }

    res.status(500).json({ error: 'Error interno durante el inicio de sesion' });
  }
};

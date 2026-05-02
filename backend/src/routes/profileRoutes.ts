import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.js';
import prisma from '../lib/prisma.js';
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();

const profileUpdateSchema = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  telefono: z.string().trim().max(25).optional().nullable(),
  genero: z.string().trim().max(40).optional().nullable(),
  fecha_nac: z.string().trim().optional().nullable(),
  tipo_documento: z.string().trim().max(40).optional().nullable(),
  num_documento: z.string().trim().max(40).optional().nullable(),
  provincia: z.string().trim().max(80).optional().nullable(),
  canton: z.string().trim().max(80).optional().nullable(),
  distrito: z.string().trim().max(80).optional().nullable(),
  foto_perfil: z.string().trim().max(500).optional().nullable(),
}).strict();

// GET /api/profile/bootstrap - Get everything for initial load
router.get('/bootstrap', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Fetch in parallel for speed
    const [user, orders, reservations] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, nombre: true, correo: true, telefono: true, role: true, 
          genero: true, fecha_nac: true, tipo_documento: true, num_documento: true,
          provincia: true, canton: true, distrito: true, foto_perfil: true, created_at: true
        }
      }),
      prisma.order.findMany({
        where: { user_id: userId, deleted_at: null },
        take: 5,
        orderBy: { fecha: 'desc' },
        include: { items: { include: { product: true } } }
      }),
      prisma.reservation.findMany({
        where: { correo: req.user!.email || "" }, // Falling back to email check
        take: 5,
        orderBy: { created_at: 'desc' }
      })
    ]);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Fallback: if user email is not in req.user, use the one from DB for reservations
    let finalReservations = reservations;
    if (reservations.length === 0 && user.correo) {
       finalReservations = await prisma.reservation.findMany({
         where: { correo: user.correo },
         take: 5,
         orderBy: { created_at: 'desc' }
       });
    }

    res.json({
      profile: user,
      recentOrders: orders,
      recentReservations: finalReservations as any
    });
  } catch (err) {
    console.error('Error bootstrapping profile:', err);
    res.status(500).json({ error: 'Error al cargar datos iniciales' });
  }
});

// GET /api/profile - Get current user's full profile  
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        role: true,
        genero: true,
        fecha_nac: true,
        tipo_documento: true,
        num_documento: true,
        provincia: true,
        canton: true,
        distrito: true,
        foto_perfil: true,
        created_at: true
      }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// PUT /api/profile - Update current user's profile
router.put('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = profileUpdateSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: validatedData.error.issues });
    }

    const { 
      nombre, telefono, genero, fecha_nac, 
      tipo_documento, num_documento, provincia, 
      canton, distrito, foto_perfil 
    } = validatedData.data;

    const parsedBirthDate = fecha_nac ? new Date(fecha_nac) : null;
    if (parsedBirthDate && (Number.isNaN(parsedBirthDate.getTime()) || parsedBirthDate > new Date())) {
      return res.status(400).json({ error: 'Fecha de nacimiento inválida' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(nombre && { nombre }),
        ...(telefono !== undefined && { telefono: telefono || null }),
        ...(genero !== undefined && { genero: genero || null }),
        ...(fecha_nac !== undefined && { fecha_nac: parsedBirthDate }),
        ...(tipo_documento !== undefined && { tipo_documento: tipo_documento || null }),
        ...(num_documento !== undefined && { num_documento: num_documento || null }),
        ...(provincia !== undefined && { provincia: provincia || null }),
        ...(canton !== undefined && { canton: canton || null }),
        ...(distrito !== undefined && { distrito: distrito || null }),
        ...(foto_perfil !== undefined && { foto_perfil: foto_perfil || null }),
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        role: true,
        genero: true,
        fecha_nac: true,
        tipo_documento: true,
        num_documento: true,
        provincia: true,
        canton: true,
        distrito: true,
        foto_perfil: true,
        created_at: true
      }
    });
    res.json(updated);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// PUT /api/profile/password - Change password
router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash } });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

// DELETE /api/profile - Delete account
router.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.userId } });
    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2003') {
      res.status(400).json({ error: 'No se puede eliminar la cuenta porque tiene órdenes asociadas. Contacte al administrador.' });
    } else {
      res.status(500).json({ error: 'Error al eliminar cuenta' });
    }
  }
});

export default router;

import { Request, Response } from 'express';
import NodeCache from 'node-cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';
import { AuthRequest } from '../../middlewares/auth.js';
import {
  buildPaginatedResponse,
  getQueryString,
  parsePaginationParams,
} from '../../utils/pagination.js';
import {
  buildRequestCacheKey,
  cacheJsonPayload,
  getAuthRequestCacheScope,
  sendCachedJson,
} from '../../utils/httpCache.js';

const passwordSchema = z.string().min(8).max(100)
  .regex(/[A-Z]/, 'La contrasena debe incluir una mayuscula')
  .regex(/[0-9]/, 'La contrasena debe incluir un numero')
  .regex(/[^A-Za-z0-9]/, 'La contrasena debe incluir un simbolo especial');

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(max).nullable().optional()
  );

const createClientSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  correo: z.string().trim().email().toLowerCase(),
  telefono: z.string().trim().min(8).max(25),
  password: passwordSchema,
  tipo_documento: optionalText(40),
  num_documento: optionalText(40),
  provincia: optionalText(80),
  canton: optionalText(80),
  distrito: optionalText(80),
  genero: optionalText(40),
  fecha_nac: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.coerce.date().max(new Date(), 'La fecha de nacimiento no puede ser futura').nullable().optional()
  )
});

const createStaffSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  correo: z.string().trim().email().toLowerCase(),
  telefono: z.string().trim().min(8).max(25),
  password: passwordSchema,
  role: z.enum(['ADMIN', 'MANAGER', 'VENTAS']),
  puesto: z.string().trim().min(2).max(80)
});

const changeRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'VENTAS'])
});

const accountCache = new NodeCache({ stdTTL: 15, checkperiod: 30 });
const ACCOUNT_CACHE_TTL_SECONDS = 15;

const buildAccountCacheKey = (prefix: string, req: Request) =>
  buildRequestCacheKey(prefix, req, getAuthRequestCacheScope(req));

const invalidateAccountCache = () => {
  accountCache.flushAll();
};

const accountSelect = {
  id: true,
  nombre: true,
  correo: true,
  telefono: true,
  role: true,
  puesto: true,
  created_at: true
} as const;

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const getAccountWhere = (
  query: Record<string, unknown>,
  roleWhere: Record<string, unknown>,
) => {
  const search = getQueryString(query, 'q');
  const where: any = { ...roleWhere };

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { correo: { contains: search, mode: 'insensitive' } },
      { telefono: { contains: search, mode: 'insensitive' } },
      { puesto: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const cacheKey = buildAccountCacheKey('accounts:users', req);
    if (req.query.refresh === 'true') {
      invalidateAccountCache();
    } else if (sendCachedJson(accountCache, cacheKey, res)) {
      return;
    }

    const pagination = parsePaginationParams(req.query);
    const where = getAccountWhere(req.query, { role: 'USER' });
    const [totalItems, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: accountSelect,
        orderBy: { created_at: 'desc' },
        ...(pagination.isPaginated ? { skip: pagination.skip, take: pagination.take } : {}),
      }),
    ]);

    if (pagination.isPaginated) {
      const payload = buildPaginatedResponse(users, totalItems, pagination);
      cacheJsonPayload(accountCache, cacheKey, payload, ACCOUNT_CACHE_TTL_SECONDS);
      return res.json(payload);
    }

    cacheJsonPayload(accountCache, cacheKey, users, ACCOUNT_CACHE_TTL_SECONDS);
    res.json(users);
  } catch {
    res.status(500).json({ error: 'No se pudieron cargar los usuarios' });
  }
};

export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const cacheKey = buildAccountCacheKey('accounts:staff', req);
    if (req.query.refresh === 'true') {
      invalidateAccountCache();
    } else if (sendCachedJson(accountCache, cacheKey, res)) {
      return;
    }

    const pagination = parsePaginationParams(req.query);
    const where = getAccountWhere(req.query, { role: { not: 'USER' } });
    const [totalItems, staff] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: accountSelect,
        orderBy: { created_at: 'desc' },
        ...(pagination.isPaginated ? { skip: pagination.skip, take: pagination.take } : {}),
      }),
    ]);

    if (pagination.isPaginated) {
      const payload = buildPaginatedResponse(staff, totalItems, pagination);
      cacheJsonPayload(accountCache, cacheKey, payload, ACCOUNT_CACHE_TTL_SECONDS);
      return res.json(payload);
    }

    cacheJsonPayload(accountCache, cacheKey, staff, ACCOUNT_CACHE_TTL_SECONDS);
    res.json(staff);
  } catch {
    res.status(500).json({ error: 'No se pudo cargar el personal' });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const parsed = createClientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos invalidos', details: parsed.error.issues });
    }

    const { password, ...clientData } = parsed.data;
    const password_hash = await hashPassword(password);

    const newClient = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...clientData,
          role: 'USER',
          password_hash
        },
        select: accountSelect
      });

      await tx.auditLog.create({
        data: {
          usuario_que_modifica: adminId,
          accion: `Creacion de cliente ${user.id}`
        }
      });

      return user;
    });

    invalidateAccountCache();

    res.status(201).json(newClient);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo ya esta registrado' });
    }
    res.status(500).json({ error: 'No se pudo crear el cliente' });
  }
};

export const createStaff = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const parsed = createStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos invalidos', details: parsed.error.issues });
    }

    const { password, ...staffData } = parsed.data;
    const password_hash = await hashPassword(password);

    const newStaff = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...staffData,
          password_hash
        },
        select: accountSelect
      });

      await tx.auditLog.create({
        data: {
          usuario_que_modifica: adminId,
          accion: `Creacion de personal ${user.id} con rol ${user.role}`
        }
      });

      return user;
    });

    invalidateAccountCache();

    res.status(201).json(newStaff);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo ya esta registrado' });
    }
    res.status(500).json({ error: 'No se pudo crear el miembro del personal' });
  }
};

export const changeUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (id === adminId) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol desde esta accion' });
    }

    const parsed = changeRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Solo puedes asignar roles de personal (ADMIN, MANAGER, VENTAS)' });
    }
    const { role } = parsed.data;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (targetUser.role === 'USER') {
      return res.status(400).json({ error: 'No se puede cambiar el rol de cuentas de cliente desde esta accion' });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { role },
        select: { id: true, nombre: true, role: true }
      });

      await tx.auditLog.create({
        data: {
          usuario_que_modifica: adminId,
          accion: `Cambio de rol del usuario ${user.id} a ${role}`
        }
      });

      return user;
    });

    invalidateAccountCache();

    res.json(updatedUser);
  } catch {
    res.status(500).json({ error: 'No se pudo actualizar el rol del usuario' });
  }
};

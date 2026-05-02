import { type Request, type Response } from 'express';
import NodeCache from 'node-cache';
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { type AuthRequest } from '../../middlewares/auth.js';
import { prisma } from '../../lib/prisma.js';
import { getResolvedEventPriceMap } from '../site-content/site-content.controller.js';
import { convertBufferToWebp } from '../../utils/convertToWebp.js';
import { isValidImageBuffer } from '../../utils/imageValidator.js';
import { isSupabaseStorageConfigured, uploadImageBuffer } from '../../lib/supabaseStorage.js';
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

interface RequestWithOptionalFile extends AuthRequest {
  file?: Express.Multer.File;
}

const reservationCache = new NodeCache({ stdTTL: 10, checkperiod: 30 });
const RESERVATION_CACHE_TTL_SECONDS = 10;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_ANULACIONES_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads', 'anulaciones');

const buildReservationCacheKey = (prefix: string, req: AuthRequest) =>
  buildRequestCacheKey(prefix, req, getAuthRequestCacheScope(req));

const invalidateReservationCache = () => {
  reservationCache.flushAll();
};

const saveLocalCancellationImage = (buffer: Buffer) => {
  fs.mkdirSync(LOCAL_ANULACIONES_DIR, { recursive: true });
  const filename = `anulacion-${Date.now()}-${randomUUID()}.webp`;
  fs.writeFileSync(path.join(LOCAL_ANULACIONES_DIR, filename), buffer);
  return `/uploads/anulaciones/${filename}`;
};

const getRouteParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

const getReservationWhere = (query: Record<string, unknown>, correo?: string) => {
  const search = getQueryString(query, 'q');
  const where: any = correo ? { correo } : {};

  if (search) {
    const normalizedStatus = search.toUpperCase();
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { correo: { contains: search, mode: 'insensitive' } },
      { tipo_evento: { contains: search, mode: 'insensitive' } },
      ...(['PENDIENTE', 'CONFIRMADA', 'CANCELADA'].includes(normalizedStatus)
        ? [{ estado: normalizedStatus }]
        : []),
    ];
  }

  return where;
};

export const getEventPrices = async (_req: Request, res: Response) => {
  const priceMap = await getResolvedEventPriceMap();
  res.json(priceMap);
};

export const createReservation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Debes iniciar sesion para realizar una reservacion.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nombre: true, correo: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const {
      fecha,
      hora_inicio,
      hora_fin,
      tipo_evento,
      comensales,
      detalles,
    } = req.body;

    if (!fecha || !hora_inicio || !tipo_evento) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para la reservacion.' });
    }

    // Prevenir duplicados: mismo correo + misma fecha + mismo tipo de evento
    const fechaDate = new Date(fecha);
    if (Number.isNaN(fechaDate.getTime())) {
      return res.status(400).json({ error: 'Fecha de reservacion invalida.' });
    }
    const startOfDay = new Date(fechaDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservation = await prisma.reservation.findFirst({
      where: {
        correo: user.correo,
        fecha: {
          gte: startOfDay,
          lte: endOfDay,
        },
        tipo_evento,
        estado: { not: 'CANCELADA' },
      },
    });

    if (existingReservation) {
      return res.status(409).json({
        error: 'Ya tienes una reservacion del mismo tipo para este dia. Si necesitas modificarla, contacta a nuestro equipo.',
      });
    }

    const eventPrices = await getResolvedEventPriceMap();
    const precio = tipo_evento === 'mesa' ? 0 : eventPrices[tipo_evento] || eventPrices.other || 30000;

    const reservation = await prisma.reservation.create({
      data: {
        nombre: user.nombre,
        correo: user.correo,
        fecha: fechaDate,
        hora_inicio,
        hora_fin: hora_fin || hora_inicio,
        tipo_evento,
        comensales: parseInt(String(comensales), 10) || 1,
        detalles: detalles || '',
        estado: 'PENDIENTE',
      },
    });

    invalidateReservationCache();

    return res.status(201).json({
      message: 'Reservacion enviada correctamente',
      reservation,
      precio_evento: precio,
    });
  } catch (error) {
    console.error('Error al crear reservacion:', error);
    return res.status(500).json({ error: 'Error interno al procesar la reservacion' });
  }
};

export const getReservations = async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = buildReservationCacheKey('reservations:admin', req);
    if (req.query.refresh === 'true') {
      invalidateReservationCache();
    } else if (sendCachedJson(reservationCache, cacheKey, res)) {
      return;
    }

    const pagination = parsePaginationParams(req.query);
    const where = getReservationWhere(req.query);
    const [totalItems, reservations] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.findMany({
        where,
        orderBy: { created_at: 'desc' },
        ...(pagination.isPaginated ? { skip: pagination.skip, take: pagination.take } : {}),
      }),
    ]);

    if (!pagination.isPaginated) {
      cacheJsonPayload(reservationCache, cacheKey, reservations, RESERVATION_CACHE_TTL_SECONDS);
      return res.json(reservations);
    }

    const payload = buildPaginatedResponse(reservations, totalItems, pagination);
    cacheJsonPayload(reservationCache, cacheKey, payload, RESERVATION_CACHE_TTL_SECONDS);
    return res.json(payload);
  } catch (error) {
    console.error('Error al obtener reservaciones:', error);
    return res.status(500).json({ error: 'Error al obtener reservaciones' });
  }
};

export const getUserReservations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado. Se requiere token valido.' });
    }

    const cacheKey = buildReservationCacheKey('reservations:mine', req);
    if (req.query.refresh === 'true') {
      invalidateReservationCache();
    } else if (sendCachedJson(reservationCache, cacheKey, res)) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { correo: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const pagination = parsePaginationParams(req.query);
    const where = getReservationWhere(req.query, user.correo);
    const [totalItems, reservations] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.findMany({
        where,
        orderBy: { created_at: 'desc' },
        ...(pagination.isPaginated ? { skip: pagination.skip, take: pagination.take } : {}),
      }),
    ]);

    if (!pagination.isPaginated) {
      cacheJsonPayload(reservationCache, cacheKey, reservations, RESERVATION_CACHE_TTL_SECONDS);
      return res.json(reservations);
    }

    const payload = buildPaginatedResponse(reservations, totalItems, pagination);
    cacheJsonPayload(reservationCache, cacheKey, payload, RESERVATION_CACHE_TTL_SECONDS);
    return res.json(payload);
  } catch (error) {
    console.error('Error al obtener reservaciones del usuario:', error);
    return res.status(500).json({ error: 'Error al obtener reservaciones del usuario' });
  }
};

/**
 * Confirma una reservacion con datos de pago completos.
 * Registra quien confirma y la fecha de confirmacion.
 */
export const confirmReservation = async (req: AuthRequest, res: Response) => {
  try {
    const reservationId = getRouteParam(req.params.id);
    const {
      codigo_referencia,
      monto_deposito,
      medio_pago,
      tipo_pago,
      observacion_pago,
      confirmado_por,
      confirmado_por_rol,
    } = req.body;

    if (!codigo_referencia || !monto_deposito || !medio_pago || !tipo_pago) {
      return res.status(400).json({
        error: 'Campos obligatorios: codigo de referencia, monto del deposito, medio de pago y tipo de pago.',
      });
    }

    const validMedioPago = ['SINPE_MOVIL', 'TRANSFERENCIA'];
    const validTipoPago = ['CONTADO', 'CREDITO'];

    if (!validMedioPago.includes(medio_pago)) {
      return res.status(400).json({ error: `Medio de pago invalido. Permitidos: ${validMedioPago.join(', ')}` });
    }

    if (!validTipoPago.includes(tipo_pago)) {
      return res.status(400).json({ error: `Tipo de pago invalido. Permitidos: ${validTipoPago.join(', ')}` });
    }

    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reservacion no encontrada.' });
    }

    if (existing.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: `No se puede confirmar una reservacion con estado ${existing.estado}.` });
    }

    const eventPrices = await getResolvedEventPriceMap();
    const precioTotal = existing.tipo_evento === 'mesa' ? 0 : eventPrices[existing.tipo_evento] || eventPrices.other || 30000;
    const deposito = parseFloat(String(monto_deposito));
    const nuevoEstado = deposito >= precioTotal ? 'CONFIRMADA' : 'PENDIENTE';

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        estado: nuevoEstado,
        codigo_referencia,
        monto_deposito: deposito,
        medio_pago,
        tipo_pago,
        observacion_pago: observacion_pago || null,
        confirmado_por: confirmado_por || 'Sistema',
        confirmado_por_rol: confirmado_por_rol || 'ADMIN',
        fecha_confirmacion: new Date(),
      },
    });

    console.log(`[Reservaciones] Confirmada ${reservationId} por ${confirmado_por} (${confirmado_por_rol})`);

    invalidateReservationCache();

    return res.json({
      message:
        nuevoEstado === 'CONFIRMADA'
          ? 'Reservacion confirmada exitosamente.'
          : 'Abono registrado exitosamente. La reservacion sigue pendiente.',
      reservation: updated,
    });
  } catch (error) {
    console.error('Error al confirmar reservacion:', error);
    return res.status(500).json({ error: 'Error interno al confirmar la reservacion.' });
  }
};

/**
 * Anula una reservacion con motivo obligatorio e imagen opcional.
 * Registra quien anula y la fecha de anulacion.
 */
export const cancelReservation = async (req: RequestWithOptionalFile, res: Response) => {
  try {
    const reservationId = getRouteParam(req.params.id);
    const { motivo_anulacion, anulado_por, anulado_por_rol } = req.body;

    if (!motivo_anulacion || motivo_anulacion.trim().length === 0) {
      return res.status(400).json({ error: 'El motivo de anulacion es obligatorio.' });
    }

    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reservacion no encontrada.' });
    }

    if (existing.estado === 'CANCELADA') {
      return res.status(400).json({ error: 'La reservacion ya esta anulada.' });
    }

    let imagenPath: string | null = null;
    if (req.file) {
      if (!isValidImageBuffer(req.file.buffer)) {
        return res.status(400).json({ error: 'El archivo subido no es una imagen valida.' });
      }

      const webpBuffer = await convertBufferToWebp(req.file.buffer);

      if (isSupabaseStorageConfigured()) {
        const uploaded = await uploadImageBuffer('events', webpBuffer);
        imagenPath = uploaded.url;
      } else if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Storage de imagenes no configurado.' });
      } else {
        imagenPath = saveLocalCancellationImage(webpBuffer);
      }
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        estado: 'CANCELADA',
        motivo_anulacion: motivo_anulacion.trim(),
        imagen_anulacion: imagenPath,
        anulado_por: anulado_por || 'Sistema',
        anulado_por_rol: anulado_por_rol || 'ADMIN',
        fecha_anulacion: new Date(),
      },
    });

    console.log(
      `[Reservaciones] Anulada ${reservationId} por ${anulado_por} (${anulado_por_rol}) - Motivo: ${motivo_anulacion}`,
    );

    invalidateReservationCache();

    return res.json({ message: 'Reservacion anulada exitosamente.', reservation: updated });
  } catch (error) {
    console.error('Error al anular reservacion:', error);
    return res.status(500).json({ error: 'Error interno al anular la reservacion.' });
  }
};

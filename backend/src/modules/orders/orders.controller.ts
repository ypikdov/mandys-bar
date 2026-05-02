import { Response } from 'express';
import NodeCache from 'node-cache';
import { z } from 'zod';
import { AuthRequest } from '../../middlewares/auth.js';
import prisma from '../../lib/prisma.js';
import { Prisma } from '../../generated/client/client.js';
import { triggerShadowSync } from '../../services/syncService.js';
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
import { ORDER_STATUS_VALUES, canTransitionOrderStatus } from './orderStatus.js';

const ORDER_FILTER_STATES: Record<string, string[]> = {
  PENDIENTES: ['PENDIENTE', 'PENDIENTE_VERIFICACION'],
  CONFIRMADAS: ['PAGADO', 'EN_PREPARACION', 'COMPLETADO'],
  ANULADAS: ['CANCELADO', 'ERROR'],
};

const orderCache = new NodeCache({ stdTTL: 10, checkperiod: 30 });
const ORDER_CACHE_TTL_SECONDS = 10;
const ORDER_CREATE_MAX_RETRIES = 3;

type OrderControllerError = Error & { statusCode?: number };

const createOrderPayloadSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).max(99),
  })).min(1).max(100),
  pickupTime: z.string().datetime().optional().nullable(),
  notas: z.string().trim().max(500).optional().nullable(),
});

const orderStatusSchema = z.object({
  estado: z.enum(ORDER_STATUS_VALUES),
});

const createOrderError = (message: string, statusCode = 400): OrderControllerError => {
  const error = new Error(message) as OrderControllerError;
  error.statusCode = statusCode;
  return error;
};

type OrderAuditClient = {
  auditLog: {
    create: (args: Parameters<typeof prisma.auditLog.create>[0]) => ReturnType<typeof prisma.auditLog.create>;
  };
};

const truncateAuditField = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return undefined;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
};

const toAuditJson = (value: unknown) => JSON.parse(JSON.stringify(value));

const writeOrderAuditLog = async (
  db: OrderAuditClient,
  req: AuthRequest,
  action: string,
  orderId: string,
  previousValue?: unknown,
  nextValue?: unknown,
) => {
  const userId = req.user?.userId;
  if (!userId) return;

  await db.auditLog.create({
    data: {
      usuario_que_modifica: userId,
      accion: action,
      entidad: 'Order',
      entidad_id: orderId,
      datos_anteriores: previousValue === undefined ? undefined : toAuditJson(previousValue),
      datos_nuevos: nextValue === undefined ? undefined : toAuditJson(nextValue),
      ip: truncateAuditField(req.ip, 64),
      user_agent: truncateAuditField(req.headers['user-agent'], 512),
    } as any,
  });
};

const isRetryableOrderSequenceError = (error: unknown) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code === 'P2034') {
    return true;
  }

  if (error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes('consecutivo_anual');
  }

  return typeof target === 'string' && target.includes('consecutivo_anual');
};

const buildOrderCacheKey = (prefix: string, req: AuthRequest) =>
  buildRequestCacheKey(prefix, req, getAuthRequestCacheScope(req));

const invalidateOrderCache = () => {
  orderCache.flushAll();
};

const getOrderWhere = (query: Record<string, unknown>, userId?: string) => {
  const search = getQueryString(query, 'q');
  const filter = getQueryString(query, 'filter');
  const where: any = {
    deleted_at: null,
    ...(userId ? { user_id: userId } : {}),
  };

  if (filter && ORDER_FILTER_STATES[filter]) {
    where.estado = { in: ORDER_FILTER_STATES[filter] };
  }

  if (search) {
    where.OR = [
      { consecutivo_anual: { contains: search, mode: 'insensitive' } },
      { cliente_nombre: { contains: search, mode: 'insensitive' } },
      { cliente_telefono: { contains: search, mode: 'insensitive' } },
      { user: { is: { nombre: { contains: search, mode: 'insensitive' } } } },
      { user: { is: { correo: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  return where;
};

const getOrderSummaryWhere = (query: Record<string, unknown>) => {
  const summaryQuery = { ...query };
  delete summaryQuery.filter;
  return getOrderWhere(summaryQuery);
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Debes iniciar sesion para realizar un pedido' });
    }

    const parsedBody = createOrderPayloadSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        error: 'El pedido contiene productos o cantidades invalidas.',
        details: parsedBody.error.issues,
      });
    }

    const { items, pickupTime, notas } = parsedBody.data;
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { nombre: true, telefono: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const currentYear = new Date().getFullYear().toString();
    const productIds = Array.from(new Set(items.map((item) => item.id)));

    const createOrderAttempt = () => prisma.$transaction(async (tx) => {
      const lastOrder = await tx.order.findFirst({
        where: {
          consecutivo_anual: {
            startsWith: `${currentYear}-`,
          },
        },
        orderBy: {
          consecutivo_anual: 'desc',
        },
      });

      let nextSequence = 1;
      if (lastOrder && lastOrder.consecutivo_anual.includes('-')) {
        const parts = lastOrder.consecutivo_anual.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          nextSequence = lastSeq + 1;
        }
      }

      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          nombre: true,
          precio_con_iva: true,
          activo: true,
        },
      });

      const productsById = new Map(products.map((product) => [product.id, product]));
      const missingProductId = productIds.find((productId) => !productsById.has(productId));
      if (missingProductId) {
        throw createOrderError(`Producto no encontrado en el catalogo: ${missingProductId}`, 404);
      }

      const inactiveProduct = products.find((product) => !product.activo);
      if (inactiveProduct) {
        throw createOrderError(`Producto no disponible (inactivo): ${inactiveProduct.nombre}. Fue desactivado del catalogo.`, 409);
      }

      const consecutivo = `${currentYear}-${nextSequence.toString().padStart(5, '0')}`;
      const orderItemsToCreate = items.map((item) => {
        const product = productsById.get(item.id);
        if (!product) {
          throw createOrderError(`Producto no encontrado en el catalogo: ${item.id}`, 404);
        }

        const itemPrice = Number(product.precio_con_iva) || 0;
        return {
          product_id: product.id,
          cantidad: item.quantity,
          precio_sin_iva: itemPrice / 1.13,
          iva_linea: (itemPrice / 1.13) * 0.13,
          total_linea: itemPrice * item.quantity,
        };
      });
      const safeTotalWithIVA = orderItemsToCreate.reduce((total, item) => total + item.total_linea, 0);

      return await tx.order.create({
        data: {
          user_id: userId,
          consecutivo_anual: consecutivo,
          cliente_nombre: currentUser.nombre,
          cliente_telefono: currentUser.telefono,
          subtotal_sin_iva: safeTotalWithIVA / 1.13,
          iva: (safeTotalWithIVA / 1.13) * 0.13,
          total: safeTotalWithIVA,
          pickup_time: pickupTime ? new Date(pickupTime) : null,
          notas: notas || null,
          estado: 'PENDIENTE_VERIFICACION',
          items: {
            create: orderItemsToCreate,
          },
          accounting_logs: {
            create: {
              action: 'ORDER_CREATED_PENDING',
              total: safeTotalWithIVA,
              details: JSON.stringify({
                items_count: items.length,
                pickupTime,
                device: truncateAuditField(req.headers['user-agent'], 512),
                sequence: consecutivo,
              }),
            },
          },
        },
        include: {
          items: true,
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    });

    let newOrder;
    for (let attempt = 1; attempt <= ORDER_CREATE_MAX_RETRIES; attempt += 1) {
      try {
        newOrder = await createOrderAttempt();
        break;
      } catch (error) {
        if (isRetryableOrderSequenceError(error) && attempt < ORDER_CREATE_MAX_RETRIES) {
          console.warn(`Retrying order creation after sequence conflict (attempt ${attempt}/${ORDER_CREATE_MAX_RETRIES})`);
          continue;
        }
        throw error;
      }
    }

    if (!newOrder) {
      throw new Error('No se pudo crear el pedido despues de reintentar la secuencia.');
    }

    invalidateOrderCache();
    triggerShadowSync(newOrder.id);

    return res.status(201).json({ message: 'Pedido creado correctamente', order: newOrder });
  } catch (error) {
    console.error('CRITICAL ERROR CREATING ORDER:', error);

    if (isRetryableOrderSequenceError(error)) {
      return res.status(503).json({
        error: 'No se pudo asignar el numero del pedido en este momento. Intenta nuevamente.',
      });
    }

    if (error instanceof Error && 'statusCode' in error && typeof (error as OrderControllerError).statusCode === 'number') {
      return res.status((error as OrderControllerError).statusCode!).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'No se pudo registrar el pedido en este momento.',
    });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const cacheKey = buildOrderCacheKey('orders:mine', req);
    if (req.query.refresh === 'true') {
      invalidateOrderCache();
    } else if (sendCachedJson(orderCache, cacheKey, res)) {
      return;
    }

    const pagination = parsePaginationParams(req.query);
    const where = getOrderWhere(req.query, userId);
    const [totalItems, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true } },
          accounting_logs: true,
        },
        orderBy: { fecha: 'desc' },
        ...(pagination.isPaginated ? { skip: pagination.skip, take: pagination.take } : {}),
      }),
    ]);

    if (!pagination.isPaginated) {
      cacheJsonPayload(orderCache, cacheKey, orders, ORDER_CACHE_TTL_SECONDS);
      return res.json(orders);
    }

    const payload = buildPaginatedResponse(orders, totalItems, pagination);
    cacheJsonPayload(orderCache, cacheKey, payload, ORDER_CACHE_TTL_SECONDS);
    return res.json(payload);
  } catch {
    return res.status(500).json({ error: 'No se pudieron cargar tus pedidos' });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = buildOrderCacheKey('orders:admin', req);
    if (req.query.refresh === 'true') {
      invalidateOrderCache();
    } else if (sendCachedJson(orderCache, cacheKey, res)) {
      return;
    }

    const pagination = parsePaginationParams(req.query);
    const where = getOrderWhere(req.query);
    const summaryWhere = getOrderSummaryWhere(req.query);
    const [totalItems, orders, allItems, pendingItems, confirmedItems, cancelledItems] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          user: { select: { nombre: true, correo: true, telefono: true } },
          items: { include: { product: true } },
          accounting_logs: true,
        },
        orderBy: { fecha: 'desc' },
        ...(pagination.isPaginated ? { skip: pagination.skip, take: pagination.take } : {}),
      }),
      prisma.order.count({ where: summaryWhere }),
      prisma.order.count({ where: { ...summaryWhere, estado: { in: ORDER_FILTER_STATES.PENDIENTES } } }),
      prisma.order.count({ where: { ...summaryWhere, estado: { in: ORDER_FILTER_STATES.CONFIRMADAS } } }),
      prisma.order.count({ where: { ...summaryWhere, estado: { in: ORDER_FILTER_STATES.ANULADAS } } }),
    ]);

    if (!pagination.isPaginated) {
      cacheJsonPayload(orderCache, cacheKey, orders, ORDER_CACHE_TTL_SECONDS);
      return res.json(orders);
    }

    const payload = {
      ...buildPaginatedResponse(orders, totalItems, pagination),
      summary: {
        allItems,
        pendingItems,
        confirmedItems,
        cancelledItems,
      },
    };

    cacheJsonPayload(orderCache, cacheKey, payload, ORDER_CACHE_TTL_SECONDS);
    return res.json(payload);
  } catch (error) {
    console.error('Error in GET /all:', error);
    return res.status(500).json({ error: 'No se pudieron cargar los pedidos' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsedBody = orderStatusSchema.safeParse(req.body);
    const userRole = req.user?.role;

    if (!['ADMIN', 'MANAGER', 'VENTAS'].includes(userRole || '')) {
      return res.status(403).json({ error: 'No tienes permisos para cambiar estados de pedidos.' });
    }

    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Estado de pedido invalido.', details: parsedBody.error.issues });
    }

    const nextStatus = parsedBody.data.estado;
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id } });
      if (!existing) {
        throw createOrderError('Pedido no encontrado', 404);
      }

      if (!canTransitionOrderStatus(existing.estado, nextStatus)) {
        throw createOrderError(`Transicion de estado invalida: ${existing.estado} -> ${nextStatus}`, 409);
      }

      const updated = await tx.order.update({
        where: { id },
        data: { estado: nextStatus },
        include: { user: true },
      });

      await writeOrderAuditLog(
        tx,
        req,
        'ORDER_STATUS_UPDATE',
        id,
        { estado: existing.estado },
        { estado: updated.estado },
      );

      return updated;
    });

    invalidateOrderCache();
    return res.json({ message: 'Estado actualizado correctamente', order });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);

    if (error instanceof Error && 'statusCode' in error && typeof (error as OrderControllerError).statusCode === 'number') {
      return res.status((error as OrderControllerError).statusCode!).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error al actualizar el estado del pedido' });
  }
};

export const approveOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user;

    if (!user) return res.status(401).json({ error: 'No autorizado' });

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id } });
      if (!existing) {
        throw createOrderError('Pedido no encontrado', 404);
      }

      if (!canTransitionOrderStatus(existing.estado, 'PAGADO')) {
        throw createOrderError(`No se puede aprobar un pedido con estado ${existing.estado}.`, 409);
      }

      const updated = await tx.order.update({
        where: { id },
        data: { estado: 'PAGADO' },
      });

      await tx.accountingLog.create({
        data: {
          order_id: id,
          action: 'ORDER_PAYMENT_APPROVED',
          total: existing.total,
          details: `Aprobado por ${dbUser?.nombre || 'Admin'} (${user.userId})`,
        },
      });

      await writeOrderAuditLog(
        tx,
        req,
        'ORDER_PAYMENT_APPROVED',
        id,
        { estado: existing.estado },
        { estado: updated.estado },
      );

      return updated;
    });

    invalidateOrderCache();
    res.json({ message: 'Pago del pedido verificado y aprobado correctamente', order });

    triggerShadowSync(id);
  } catch (error) {
    console.error('Error in approveOrder:', error);

    if (error instanceof Error && 'statusCode' in error && typeof (error as OrderControllerError).statusCode === 'number') {
      return res.status((error as OrderControllerError).statusCode!).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error interno al procesar la aprobacion del pago' });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { motivo } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ error: 'No autorizado' });

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (user.role === 'VENTAS') {
      if (!motivo || String(motivo).trim().length < 5) {
        return res.status(400).json({ error: 'Motivo de eliminacion valido (min 5 carac.) es obligatorio para el rol VENTAS' });
      }

      if (order.estado === 'COMPLETADO') {
        return res.status(403).json({ error: 'Seguridad: El rol VENTAS no tiene permitido eliminar pedidos COMPLETADOS.' });
      }
    }

    const deletionReason = motivo || 'Eliminacion administrativa sin motivo detallado';
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          motivo_eliminacion: deletionReason,
        },
      });

      await writeOrderAuditLog(
        tx,
        req,
        'ORDER_SOFT_DELETE',
        id,
        { estado: order.estado, deleted_at: order.deleted_at, motivo_eliminacion: order.motivo_eliminacion },
        { estado: updated.estado, deleted_at: updated.deleted_at, motivo_eliminacion: updated.motivo_eliminacion },
      );
    });

    invalidateOrderCache();

    return res.json({
      message: 'Pedido marcado como eliminado y registrado en logs de auditoria.',
      consecutivo: order.consecutivo_anual,
    });
  } catch (error) {
    console.error('Error in deleteOrder:', error);
    return res.status(500).json({ error: 'Fallo interno al procesar la eliminacion del pedido' });
  }
};




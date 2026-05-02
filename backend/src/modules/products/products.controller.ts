import { Request, Response } from 'express';
import prisma from '../../lib/prisma.js';
import NodeCache from 'node-cache';
import { z } from 'zod';
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

// Cache for products kept hot until an admin mutation invalidates it.
const productCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const PRODUCTS_CACHE_KEY = 'products:public:list';
const ADMIN_PRODUCTS_CACHE_KEY = 'products:admin:list';
const PRODUCTS_CACHE_JSON_KEY = 'products:public:list_json';
const PRODUCT_PAGE_CACHE_TTL_SECONDS = 30;

const productPayloadSchema = z.object({
  nombre: z.string().trim().min(1),
  descripcion: z.string().trim().optional().nullable(),
  precio_con_iva: z.number().nonnegative(),
  categoria: z.string().trim().min(1),
  imagen_url: z.string().trim().optional().nullable(),
  destacado: z.boolean().optional().default(false),
  activo: z.boolean().optional(),
});

const activeProductSchema = z.object({
  activo: z.boolean(),
});

const selectProductFields = {
  id: true,
  nombre: true,
  descripcion: true,
  precio_con_iva: true,
  categoria: true,
  imagen_url: true,
  destacado: true,
  activo: true,
  created_at: true,
} as const;

type ProductListItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_con_iva: number;
  categoria: string;
  imagen_url: string | null;
  destacado: boolean;
  activo: boolean;
  created_at: Date;
};

type ProductActiveUpdateRow = ProductListItem & {
  previous_activo: boolean;
};

type CachedAdminProductPage = {
  items?: ProductListItem[];
  summary?: {
    totalItems: number;
    activeItems: number;
    inactiveItems: number;
  };
};

type AuditClient = {
  auditLog: {
    create: (args: Parameters<typeof prisma.auditLog.create>[0]) => ReturnType<typeof prisma.auditLog.create>;
  };
};

type ProductControllerError = Error & { statusCode?: number };

const createProductControllerError = (message: string, statusCode = 400): ProductControllerError => {
  const error = new Error(message) as ProductControllerError;
  error.statusCode = statusCode;
  return error;
};

const toAuditJson = (value: unknown) => JSON.parse(JSON.stringify(value));

const truncateAuditField = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return undefined;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
};

const writeProductAuditLog = async (
  db: AuditClient,
  req: AuthRequest,
  action: string,
  productId: string,
  previousValue?: unknown,
  nextValue?: unknown,
) => {
  const userId = req.user?.userId;
  if (!userId) return;

  await db.auditLog.create({
    data: {
      usuario_que_modifica: userId,
      accion: action,
      entidad: 'Product',
      entidad_id: productId,
      datos_anteriores: previousValue === undefined ? undefined : toAuditJson(previousValue),
      datos_nuevos: nextValue === undefined ? undefined : toAuditJson(nextValue),
      ip: truncateAuditField(req.ip, 64),
      user_agent: truncateAuditField(req.headers['user-agent'], 512),
    } as any,
  });
};

const hasProductQuery = (query: Record<string, unknown>) =>
  query.page !== undefined ||
  query.limit !== undefined ||
  query.q !== undefined ||
  query.category !== undefined ||
  query.sort !== undefined;

const readPublicProducts = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cachedProducts = productCache.get(PRODUCTS_CACHE_KEY);
    if (cachedProducts) {
      return cachedProducts as Awaited<ReturnType<typeof prisma.product.findMany>>;
    }
  }

  const products = await prisma.product.findMany({
    where: { activo: true },
    select: selectProductFields,
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
  });

  productCache.set(PRODUCTS_CACHE_KEY, products);
  productCache.set(PRODUCTS_CACHE_JSON_KEY, JSON.stringify(products));
  return products;
};

const readAdminProducts = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cachedProducts = productCache.get<ProductListItem[]>(ADMIN_PRODUCTS_CACHE_KEY);
    if (cachedProducts) {
      return cachedProducts;
    }
  }

  const products = await prisma.product.findMany({
    select: selectProductFields,
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
  });

  productCache.set(ADMIN_PRODUCTS_CACHE_KEY, products);
  return products;
};

const filterProducts = (products: ProductListItem[], query: Record<string, unknown>) => {
  const search = getQueryString(query, 'q').toLowerCase();
  const category = getQueryString(query, 'category');

  return products.filter((product) => {
    const matchesCategory = !category || category === 'Todos' || product.categoria === category;
    const matchesSearch =
      !search ||
      product.nombre.toLowerCase().includes(search) ||
      (product.descripcion ?? '').toLowerCase().includes(search) ||
      product.categoria.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });
};

const sortProducts = (products: ProductListItem[], sort: string) =>
  [...products].sort((a, b) => {
    switch (sort) {
      case 'name_asc':
        return a.nombre.localeCompare(b.nombre);
      case 'name_desc':
        return b.nombre.localeCompare(a.nombre);
      case 'price_asc':
        return Number(a.precio_con_iva) - Number(b.precio_con_iva);
      case 'price_desc':
        return Number(b.precio_con_iva) - Number(a.precio_con_iva);
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'featured':
      default: {
        const featuredDelta = Number(b.destacado ?? false) - Number(a.destacado ?? false);
        if (featuredDelta !== 0) return featuredDelta;
        const categoryDelta = a.categoria.localeCompare(b.categoria);
        return categoryDelta !== 0 ? categoryDelta : a.nombre.localeCompare(b.nombre);
      }
    }
  });

const buildPublicProductsPage = async (req: Request) => {
  const pagination = parsePaginationParams(req.query);
  const sort = getQueryString(req.query, 'sort');
  const products = await readPublicProducts(false);
  const filteredProducts = sortProducts(filterProducts(products, req.query), sort);
  const categories = [
    'Todos',
    ...Array.from(new Set(products.map((product) => product.categoria).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    ),
  ];

  return {
    ...buildPaginatedResponse(
      filteredProducts.slice(pagination.skip, pagination.skip + pagination.take),
      filteredProducts.length,
      pagination,
    ),
    categories,
  };
};

const buildAdminProductsPage = async (req: Request) => {
  const pagination = parsePaginationParams(req.query);
  const sort = getQueryString(req.query, 'sort');
  const products = await readAdminProducts(false);
  const filteredProducts = sortProducts(filterProducts(products, req.query), sort);
  const activeItems = products.reduce((count, product) => count + Number(product.activo), 0);
  const inactiveItems = products.length - activeItems;

  return {
    ...buildPaginatedResponse(
      filteredProducts.slice(pagination.skip, pagination.skip + pagination.take),
      filteredProducts.length,
      pagination,
    ),
    summary: {
      totalItems: products.length,
      activeItems,
      inactiveItems,
    },
  };
};

const deleteProductCacheByPrefix = (prefixes: string[]) => {
  const keysToDelete = productCache.keys().filter((key) =>
    prefixes.some((prefix) => key.startsWith(prefix)),
  );

  if (keysToDelete.length > 0) {
    productCache.del(keysToDelete);
  }
};

const invalidateProductListCache = () => {
  deleteProductCacheByPrefix([
    PRODUCTS_CACHE_KEY,
    PRODUCTS_CACHE_JSON_KEY,
    ADMIN_PRODUCTS_CACHE_KEY,
    'products:public_page',
    'products:admin_page',
  ]);
};

const invalidatePublicProductCache = () => {
  deleteProductCacheByPrefix([
    PRODUCTS_CACHE_KEY,
    PRODUCTS_CACHE_JSON_KEY,
    'products:public_page',
  ]);
};

const applyActiveSummaryDelta = (
  summary: CachedAdminProductPage['summary'],
  previousActive: boolean,
  nextActive: boolean,
) => {
  if (!summary || previousActive === nextActive) return summary;

  return {
    ...summary,
    activeItems: summary.activeItems + (nextActive ? 1 : -1),
    inactiveItems: summary.inactiveItems + (nextActive ? -1 : 1),
  };
};

const patchAdminProductCache = (updatedProduct: ProductListItem, previousActive: boolean) => {
  const cachedAdminProducts = productCache.get<ProductListItem[]>(ADMIN_PRODUCTS_CACHE_KEY);
  if (cachedAdminProducts) {
    productCache.set(
      ADMIN_PRODUCTS_CACHE_KEY,
      cachedAdminProducts.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product,
      ),
    );
  }

  const adminPageKeys = productCache.keys().filter((key) => key.startsWith('products:admin_page'));
  for (const key of adminPageKeys) {
    const cachedJson = productCache.get<string>(key);
    if (!cachedJson) continue;

    try {
      const cachedPage = JSON.parse(cachedJson) as CachedAdminProductPage;
      const patchedItems = Array.isArray(cachedPage.items)
        ? cachedPage.items.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product,
          )
        : cachedPage.items;

      productCache.set(
        key,
        JSON.stringify({
          ...cachedPage,
          items: patchedItems,
          summary: applyActiveSummaryDelta(cachedPage.summary, previousActive, updatedProduct.activo),
        }),
        PRODUCT_PAGE_CACHE_TTL_SECONDS,
      );
    } catch {
      productCache.del(key);
    }
  }
};

export const primePublicProductsCache = async () => {
  await readPublicProducts(true);
};

export const primeAdminProductsCache = async () => {
  await readAdminProducts(true);
};

export const getPublicProducts = async (req: Request, res: Response) => {
  try {
    if (hasProductQuery(req.query) && req.query.refresh !== 'true') {
      const cacheKey = buildRequestCacheKey('products:public_page', req);

      if (sendCachedJson(productCache, cacheKey, res)) {
        return;
      }

      const payload = await buildPublicProductsPage(req);
      cacheJsonPayload(productCache, cacheKey, payload);
      return res.json(payload);
    }

    const forceRefresh = req.query.refresh === 'true';
    if (!forceRefresh) {
      const cachedJson = productCache.get<string>(PRODUCTS_CACHE_JSON_KEY);
      if (cachedJson) {
        return res.type('application/json').send(cachedJson);
      }
    }

    const products = await readPublicProducts(forceRefresh);
    const cachedJson = productCache.get<string>(PRODUCTS_CACHE_JSON_KEY);
    if (cachedJson) {
      return res.type('application/json').send(cachedJson);
    }

    res.json(products);
  } catch (err) {
    console.error('Error fetching public products:', err);
    res.status(500).json({ error: 'No se pudieron cargar los productos' });
  }
};

export const getAdminProducts = async (req: Request, res: Response) => {
  try {
    if (hasProductQuery(req.query) && req.query.refresh !== 'true') {
      const cacheKey = buildRequestCacheKey(
        'products:admin_page',
        req,
        getAuthRequestCacheScope(req),
      );

      if (sendCachedJson(productCache, cacheKey, res)) {
        return;
      }

      const payload = await buildAdminProductsPage(req);
      cacheJsonPayload(productCache, cacheKey, payload, PRODUCT_PAGE_CACHE_TTL_SECONDS);
      return res.json(payload);
    }

    const forceRefresh = req.query.refresh === 'true';
    if (!forceRefresh) {
      const cachedProducts = productCache.get(ADMIN_PRODUCTS_CACHE_KEY);
      if (cachedProducts) {
        return res.json(cachedProducts);
      }
    }

    const products = await readAdminProducts(forceRefresh);
    res.json(products);
  } catch (err) {
    console.error('Error fetching admin products:', err);
    res.status(500).json({ error: 'No se pudieron cargar los productos' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  const parsedBody = productPayloadSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsedBody.error.issues });
  }

  try {
    const { nombre, descripcion, precio_con_iva, categoria, imagen_url, destacado } = parsedBody.data;
    const newProduct = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: { nombre, descripcion, precio_con_iva, categoria, imagen_url, destacado }
      });

      await writeProductAuditLog(tx, req, 'PRODUCT_CREATE', created.id, undefined, created);
      return created;
    });
    
    invalidateProductListCache();
    
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'No se pudo crear el producto' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsedBody = productPayloadSchema.partial().safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsedBody.error.issues });
    }
    
    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.product.findUnique({ where: { id }, select: selectProductFields });
      if (!previous) {
        throw createProductControllerError('Producto no encontrado', 404);
      }

      const nextProduct = await tx.product.update({
        where: { id },
        data: parsedBody.data
      });

      await writeProductAuditLog(tx, req, 'PRODUCT_UPDATE', id, previous, nextProduct);
      return nextProduct;
    });
    
    invalidateProductListCache();
    
    res.json(updated);
  } catch (err) {
    if (err instanceof Error && 'statusCode' in err) {
      return res.status((err as ProductControllerError).statusCode ?? 400).json({ error: err.message });
    }

    console.error('Error updating product:', err);
    res.status(500).json({ error: 'No se pudo actualizar el producto' });
  }
};

export const updateProductActive = async (req: AuthRequest, res: Response) => {
  const parsedBody = activeProductSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: 'Datos invalidos', details: parsedBody.error.issues });
  }

  try {
    const id = req.params.id as string;
    const nextActive = parsedBody.data.activo;
    const updatedRow = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<ProductActiveUpdateRow[]>`
        WITH previous AS MATERIALIZED (
          SELECT activo
          FROM products
          WHERE id = ${id}
        ),
        updated AS (
          UPDATE products
          SET activo = ${nextActive}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, nombre, descripcion, precio_con_iva, categoria, imagen_url, destacado, activo, created_at
        )
        SELECT updated.*, previous.activo AS previous_activo
        FROM updated, previous
      `;

      const row = rows[0];
      if (!row) return null;

      await writeProductAuditLog(
        tx,
        req,
        'PRODUCT_ACTIVE_UPDATE',
        id,
        { activo: row.previous_activo },
        { activo: row.activo },
      );
      return row;
    });

    if (!updatedRow) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const { previous_activo: previousActive, ...updated } = updatedRow;

    invalidatePublicProductCache();
    patchAdminProductCache(updated, previousActive);

    return res.json(updated);
  } catch (err) {
    console.error('Error updating product active state:', err);
    return res.status(500).json({ error: 'No se pudo actualizar el estado del producto' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.$transaction(async (tx) => {
      const previous = await tx.product.findUnique({ where: { id }, select: selectProductFields });
      if (!previous) {
        throw createProductControllerError('Producto no encontrado', 404);
      }

      await tx.product.delete({ where: { id } });
      await writeProductAuditLog(tx, req, 'PRODUCT_DELETE', id, previous, undefined);
    });
    
    invalidateProductListCache();
    
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    if (err instanceof Error && 'statusCode' in err) {
      return res.status((err as ProductControllerError).statusCode ?? 400).json({ error: err.message });
    }

    // If product has order references, soft-delete instead
    const error = err as { code?: string };
    if (error.code === 'P2003' || error.code === 'P2014') {
      const id = req.params.id as string;
      await prisma.$transaction(async (tx) => {
        const previous = await tx.product.findUnique({ where: { id }, select: selectProductFields });
        const updated = await tx.product.update({ where: { id }, data: { activo: false } });
        await writeProductAuditLog(tx, req, 'PRODUCT_SOFT_DELETE', id, previous, updated);
      });
      
      invalidateProductListCache();
      
      res.json({ message: 'Producto desactivado porque tiene pedidos asociados' });
    } else {
      console.error('Error deleting product:', err);
      res.status(500).json({ error: 'No se pudo eliminar el producto' });
    }
  }
};

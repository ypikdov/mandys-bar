/**
 * Servicio API — Productos
 *
 * Centraliza las llamadas de red para CRUD de productos.
 * Reemplaza los fetch directos en AdminDashboard.tsx.
 */

import { apiGet, apiPut, apiDelete } from '@/lib/api';
import { menuData } from '@/data/menu';
import type { PaginatedResponse, Product, UpdateProductPayload } from '@mandys/shared';

let cachedPublicProducts: Product[] | null = null;
let cachedPublicProductsAt = 0;
let inFlightPublicProducts: Promise<Product[]> | null = null;
const cachedPublicProductPages = new Map<string, { data: ProductPageResponse; cachedAt: number }>();
const PRODUCTS_STORAGE_KEY = 'mandys.public-products.v3';
const PRODUCTS_PAGE_STORAGE_PREFIX = 'mandys.public-products-page.v1:';
const PUBLIC_PRODUCTS_TTL_MS = 300_000;
const PUBLIC_PRODUCTS_PAGE_TTL_MS = 120_000;

const staticPublicProducts: Product[] = menuData.map((item) => ({
  id: item.id,
  nombre: item.name,
  descripcion: item.description,
  precio_con_iva: item.price,
  categoria: item.category,
  imagen_url: item.image,
  destacado: item.isFeatured ?? false,
  activo: true,
  created_at: item.createdAt,
}));

interface GetAllProductsOptions {
  token?: string | null;
  force?: boolean;
}

export type ProductSortParam =
  | 'featured'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'oldest'
  | 'newest';

export interface ProductPageOptions {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
  sort?: ProductSortParam;
}

export interface ProductPageResponse extends PaginatedResponse<Product> {
  categories: string[];
}

const DEFAULT_PRODUCTS_PAGE: ProductPageResponse['pagination'] = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const readStoredPublicProducts = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { products: Product[]; cachedAt: number };
    if (!Array.isArray(parsed?.products) || typeof parsed.cachedAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeStoredPublicProducts = (products: Product[], timestamp: number) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PRODUCTS_STORAGE_KEY,
      JSON.stringify({ products, cachedAt: timestamp }),
    );
  } catch {
    // ignore storage failures
  }
};

const readStoredProductPage = (cacheKey: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(`${PRODUCTS_PAGE_STORAGE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: ProductPageResponse; cachedAt: number };
    if (!Array.isArray(parsed?.data?.items) || typeof parsed.cachedAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeStoredProductPage = (cacheKey: string, data: ProductPageResponse, timestamp: number) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      `${PRODUCTS_PAGE_STORAGE_PREFIX}${cacheKey}`,
      JSON.stringify({ data, cachedAt: timestamp }),
    );
  } catch {
    // ignore storage failures
  }
};

export function getCachedPublicProductsSnapshot(ttlMs = PUBLIC_PRODUCTS_TTL_MS): Product[] | null {
  const now = Date.now();
  const memoryIsFresh = cachedPublicProducts && now - cachedPublicProductsAt < ttlMs;
  if (memoryIsFresh) {
    return cachedPublicProducts;
  }

  const stored = readStoredPublicProducts();
  if (!stored || now - stored.cachedAt >= ttlMs) {
    return null;
  }

  cachedPublicProducts = stored.products;
  cachedPublicProductsAt = stored.cachedAt;
  return stored.products;
}

export function getStaticPublicProductsFallback(): Product[] {
  return staticPublicProducts;
}

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

const buildProductsPageQueryString = (options: ProductPageOptions = {}) =>
  buildQueryString({
    page: options.page ?? 1,
    limit: options.limit ?? 10,
    category: options.category && options.category !== 'Todos' ? options.category : undefined,
    q: options.q?.trim() || undefined,
    sort: options.sort ?? 'featured',
  });

const getStaticProductPage = (options: ProductPageOptions = {}): ProductPageResponse => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const search = options.q?.trim().toLowerCase() ?? '';
  const category = options.category ?? 'Todos';
  const filtered = staticPublicProducts.filter((product) => {
    const matchesCategory = category === 'Todos' || product.categoria === category;
    const matchesSearch =
      !search ||
      product.nombre.toLowerCase().includes(search) ||
      (product.descripcion || '').toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (options.sort) {
      case 'name_asc':
        return a.nombre.localeCompare(b.nombre);
      case 'name_desc':
        return b.nombre.localeCompare(a.nombre);
      case 'price_asc':
        return a.precio_con_iva - b.precio_con_iva;
      case 'price_desc':
        return b.precio_con_iva - a.precio_con_iva;
      case 'oldest':
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      case 'newest':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'featured':
      default: {
        const featuredDelta = Number(b.destacado ?? false) - Number(a.destacado ?? false);
        if (featuredDelta !== 0) return featuredDelta;
        const categoryDelta = a.categoria.localeCompare(b.categoria);
        return categoryDelta !== 0 ? categoryDelta : a.nombre.localeCompare(b.nombre);
      }
    }
  });

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const start = (page - 1) * limit;
  const categories = ['Todos', ...Array.from(new Set(staticPublicProducts.map((item) => item.categoria)))];

  return {
    items: sorted.slice(start, start + limit),
    categories,
    pagination: {
      ...DEFAULT_PRODUCTS_PAGE,
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export function getStaticProductsPageFallback(options: ProductPageOptions = {}): ProductPageResponse {
  return getStaticProductPage(options);
}

export function getCachedProductsPageSnapshot(
  options: ProductPageOptions = {},
  ttlMs = PUBLIC_PRODUCTS_PAGE_TTL_MS,
): ProductPageResponse | null {
  const cacheKey = buildProductsPageQueryString(options);
  const now = Date.now();
  const memoryEntry = cachedPublicProductPages.get(cacheKey);

  if (memoryEntry && now - memoryEntry.cachedAt < ttlMs) {
    return memoryEntry.data;
  }

  const stored = readStoredProductPage(cacheKey);
  if (!stored || now - stored.cachedAt >= ttlMs) {
    return null;
  }

  cachedPublicProductPages.set(cacheKey, stored);
  return stored.data;
}

const cacheProductsPage = (cacheKey: string, data: ProductPageResponse) => {
  const cachedAt = Date.now();
  cachedPublicProductPages.set(cacheKey, { data, cachedAt });
  writeStoredProductPage(cacheKey, data, cachedAt);
};

export async function getProductsPage(options: ProductPageOptions = {}): Promise<ProductPageResponse> {
  const queryString = buildProductsPageQueryString(options);
  const cachedPage = getCachedProductsPageSnapshot(options);
  if (cachedPage) {
    return cachedPage;
  }

  try {
    const response = await apiGet(`/api/products?${queryString}`);
    if (!response.ok) {
      throw new Error('Error obteniendo productos');
    }

    const data = (await response.json()) as ProductPageResponse;
    const resolvedPage = {
      items: Array.isArray(data.items) ? data.items : [],
      categories: Array.isArray(data.categories) ? data.categories : getStaticProductPage().categories,
      pagination: data.pagination ?? DEFAULT_PRODUCTS_PAGE,
    };

    cacheProductsPage(queryString, resolvedPage);
    return resolvedPage;
  } catch (error) {
    console.warn('No se pudo cargar la pagina de productos desde la API; usando catalogo local.', error);
    return getStaticProductPage(options);
  }
}

/**
 * Obtiene todos los productos (incluyendo inactivos para admin).
 * Ruta backend: GET /api/products
 */
export async function getAllProducts(options?: string | null | GetAllProductsOptions): Promise<Product[]> {
  const token = typeof options === 'object' && options !== null ? options.token : options;
  const force = typeof options === 'object' && options !== null ? options.force === true : false;
  const shouldUsePublicCache = !token;
  const now = Date.now();

  if (!force && shouldUsePublicCache && cachedPublicProducts && now - cachedPublicProductsAt < PUBLIC_PRODUCTS_TTL_MS) {
    return cachedPublicProducts;
  }

  if (!force && shouldUsePublicCache) {
    const stored = getCachedPublicProductsSnapshot(PUBLIC_PRODUCTS_TTL_MS);
    if (stored) {
      return stored;
    }
  }

  if (!force && shouldUsePublicCache && inFlightPublicProducts) {
    return inFlightPublicProducts;
  }

  const load = async () => {
    const endpoint = force && shouldUsePublicCache ? '/api/products?refresh=true' : '/api/products';
    let response: Response;
    try {
      response = await apiGet(endpoint, token);
    } catch (error) {
      if (shouldUsePublicCache) {
        console.warn('No se pudo cargar productos desde la API; usando catálogo local.', error);
        return staticPublicProducts;
      }

      throw error;
    }

    if (!response.ok) {
      if (shouldUsePublicCache) {
        console.warn('La API de productos no respondió correctamente; usando catálogo local.');
        return staticPublicProducts;
      }

      throw new Error('Error obteniendo productos');
    }

    const products = (await response.json()) as Product[];
    const resolvedProducts = products.length > 0 ? products : staticPublicProducts;

    if (shouldUsePublicCache) {
      cachedPublicProducts = resolvedProducts;
      cachedPublicProductsAt = Date.now();
      writeStoredPublicProducts(resolvedProducts, cachedPublicProductsAt);
    }

    return resolvedProducts;
  };

  if (!shouldUsePublicCache) {
    return load();
  }

  inFlightPublicProducts = load();

  try {
    return await inFlightPublicProducts;
  } finally {
    inFlightPublicProducts = null;
  }
}

/**
 * Actualiza un producto existente.
 * Ruta backend: PUT /api/products/:id
 */
export async function updateProduct(
  productId: string,
  payload: UpdateProductPayload,
  token: string
): Promise<void> {
  const response = await apiPut(`/api/products/${productId}`, payload, token);
  if (!response.ok) {
    throw new Error('Error al guardar producto');
  }
}

/**
 * Elimina un producto permanentemente.
 * Ruta backend: DELETE /api/products/:id
 */
export async function deleteProduct(productId: string, token: string): Promise<void> {
  const response = await apiDelete(`/api/products/${productId}`, token);
  if (!response.ok) {
    throw new Error('Error al eliminar producto');
  }
}

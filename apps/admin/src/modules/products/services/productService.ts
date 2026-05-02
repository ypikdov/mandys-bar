/**
 * Servicio API — Productos
 *
 * Centraliza las llamadas de red para CRUD de productos.
 * Reemplaza los fetch directos en AdminDashboard.tsx.
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type { PaginatedResponse, Product, CreateProductPayload, UpdateProductPayload } from '@mandys/shared';
import { buildListQueryString, normalizePaginatedResponse, type ListQueryOptions } from '@/shared/api/pagination';

export interface ProductsSummary {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
}

export interface ProductsPageResponse extends PaginatedResponse<Product> {
  summary?: ProductsSummary;
}

/**
 * Obtiene todos los productos (incluyendo inactivos para admin).
 * Ruta backend: GET /api/products/admin
 */
export async function getAllProducts(token: string, options?: ListQueryOptions): Promise<ProductsPageResponse> {
  const query = options ? `?${buildListQueryString(options)}` : '';
  const response = await apiGet(`/api/products/admin${query}`, token);
  if (!response.ok) {
    throw new Error('Error obteniendo productos');
  }
  const data = (await response.json()) as ProductsPageResponse | Product[];
  if (Array.isArray(data)) {
    return normalizePaginatedResponse(data);
  }
  return {
    ...normalizePaginatedResponse(data),
    summary: data.summary,
  };
}

/**
 * Crea un nuevo producto.
 * Ruta backend: POST /api/products
 */
export async function createProduct(
  payload: CreateProductPayload,
  token: string
): Promise<Product> {
  const response = await apiPost('/api/products', payload, token);
  if (!response.ok) {
    throw new Error('Error al crear producto');
  }
  return response.json();
}

/**
 * Actualiza un producto existente.
 * Ruta backend: PUT /api/products/:id
 */
export async function updateProduct(
  productId: string,
  payload: UpdateProductPayload,
  token: string
): Promise<Product> {
  const response = await apiPut(`/api/products/${productId}`, payload, token);
  if (!response.ok) {
    throw new Error('Error al guardar producto');
  }
  return response.json();
}

/**
 * Cambia solo el estado activo/inactivo.
 * Ruta backend: PATCH /api/products/:id/active
 */
export async function updateProductActive(
  productId: string,
  activo: boolean,
  token: string
): Promise<Product> {
  const response = await apiPatch(`/api/products/${productId}/active`, { activo }, token);
  if (!response.ok) {
    throw new Error('Error al cambiar el estado del producto');
  }
  return response.json();
}

/**
 * Elimina un producto permanentemente.
 * Ruta backend: DELETE /api/products/:id
 */
export async function deleteProduct(productId: string, token: string): Promise<void> {
  const response = await apiDelete(`/api/products/${productId}`, undefined, token);
  if (!response.ok) {
    throw new Error('Error al eliminar producto');
  }
}


/**
 * Servicio API — Órdenes
 *
 * Centraliza todas las llamadas de red relacionadas con pedidos.
 * Reemplaza los ~6 fetch directos que existían en AdminDashboard.tsx,
 * estandarizando el uso del apiClient y devolviendo datos tipados.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { Order, PaginatedResponse } from '@mandys/shared';
import { buildListQueryString, normalizePaginatedResponse, type ListQueryOptions } from '@/shared/api/pagination';

export interface OrdersSummary {
  allItems: number;
  pendingItems: number;
  confirmedItems: number;
  cancelledItems: number;
}

export interface OrdersPageResponse extends PaginatedResponse<Order> {
  summary?: OrdersSummary;
}

/**
 * Obtiene todas las órdenes (vista admin).
 * Ruta backend: GET /api/orders/all
 */
export async function getAllOrders(token: string, options?: ListQueryOptions): Promise<OrdersPageResponse> {
  const query = options ? `?${buildListQueryString(options)}` : '';
  const response = await apiGet(`/api/orders/all${query}`, token);
  if (!response.ok) {
    throw new Error('Error obteniendo órdenes');
  }
  const data = (await response.json()) as OrdersPageResponse | Order[];
  if (Array.isArray(data)) {
    return normalizePaginatedResponse(data);
  }
  return {
    ...normalizePaginatedResponse(data),
    summary: data.summary,
  };
}

/**
 * Actualiza el estado de una orden.
 * Ruta backend: PUT /api/orders/status/:id
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  token: string
): Promise<void> {
  const response = await apiPut(`/api/orders/status/${orderId}`, { estado: newStatus }, token);
  if (!response.ok) {
    throw new Error('Error al actualizar el estado');
  }
}

/**
 * Aprueba el pago de una orden (cambia a PAGADO).
 * Ruta backend: PUT /api/orders/approve/:id
 */
export async function approveOrder(orderId: string, token: string): Promise<void> {
  const response = await apiPut(`/api/orders/approve/${orderId}`, {}, token);
  if (!response.ok) {
    throw new Error('Error al aprobar la orden');
  }
}

/**
 * Soft delete de una orden con motivo.
 * Ruta backend: DELETE /api/orders/:id
 */
export async function deleteOrder(
  orderId: string,
  motivo: string,
  token: string
): Promise<void> {
  const response = await apiDelete(`/api/orders/${orderId}`, { motivo }, token);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Fallo al eliminar el pedido');
  }
}

/**
 * Registra un pedido nuevo a nombre del cliente autenticado.
 * Ruta backend: POST /api/orders
 */
export async function createClientOrder(payload: any, token: string): Promise<any> {
  const response = await apiPost('/api/orders', payload, token);
  
  if (response.status === 401) {
    throw new Error("Tu sesión ha expirado o no tienes permisos para realizar pedidos. Por favor ingresa de nuevo.");
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const details = errorData.details || errorData.error || "Error interno del servidor";
    throw new Error(`Error en el servidor: ${details}`);
  }
  
  return response.json();
}

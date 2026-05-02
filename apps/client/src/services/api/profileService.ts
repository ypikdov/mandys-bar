/**
 * Servicio API — Perfil de Usuario
 *
 * Centraliza las llamadas de red para la gestión del perfil del cliente logueado.
 * Implementa las operaciones previamente incrustadas on-demand dentro de ProfilePage.tsx
 */

import { apiGet, apiPut, apiDelete } from '@/lib/api';
import type { PaginatedResponse } from '@mandys/shared';

export interface ProfileListOptions {
  page?: number;
  limit?: number;
}

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const buildListQueryString = (options: ProfileListOptions = {}) => {
  const query = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 10),
  });
  return query.toString();
};

const normalizePaginatedResponse = <T>(data: PaginatedResponse<T> | T[]): PaginatedResponse<T> => {
  if (Array.isArray(data)) {
    return {
      items: data,
      pagination: {
        ...DEFAULT_PAGINATION,
        totalItems: data.length,
        totalPages: Math.max(1, Math.ceil(data.length / DEFAULT_PAGINATION.limit)),
      },
    };
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: data.pagination ?? DEFAULT_PAGINATION,
  };
};

/**
 * Carga inicial combinada del perfil (Datos Básicos + Preview de Órdenes y Reservas)
 * Ruta backend: GET /api/profile/bootstrap
 */
export async function getBootstrapProfile(token: string) {
  const response = await apiGet('/api/profile/bootstrap', token);
  if (!response.ok) {
    throw new Error('Error al inicializar el perfil');
  }
  return response.json();
}

/**
 * Obtiene la información personal y de facturación.
 * Ruta backend: GET /api/profile
 */
export async function getProfile(token: string) {
  const response = await apiGet('/api/profile', token);
  if (!response.ok) {
    throw new Error('Error al cargar datos del perfil');
  }
  return response.json();
}

/**
 * Actualiza uno o más campos del perfil (nombre, foto, secciones, dirección).
 * Ruta backend: PUT /api/profile
 */
export async function updateProfile(body: any, token: string) {
  const response = await apiPut('/api/profile', body, token);
  if (!response.ok) {
    throw new Error('Error al actualizar el perfil');
  }
  return response.json();
}

/**
 * Modifica la contraseña del usuario (Flujo Seguro)
 * Ruta backend: PUT /api/profile/password
 */
export async function updatePassword(body: any, token: string) {
  const response = await apiPut('/api/profile/password', body, token);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Error al modificar la contraseña');
  }
  return response.json();
}

/**
 * Eliminación de cuenta permanentemente (Flujo Crítico Sensible)
 * Ruta backend: DELETE /api/profile
 */
export async function deleteAccount(token: string) {
  const response = await apiDelete('/api/profile', token);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Error al eliminar la cuenta');
  }
  return response.json();
}

/**
 * Carga diferida del resumen completo de reservaciones de un usuario
 * Ruta backend: GET /api/reservations/me
 */
export async function getUserReservations(token: string, options?: ProfileListOptions) {
  const query = options ? `?${buildListQueryString(options)}` : '';
  const response = await apiGet(`/api/reservations/me${query}`, token);
  if (!response.ok) {
    throw new Error('Error al cargar el historial de reservas');
  }
  return normalizePaginatedResponse(await response.json());
}

/**
 * Carga diferida del resumen completo del historial de pedidos de un usuario
 * Ruta backend: GET /api/orders/me
 */
export async function getUserOrders(token: string, options?: ProfileListOptions) {
  const query = options ? `?${buildListQueryString(options)}` : '';
  const response = await apiGet(`/api/orders/me${query}`, token);
  if (!response.ok) {
    throw new Error('Error al cargar el historial de pedidos');
  }
  return normalizePaginatedResponse(await response.json());
}

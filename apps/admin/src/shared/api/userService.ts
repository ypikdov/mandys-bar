/**
 * Servicio API — Usuarios y Staff
 *
 * Centraliza las llamadas de red para gestión de clientes y personal.
 * Reemplaza los fetch directos en AdminDashboard.tsx.
 */

import { apiGet, apiPost, apiPut } from '@/lib/api';
import type { AppUser, CreateClientPayload, CreateStaffPayload, PaginatedResponse } from '@mandys/shared';
import { buildListQueryString, normalizePaginatedResponse, type ListQueryOptions } from '@/shared/api/pagination';

/**
 * Obtiene todos los clientes registrados (usuarios con rol USER).
 * Ruta backend: GET /api/users
 */
export async function getClients(token: string, options?: ListQueryOptions): Promise<PaginatedResponse<AppUser>> {
  const query = options ? `?${buildListQueryString(options)}` : '';
  const response = await apiGet(`/api/users${query}`, token);
  if (!response.ok) {
    throw new Error('Error obteniendo clientes');
  }
  return normalizePaginatedResponse((await response.json()) as PaginatedResponse<AppUser> | AppUser[]);
}

/**
 * Registra un nuevo cliente desde el panel admin.
 * Ruta backend: POST /api/users
 */
export async function createClient(
  payload: CreateClientPayload,
  token: string
): Promise<AppUser> {
  const response = await apiPost('/api/users', payload, token);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'No se pudo crear el cliente');
  }
  return data;
}

/**
 * Obtiene todos los miembros del staff (roles operativos).
 * Ruta backend: GET /api/users/staff
 */
export async function getStaff(token: string, options?: ListQueryOptions): Promise<PaginatedResponse<AppUser>> {
  const query = options ? `?${buildListQueryString(options)}` : '';
  const response = await apiGet(`/api/users/staff${query}`, token);
  if (!response.ok) {
    throw new Error('Error obteniendo personal');
  }
  return normalizePaginatedResponse((await response.json()) as PaginatedResponse<AppUser> | AppUser[]);
}

/**
 * Registra un nuevo miembro del staff desde el panel admin.
 * Ruta backend: POST /api/users/staff
 */
export async function createStaffMember(
  payload: CreateStaffPayload,
  token: string
): Promise<AppUser> {
  const response = await apiPost('/api/users/staff', payload, token);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'No se pudo crear el trabajador');
  }
  return data;
}

/**
 * Cambia el rol de un usuario existente.
 * Ruta backend: PUT /api/users/:id/role
 */
export async function changeUserRole(
  userId: string,
  newRole: string,
  token: string
): Promise<void> {
  const response = await apiPut(`/api/users/${userId}/role`, { role: newRole }, token);
  if (!response.ok) {
    throw new Error('No se pudo cambiar el rol');
  }
}

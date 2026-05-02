/**
 * Servicio API — Usuarios y Staff
 *
 * Centraliza las llamadas de red para gestión de clientes y personal.
 * Reemplaza los fetch directos en AdminDashboard.tsx.
 */

import { apiGet, apiPost, apiPut } from '@/lib/api';
import type { AppUser, CreateStaffPayload } from '@mandys/shared';

/**
 * Obtiene todos los clientes registrados (usuarios con rol USER).
 * Ruta backend: GET /api/users
 */
export async function getClients(token: string): Promise<AppUser[]> {
  const response = await apiGet('/api/users', token);
  if (!response.ok) {
    throw new Error('Error obteniendo clientes');
  }
  return response.json();
}

/**
 * Obtiene todos los miembros del staff (roles operativos).
 * Ruta backend: GET /api/users/staff
 */
export async function getStaff(token: string): Promise<AppUser[]> {
  const response = await apiGet('/api/users/staff', token);
  if (!response.ok) {
    throw new Error('Error obteniendo personal');
  }
  return response.json();
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

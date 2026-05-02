/**
 * Servicio API — Autenticación
 *
 * Centraliza el login del panel admin.
 *
 * Principio de Agnosticismo de Dependencias: si la estrategia de
 * autenticación cambia (ej: OAuth), solo se edita este servicio.
 */

import type { AuthCredentials, AuthResponse } from '@mandys/shared';
import { apiPost, readApiJson } from '@/lib/api';

type AuthPayload = AuthResponse & { message?: string; error?: string };

/**
 * Inicio de sesión con correo y contraseña.
 * Ruta backend: POST /api/auth/login
 */
export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  const response = await apiPost('/api/auth/login', credentials);
  const data = await readApiJson<AuthPayload>(response);
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error al iniciar sesión');
  }
  return data;
}

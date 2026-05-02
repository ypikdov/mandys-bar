/**
 * Servicio API — Reservaciones
 *
 * Centraliza las llamadas de red para gestión de reservaciones.
 * Reemplaza los fetch directos en AdminDashboard.tsx.
 */

import { apiGet, apiFetch, apiPost, readApiJson } from '@/lib/api';
import type { Reservation, ConfirmReservationPayload } from '@mandys/shared';

type ReservationResponse = {
  message?: string;
  error?: string;
  reservation?: Reservation;
  precio_evento?: number;
};

/**
 * Crea una nueva reservación desde el cliente.
 * Ruta backend: POST /api/reservations
 */
export async function createClientReservation(payload: any, token: string) {
  if (!token) {
    throw new Error('Debes iniciar sesion para realizar una reservacion.');
  }

  const response = await apiPost('/api/reservations', payload, token);
  const data = await readApiJson<ReservationResponse>(response);
  if (response.status === 409) {
    throw new Error(data.error || 'Ya tienes una reservación para este día y tipo de evento.');
  }
  if (!response.ok && response.status !== 201) {
    throw new Error(data.error || 'Hubo un error al procesar tu solicitud.');
  }
  return data;
}

/**
 * Obtiene todas las reservaciones (vista admin).
 * Ruta backend: GET /api/reservations
 */
export async function getAllReservations(token: string): Promise<Reservation[]> {
  const response = await apiGet('/api/reservations', token);
  if (!response.ok) {
    throw new Error('Error obteniendo reservaciones');
  }
  return response.json();
}

/**
 * Confirma una reservación con datos de pago.
 * Ruta backend: PUT /api/reservations/confirm/:id
 */
export async function confirmReservation(
  reservationId: string,
  payload: ConfirmReservationPayload,
  token: string
): Promise<Reservation> {
  const response = await apiFetch(`/api/reservations/confirm/${reservationId}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Error al confirmar la reservación');
  }
  return data.reservation;
}

/**
 * Anula (cancela) una reservación con motivo e imagen opcional.
 * Usa FormData para soportar subida de imagen adjunta.
 * Ruta backend: PUT /api/reservations/cancel/:id
 */
export async function cancelReservation(
  reservationId: string,
  motivo: string,
  cancelledBy: { nombre: string; role: string },
  cancelImage: File | null,
  token: string
): Promise<Reservation> {
  const formData = new FormData();
  formData.append('motivo_anulacion', motivo.trim());
  formData.append('anulado_por', cancelledBy.nombre);
  formData.append('anulado_por_rol', cancelledBy.role);
  if (cancelImage) {
    formData.append('imagen_anulacion', cancelImage);
  }

  const response = await apiFetch(`/api/reservations/cancel/${reservationId}`, token, {
    method: 'PUT',
    body: formData,
    isFormData: true,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Error al anular la reservación');
  }
  return data.reservation;
}

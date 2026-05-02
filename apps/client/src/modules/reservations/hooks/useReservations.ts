/**
 * Hook de dominio — Reservaciones
 *
 * Encapsula estado + lógica de red para gestión de reservaciones.
 * Obtiene el token y usuario de AuthContext internamente.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthContext';
import * as reservationService from '@/modules/reservations/services/reservationService';
import type { Reservation, ConfirmReservationPayload } from '@mandys/shared';

interface UseReservationsReturn {
  reservations: Reservation[];
  isLoading: boolean;
  error: string | null;
  fetchReservations: () => Promise<void>;
  confirmReservation: (reservationId: string, payload: ConfirmReservationPayload) => Promise<void>;
  cancelReservation: (reservationId: string, motivo: string, cancelImage: File | null) => Promise<void>;
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
}

export function useReservations(): UseReservationsReturn {
  const { token, user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await reservationService.getAllReservations(token);
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const confirmReservation = useCallback(async (
    reservationId: string,
    payload: ConfirmReservationPayload
  ) => {
    if (!token) return;
    try {
      const updatedReservation = await reservationService.confirmReservation(
        reservationId,
        payload,
        token
      );
      setReservations(prev =>
        prev.map(r => r.id === reservationId ? { ...r, ...updatedReservation } : r)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [token]);

  const cancelReservation = useCallback(async (
    reservationId: string,
    motivo: string,
    cancelImage: File | null
  ) => {
    if (!token || !user) return;
    try {
      const updatedReservation = await reservationService.cancelReservation(
        reservationId,
        motivo,
        { nombre: user.nombre || 'Sistema', role: user.role || 'ADMIN' },
        cancelImage,
        token
      );
      setReservations(prev =>
        prev.map(r => r.id === reservationId ? { ...r, ...updatedReservation } : r)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [token, user]);

  return {
    reservations,
    isLoading,
    error,
    fetchReservations,
    confirmReservation,
    cancelReservation,
    setReservations,
  };
}

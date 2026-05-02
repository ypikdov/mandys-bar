/**
 * Hook de dominio — Staff (Personal)
 *
 * Encapsula estado + lógica de red para gestión de personal operativo.
 * Obtiene el token de AuthContext internamente.
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthContext';
import * as userService from '@/shared/api/userService';
import type { AppUser, CreateStaffPayload, PaginationMeta } from '@mandys/shared';
import { DEFAULT_PAGINATION, type ListQueryOptions } from '@/shared/api/pagination';

interface UseStaffReturn {
  staff: AppUser[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  fetchStaff: (options?: ListQueryOptions) => Promise<void>;
  createStaffMember: (payload: CreateStaffPayload) => Promise<void>;
  changeUserRole: (userId: string, newRole: string) => Promise<void>;
}

export function useStaff(): UseStaffReturn {
  const { token } = useAuth();
  const [staff, setStaff] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const lastFetchOptions = useRef<ListQueryOptions>({ page: 1, limit: 10 });

  const fetchStaff = useCallback(async (options?: ListQueryOptions) => {
    if (!token) return;
    lastFetchOptions.current = { ...lastFetchOptions.current, ...(options ?? {}) };
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getStaff(token, lastFetchOptions.current);
      setStaff(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createStaffMember = useCallback(async (payload: CreateStaffPayload) => {
    if (!token) return;
    try {
      await userService.createStaffMember(payload, token);
      await fetchStaff();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [token, fetchStaff]);

  const changeUserRole = useCallback(async (userId: string, newRole: string) => {
    if (!token) return;
    try {
      await userService.changeUserRole(userId, newRole, token);
      await fetchStaff();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [token, fetchStaff]);

  return {
    staff,
    isLoading,
    error,
    pagination,
    fetchStaff,
    createStaffMember,
    changeUserRole,
  };
}

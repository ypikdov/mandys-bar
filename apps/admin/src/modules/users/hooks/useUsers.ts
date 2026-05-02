import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthContext';
import * as userService from '@/shared/api/userService';
import type { AppUser, CreateClientPayload, PaginationMeta } from '@mandys/shared';
import { DEFAULT_PAGINATION, type ListQueryOptions } from '@/shared/api/pagination';

interface UseUsersReturn {
  clients: AppUser[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  fetchClients: (options?: ListQueryOptions) => Promise<void>;
  createClient: (payload: CreateClientPayload) => Promise<void>;
}

export function useUsers(): UseUsersReturn {
  const { token } = useAuth();
  const [clients, setClients] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const lastFetchOptions = useRef<ListQueryOptions>({ page: 1, limit: 10 });

  const fetchClients = useCallback(async (options?: ListQueryOptions) => {
    if (!token) return;
    lastFetchOptions.current = { ...lastFetchOptions.current, ...(options ?? {}) };
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getClients(token, lastFetchOptions.current);
      setClients(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createClient = useCallback(async (payload: CreateClientPayload) => {
    if (!token) return;
    try {
      await userService.createClient(payload, token);
      await fetchClients();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [fetchClients, token]);

  return {
    clients,
    isLoading,
    error,
    pagination,
    fetchClients,
    createClient,
  };
}

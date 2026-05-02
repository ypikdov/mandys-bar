/**
 * Hook de dominio — Órdenes
 *
 * Encapsula estado + lógica de red para gestión de pedidos.
 * Obtiene el token de AuthContext internamente.
 * Los componentes de UI solo consumen datos y llaman métodos.
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthContext';
import * as orderService from '@/modules/orders/services/orderService';
import type { Order, PaginationMeta } from '@mandys/shared';
import { DEFAULT_PAGINATION, type ListQueryOptions } from '@/shared/api/pagination';

interface UseOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  pagination: PaginationMeta;
  summary: orderService.OrdersSummary;
  fetchOrders: (options?: ListQueryOptions) => Promise<void>;
  approveOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
  deleteOrder: (orderId: string, motivo: string) => Promise<void>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  clearMessages: () => void;
}

export function useOrders(): UseOrdersReturn {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [summary, setSummary] = useState<orderService.OrdersSummary>({
    allItems: 0,
    pendingItems: 0,
    confirmedItems: 0,
    cancelledItems: 0,
  });
  const lastFetchOptions = useRef<ListQueryOptions>({ page: 1, limit: 10 });

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const fetchOrders = useCallback(async (options?: ListQueryOptions) => {
    if (!token) return;
    lastFetchOptions.current = { ...lastFetchOptions.current, ...(options ?? {}) };
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getAllOrders(token, lastFetchOptions.current);
      setOrders(data.items);
      setPagination(data.pagination);
      setSummary(data.summary ?? {
        allItems: data.pagination.totalItems,
        pendingItems: 0,
        confirmedItems: 0,
        cancelledItems: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const approveOrder = useCallback(async (orderId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      await orderService.approveOrder(orderId, token);
      showSuccess('Orden aprobada correctamente.');
      await fetchOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, fetchOrders, showSuccess]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      await orderService.updateOrderStatus(orderId, newStatus, token);
      showSuccess('Estado actualizado correctamente.');
      await fetchOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, fetchOrders, showSuccess]);

  const deleteOrder = useCallback(async (orderId: string, motivo: string) => {
    if (!token) return;
    try {
      await orderService.deleteOrder(orderId, motivo, token);
      await fetchOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [token, fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    successMessage,
    pagination,
    summary,
    fetchOrders,
    approveOrder,
    updateOrderStatus,
    deleteOrder,
    setOrders,
    clearMessages,
  };
}

/**
 * Hook de dominio — Órdenes
 *
 * Encapsula estado + lógica de red para gestión de pedidos.
 * Obtiene el token de AuthContext internamente.
 * Los componentes de UI solo consumen datos y llaman métodos.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthContext';
import * as orderService from '@/services/api/orderService';
import type { Order } from '@mandys/shared';

interface UseOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchOrders: () => Promise<void>;
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

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getAllOrders(token);
      setOrders(data);
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
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [token]);

  return {
    orders,
    isLoading,
    error,
    successMessage,
    fetchOrders,
    approveOrder,
    updateOrderStatus,
    deleteOrder,
    setOrders,
    clearMessages,
  };
}

/**
 * OrdersTab - Feature Component (Orquestador)
 *
 * Compone los sub-componentes extraídos de la vista de órdenes.
 * Responsabilidades:
 * - Estado local de UI (filtro, búsqueda, paginación, expanded row)
 * - Handlers de negocio (aprobar, eliminar)
 * - Inicialización de datos (useOrders) y realtime (useRealtimeOrders)
 *
 * Sin renderizado directo de tablas, filas ni filtros.
 * Todo delegado a: OrdersFilterBar, OrdersTable, OrdersPagination.
 */

import { SectionCard } from '@mandys/ui';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Store, RotateCw } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useOrders } from '@/modules/orders/hooks/useOrders';
import { useRealtimeOrders } from '@/modules/orders/hooks/useRealtimeOrders';
import type { Order } from '@mandys/shared';
import { OrdersFilterBar } from './OrdersFilterBar';
import { OrdersTable } from './OrdersTable';
import { OrdersPagination } from './OrdersPagination';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const ExcelReport = React.lazy(() => import('@/features/reports/ExcelReport'));

export type OrderFilterStatus = 'TODOS' | 'PENDIENTES' | 'CONFIRMADAS' | 'ANULADAS';

const ITEMS_PER_PAGE = 10;

interface OrdersTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { orders, isLoading, pagination, summary, fetchOrders, approveOrder, deleteOrder } = useOrders();

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderFilterStatus>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const ordersTopRef = useRef<HTMLDivElement>(null);
  const hasMountedPageRef = useRef(false);

  const loadOrders = useCallback(() => {
    return fetchOrders({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      q: debouncedSearchQuery,
      filter: orderFilter,
    });
  }, [currentPage, debouncedSearchQuery, fetchOrders, orderFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!hasMountedPageRef.current) {
      hasMountedPageRef.current = true;
      return;
    }

    window.requestAnimationFrame(() => {
      ordersTopRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  }, [currentPage]);

  useRealtimeOrders({
    onOrderChange: loadOrders,
    enabled: true,
  });

  const currentOrders = orders;
  const orderTotalPages = pagination.totalPages;

  const handleApproveOrder = async (orderId: string) => {
    if (!window.confirm('¿Confirma que verificó el pago SINPE por WhatsApp y desea aprobar la orden?')) return;

    try {
      await approveOrder(orderId);
      onSuccess('Orden aprobada correctamente.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    const isVentas = user?.role === 'VENTAS';

    if (isVentas && order.estado === 'COMPLETADO') {
      alert('Seguridad: El rol VENTAS no puede eliminar pedidos completados.');
      return;
    }

    const confirmMsg = isVentas
      ? `¿Seguro que desea eliminar el pedido ${order.consecutivo_anual}? Se requiere un motivo obligatorio.`
      : `¿Seguro que desea eliminar el pedido ${order.consecutivo_anual}? Esta acción quedará registrada.`;

    if (!window.confirm(confirmMsg)) return;

    const motivo = window.prompt(
      isVentas ? 'Ingrese el motivo de la eliminación (mínimo 5 caracteres):' : 'Motivo de eliminación (opcional):'
    );

    if (isVentas && (!motivo || motivo.trim().length < 5)) {
      alert('Cancelado: El motivo es obligatorio para el rol VENTAS.');
      return;
    }

    try {
      await deleteOrder(order.id, motivo || 'Eliminación administrativa');
      onSuccess(`Pedido ${order.consecutivo_anual} eliminado.`);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleFilterChange = (filter: OrderFilterStatus) => {
    setOrderFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <SectionCard
      title={
        <>
          <Store className="h-5 w-5 text-primary" /> Historial de órdenes
        </>
      }
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-zinc-200 bg-white text-zinc-500 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:border-zinc-300 hover:text-zinc-900"
            title="Refrescar"
          >
            <RotateCw className={`h-5 w-5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
          <React.Suspense fallback={<div className="h-11 w-36 animate-pulse rounded-[16px] bg-zinc-100" />}>
            <ExcelReport orders={orders} />
          </React.Suspense>
        </div>
      }
    >
      <div ref={ordersTopRef} className="scroll-mt-24" data-admin-orders-top="true">
        <div className="border-b border-zinc-100 bg-zinc-50/50 p-6">
          <OrdersFilterBar
            orders={orders}
            counts={{
              TODOS: summary.allItems,
              PENDIENTES: summary.pendingItems,
              CONFIRMADAS: summary.confirmedItems,
              ANULADAS: summary.cancelledItems,
            }}
            orderFilter={orderFilter}
            searchQuery={searchQuery}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
          />
        </div>

        <OrdersTable
          orders={currentOrders}
          isLoading={isLoading}
          expandedOrderId={expandedOrderId}
          userRole={user?.role || ''}
          onToggleExpand={handleToggleExpand}
          onApproveOrder={handleApproveOrder}
          onDeleteOrder={handleDeleteOrder}
          onSuccess={onSuccess}
        />
      </div>

      <OrdersPagination
        currentPage={currentPage}
        totalPages={orderTotalPages}
        onPageChange={setCurrentPage}
      />
    </SectionCard>
  );
};

export default OrdersTab;

import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, Trash2, Download } from 'lucide-react';
import type { Order } from '@mandys/shared';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderRowExpanded } from './OrderRowExpanded';

const PDFDownloadButton = React.lazy(() => import('@/features/reports/PDFDownloadButton'));

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  expandedOrderId: string | null;
  userRole: string;
  onToggleExpand: (orderId: string) => void;
  onApproveOrder: (orderId: string) => void;
  onDeleteOrder: (order: Order) => void;
  onSuccess: (message: string) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = React.memo(({
  orders,
  isLoading,
  expandedOrderId,
  userRole,
  onToggleExpand,
  onApproveOrder,
  onDeleteOrder,
  onSuccess,
}) => {
  const canDeleteOrders = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'VENTAS';

  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full whitespace-nowrap text-left text-sm">
        <thead className="bg-zinc-50/80 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
          <tr>
            <th className="px-6 py-4">Consecutivo</th>
            <th className="px-6 py-4">Fecha</th>
            <th className="px-6 py-4">Cliente</th>
            <th className="px-6 py-4 text-right">Total</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {orders.length === 0 && !isLoading && (
            <tr>
              <td colSpan={6} className="px-6 py-14 text-center text-zinc-500">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                    <Download className="h-5 w-5" />
                  </div>
                  <p className="font-semibold">No se encontraron órdenes.</p>
                </div>
              </td>
            </tr>
          )}
          {orders.map((o) => (
            <React.Fragment key={o.id}>
              <tr
                onClick={() => onToggleExpand(o.id)}
                className={`cursor-pointer transition-colors hover:bg-zinc-50 ${
                  expandedOrderId === o.id ? 'bg-zinc-50' : ''
                }`}
              >
                <td className="px-6 py-4 font-mono text-xs font-bold text-black">{o.consecutivo_anual}</td>
                <td className="px-6 py-4 text-zinc-500">{format(new Date(o.fecha), 'dd/MM/yy HH:mm')}</td>
                <td className="px-6 py-4 leading-tight">
                  <div className="flex flex-col">
                    <span className="line-clamp-1 font-semibold text-zinc-900">
                      {o.user?.nombre || 'Cajero local'}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-400">
                      {o.user?.correo || 'Venta presencial'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-black text-black">₡{o.total.toLocaleString('es-CR')}</td>
                <td className="px-6 py-4">
                  <OrderStatusBadge estado={o.estado} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <React.Suspense fallback={<Download className="h-5 w-5 text-zinc-200" />}>
                      <PDFDownloadButton order={o} onComplete={(msg) => onSuccess(msg)} />
                    </React.Suspense>
                    {o.estado === 'PENDIENTE_VERIFICACION' && (
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          onApproveOrder(o.id);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                        title="Verificar pago SINPE"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    {canDeleteOrders && (
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          onDeleteOrder(o);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-zinc-200 bg-white text-zinc-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              {expandedOrderId === o.id && <OrderRowExpanded order={o} />}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
});

OrdersTable.displayName = 'OrdersTable';

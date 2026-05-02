/**
 * OrderRowExpanded — Sub-componente visual
 *
 * Fila expandible que muestra los items del pedido y su historial de logs contables.
 * Sin lógica de negocio — solo presentación de datos.
 */

import React from 'react';
import { format } from 'date-fns';
import type { Order } from '@mandys/shared';

interface OrderRowExpandedProps {
  order: Order;
}

const pickDetailValue = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
};

const extractDetailMatch = (details: string, keys: string[], pattern: 'string' | 'number') => {
  for (const key of keys) {
    const regex =
      pattern === 'number'
        ? new RegExp(`"${key}"\\s*:\\s*(\\d+)`, 'i')
        : new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i');
    const match = details.match(regex);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
};

const formatLogDetails = (details?: string) => {
  if (!details) return null;

  const trimmedDetails = details.trim();
  const detailParts: string[] = [];
  let parsedDetails: Record<string, unknown> | null = null;

  try {
    parsedDetails = JSON.parse(trimmedDetails) as Record<string, unknown>;
  } catch {
    parsedDetails = null;
  }

  const itemsCount =
    pickDetailValue(parsedDetails ?? {}, ['items_count', 'itemsCount', 'cantidad_items']) ??
    extractDetailMatch(trimmedDetails, ['items_count', 'itemsCount', 'cantidad_items'], 'number');
  const pickupTime =
    pickDetailValue(parsedDetails ?? {}, ['pickupTime', 'pickup_time', 'retiro']) ??
    extractDetailMatch(trimmedDetails, ['pickupTime', 'pickup_time', 'retiro'], 'string');
  const sequence =
    pickDetailValue(parsedDetails ?? {}, ['sequence', 'secuencia', 'consecutivo']) ??
    extractDetailMatch(trimmedDetails, ['sequence', 'secuencia', 'consecutivo'], 'string');

  if (itemsCount) {
    const itemLabel = Number(itemsCount) === 1 ? 'item' : 'items';
    detailParts.push(`${itemsCount} ${itemLabel}`);
  }

  if (typeof pickupTime === 'string') {
    const pickupDate = new Date(pickupTime);
    if (!Number.isNaN(pickupDate.getTime())) {
      detailParts.push(`Retiro: ${format(pickupDate, 'dd/MM/yyyy HH:mm')}`);
    }
  }

  if (typeof sequence === 'string') {
    detailParts.push(`Secuencia: ${sequence}`);
  }

  if (detailParts.length > 0) {
    return detailParts.join(' · ');
  }

  // Evita mostrar JSON técnico crudo al usuario final.
  if (parsedDetails) {
    return null;
  }

  return trimmedDetails;
};

export const OrderRowExpanded: React.FC<OrderRowExpandedProps> = React.memo(({ order }) => {
  return (
    <tr className="bg-zinc-50/80 animate-in fade-in slide-in-from-top-1 duration-200">
      <td colSpan={6} className="px-8 py-6 border-zinc-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Items del Pedido */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b pb-2">Items del Pedido</h4>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-700">{item.cantidad}x {item.product.nombre}</span>
                  <span className="font-mono text-zinc-500">
                    ₡{item.total_linea?.toLocaleString('es-CR') || (item.precio_sin_iva * 1.13 * item.cantidad).toLocaleString('es-CR')}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between font-black text-sm">
                <span>TOTAL</span>
                <span className="text-primary">₡{order.total.toLocaleString('es-CR')}</span>
              </div>
            </div>
          </div>

          {/* Historial de Logs */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b pb-2">Historial de Movimientos (Logs)</h4>
            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
              {order.accounting_logs && order.accounting_logs.length > 0 ? (
                [...order.accounting_logs]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((log) => {
                    const readableDetails = formatLogDetails(log.details);

                    return (
                      <div key={log.id} className="relative pl-6">
                        <div className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-300 border-2 border-white" />
                        <p className="text-[11px] font-bold text-zinc-800 uppercase tracking-tight">
                          {log.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {format(new Date(log.created_at), 'dd MMM, HH:mm:ss')}
                        </p>
                        {readableDetails && (
                          <p className="text-[9px] text-zinc-500 mt-0.5 italic max-w-xs">{readableDetails}</p>
                        )}
                      </div>
                    );
                  })
              ) : (
                <p className="text-[10px] text-zinc-400 pl-6 italic">No se encontraron logs contables registrados.</p>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
});

OrderRowExpanded.displayName = 'OrderRowExpanded';

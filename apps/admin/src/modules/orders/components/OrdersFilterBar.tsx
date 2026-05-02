import React from 'react';
import { Search, X, Filter, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { Order } from '@mandys/shared';
import type { OrderFilterStatus } from './OrdersTab';

interface OrdersFilterBarProps {
  orders: Order[];
  counts?: Record<OrderFilterStatus, number>;
  orderFilter: OrderFilterStatus;
  searchQuery: string;
  onFilterChange: (filter: OrderFilterStatus) => void;
  onSearchChange: (query: string) => void;
}

const FILTER_DEFINITIONS = [
  { id: 'TODOS' as const, label: 'Todas', icon: Filter, color: 'zinc' as const, states: [] as string[] },
  { id: 'PENDIENTES' as const, label: 'Pendientes', icon: Clock, color: 'amber' as const, states: ['PENDIENTE', 'PENDIENTE_VERIFICACION'] },
  { id: 'CONFIRMADAS' as const, label: 'Confirmadas', icon: CheckCircle2, color: 'emerald' as const, states: ['PAGADO', 'EN_PREPARACION', 'COMPLETADO'] },
  { id: 'ANULADAS' as const, label: 'Anuladas', icon: XCircle, color: 'rose' as const, states: ['CANCELADO', 'ERROR'] },
] as const;

const COLOR_CLASSES = {
  zinc: {
    active: 'border-zinc-950 bg-zinc-950 text-white shadow-[0_16px_32px_rgba(24,24,27,0.18)]',
    inactive: 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
  },
  amber: {
    active: 'border-amber-200 bg-amber-50 text-amber-900 shadow-[0_14px_26px_rgba(245,158,11,0.14)]',
    inactive: 'border-amber-200/80 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50/80',
  },
  emerald: {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-[0_14px_26px_rgba(16,185,129,0.14)]',
    inactive: 'border-emerald-200/80 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/80',
  },
  rose: {
    active: 'border-rose-200 bg-rose-50 text-rose-900 shadow-[0_14px_26px_rgba(244,63,94,0.14)]',
    inactive: 'border-rose-200/80 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50/80',
  },
};

export const OrdersFilterBar: React.FC<OrdersFilterBarProps> = React.memo(({
  orders,
  counts,
  orderFilter,
  searchQuery,
  onFilterChange,
  onSearchChange,
}) => {
  return (
    <div className="grid gap-3 rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
      <div className="min-w-0">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {FILTER_DEFINITIONS.map((filterOption) => {
            const isActive = orderFilter === filterOption.id;
            const count = counts?.[filterOption.id] ?? (filterOption.id === 'TODOS'
              ? orders.length
              : orders.filter((order) => (filterOption.states as readonly string[]).includes(order.estado)).length);

            const colorClass = isActive
              ? COLOR_CLASSES[filterOption.color].active
              : COLOR_CLASSES[filterOption.color].inactive;

            return (
              <button
                key={filterOption.id}
                type="button"
                onClick={() => onFilterChange(filterOption.id)}
                className={`group relative flex min-h-[48px] items-center gap-2.5 rounded-[17px] border px-3 py-2.5 text-sm font-black transition-all duration-200 active:scale-[0.98] ${colorClass}`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                    isActive
                      ? filterOption.color === 'zinc'
                        ? 'bg-white/12 text-white'
                        : 'bg-white text-current shadow-[0_8px_18px_rgba(15,23,42,0.08)]'
                      : 'bg-zinc-100 text-current'
                  }`}
                >
                  <filterOption.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 truncate">{filterOption.label}</span>
                <span
                  className={`ml-auto flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                    isActive
                      ? filterOption.color === 'zinc'
                        ? 'bg-white/14 text-white'
                        : 'bg-white text-current shadow-[0_6px_18px_rgba(15,23,42,0.08)]'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative w-full group/search">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-4 w-4 text-zinc-400 transition-colors group-focus-within/search:text-zinc-700" />
        </div>
        <input
          type="text"
          placeholder="Buscar por ID o cliente..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="block min-h-[48px] w-full rounded-[17px] border border-zinc-200 bg-white py-3 pl-11 pr-10 text-sm font-semibold text-zinc-700 placeholder:text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />
        {searchQuery ? (
          <button type="button" onClick={() => onSearchChange('')} className="absolute inset-y-0 right-0 flex items-center pr-3">
            <X className="h-4 w-4 text-zinc-400 transition-colors hover:text-red-500" />
          </button>
        ) : null}
      </div>
    </div>
  );
});

OrdersFilterBar.displayName = 'OrdersFilterBar';

import React from 'react';

interface OrderStatusBadgeProps {
  estado: string;
}

const STATUS_MAP: Record<
  string,
  { label: string; className: string; dotClassName: string }
> = {
  COMPLETADO: {
    label: 'Completado',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    dotClassName: 'bg-emerald-500',
  },
  PAGADO: {
    label: 'Pagado',
    className: 'border-sky-200 bg-sky-50 text-sky-800',
    dotClassName: 'bg-sky-500',
  },
  EN_PREPARACION: {
    label: 'En preparación',
    className: 'border-orange-200 bg-orange-50 text-orange-800',
    dotClassName: 'bg-orange-500',
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
    dotClassName: 'bg-rose-500',
  },
  ERROR: {
    label: 'Error',
    className: 'border-zinc-200 bg-zinc-100 text-zinc-700',
    dotClassName: 'bg-zinc-500',
  },
  PENDIENTE_VERIFICACION: {
    label: 'Pendiente de verificación',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    dotClassName: 'bg-amber-500',
  },
  PENDIENTE: {
    label: 'Pendiente',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    dotClassName: 'bg-amber-500',
  },
};

const DEFAULT_STATUS = {
  label: 'Pendiente',
  className: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  dotClassName: 'bg-cyan-500',
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = React.memo(({ estado }) => {
  const status = STATUS_MAP[estado] || {
    ...DEFAULT_STATUS,
    label: estado ? estado.replace(/_/g, ' ') : DEFAULT_STATUS.label,
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-[0.02em] shadow-[0_10px_22px_rgba(15,23,42,0.04)] ${status.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${status.dotClassName}`} />
      {status.label}
    </span>
  );
});

OrderStatusBadge.displayName = 'OrderStatusBadge';

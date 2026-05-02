export const ORDER_STATUS_VALUES = [
  'PENDIENTE',
  'PENDIENTE_VERIFICACION',
  'PAGADO',
  'EN_PREPARACION',
  'COMPLETADO',
  'CANCELADO',
  'ERROR',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATE_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDIENTE: ['PENDIENTE_VERIFICACION', 'CANCELADO', 'ERROR'],
  PENDIENTE_VERIFICACION: ['PAGADO', 'CANCELADO', 'ERROR'],
  PAGADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['COMPLETADO', 'CANCELADO'],
  ERROR: ['PENDIENTE_VERIFICACION', 'CANCELADO'],
  COMPLETADO: [],
  CANCELADO: [],
};

export const canTransitionOrderStatus = (currentStatus: string, nextStatus: string) => {
  if (currentStatus === nextStatus) return true;
  if (!ORDER_STATUS_VALUES.includes(currentStatus as OrderStatusValue)) return false;
  if (!ORDER_STATUS_VALUES.includes(nextStatus as OrderStatusValue)) return false;
  return ORDER_STATE_TRANSITIONS[currentStatus as OrderStatusValue].includes(nextStatus as OrderStatusValue);
};

/**
 * Tipos compartidos del dominio — Mandy's Bar
 *
 * Fuente de verdad para interfaces que usan servicios, hooks y features.
 * Principio: Inmutabilidad por Defecto — los datos se representan como
 * estructuras de solo lectura hasta que se confirme una mutación explícita.
 */

// ─── Enumeraciones de dominio ──────────────────────────────────

export type OrderStatus =
  | 'PENDIENTE'
  | 'PENDIENTE_VERIFICACION'
  | 'PAGADO'
  | 'EN_PREPARACION'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'ERROR';

export type UserRole = 'ADMIN' | 'MANAGER' | 'VENTAS' | 'USER';

export type ReservationStatus = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';

// ─── Entidades ─────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  cantidad: number;
  precio_sin_iva: number;
  iva_linea: number;
  total_linea: number;
  product: {
    nombre: string;
    categoria: string;
  };
}

export interface AccountingLog {
  id: string;
  action: string;
  total: number;
  details?: string;
  created_at: string;
}

export interface Order {
  id: string;
  consecutivo_anual: string;
  fecha: string;
  subtotal_sin_iva: number;
  iva: number;
  total: number;
  estado: OrderStatus;
  pickup_time?: string;
  notas?: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  user?: {
    nombre: string;
    correo: string;
    telefono?: string;
  };
  items: OrderItem[];
  accounting_logs: AccountingLog[];
}

export interface Product {
  id: string;
  nombre: string;
  precio_con_iva: number;
  categoria: string;
  imagen_url: string | null;
  activo: boolean;
}

export interface Reservation {
  id: string;
  consecutivo_reserva?: number;
  nombre: string;
  correo: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_evento: string;
  comensales: number;
  detalles: string;
  estado: ReservationStatus;
  created_at: string;
  // Datos de pago (se llenan al confirmar)
  codigo_referencia?: string;
  monto_deposito?: number;
  medio_pago?: string;
  tipo_pago?: string;
  observacion_pago?: string;
  confirmado_por?: string;
  confirmado_por_rol?: string;
  fecha_confirmacion?: string;
  // Datos de anulación (se llenan al anular)
  motivo_anulacion?: string;
  imagen_anulacion?: string;
  anulado_por?: string;
  anulado_por_rol?: string;
  fecha_anulacion?: string;
}

export interface AppUser {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  role: UserRole;
  puesto?: string;
  created_at: string;
}

// ─── DTOs (Data Transfer Objects) ──────────────────────────────

export interface CreateOrderPayload {
  items: Array<{ id: string; quantity: number }>;
  pickup_time?: string;
  notas?: string;
}

export interface UpdateProductPayload {
  nombre?: string;
  precio_con_iva?: number;
  imagen_url?: string | null;
  activo?: boolean;
}

export interface ConfirmReservationPayload {
  codigo_referencia: string;
  monto_deposito: number;
  medio_pago: string;
  tipo_pago: string;
  observacion_pago?: string;
  confirmado_por: string;
  confirmado_por_rol: string;
}

export interface CreateStaffPayload {
  nombre: string;
  correo: string;
  telefono: string;
  password: string;
  role: Exclude<UserRole, 'USER'>;
  puesto: string;
}

export interface AuthCredentials {
  correo: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    nombre: string;
    correo: string;
    role: UserRole;
  };
}

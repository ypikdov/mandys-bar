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

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  details?: string;
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
  descripcion?: string | null;
  precio_con_iva: number;
  categoria: string;
  imagen_url: string | null;
  destacado?: boolean;
  activo: boolean;
  created_at?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
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

export interface CreateProductPayload {
  nombre: string;
  descripcion?: string | null;
  precio_con_iva: number;
  categoria: string;
  destacado?: boolean;
  imagen_url?: string | null;
}

export interface UpdateProductPayload {
  nombre?: string;
  descripcion?: string | null;
  precio_con_iva?: number;
  categoria?: string;
  imagen_url?: string | null;
  destacado?: boolean;
  activo?: boolean;
}

export interface NavbarDropdownLink {
  label: string;
  path: string;
}

export interface NavbarLink {
  label: string;
  path: string;
  dropdown?: NavbarDropdownLink[];
}

export interface AboutContent {
  historyTitle: string;
  historyParagraphs: string[];
  valuesTitleA: string;
  valuesBodyA: string;
  valuesTitleB: string;
  valuesBodyB: string;
  videoUrl: string;
}

export interface SiteTeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  description: string;
}

export interface SiteFaqItem {
  question: string;
  answer: string;
}

export interface SiteFaqCategory {
  title: string;
  items: SiteFaqItem[];
}

export interface ContactContent {
  title: string;
  hours: string[];
  closedDayLabel: string;
  address: string;
  phone: string;
  instagramUrl: string;
  facebookUrl: string;
}

export type SiteEventKind = 'PUBLIC_PROGRAM' | 'PRIVATE_TEMPLATE';

export interface SiteEvent {
  id: string;
  slug: string;
  kind: SiteEventKind;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  day_label?: string | null;
  display_date?: string | null;
  start_time?: string | null;
  image_url?: string | null;
  price?: number | null;
  order_index: number;
  active: boolean;
}

export interface GalleryContentItem {
  id: string;
  title: string;
  alt_text: string;
  category: string;
  image_url: string;
  rotation?: number | null;
  aspect?: string | null;
  object_position?: string | null;
  order_index: number;
  active: boolean;
}

export interface EventsPageContent {
  publicTag: string;
  publicTitle: string;
  publicDescription: string;
  privateTag: string;
  privateTitle: string;
  privateDescription: string;
  privateButtonLabel: string;
}

export interface GalleryPageContent {
  heroTag: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  ctaTitle: string;
  ctaButtonLabel: string;
}

export interface PublicSiteContent {
  navbarLinks: NavbarLink[];
  about: AboutContent;
  teamMembers: SiteTeamMember[];
  faqCategories: SiteFaqCategory[];
  contact: ContactContent;
  eventsPage: EventsPageContent;
  galleryPage: GalleryPageContent;
  publicEvents: SiteEvent[];
  privateEventTemplates: SiteEvent[];
  galleryItems: GalleryContentItem[];
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

export interface CreateClientPayload {
  nombre: string;
  correo: string;
  telefono: string;
  password: string;
  tipo_documento?: string | null;
  num_documento?: string | null;
  provincia?: string | null;
  canton?: string | null;
  distrito?: string | null;
  fecha_nac?: string | null;
  genero?: string | null;
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
    telefono?: string | null;
    role: UserRole;
    genero?: string | null;
    fecha_nac?: string | null;
    tipo_documento?: string | null;
    num_documento?: string | null;
    provincia?: string | null;
    canton?: string | null;
    distrito?: string | null;
    foto_perfil?: string | null;
  };
}

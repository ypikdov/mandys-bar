/**
 * Constantes del dominio de reservaciones.
 *
 * Mapeo de tipos de evento → etiquetas y precios.
 * Compartido entre ReservationsTab y sus sub-componentes.
 */

export const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: 'Cumpleaños',
  party: 'Fiesta',
  corporate: 'Corporativo',
  wedding: 'Boda',
  other: 'Otro',
};

export const EVENT_PRICES: Record<string, number> = {
  birthday: 45000,
  party: 35000,
  corporate: 75000,
  wedding: 120000,
  other: 30000,
};

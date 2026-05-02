/**
 * ReservationsTab — Feature Component (Orquestador)
 *
 * Compone los sub-componentes de la vista de reservaciones.
 * Responsabilidades:
 * - Estado local de UI (búsqueda, paginación, modal visibility)
 * - Inicialización de datos (useReservations)
 * - Delegación de rendering a sub-componentes
 *
 * Modales delegados a: ReservationConfirmModal, ReservationCancelModal.
 * Paginación reutilizada de: OrdersPagination.
 */

import { DataTableShell } from '@mandys/ui';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Trash2, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useReservations } from '@/modules/reservations/hooks/useReservations';
import type { Reservation } from '@mandys/shared';
import { EVENT_TYPE_LABELS, EVENT_PRICES } from '../reservationConstants';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';


// Sub-componentes
import { ReservationConfirmModal } from './ReservationConfirmModal';
import { ReservationCancelModal } from './ReservationCancelModal';

const ReservationPDFButtonLazy = React.lazy(
  () => import('../ReservationPDFDocument').then((m) => ({ default: m.ReservationPDFButton }))
);

const ITEMS_PER_PAGE = 10;

interface ReservationsTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const ReservationsTab: React.FC<ReservationsTabProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const {
    reservations,
    isLoading,
    pagination,
    fetchReservations,
    confirmReservation,
    cancelReservation,
  } = useReservations();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Modal state
  const [confirmingReservation, setConfirmingReservation] = useState<Reservation | null>(null);
  const [cancellingReservation, setCancellingReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    fetchReservations({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      q: debouncedSearchQuery,
    });
  }, [currentPage, debouncedSearchQuery, fetchReservations]);

  const currentReservations = reservations;
  const reservationTotalPages = pagination.totalPages;

  const columns = [
    { header: 'Cliente', cell: (r: any) => (
      <>
        <p className="font-semibold text-black">{r.nombre}</p>
        <p className="text-xs text-zinc-400">{r.correo}</p>
      </>
    )},
    { header: 'Fecha', cell: (r: any) => <span className="text-zinc-700 font-medium">{r.fecha ? format(new Date(r.fecha), 'dd/MM/yyyy') : '—'}</span> },
    { header: 'Horario', cell: (r: any) => <span className="text-zinc-600">{r.hora_inicio} — {r.hora_fin}</span> },
    { header: 'Tipo', cell: (r: any) => (
      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700 uppercase tracking-wide">
        {EVENT_TYPE_LABELS[r.tipo_evento] || r.tipo_evento}
      </span>
    )},
    { header: 'Precio', align: 'right' as const, cell: (r: any) => <span className="font-bold text-black">₡{(EVENT_PRICES[r.tipo_evento] || EVENT_PRICES['other']).toLocaleString()}</span> },
    { header: 'Comensales', cell: (r: any) => <span className="font-bold text-black">{r.comensales}</span> },
    { header: 'Estado', cell: (r: any) => (
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
        ${r.estado === 'CONFIRMADA' ? 'bg-green-100 text-green-700' : r.estado === 'CANCELADA' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
        {r.estado}
      </span>
    )},
    { header: 'Acciones', align: 'right' as const, cell: (r: any) => (
      <div className="flex justify-end gap-1">
        {r.estado === 'PENDIENTE' && (
          <>
            <button onClick={() => setConfirmingReservation(r)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-md transition" title="Confirmar Pago">
              <CheckCircle className="w-4 h-4" />
            </button>
            <button onClick={() => setCancellingReservation(r)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-md transition" title="Anular">
              <X className="w-4 h-4" />
            </button>
          </>
        )}
        {r.estado === 'CONFIRMADA' && (
          <button onClick={() => setCancellingReservation(r)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-md transition" title="Anular">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <React.Suspense fallback={<span className="p-1.5 text-zinc-300"><FileText className="w-4 h-4" /></span>}>
          <ReservationPDFButtonLazy
            reservation={r}
            onComplete={(msg) => onSuccess(msg)}
          />
        </React.Suspense>
      </div>
    )},
  ];

  return (
    <>
      <DataTableShell
        title="Reservaciones de Eventos"
        searchPlaceholder="Buscar por nombre o email..."
        searchValue={searchQuery}
        onSearchChange={(value) => { setSearchQuery(value); setCurrentPage(1); }}
        onRefresh={() => fetchReservations({ page: currentPage, limit: ITEMS_PER_PAGE, q: debouncedSearchQuery })}
        isLoading={isLoading}
        data={currentReservations}
        keyExtractor={(r) => r.id}
        columns={columns}
        emptyMessage="No se encontraron reservaciones."
        currentPage={currentPage}
        totalPages={reservationTotalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modales */}
      {confirmingReservation && (
        <ReservationConfirmModal
          reservation={confirmingReservation}
          userName={user?.nombre || 'Sistema'}
          userRole={user?.role || 'ADMIN'}
          onConfirm={confirmReservation}
          onClose={() => setConfirmingReservation(null)}
          onSuccess={onSuccess}
        />
      )}

      {cancellingReservation && (
        <ReservationCancelModal
          reservation={cancellingReservation}
          userName={user?.nombre || 'Sistema'}
          userRole={user?.role || 'ADMIN'}
          onCancel={cancelReservation}
          onClose={() => setCancellingReservation(null)}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
};

export default ReservationsTab;

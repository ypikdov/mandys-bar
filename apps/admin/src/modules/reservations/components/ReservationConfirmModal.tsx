/**
 * ReservationConfirmModal — Sub-componente modal
 *
 * Modal de confirmación de pago de reservación.
 * Recibe la reservación a confirmar y callbacks del padre.
 * Sin lógica de negocio propia — solo formulario y validación de campos obligatorios.
 */

import React, { useState } from 'react';
import type { Reservation } from '@mandys/shared';

interface ConfirmFormState {
  codigo_referencia: string;
  monto_deposito: string;
  medio_pago: string;
  tipo_pago: string;
  observacion_pago: string;
}

interface ReservationConfirmModalProps {
  reservation: Reservation;
  userName: string;
  userRole: string;
  onConfirm: (reservationId: string, payload: {
    codigo_referencia: string;
    monto_deposito: number;
    medio_pago: string;
    tipo_pago: string;
    observacion_pago: string;
    confirmado_por: string;
    confirmado_por_rol: string;
  }) => Promise<void>;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ReservationConfirmModal: React.FC<ReservationConfirmModalProps> = React.memo(({
  reservation,
  userName,
  userRole,
  onConfirm,
  onClose,
  onSuccess,
}) => {
  const [confirmForm, setConfirmForm] = useState<ConfirmFormState>({
    codigo_referencia: '', monto_deposito: '', medio_pago: '', tipo_pago: '', observacion_pago: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const { codigo_referencia, monto_deposito, medio_pago, tipo_pago, observacion_pago } = confirmForm;
    if (!codigo_referencia || !monto_deposito || !medio_pago || !tipo_pago) {
      alert('Todos los campos marcados con * son obligatorios.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm(reservation.id, {
        codigo_referencia,
        monto_deposito: parseFloat(monto_deposito),
        medio_pago,
        tipo_pago,
        observacion_pago,
        confirmado_por: userName,
        confirmado_por_rol: userRole,
      });
      onSuccess('Reservación confirmada exitosamente.');
      onClose();
    } catch {
      alert('Error de red al confirmar la reservación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-green-600 text-white px-6 py-4 rounded-t-2xl">
          <h3 className="text-lg font-bold">✅ Confirmar Reservación</h3>
          <p className="text-green-100 text-sm mt-1">{reservation.nombre} — {reservation.tipo_evento}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Código de Referencia *</label>
            <input type="text" value={confirmForm.codigo_referencia} onChange={(e) => setConfirmForm((prev) => ({ ...prev, codigo_referencia: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Ej: REF-123456" />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Monto del Depósito (₡) *</label>
            <input type="number" value={confirmForm.monto_deposito} onChange={(e) => setConfirmForm((prev) => ({ ...prev, monto_deposito: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Ej: 45000" min="0" />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Medio de Pago *</label>
            <select aria-label="Medio de Pago" value={confirmForm.medio_pago} onChange={(e) => setConfirmForm((prev) => ({ ...prev, medio_pago: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500">
              <option value="">Seleccionar...</option>
              <option value="SINPE_MOVIL">SINPE Móvil</option>
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Tipo de Pago *</label>
            <select aria-label="Tipo de Pago" value={confirmForm.tipo_pago} onChange={(e) => setConfirmForm((prev) => ({ ...prev, tipo_pago: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500">
              <option value="">Seleccionar...</option>
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Observación</label>
            <textarea value={confirmForm.observacion_pago} onChange={(e) => setConfirmForm((prev) => ({ ...prev, observacion_pago: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none" rows={2} placeholder="Observaciones adicionales (opcional)" />
          </div>
          <div className="bg-zinc-50 rounded-lg p-3 text-xs text-zinc-500">
            <strong>Registrado por:</strong> {userName} ({userRole})
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition">Cancelar</button>
          <button onClick={handleSubmit}
            disabled={isSubmitting || !confirmForm.codigo_referencia || !confirmForm.monto_deposito || !confirmForm.medio_pago || !confirmForm.tipo_pago}
            className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold">
            {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
});

ReservationConfirmModal.displayName = 'ReservationConfirmModal';

/**
 * ReservationCancelModal — Sub-componente modal
 *
 * Modal de anulación de reservación con motivo obligatorio e imagen opcional.
 * Sin lógica de negocio propia — solo formulario, validación y callback al padre.
 */

import React, { useState } from 'react';
import type { Reservation } from '@mandys/shared';

interface ReservationCancelModalProps {
  reservation: Reservation;
  userName: string;
  userRole: string;
  onCancel: (reservationId: string, motivo: string, cancelImage: File | null) => Promise<void>;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ReservationCancelModal: React.FC<ReservationCancelModalProps> = React.memo(({
  reservation,
  userName,
  userRole,
  onCancel,
  onClose,
  onSuccess,
}) => {
  const [motivo, setMotivo] = useState('');
  const [cancelImage, setCancelImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      alert('El motivo de anulación es obligatorio.');
      return;
    }
    if (cancelImage) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(cancelImage.type)) { alert('Solo se permiten imágenes (JPEG, PNG, WebP, GIF).'); return; }
      if (cancelImage.size > 5 * 1024 * 1024) { alert('La imagen no debe superar 5MB.'); return; }
    }
    setIsSubmitting(true);
    try {
      await onCancel(reservation.id, motivo.trim(), cancelImage);
      onSuccess('Reservación anulada exitosamente.');
      onClose();
    } catch {
      alert('Error de red al anular la reservación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-2xl">
          <h3 className="text-lg font-bold">⚠️ Anular Reservación</h3>
          <p className="text-red-100 text-sm mt-1">{reservation.nombre} — {reservation.tipo_evento}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Motivo de Anulación *</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none" rows={3} placeholder="Describe el motivo de la anulación..." />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Adjuntar Imagen (opcional)</label>
            <p className="text-xs text-zinc-400 mb-2">Solo imágenes (JPEG, PNG, WebP, GIF). Máximo 5MB.</p>
            <input type="file" aria-label="Adjuntar Imagen (opcional)" accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && file.size > 5 * 1024 * 1024) { alert('La imagen no debe superar 5MB.'); e.target.value = ''; return; }
                setCancelImage(file);
              }}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-1 file:text-red-600 file:font-medium file:text-xs"
            />
            {cancelImage && <p className="text-xs text-green-600 mt-1">📎 {cancelImage.name} ({(cancelImage.size / 1024).toFixed(0)} KB)</p>}
          </div>
          <div className="bg-zinc-50 rounded-lg p-3 text-xs text-zinc-500">
            <strong>Anulado por:</strong> {userName} ({userRole})
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition">Cancelar</button>
          <button onClick={handleSubmit}
            disabled={isSubmitting || !motivo.trim()}
            className="px-6 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold">
            {isSubmitting ? 'Procesando...' : 'Anular Reservación'}
          </button>
        </div>
      </div>
    </div>
  );
});

ReservationCancelModal.displayName = 'ReservationCancelModal';

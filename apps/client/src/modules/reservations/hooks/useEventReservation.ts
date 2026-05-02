import { useState, useCallback } from "react";
import { useAuth } from "@/providers/AuthContext";
import { createClientReservation } from "@/modules/reservations/services/reservationService";
import { eventPrices } from "@/data/events";

export function useEventReservation(priceMap?: Record<string, number>) {
  const { token, isAuthenticated, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastReservation, setLastReservation] = useState<any | null>(null);
  const [autoDownloadedReceipt, setAutoDownloadedReceipt] = useState(false);

  const submitReservation = useCallback(async (
    formData: FormData,
    dateString: string,
    startTime: string,
    endTime: string,
    tipoEvento: string,
    onSuccessReset: () => void
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const dataPayload = {
      fecha: dateString,
      hora_inicio: startTime,
      hora_fin: endTime,
      tipo_evento: tipoEvento,
      comensales: formData.get("comensales"),
      detalles: formData.get("detalles")
    };

    try {
      if (!isAuthenticated || !token || !user) {
        throw new Error("Debes iniciar sesion para realizar una reservacion.");
      }

      const result = await createClientReservation(dataPayload, token);

      const reservationData = {
        id: result?.reservation?.id,
        consecutivo_reserva: result?.reservation?.consecutivo_reserva,
        created_at: result?.reservation?.created_at,
        tipo_evento: tipoEvento,
        fecha: dateString,
        hora_inicio: startTime,
        hora_fin: endTime,
        precio: result?.precio_evento || priceMap?.[tipoEvento] || eventPrices[tipoEvento] || 30000,
        nombre: user.nombre,
        correo: user.correo,
        telefono: user.telefono || undefined,
        comensales: parseInt(dataPayload.comensales as string, 10),
        detalles: (dataPayload.detalles as string) || "N/A",
        estado: result?.reservation?.estado || "PENDIENTE"
      };

      let downloaded = false;
      try {
        const { downloadReservationPDF } = await import("@mandys/shared");
        downloadReservationPDF(reservationData);
        downloaded = true;
      } catch (pdfError) {
        console.error("No se pudo descargar automaticamente el comprobante de reservacion:", pdfError);
      }

      setLastReservation(reservationData);
      setAutoDownloadedReceipt(downloaded);
      setShowSuccessModal(true);
      if (onSuccessReset) {
        onSuccessReset();
      }
      return true;
    } catch (error: any) {
      alert(error.message || "Error de conexion con el servidor.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isAuthenticated, token, user, priceMap]);

  const closeSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
  }, []);

  return {
    isSubmitting,
    showSuccessModal,
    lastReservation,
    autoDownloadedReceipt,
    submitReservation,
    closeSuccessModal
  };
}

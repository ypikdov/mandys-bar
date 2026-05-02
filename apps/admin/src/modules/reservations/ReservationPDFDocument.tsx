import React from "react";
import { Download } from "lucide-react";
import { downloadReservationPDF, type ReservationPDFData } from "@mandys/shared";
import { EVENT_PRICES } from "./reservationConstants";

type ReservationData = ReservationPDFData & {
  id: string;
  estado: string;
  created_at: string;
  consecutivo_reserva?: number;
  motivo_anulacion?: string;
  imagen_anulacion?: string;
  anulado_por?: string;
  anulado_por_rol?: string;
  fecha_anulacion?: string;
};

const ReservationPDFButton: React.FC<{ reservation: ReservationData; onComplete?: (msg: string) => void }> = ({
  reservation,
  onComplete,
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateAndDownloadPDF = () => {
    setIsGenerating(true);
    try {
      downloadReservationPDF({
        ...reservation,
        precio: EVENT_PRICES[reservation.tipo_evento] || EVENT_PRICES.other,
        detalles: reservation.detalles || "N/A",
      });
      onComplete?.("Comprobante de reservacion descargado.");
    } catch (error) {
      alert(`Error al generar el PDF: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generateAndDownloadPDF}
      disabled={isGenerating}
      className={`rounded-md p-1.5 transition ${isGenerating ? "text-primary" : "text-zinc-400 hover:text-primary"}`}
      title="Descargar PDF"
    >
      <Download className={`h-4 w-4 ${isGenerating ? "animate-bounce" : ""}`} />
    </button>
  );
};

export { ReservationPDFButton };
export type { ReservationData };

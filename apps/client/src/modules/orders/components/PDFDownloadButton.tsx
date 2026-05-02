import React from 'react';
import { Download } from 'lucide-react';
import { generateInvoicePDF, type InvoiceItem } from '../../../../../../packages/shared/src/utils/invoice';

interface Order {
  id: string;
  consecutivo_anual: string;
  fecha: string;
  subtotal_sin_iva: number;
  iva: number;
  total: number;
  estado?: string;
  notas?: string | null;
  pickup_time?: string | null;
  user?: { nombre: string; correo: string; telefono?: string | null };
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  items: Array<{
    id?: string;
    cantidad: number;
    precio_sin_iva: number;
    total_linea?: number;
    product: { nombre: string; categoria: string };
  }>;
}

const toInvoiceItems = (order: Order): InvoiceItem[] =>
  order.items.map((item, index) => {
    const quantity = Number(item.cantidad) || 1;
    const unitPriceWithVat = item.total_linea
      ? item.total_linea / quantity
      : item.precio_sin_iva * 1.13;

    return {
      id: item.id || `${order.id}-${index}`,
      name: item.product.nombre,
      price: unitPriceWithVat,
      quantity,
    };
  });

const PDFDownloadButton: React.FC<{ order: Order; onComplete: (msg: string) => void }> = ({ order, onComplete }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateAndDownloadPDF = () => {
    setIsGenerating(true);
    try {
      generateInvoicePDF(
        order.consecutivo_anual,
        toInvoiceItems(order),
        order.total,
        {
          fullName: order.user?.nombre || order.cliente_nombre || 'Cliente contado',
          email: order.user?.correo || 'N/A',
          phone: order.user?.telefono || order.cliente_telefono || 'N/A',
        },
        order.pickup_time || undefined,
        order.estado,
        order.notas || undefined,
        order.fecha,
      );
      onComplete(`Factura # ${order.consecutivo_anual} descargada.`);
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
      className={`p-2 transition ${isGenerating ? 'text-primary' : 'text-zinc-400 hover:text-primary'}`}
      title="Descargar PDF"
    >
      <Download className={`h-5 w-5 ${isGenerating ? 'animate-bounce' : ''}`} />
    </button>
  );
};

export default PDFDownloadButton;

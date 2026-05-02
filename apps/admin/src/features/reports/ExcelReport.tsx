import React, { useState } from 'react';
import { format } from "date-fns";
import { Download } from "lucide-react";

interface Order {
  id: string;
  consecutivo_anual: string;
  fecha: string;
  subtotal_sin_iva: number;
  iva: number;
  total: number;
  user?: { nombre: string; correo: string };
  items: Array<{
    cantidad: number;
    precio_sin_iva: number;
    product: { nombre: string; categoria: string };
  }>;
}

interface ExcelReportProps {
  orders: Order[];
}

const ExcelReport: React.FC<ExcelReportProps> = ({ orders }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const xlsx = await import("xlsx");
      const exportData = orders.map(o => ({
        Consecutivo: o.consecutivo_anual,
        Fecha: format(new Date(o.fecha), "dd/MM/yyyy HH:mm"),
        Cliente: o.user?.nombre || "N/A",
        Correo: o.user?.correo || "N/A",
        Subtotal_Sin_IVA: o.subtotal_sin_iva,
        Impuesto_Ventas: o.iva,
        Total_Facturado: o.total,
        Cantidad_Items: o.items.reduce((sum, i) => sum + i.cantidad, 0)
      }));
      const ws = xlsx.utils.json_to_sheet(exportData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Ventas_MandyBar");
      xlsx.writeFile(wb, `Reporte_Ventas_${format(new Date(), "yyyyMMdd")}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button 
      onClick={exportToExcel}
      disabled={isExporting}
      aria-busy={isExporting}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-[16px] border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 shadow-[0_12px_28px_rgba(16,185,129,0.1)] transition hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-70"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Download className="h-4 w-4" />
      </span>
      <span className="min-w-[92px] text-left">{isExporting ? "Exportando..." : "Exportar Excel"}</span>
    </button>
  );
};

export default ExcelReport;

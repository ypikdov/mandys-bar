import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MANDYS_FIRE_DATA_URL, MANDYS_LOGO_DATA_URL } from "./pdfBrandAssets";
import { stripPngTextChunks } from "./pngDataUrl";

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface InvoiceCustomer {
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
}

type PdfDoc = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

const BRAND = {
  paper: [255, 252, 248] as const,
  black: [10, 10, 10] as const,
  orange: [255, 79, 15] as const,
  orangeSoft: [255, 241, 235] as const,
  orangeStrong: [233, 56, 24] as const,
  text: [24, 24, 27] as const,
  muted: [82, 82, 91] as const,
  line: [238, 221, 214] as const,
  white: [255, 255, 255] as const,
  success: [34, 139, 67] as const,
  danger: [196, 35, 35] as const,
};

const BUSINESS = {
  name: "Mandy's Bar & Restaurante",
  legalId: "3-101-123456",
  address: "Canas, 450 m norte de Compre Bien",
  contactPhone: "+506 8664-4221",
  email: "geraldvill101@gmail.com",
  sinpePhone: "+506 8666-1940",
  whatsappPhone: "+506 8666-1940",
  paymentTarget: "Mandy's Bar & Restaurante",
};

const MANDYS_FIRE_PDF_DATA_URL = stripPngTextChunks(MANDYS_FIRE_DATA_URL);

const formatCurrency = (value: number) =>
  `CRC ${value.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateOnly = (value?: string | Date | null) => {
  if (!value) return "No definido";
  return format(new Date(value), "dd/MM/yyyy", { locale: es });
};

const formatTimeOnly = (value?: string | Date | null) => {
  if (!value) return "No definido";
  return format(new Date(value), "HH:mm", { locale: es });
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "No definido";
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es });
};

const sanitizeFileToken = (value: string) => value.replace(/[^\w-]+/g, "_");

const toNetAmount = (grossValue: number) => grossValue / 1.13;

const getStatusMeta = (status?: string) => {
  const normalized = (status || "PENDIENTE_VERIFICACION").toUpperCase();

  switch (normalized) {
    case "PAGADO":
      return {
        label: "ESTADO: PAGO VERIFICADO",
        detailLabel: "Pago verificado",
        color: BRAND.success,
        reminder:
          "Conserva este comprobante como respaldo del pedido y validacion interna del pago.",
      };
    case "COMPLETADO":
      return {
        label: "ESTADO: PEDIDO COMPLETADO",
        detailLabel: "Pedido completado",
        color: BRAND.success,
        reminder:
          "Este pedido ya fue entregado. Conserva el comprobante para control interno.",
      };
    case "CANCELADO":
    case "ERROR":
      return {
        label: "ESTADO: PEDIDO ANULADO",
        detailLabel: "Pedido anulado",
        color: BRAND.danger,
        reminder:
          "El pedido fue anulado. Si necesitas asistencia, comunicate con el negocio.",
      };
    case "EN_PREPARACION":
      return {
        label: "ESTADO: EN PREPARACION",
        detailLabel: "En preparacion",
        color: BRAND.orange,
        reminder:
          "Tu pedido ya esta siendo preparado. Mantente atento al retiro programado.",
      };
    default:
      return {
        label: "ESTADO: PENDIENTE DE VERIFICACION (SINPE MOVIL)",
        detailLabel: "Pendiente de verificacion",
        color: BRAND.orangeStrong,
        reminder:
          "Envia este PDF y el screenshot del SINPE por WhatsApp para validar tu pedido.",
      };
  }
};

const drawPageBackground = (doc: jsPDF) => {
  doc.setFillColor(BRAND.paper[0], BRAND.paper[1], BRAND.paper[2]);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
};

const drawFireGraphic = (doc: jsPDF, originX: number, originY: number) => {
  doc.addImage(MANDYS_FIRE_PDF_DATA_URL, "PNG", originX, originY, 33, 33);
};

const drawLogoSeal = (doc: jsPDF, centerX: number, centerY: number) => {
  doc.addImage(MANDYS_LOGO_DATA_URL, "JPEG", centerX - 22, centerY - 22, 44, 44);
};

const drawHeader = (doc: jsPDF, internalCode: string, createdAt: Date) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(BRAND.black[0], BRAND.black[1], BRAND.black[2]);
  doc.rect(0, 0, pageWidth, 78, "F");

  drawFireGraphic(doc, 0, 45);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(BRAND.orange[0], BRAND.orange[1], BRAND.orange[2]);
  doc.text("INTERNO:", 20, 13);
  doc.setFontSize(10);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.text(internalCode, 20, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(BRAND.orange[0], BRAND.orange[1], BRAND.orange[2]);
  doc.text("FECHA:", pageWidth - 18, 13, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.text(formatDateOnly(createdAt), pageWidth - 18, 20, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(BRAND.orange[0], BRAND.orange[1], BRAND.orange[2]);
  doc.text("HORA:", pageWidth - 18, 30, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.text(formatTimeOnly(createdAt), pageWidth - 18, 37, { align: "right" });

  drawLogoSeal(doc, pageWidth / 2, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.setTextColor(BRAND.orange[0], BRAND.orange[1], BRAND.orange[2]);
  doc.text(BUSINESS.name.toUpperCase(), pageWidth / 2, 51, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  [
    `Cedula juridica: ${BUSINESS.legalId}`,
    `Direccion: ${BUSINESS.address}`,
    `Telefono: ${BUSINESS.contactPhone}`,
    `Email: ${BUSINESS.email}`,
  ].forEach((line, index) => {
    doc.text(line, pageWidth / 2, 58 + index * 4.8, { align: "center" });
  });

  doc.setDrawColor(BRAND.orange[0], BRAND.orange[1], BRAND.orange[2]);
  doc.setLineWidth(1.4);
  doc.line(0, 78, pageWidth, 78);
};

const drawReceiptTitle = (doc: jsPDF, title: string, statusText: string, statusColor: readonly number[]) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(BRAND.text[0], BRAND.text[1], BRAND.text[2]);
  doc.text(title, pageWidth / 2, 92, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(statusText, pageWidth / 2, 102, { align: "center" });

  doc.setDrawColor(BRAND.line[0], BRAND.line[1], BRAND.line[2]);
  doc.setLineWidth(0.4);
  doc.line(16, 108, pageWidth - 16, 108);
};

const drawSectionHeader = (doc: jsPDF, y: number, title: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(BRAND.orange[0], BRAND.orange[1], BRAND.orange[2]);
  doc.circle(21, y - 1.5, 4.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BRAND.text[0], BRAND.text[1], BRAND.text[2]);
  doc.text(title, 30, y);
  doc.setDrawColor(BRAND.orange[0], BRAND.orange[1], BRAND.orange[2]);
  doc.setLineWidth(0.4);
  doc.line(30, y + 3, pageWidth - 16, y + 3);
};

const drawFieldColumns = (
  doc: jsPDF,
  startY: number,
  leftFields: Array<{ label: string; value: string }>,
  rightFields: Array<{ label: string; value: string }>,
) => {
  const rows = Math.max(leftFields.length, rightFields.length);
  let currentY = startY;

  for (let index = 0; index < rows; index += 1) {
    const left = leftFields[index];
    const right = rightFields[index];
    let leftLinesLength = 1;
    let rightLinesLength = 1;

    if (left) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(BRAND.text[0], BRAND.text[1], BRAND.text[2]);
      doc.text(`${left.label}:`, 20, currentY);
      doc.setFont("helvetica", "normal");
      const leftLines = doc.splitTextToSize(left.value, 52);
      leftLinesLength = leftLines.length;
      doc.text(leftLines, 47, currentY);
    }

    if (right) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(BRAND.text[0], BRAND.text[1], BRAND.text[2]);
      doc.text(`${right.label}:`, 112, currentY);
      doc.setFont("helvetica", "normal");
      const rightLines = doc.splitTextToSize(right.value, 58);
      rightLinesLength = rightLines.length;
      doc.text(rightLines, 143, currentY);
    }

    currentY += Math.max(leftLinesLength, rightLinesLength) * 4.4 + 3;
  }

  return currentY;
};

const drawWideField = (doc: jsPDF, y: number, label: string, value: string) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(BRAND.text[0], BRAND.text[1], BRAND.text[2]);
  doc.text(`${label}:`, 20, y);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(value, 145);
  doc.text(lines, 47, y);
  return y + lines.length * 4.4;
};

const ensureSpace = (doc: PdfDoc, currentY: number, neededHeight: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (currentY + neededHeight <= pageHeight - 18) {
    return currentY;
  }

  doc.addPage();
  drawPageBackground(doc);
  return 18;
};

export const generateInvoicePDF = (
  invoiceNumber: string,
  items: InvoiceItem[],
  totalWithIVA: number,
  customer?: InvoiceCustomer,
  pickupTime?: string,
  estado?: string,
  notas?: string,
  createdAtValue?: string | Date,
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as PdfDoc;

  const createdAt = createdAtValue ? new Date(createdAtValue) : new Date();
  const statusMeta = getStatusMeta(estado);
  const subtotal = toNetAmount(totalWithIVA);
  const iva = totalWithIVA - subtotal;
  const pageWidth = doc.internal.pageSize.getWidth();

  drawPageBackground(doc);
  drawHeader(doc, invoiceNumber, createdAt);
  drawReceiptTitle(doc, "COMPROBANTE DE PEDIDO", statusMeta.label, statusMeta.color);

  let currentY = 120;
  drawSectionHeader(doc, currentY, "DETALLES DEL CLIENTE");
  currentY += 11;
  currentY = drawFieldColumns(
    doc,
    currentY,
    [
      { label: "Nombre", value: customer?.fullName || "Cliente registrado" },
      { label: "Documento", value: customer?.documentId || "N/A" },
    ],
    [
      { label: "Correo", value: customer?.email || "N/A" },
      { label: "Telefono", value: customer?.phone || "N/A" },
    ],
  );

  currentY += 5;
  drawSectionHeader(doc, currentY, "DETALLES DEL PEDIDO");
  currentY += 11;
  currentY = drawFieldColumns(
    doc,
    currentY,
    [
      { label: "Interno", value: invoiceNumber },
      { label: "Fecha", value: formatDateOnly(createdAt) },
      { label: "Hora de pedido", value: formatTimeOnly(createdAt) },
    ],
    [
      { label: "Hora de retiro", value: pickupTime ? formatDateTime(pickupTime) : "No definida" },
      {
        label: "Estado",
        value: statusMeta.detailLabel,
      },
      { label: "Items", value: `${items.length}` },
    ],
  );

  if (notas?.trim()) {
    currentY = drawWideField(doc, currentY, "Observaciones", notas.trim()) + 4;
  }

  currentY += 3;
  drawSectionHeader(doc, currentY, "DETALLE DE PRODUCTOS");
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    head: [["Cant", "Descripcion", "Precio Unit.", "Subtotal (CRC)", "Total (CRC)"]],
    body: items.map((item) => {
      const quantity = Math.max(Number(item.quantity) || 1, 1);
      const unitGross = Number(item.price) || 0;
      const unitNet = toNetAmount(unitGross);
      const lineNet = unitNet * quantity;
      const lineGross = unitGross * quantity;

      return [
        quantity.toString(),
        item.name,
        formatCurrency(unitNet),
        formatCurrency(lineNet),
        formatCurrency(lineGross),
      ];
    }),
    margin: { left: 14, right: 14 },
    theme: "plain",
    headStyles: {
      fillColor: [...BRAND.black],
      textColor: [...BRAND.white],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 8.8,
      textColor: [...BRAND.text],
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      lineWidth: 0.15,
      lineColor: [...BRAND.line],
    },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 74 },
      2: { cellWidth: 31, halign: "right" },
      3: { cellWidth: 33, halign: "right" },
      4: { cellWidth: 33, halign: "right", textColor: [...BRAND.orangeStrong], fontStyle: "bold" },
    },
  });

  currentY = (doc.lastAutoTable?.finalY || currentY) + 6;
  currentY = ensureSpace(doc, currentY, 70);

  const summaryX = pageWidth - 86;
  const summaryY = currentY;
  const summaryWidth = 72;

  doc.setDrawColor(BRAND.line[0], BRAND.line[1], BRAND.line[2]);
  doc.setLineDashPattern([], 0);
  doc.line(14, summaryY - 2, pageWidth - 14, summaryY - 2);

  doc.setFillColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.roundedRect(summaryX, summaryY, summaryWidth, 28, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(BRAND.text[0], BRAND.text[1], BRAND.text[2]);
  doc.text("Subtotal", summaryX + 4, summaryY + 7);
  doc.text(formatCurrency(subtotal), summaryX + summaryWidth - 4, summaryY + 7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Impto Ventas (13%)", summaryX + 4, summaryY + 14);
  doc.text(formatCurrency(iva), summaryX + summaryWidth - 4, summaryY + 14, { align: "right" });

  doc.setFillColor(BRAND.orangeStrong[0], BRAND.orangeStrong[1], BRAND.orangeStrong[2]);
  doc.roundedRect(summaryX, summaryY + 18, summaryWidth, 10, 0, 0, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.text("TOTAL A PAGAR", summaryX + 4, summaryY + 24.5);
  doc.text(formatCurrency(totalWithIVA), summaryX + summaryWidth - 4, summaryY + 24.5, { align: "right" });

  currentY += 34;
  currentY = ensureSpace(doc, currentY, 58);

  doc.setDrawColor(BRAND.orange[0], BRAND.orange[1], BRAND.orange[2]);
  doc.setLineDashPattern([1.4, 1.2], 0);
  doc.line(14, currentY, pageWidth - 14, currentY);
  doc.setLineDashPattern([], 0);

  const leftX = 14;
  const rightX = 122;
  const reminderWidth = pageWidth - rightX - 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(BRAND.text[0], BRAND.text[1], BRAND.text[2]);
  doc.text("INSTRUCCIONES DE PAGO", leftX, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.text("Realiza el SINPE y comparte este comprobante por WhatsApp.", leftX, currentY + 13);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(BRAND.orangeStrong[0], BRAND.orangeStrong[1], BRAND.orangeStrong[2]);
  doc.text("CONCEPTO EN EL PAGO:", leftX, currentY + 19);
  doc.setFontSize(12.5);
  doc.text(`Pedido ${invoiceNumber.replace("-", " ")}`, leftX, currentY + 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.setTextColor(BRAND.text[0], BRAND.text[1], BRAND.text[2]);
  [
    ["SINPE", BUSINESS.sinpePhone],
    ["A nombre de", BUSINESS.paymentTarget],
    ["Moneda", "Colones (CRC)"],
  ].forEach(([label, value], index) => {
    const rowY = currentY + 31 + index * 5.1;
    doc.text(`- ${label}:`, leftX, rowY);
    doc.text(value, leftX + 28, rowY);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(BRAND.orangeStrong[0], BRAND.orangeStrong[1], BRAND.orangeStrong[2]);
  doc.text("Gracias por preferirnos.", leftX, currentY + 49);

  doc.setDrawColor(BRAND.orange[0], BRAND.orange[1], BRAND.orange[2]);
  doc.line(rightX - 6, currentY + 4, rightX - 6, currentY + 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BRAND.orangeStrong[0], BRAND.orangeStrong[1], BRAND.orangeStrong[2]);
  doc.text("RECORDATORIO", rightX, currentY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.setTextColor(BRAND.text[0], BRAND.text[1], BRAND.text[2]);
  const reminderLines = doc.splitTextToSize(
    `${statusMeta.reminder} WhatsApp: ${BUSINESS.whatsappPhone}.`,
    reminderWidth,
  );
  doc.text(reminderLines, rightX, currentY + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(BUSINESS.name, pageWidth - 14, currentY + 49, { align: "right" });

  const filename = `Mandys_Orden_${sanitizeFileToken(invoiceNumber)}.pdf`;
  doc.save(filename);
  return invoiceNumber;
};

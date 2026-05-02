import jsPDF from "jspdf";
import type { CartItem } from "../types/models";

export const generateOrderPDF = (
  orderNumber: string,
  items: CartItem[], 
  total: number,
  customerData?: { name: string; email: string; phone: string },
  pickupTime?: string
): void => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.text("Mandy's Bar & Restaurante", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.text("Orden de Pedido", 105, 30, { align: "center" });
  doc.text(`Orden #: ${orderNumber}`, 105, 38, { align: "center" });

  let startY = 45;

  if (customerData) {
    doc.setFontSize(10);
    doc.text(`Cliente: ${customerData.name}`, 20, startY);
    doc.text(`Tel: ${customerData.phone}`, 20, startY + 6);
    startY += 15;
  }

  if (pickupTime) {
    doc.setFontSize(10);
    // Format safely to avoid complex date-fns dependency here 
    const dateObj = new Date(pickupTime);
    const dateStr = dateObj.toLocaleDateString();
    const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    doc.text(`Retiro Programado: ${dateStr} ${timeStr}`, 20, startY);
    startY += 10;
  }

  // Line
  doc.line(20, startY, 190, startY);
  startY += 5;

  // Items Header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Producto", 20, startY);
  doc.text("Cant.", 130, startY);
  doc.text("Precio", 150, startY);
  doc.text("Total", 180, startY, { align: "right" });

  doc.setFont("helvetica", "normal");
  let y = startY + 10;

  items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    
    // Handle long names
    const nameLines = doc.splitTextToSize(item.name, 100);
    doc.text(nameLines, 20, y);
    
    doc.text(item.quantity.toString(), 135, y);
    doc.text(`₡${item.price.toLocaleString()}`, 150, y);
    doc.text(`₡${itemTotal.toLocaleString()}`, 180, y, { align: "right" });
    
    y += 10 * nameLines.length; // Adjust spacing based on lines
  });

  // Total
  y += 10;
  doc.line(20, y, 190, y);
  y += 10;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Total: ₡${total.toLocaleString()}`, 180, y, { align: "right" });

  // Footer
  y += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por su preferencia!", 105, y, { align: "center" });
  doc.text("Mandy's Bar & Restaurante - Cañas, Guanacaste", 105, y + 6, { align: "center" });

  doc.save(`Orden_${orderNumber}.pdf`);
};

// Mock upload function
export const uploadPDF = async (pdfBlob: Blob): Promise<string> => {
    // In a real app, we would append to FormData and fetch to backend
    // const formData = new FormData();
    // formData.append("file", pdfBlob, "order.pdf");
    // const res = await fetch("/api/upload-ticket", { method: "POST", body: formData });
    // return res.json().url;

    // Simulation:
    console.log("Simulating PDF upload...");
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    
    // Generate a temporary object URL (this works for local viewing, 
    // but for WhatsApp sharing usually you need a public URL. 
    // Since we are frontend only, we'll pretend we got a public URL)
    // For local demo purposes, opening the blob URL in new tab is robust enough to show "it works".
    // But for WhatsApp text, we might just put "Link del pedido (simulado)"
    
    return URL.createObjectURL(pdfBlob);
};

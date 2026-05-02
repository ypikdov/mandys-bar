import { useState, useEffect, useCallback } from "react";
import { format, addMinutes, addDays, setHours, setMinutes } from "date-fns";
import { useAuth } from "@/providers/AuthContext";
import { useCart } from "@/providers/CartContext";
import { createClientOrder } from "@/services/api/orderService";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UseCheckoutProps {
  items: { id: string; name: string; price: number; quantity: number }[];
  totalPrice: number;
  onOrderSuccess: (order: { id: string; consecutivo_anual: string; pickup_time?: string }) => void;
  onClose?: () => void;
}

export function useCheckout({ items, totalPrice, onOrderSuccess, onClose }: UseCheckoutProps) {
  const { user, isAuthenticated, token } = useAuth();
  const { clearCart, setIsCartOpen } = useCart() as any;

  const [step, setStep] = useState(1);
  const [pickupDay, setPickupDay] = useState<"today" | "other">("today");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [notas, setNotas] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isStoreClosedToday, setIsStoreClosedToday] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; consecutivo_anual: string; pickup_time?: string; notas?: string; estado?: string } | null>(null);
  const [autoDownloadedInvoice, setAutoDownloadedInvoice] = useState(false);
  const [submittedItems, setSubmittedItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [submittedTotal, setSubmittedTotal] = useState(0);

  const MIN_PREP_MINUTES = 60;
  const SLOT_MINUTES = 15;
  const OPEN_HOUR = 11;
  const CLOSE_HOUR = 23;

  const generateSlots = useCallback(() => {
    const slots: string[] = [];
    const now = new Date();
    let start: Date;
    let end: Date;

    if (pickupDay === "today") {
      start = addMinutes(now, MIN_PREP_MINUTES);
      const minutes = start.getMinutes();
      const roundedMinutes = Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES;
      start.setMinutes(roundedMinutes);
      start.setSeconds(0);
      start.setMilliseconds(0);

      const openTime = setMinutes(setHours(new Date(), OPEN_HOUR), 0);
      if (start < openTime) start = openTime;

      end = setMinutes(setHours(new Date(), CLOSE_HOUR), 0);

      if (start >= end) {
        setIsStoreClosedToday(true);
        setPickupDay("other");
        return;
      }
      setIsStoreClosedToday(false);
    } else {
      start = setMinutes(setHours(new Date(selectedDate), OPEN_HOUR), 0);
      end = setMinutes(setHours(new Date(selectedDate), CLOSE_HOUR), 0);
      setIsStoreClosedToday(false);
    }

    let current = start;
    while (current < end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, SLOT_MINUTES);
    }
    setAvailableSlots(slots);
  }, [pickupDay, selectedDate]);

  useEffect(() => {
    generateSlots();
  }, [generateSlots]);

  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString + "T12:00:00");
    if (newDate.getDay() === 2) {
      alert("Lo sentimos, Mandy's Bar & Restaurante esta cerrado los martes. Por favor selecciona otro dia.");
      const safeDay = addDays(new Date(), 1);
      setSelectedDate(safeDay.getDay() === 2 ? addDays(safeDay, 1) : safeDay);
      return;
    }
    setSelectedDate(newDate);
  };

  const handleRegister = async () => {
    if (isProcessing || orderSent) {
      console.log("Previniendo doble intento de registro.");
      return;
    }

    console.log("Iniciando registro de pedido...");

    if (!token) {
      console.warn("No se encontro token de sesion.");
      alert("Tu sesion ha expirado o no has iniciado sesion. Por favor inicia sesion de nuevo.");
      return;
    }

    if (!selectedTime) {
      alert("Por favor selecciona una hora de retiro.");
      return;
    }

    if (items.some((item) => !UUID_PATTERN.test(item.id))) {
      alert("No se puede registrar el pedido porque el menu no se sincronizo con el catalogo del servidor. Actualiza la pagina e intenta de nuevo.");
      return;
    }

    setIsProcessing(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const pickupDateTime = new Date(selectedDate);
      pickupDateTime.setHours(hours, minutes, 0, 0);

      const payload = {
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
        })),
        totalWithIVA: totalPrice,
        pickupTime: pickupDateTime.toISOString(),
        notas,
      };

      const result = await createClientOrder(payload, token);
      console.log("Pedido creado con exito en DB:", result);
      setCreatedOrder(result.order);
      setSubmittedItems(payload.items);
      setSubmittedTotal(totalPrice);

      let downloaded = false;
      try {
        const { generateInvoicePDF } = await import("@mandys/shared");
        generateInvoicePDF(
          result.order.consecutivo_anual,
          items,
          totalPrice,
          user
            ? {
                fullName: user.nombre,
                email: user.correo,
                phone: user.telefono || "",
              }
            : undefined,
          result.order.pickup_time,
          result.order.estado,
          result.order.notas || notas,
        );
        downloaded = true;
      } catch (pdfError) {
        console.error("No se pudo descargar automaticamente el comprobante del pedido:", pdfError);
      }

      setAutoDownloadedInvoice(downloaded);
      setOrderSent(true);
      onOrderSuccess(result.order);
      setStep(3);
      setIsProcessing(false);
      clearCart();
    } catch (err) {
      console.error("Fallo critico en el flujo de Checkout:", err);
      alert(err instanceof Error ? err.message : "Fallo inesperado al conectar con el servidor.");
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setIsCartOpen(false);
    if (onClose) onClose();
  };

  return {
    user,
    isAuthenticated,
    step,
    setStep,
    pickupDay,
    setPickupDay,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    notas,
    setNotas,
    isProcessing,
    availableSlots,
    isStoreClosedToday,
    orderSent,
    createdOrder,
    autoDownloadedInvoice,
    submittedItems,
    submittedTotal,
    handleDateChange,
    handleRegister,
    resetAndClose,
  };
}

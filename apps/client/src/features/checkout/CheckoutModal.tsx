import { CheckCircle, Clock, Calendar, AlertTriangle, Info, LogIn, Download, MessageCircle, X } from "lucide-react";
import { Button } from "@mandys/ui";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import StyledOrderButton from "@/modules/orders/components/StyledOrderButton";
import { useCheckout } from "@/features/checkout/useCheckout";
import { useAuthModal } from "@/features/auth/AuthModalProvider";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: { id: string; name: string; price: number; quantity: number }[];
  totalPrice: number;
  onOrderSuccess: (order: { id: string; consecutivo_anual: string; pickup_time?: string }) => void;
}

export const CheckoutModal = ({ isOpen, onClose, items, totalPrice, onOrderSuccess }: CheckoutModalProps) => {
  const SINPE_PHONE = "+506 8666-1940";
  const { openAuthModal } = useAuthModal();

  const {
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
    resetAndClose
  } = useCheckout({ items, totalPrice, onOrderSuccess, onClose });

  const pdfItems = createdOrder ? submittedItems : items;
  const displayTotal = createdOrder ? submittedTotal : totalPrice;

  const handleDownloadInvoice = async () => {
    if (!createdOrder) return;

    const { generateInvoicePDF } = await import("@mandys/shared");

    generateInvoicePDF(
      createdOrder.consecutivo_anual,
      pdfItems,
      displayTotal,
      user
        ? {
            fullName: user.nombre,
            email: user.correo,
            phone: user.telefono || "",
          }
        : undefined,
      createdOrder.pickup_time,
      createdOrder.estado,
      createdOrder.notas,
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100" title="Cerrar modal">
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-zinc-100 bg-zinc-50 p-6">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${step === 3 ? "bg-green-100" : "bg-primary/10"}`}>
              {step === 3 ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Clock className="h-6 w-6 text-primary" />}
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                {step === 1 ? "Programar retiro" : step === 2 ? "Instrucciones de pago" : "Pedido registrado"}
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mandy's Bar & Restaurante</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                {isStoreClosedToday ? (
                  <div className="col-span-2 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-tight">Hoy ya no aceptamos mas pedidos. Elige otro dia para el retiro.</p>
                  </div>
                ) : (
                  <button
                    onClick={() => { setPickupDay("today"); setSelectedDate(new Date()); }}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${pickupDay === "today" ? "border-primary bg-primary/5" : "border-zinc-100 hover:border-zinc-200"}`}
                    title="Recoger hoy"
                  >
                    <Clock className={pickupDay === "today" ? "text-primary" : "text-zinc-400"} />
                    <span className="text-sm font-bold">Hoy</span>
                  </button>
                )}
                <button
                  onClick={() => setPickupDay("other")}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${pickupDay === "other" ? "border-primary bg-primary/5" : "border-zinc-100 hover:border-zinc-200"}`}
                  title="Recoger otro dia"
                >
                  <Calendar className={pickupDay === "other" ? "text-primary" : "text-zinc-400"} />
                  <span className="text-sm font-bold">Otro dia</span>
                </button>
              </div>

              {pickupDay === "other" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Seleccionar fecha</label>
                  <input
                    type="date"
                    min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 p-3 font-semibold focus:border-primary focus:outline-none"
                    title="Fecha de retiro"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Hora de retiro</label>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">+1h prep.</span>
                </div>
                <div className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                  {availableSlots.map((time: string) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-lg border py-2 text-sm font-bold transition-all ${selectedTime === time ? "border-black bg-black text-white" : "border-zinc-200 text-zinc-600 hover:border-primary"}`}
                      title={`Seleccionar ${time}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Observaciones (opcional)</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: sin cebolla, extra salsa..."
                  className="w-full resize-none rounded-lg border border-zinc-200 p-3 text-sm font-semibold text-zinc-700 focus:border-primary focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-xs font-medium leading-relaxed text-blue-800">
                  En horas pico, el pedido puede tardar un poco mas. Te confirmaremos el tiempo estimado por WhatsApp.
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!selectedTime}
                className="w-full py-6 text-lg font-black uppercase tracking-wider"
              >
                Continuar al pago
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4 rounded-2xl bg-zinc-900 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Transferencia SINPE</span>
                    <p className="text-3xl font-black">{SINPE_PHONE}</p>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200">
                    Paso final
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Monto total</span>
                  <p className="text-3xl font-black text-primary">CRC {totalPrice.toLocaleString("es-CR")}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-zinc-800 pt-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Retiro</p>
                    <p className="mt-1 font-semibold text-zinc-200">
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: es }) : "Sin fecha"} · {selectedTime || "Sin hora"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Comprobante</p>
                    <p className="mt-1 font-semibold text-zinc-200">Se descarga al registrar el pedido</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-zinc-800 pt-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-zinc-400">Pago por SINPE Movil</span>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-zinc-100 p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                  <div className="h-4 w-1 rounded-full bg-primary" /> Pasos finales
                </h3>
                <ul className="space-y-3 text-xs text-zinc-600">
                  <li className="flex gap-3">
                    <span className="font-black text-primary">1.</span>
                    <span>Registra el pedido. El comprobante PDF se descarga de inmediato.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-black text-primary">2.</span>
                    <span>Realiza el SINPE con el mismo monto mostrado arriba.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-black text-primary">3.</span>
                    <span>Envia el PDF y el screenshot del SINPE a nuestro WhatsApp.</span>
                  </li>
                </ul>
              </div>

              {!isAuthenticated ? (
                <div className="space-y-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <LogIn className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black uppercase text-black">Usuario no autenticado</p>
                    <p className="text-xs text-zinc-500">Debes iniciar sesion para registrar el pedido y descargar el comprobante.</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      openAuthModal("login");
                    }}
                    className="w-full font-bold uppercase"
                  >
                    Iniciar sesion
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold leading-relaxed text-orange-900">
                    Cuando registres el pedido, descargaremos el comprobante automaticamente para que puedas enviarlo por WhatsApp junto con el pago.
                  </p>
                  <StyledOrderButton
                    onClick={handleRegister}
                    disabled={isProcessing}
                    isSent={orderSent}
                  />
                </div>
              )}

              <Button variant="ghost" onClick={() => setStep(1)} className="w-full font-bold text-zinc-400">
                Atras
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 py-4 text-center animate-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-black">Pedido registrado</h3>
                <p className="text-sm text-zinc-500">
                  {autoDownloadedInvoice
                    ? "El comprobante PDF se descargo automaticamente. Si tu navegador lo bloqueo, puedes bajarlo otra vez aqui."
                    : "Tu orden quedo registrada. Si el PDF no se descargo solo, puedes bajarlo otra vez aqui."}
                </p>
              </div>

              {createdOrder && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Pedido</p>
                      <p className="mt-1 text-xl font-black text-zinc-950">#{createdOrder.consecutivo_anual}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Total</p>
                      <p className="mt-1 text-xl font-black text-primary">CRC {displayTotal.toLocaleString("es-CR")}</p>
                    </div>
                  </div>
                  {createdOrder.pickup_time && (
                    <p className="mt-4 text-sm font-semibold text-zinc-600">
                      Retiro programado: {format(new Date(createdOrder.pickup_time), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => void handleDownloadInvoice()}
                className="w-full gap-3 border-zinc-200 py-6 text-base font-black uppercase text-zinc-900 hover:bg-zinc-50"
              >
                <Download className="h-5 w-5" /> Descargar PDF otra vez
              </Button>

              <Button
                onClick={() => {
                  if (!createdOrder) return;

                  let waText = "Hola Mandy's Bar,\n\n";
                  waText += `He registrado mi pedido #${createdOrder.consecutivo_anual}.\n\nResumen:\n`;
                  pdfItems.forEach((item) => {
                    waText += `- ${item.quantity}x ${item.name} (CRC ${item.price.toLocaleString("es-CR")})\n`;
                  });
                  waText += `\nTotal a pagar: CRC ${displayTotal.toLocaleString("es-CR")}\n`;

                  if (createdOrder.pickup_time) {
                    waText += `Retiro: ${format(new Date(createdOrder.pickup_time), "dd/MM HH:mm", { locale: es })}\n`;
                  }

                  if (createdOrder.notas) {
                    waText += `Observaciones: ${createdOrder.notas}\n`;
                  }

                  waText += "\nAdjunto el comprobante y el pago SINPE para validacion.";
                  window.open(`https://wa.me/50686661940?text=${encodeURIComponent(waText)}`, "_blank");
                }}
                className="w-full gap-3 bg-black py-6 font-bold uppercase text-white hover:bg-zinc-800"
              >
                <MessageCircle className="h-6 w-6" /> Continuar por WhatsApp
              </Button>

              <Button
                variant="ghost"
                onClick={resetAndClose}
                className="mt-2 w-full font-bold text-zinc-400"
              >
                Cerrar y volver al menu
              </Button>

              <p className="px-8 text-[10px] font-medium italic text-zinc-400">
                El pedido queda en estado <b>"Pendiente de verificacion"</b> hasta validar el comprobante del SINPE.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

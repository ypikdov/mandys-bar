import { useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isTuesday } from "date-fns";
import { Button } from "@mandys/ui";
import { getAvailableTimes, formatTimeDisplay } from '@mandys/shared';
import { ChevronDown, Music, Download, X, CreditCard, Phone, LogIn } from "lucide-react";
import { useAuth } from "@/providers/AuthContext";
import { useAuthModal } from "@/features/auth/AuthModalProvider";
import { useEventReservation } from "@/modules/reservations/hooks/useEventReservation";
import { useSiteContent } from "@/modules/site-content/providers/SiteContentProvider";

const fallbackPage = {
  publicTag: "Experiencias Mandy's",
  publicTitle: "Eventos para Todo Público",
  publicDescription: "Disfruta de música en vivo, shows exclusivos y entretenimiento de primer nivel.",
  privateTag: "Celebraciones Privadas",
  privateTitle: "Reserva tu lugar y celebra en grande",
  privateDescription: "Cumpleaños, aniversarios, eventos corporativos o reuniones con amigos.",
  privateButtonLabel: "Empieza a planear",
};

const fallbackTemplates = [
  { id: "birthday", slug: "birthday", title: "Cumpleaños", subtitle: "", description: "Celebra con nosotros.", day_label: "", display_date: "", start_time: "", image_url: "/images/event_birthday.jpg", price: 30000, order_index: 0, active: true, kind: "PRIVATE_TEMPLATE" as const },
  { id: "party", slug: "party", title: "Fiesta", subtitle: "", description: "Tu espacio privado para bailar y compartir.", day_label: "", display_date: "", start_time: "", image_url: "/images/event_party.jpg", price: 35000, order_index: 1, active: true, kind: "PRIVATE_TEMPLATE" as const },
  { id: "meeting", slug: "meeting", title: "Reunión", subtitle: "", description: "Momentos especiales en un ambiente reservado.", day_label: "", display_date: "", start_time: "", image_url: "/images/event_meeting.jpg", price: 30000, order_index: 2, active: true, kind: "PRIVATE_TEMPLATE" as const },
];

const fallbackPublicEvents = [
  { id: "pub-1", slug: "viernes-musica", title: "Música en Vivo", subtitle: "Grupo invitado", description: "Una noche con el mejor ambiente.", day_label: "VIERNES", display_date: "24 de febrero", start_time: "8:00 p. m.", image_url: "/images/paisajes/slide3_band.webp", price: null, order_index: 0, active: true, kind: "PUBLIC_PROGRAM" as const },
];

const resolveImageUrl = (path?: string | null) => {
  if (!path) return "/images/paisajes/slide3_band.webp";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

export const Events = () => {
  const location = useLocation();
  const { content } = useSiteContent();
  const { isAuthenticated, user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const pageContent = content?.eventsPage ?? fallbackPage;
  const publicEvents = content ? content.publicEvents : fallbackPublicEvents;
  const privateTemplates = content ? content.privateEventTemplates : fallbackTemplates;
  const priceMap = useMemo(() => Object.fromEntries(privateTemplates.map((item) => [item.slug, item.price ?? 30000])), [privateTemplates]);
  const typeLabelMap = useMemo(() => Object.fromEntries(privateTemplates.map((item) => [item.slug, item.title])), [privateTemplates]);

  const {
    isSubmitting,
    showSuccessModal,
    lastReservation,
    submitReservation,
    closeSuccessModal
  } = useEventReservation(priceMap);

  const activeTab: "public" | "private" = location.pathname === "/eventos/privados" ? "private" : "public";

  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");

  if (location.pathname === "/eventos") {
    return <Navigate to="/eventos/publicos" replace />;
  }

  const downloadReservationPDF = async (reservationData: {
    tipo_evento: string;
    fecha: string;
    hora_inicio: string;
    hora_fin?: string;
    precio: number;
    nombre: string;
    correo: string;
    comensales: number | string;
    detalles: string;
    estado?: string;
  }) => {
    const { downloadReservationPDF: generateReservationPDF } = await import("@mandys/shared");
    generateReservationPDF(reservationData);
  };

  const handleDateChange = (val: string) => {
    if (!val) {
      setDate(undefined);
      setDateString("");
      return;
    }
    const selectedDate = new Date(`${val}T12:00:00`);
    if (isTuesday(selectedDate)) {
      alert("Lo sentimos, Mandy's Bar & Restaurante esta cerrado los martes. Por favor selecciona otro dia.");
      setDateString("");
      setDate(undefined);
      return;
    }
    setDateString(val);
    setDate(selectedDate);
    setStartTime("");
    setEndTime("");
  };

  const availableTimes = getAvailableTimes(date);

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7]">
      {activeTab === "public" ? (
        <section className="bg-black py-24 min-h-[70vh] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50"></div>
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="flex flex-col items-center mb-20">
              <span className="text-primary font-bold tracking-[0.4em] uppercase mb-4 text-sm">{pageContent.publicTag}</span>
              <h1 className="text-5xl md:text-[5.5rem] font-black text-white text-center uppercase tracking-tighter leading-none mb-6">{pageContent.publicTitle}</h1>
              <div className="w-32 h-1.5 bg-primary rounded-full mb-10"></div>
              <p className="text-zinc-400 text-xl md:text-2xl max-w-3xl text-center font-medium leading-relaxed">{pageContent.publicDescription}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
              {publicEvents.map((event) => (
                <div key={event.id} className="flex flex-col bg-zinc-900/40 backdrop-blur-sm p-8 rounded-[2rem] border border-white/5 hover:border-primary/40 transition-all duration-700 shadow-2xl">
                  <img src={resolveImageUrl(event.image_url)} alt={event.title} className="h-52 w-full rounded-[1.5rem] object-cover mb-8" loading="lazy" decoding="async" />
                  <span className="text-primary font-black uppercase tracking-widest text-xs block mb-3 opacity-80">{event.day_label || "EVENTO"}</span>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-3">{event.title}</h3>
                  {event.display_date && <p className="text-zinc-200 text-sm font-bold mb-2">{event.display_date}</p>}
                  {event.start_time && <p className="text-primary font-black mb-3">{event.start_time}</p>}
                  {event.subtitle && <p className="text-zinc-200 font-semibold mb-3">{event.subtitle}</p>}
                  <p className="text-zinc-400 leading-relaxed">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="relative w-full py-32 bg-black overflow-hidden flex items-center min-h-[60vh]">
            <div className="absolute inset-0 bg-[url('/images/paisajes/slide3_band.webp')] bg-cover bg-center opacity-30 grayscale"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40"></div>
            <div className="container relative z-10 mx-auto px-4 md:px-8">
              <div className="max-w-4xl">
                <span className="text-primary font-black tracking-[0.3em] uppercase mb-6 block text-sm">{pageContent.privateTag}</span>
                <h1 className="text-5xl md:text-[6rem] font-black text-white mb-8 uppercase tracking-tighter leading-[0.9] italic">{pageContent.privateTitle}</h1>
                <p className="text-zinc-300 text-xl md:text-2xl mb-12 max-w-2xl leading-relaxed font-medium">{pageContent.privateDescription}</p>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-12 py-8 text-2xl font-black tracking-tighter uppercase shadow-[0_10px_40px_rgba(234,88,12,0.3)] hover:shadow-primary/50 transition-all duration-500 border-none" onClick={() => document.getElementById("registro-eventos")?.scrollIntoView({ behavior: "smooth" })}>
                  {pageContent.privateButtonLabel}
                </Button>
              </div>
            </div>
          </section>

          <section className="py-24 bg-zinc-950">
            <div className="container mx-auto px-4 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {privateTemplates.map((template) => (
                  <div key={template.id} className="group relative overflow-hidden rounded-[2.5rem] aspect-[4/5] cursor-pointer border border-white/5">
                    <img src={resolveImageUrl(template.image_url)} alt={template.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-10">
                      <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic leading-none">{template.title}</h3>
                      <p className="text-zinc-200 mb-4">{template.description}</p>
                      <div className="flex items-center justify-between gap-3">
                        <div className="w-12 h-1 origin-left scale-x-100 bg-primary rounded-full transition-transform duration-500 group-hover:scale-x-[2.4]"></div>
                        <span className="text-primary font-black">CRC {(template.price ?? 30000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="registro-eventos" className="py-32 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
              <div className="bg-zinc-50 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row border border-zinc-100">
                <div className="md:w-5/12 bg-black relative p-16 flex flex-col justify-between min-h-[500px]">
                  <div className="absolute inset-0 opacity-50">
                    <img src={resolveImageUrl(privateTemplates[0]?.image_url)} alt="Evento" loading="lazy" decoding="async" className="w-full h-full object-cover grayscale" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                  </div>
                  <div className="relative z-10">
                    <Music className="text-primary w-12 h-12 mb-8" />
                    <h2 className="text-5xl md:text-6xl font-black text-white uppercase leading-[0.9] tracking-tighter italic">HAZ TU EVENTO REALIDAD</h2>
                    <div className="w-24 h-2 bg-primary mt-8 rounded-full"></div>
                  </div>
                  <div className="relative z-10 text-zinc-400 font-medium">
                    <p>Completa el formulario y nuestro equipo de eventos se pondra en contacto contigo a la brevedad.</p>
                  </div>
                </div>

                <div className="md:w-7/12 p-10 md:p-20">
                  <form className="space-y-8" onSubmit={async (e) => {
                    e.preventDefault();
                    if (isSubmitting) return;
                    if (!isAuthenticated) {
                      openAuthModal("login");
                      return;
                    }
                    const formData = new FormData(e.currentTarget);
                    const tipoEvento = formData.get('tipo_evento') as string;
                    const formEl = e.target as HTMLFormElement;
                    await submitReservation(formData, dateString, startTime, endTime, tipoEvento, () => {
                      formEl.reset();
                      setDateString("");
                      setStartTime("");
                      setEndTime("");
                      setDate(undefined);
                      setSelectedEventType("");
                    });
                  }}>
                    {!isAuthenticated ? (
                      <div className="rounded-[2rem] border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                          <LogIn className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-black">Inicia sesion para reservar</h3>
                        <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-relaxed text-zinc-600">
                          Las reservaciones se registran con los datos de tu cuenta. No necesitas llenar nombre, correo ni cedula aqui.
                        </p>
                        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                          <Button type="button" onClick={() => openAuthModal("login")} className="bg-black px-7 py-6 text-white hover:bg-zinc-800">
                            <LogIn className="mr-2 h-4 w-4" /> Iniciar sesion
                          </Button>
                          <p className="max-w-xs text-xs font-semibold leading-relaxed text-zinc-500">
                            Si aun no tienes cuenta, solicita al personal que la registre desde el sistema.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Reservando como</p>
                        <p className="mt-1 text-lg font-black text-emerald-950">{user?.nombre}</p>
                        <p className="text-sm font-semibold text-emerald-700">{user?.correo}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">Fecha</label>
                        <input type="date" required value={dateString} onChange={(e) => handleDateChange(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full p-5 border-2 border-zinc-100 bg-white rounded-2xl focus:border-primary outline-none transition-all text-black font-bold h-[64px]" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">Inicio</label>
                          <div className="relative">
                            <select required disabled={!date} value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-5 pr-10 border-2 border-zinc-100 bg-white rounded-2xl focus:border-primary outline-none appearance-none transition-all text-black font-bold disabled:opacity-50 h-[64px] text-sm">
                              <option value="" disabled>-- : --</option>
                              {availableTimes.map((slot) => <option key={slot} value={slot}>{formatTimeDisplay(slot)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">Fin</label>
                          <div className="relative">
                            <select required disabled={!startTime} value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-5 pr-10 border-2 border-zinc-100 bg-white rounded-2xl focus:border-primary outline-none appearance-none transition-all text-black font-bold disabled:opacity-50 h-[64px] text-sm">
                              <option value="" disabled>-- : --</option>
                              {availableTimes.filter((slot) => !startTime || slot > startTime).map((slot) => <option key={slot} value={slot}>{formatTimeDisplay(slot)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">Tipo de evento</label>
                        <div className="relative">
                          <select name="tipo_evento" required value={selectedEventType} onChange={(e) => setSelectedEventType(e.target.value)} className="w-full p-5 pr-12 border-2 border-zinc-100 bg-white rounded-2xl focus:border-primary outline-none appearance-none transition-all text-black font-bold h-[64px]">
                            <option value="" disabled>Selecciona una opcion</option>
                            {privateTemplates.map((item) => <option key={item.id} value={item.slug}>{item.title}</option>)}
                            <option value="other">Otro</option>
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                        </div>
                        {selectedEventType && (
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                            <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm font-bold text-zinc-700">Precio del evento: <span className="text-primary">CRC {(priceMap[selectedEventType] || priceMap.other || 30000).toLocaleString()}</span></span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">Comensales <span className="text-zinc-300 normal-case">(informativo)</span></label>
                        <div className="relative">
                          <select name="comensales" className="w-full p-5 pr-12 border-2 border-zinc-100 bg-white rounded-2xl focus:border-primary outline-none appearance-none transition-all text-black font-bold h-[64px]">
                            {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => <option key={num} value={num}>{num} {num === 1 ? 'Persona' : 'Personas'}</option>)}
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">Detalles adicionales</label>
                      <textarea name="detalles" rows={4} className="w-full p-5 border-2 border-zinc-100 bg-white rounded-2xl focus:border-primary outline-none transition-all resize-none text-black font-medium" placeholder="Cuéntanos más sobre tu evento..."></textarea>
                    </div>

                    <Button type={isAuthenticated ? "submit" : "button"} onClick={!isAuthenticated ? () => openAuthModal("login") : undefined} disabled={isSubmitting} className="w-full bg-primary hover:bg-black text-white font-black py-8 text-xl rounded-[1.5rem] mt-4 shadow-2xl transition-all duration-500 uppercase tracking-widest border-none disabled:opacity-50">
                      {isSubmitting ? "Enviando..." : isAuthenticated ? "Solicitar Reservación" : "Iniciar sesion para reservar"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {showSuccessModal && lastReservation && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => closeSuccessModal()}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-primary to-orange-600 p-8 text-white relative">
                  <button onClick={() => closeSuccessModal()} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition" aria-label="Cerrar">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Reservación enviada</h3>
                  <p className="text-white/80 mt-2 text-sm">Tu solicitud fue recibida. Para confirmarla, realiza el pago por SINPE Movil.</p>
                </div>

                <div className="p-8 space-y-6">
                  <div className="bg-zinc-50 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 font-medium">Tipo de evento</span>
                      <span className="font-bold text-black">{typeLabelMap[lastReservation.tipo_evento] || lastReservation.tipo_evento}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 font-medium">Fecha</span>
                      <span className="font-bold text-black">{lastReservation.fecha}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 font-medium">Hora inicio</span>
                      <span className="font-bold text-black">{lastReservation.hora_inicio}</span>
                    </div>
                    <div className="h-px bg-zinc-200 my-2"></div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 font-bold">Total a pagar</span>
                      <span className="text-2xl font-black text-primary">CRC {lastReservation.precio.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-2 border-emerald-200 bg-emerald-50 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Phone className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-black text-emerald-800 uppercase text-sm tracking-wide">Pago SINPE Movil</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Numero SINPE</span>
                        <span className="font-black text-emerald-900 text-lg">8454-9595</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">A nombre de</span>
                        <span className="font-bold text-emerald-900">Mandy's Bar & Restaurante</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Monto</span>
                        <span className="font-bold text-emerald-900">CRC {lastReservation.precio.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-600 mt-4 leading-relaxed">Envía el comprobante de pago al WhatsApp <strong>+506 8454-9595</strong> para confirmar tu reservación.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => { downloadReservationPDF({ ...lastReservation, estado: 'PENDIENTE' }); }} className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold py-4 rounded-xl text-sm uppercase tracking-wider border-none flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Bajar PDF de nuevo
                    </Button>
                    <Button onClick={closeSuccessModal} className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wider border-none">
                      Entendido, cerrar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

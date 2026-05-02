import { useState } from "react";
import { isTuesday, parseISO } from "date-fns";
import { Clock, MapPin, Phone, Instagram, Facebook, ChevronDown, LogIn } from "lucide-react";
import { Button } from "@mandys/ui";
import { getAvailableTimes, formatTimeDisplay } from '@mandys/shared';
import { useSiteContent } from "@/modules/site-content/providers/SiteContentProvider";
import { useAuth } from "@/providers/AuthContext";
import { useAuthModal } from "@/features/auth/AuthModalProvider";
import { createClientReservation } from "@/modules/reservations/services/reservationService";
import { sanitizeExternalUrl } from "@/lib/utils";

const fallbackContact = {
  title: " Te esperamos",
  hours: ["Lunes, Miércoles, Jueves: 12 md - 11 pm", "Viernes, Sábado, Domingo: 12 md - 12 mn"],
  closedDayLabel: "Martes: Cerrado",
  address: "Cañas, Guanacaste, Costa Rica",
  phone: "+506 8888-8888",
  instagramUrl: "#",
  facebookUrl: "#",
};

export const Contact = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { content } = useSiteContent();
  const contact = content?.contact ?? fallbackContact;
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");
  const [guests, setGuests] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationMessage, setReservationMessage] = useState<string | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const reservationName = user?.nombre?.trim() || "cliente";
  const submitLabel = isSubmitting ? "Enviando..." : isAuthenticated ? "Reservar mesa" : "Iniciar sesión";

  const instagramUrl = sanitizeExternalUrl(contact.instagramUrl, fallbackContact.instagramUrl);
  const facebookUrl = sanitizeExternalUrl(contact.facebookUrl, fallbackContact.facebookUrl);
  const hasInstagramLink = instagramUrl !== "#";
  const hasFacebookLink = facebookUrl !== "#";

  const handleDateChange = (val: string) => {
    if (!val) {
      setDate(undefined);
      setDateString("");
      setAvailabilityError(null);
      return;
    }
    const selectedDate = parseISO(val);
    if (isTuesday(selectedDate)) {
      setAvailabilityError("Mandy's Bar & Restaurante está cerrado los martes. Selecciona otro día.");
      setDateString("");
      setDate(undefined);
      setTime("");
      return;
    }
    setAvailabilityError(null);
    setDateString(val);
    setDate(selectedDate);
    setTime("");
  };

  const availableTimes = getAvailableTimes(date);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col md:flex-row bg-black text-white">
        <div className="flex-1 p-8 sm:p-12 lg:p-24 flex flex-col justify-center border-r border-zinc-900">
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-12 tracking-wide text-primary">{contact.title}</h1>

          <div className="space-y-10">
            <div className="flex items-start gap-4">
              <Clock className="w-8 h-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2 uppercase">Horario</h3>
                <ul className="text-zinc-400 space-y-1">
                  {contact.hours.map((item) => <li key={item}>{item}</li>)}
                  <li className="text-primary mt-2">{contact.closedDayLabel}</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="w-8 h-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2 uppercase">Ubicación</h3>
                <p className="text-zinc-400">{contact.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="w-8 h-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2 uppercase">Teléfono</h3>
                <p className="text-zinc-400">{contact.phone}</p>
              </div>
            </div>
          </div>

          <div className="mt-16 flex gap-6">
            <a
              href={instagramUrl}
              target={hasInstagramLink ? "_blank" : undefined}
              rel={hasInstagramLink ? "noopener noreferrer" : undefined}
              className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-primary hover:border-primary transition-colors"
              aria-label="Visita nuestro Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={facebookUrl}
              target={hasFacebookLink ? "_blank" : undefined}
              rel={hasFacebookLink ? "noopener noreferrer" : undefined}
              className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-primary hover:border-primary transition-colors"
              aria-label="Visita nuestro Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="flex-1 p-8 sm:p-12 lg:p-24 bg-zinc-950 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-8 uppercase tracking-wide">Haz una reserva</h2>

          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setReservationMessage(null);
              setReservationError(null);

              if (!isAuthenticated || !token) {
                openAuthModal("login");
                return;
              }

              setIsSubmitting(true);
              try {
                await createClientReservation({
                  fecha: dateString,
                  hora_inicio: time,
                  hora_fin: time,
                  tipo_evento: 'mesa',
                  comensales: guests,
                  detalles: 'Reserva de mesa',
                }, token);

                setReservationMessage(`Reserva solicitada para el ${date?.toLocaleDateString()} a las ${time} a nombre de ${reservationName}.`);
                setDate(undefined);
                setDateString("");
                setTime("");
                setGuests("1");
              } catch (error) {
                setReservationError(error instanceof Error ? error.message : 'No se pudo registrar la reserva.');
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {!isAuthenticated && (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
                <div className="flex items-start gap-3">
                  <LogIn className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-black uppercase tracking-wide text-white">Inicia sesión para reservar</p>
                    <p className="mt-1 text-sm text-zinc-400">Usaremos los datos de tu cuenta para registrar la mesa.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-semibold text-zinc-400 uppercase">Fecha</label>
                <input
                  type="date"
                  id="date"
                  required
                  value={dateString}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors h-14"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="time" className="text-sm font-semibold text-zinc-400 uppercase">Hora</label>
                <div className="relative">
                  <select
                    id="time"
                    required
                    disabled={!date}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed h-14"
                  >
                    <option value="" disabled>-- : -- --</option>
                    {availableTimes.map((slot) => (
                      <option key={slot} value={slot}>{formatTimeDisplay(slot)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {availabilityError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
                {availabilityError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="guests" className="text-sm font-semibold text-zinc-400 uppercase">No. de comensales</label>
              <div className="relative">
                <select id="guests" value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none h-14">
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Persona' : 'Personas'}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {reservationMessage && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300">
                {reservationMessage}
              </div>
            )}

            {reservationError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
                {reservationError}
              </div>
            )}

            <Button type={isAuthenticated ? "submit" : "button"} onClick={!isAuthenticated ? () => openAuthModal("login") : undefined} disabled={isSubmitting} className="mt-4 w-full rounded-xl bg-primary px-5 py-5 text-center text-base font-bold uppercase tracking-wide whitespace-normal break-words leading-tight text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-60 sm:py-7 sm:text-lg">
              {submitLabel}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

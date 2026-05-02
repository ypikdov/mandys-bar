export interface EventTemplate {
  id: string;
  title: string;
  image: string;
}

export const eventTemplates: EventTemplate[] = [
  {
    id: "birthday",
    title: "Cumpleaños",
    image: "/images/event_birthday.jpg",
  },
  {
    id: "party",
    title: "Fiesta",
    image: "/images/event_party.jpg",
  },
  {
    id: "meeting",
    title: "Reunión",
    image: "/images/event_meeting.jpg",
  },
  {
    id: "wedding",
    title: "Boda",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
  }
];

export interface ProgramEvent {
  time: string;
  description: string;
}

export interface ProgramDay {
  day: string;
  date: string;
  events: ProgramEvent[];
}

export const eventProgram: ProgramDay[] = [
  {
    day: "VIERNES",
    date: "24 de febrero",
    events: [
      { time: "8:00 p. m.", description: "Música en Vivo: Grupo Melao" },
      { time: "10:00 p. m.", description: "DJ Set: Noches de Reggaeton" }
    ]
  },
  {
    day: "SÁBADO",
    date: "25 de febrero",
    events: [
      { time: "7:00 p. m.", description: "Acústico: Juan Gabriel cover" },
      { time: "9:30 p. m.", description: "Banda de Rock: Los Renegados" }
    ]
  },
  {
    day: "DOMINGO",
    date: "26 de febrero",
    events: [
      { time: "1:00 p. m.", description: "Tarde de Karaoke" },
      { time: "4:00 p. m.", description: "Especial de Marimba" }
    ]
  }
];





export { eventPrices, eventTypeLabels } from "@mandys/shared";

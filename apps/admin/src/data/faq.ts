export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  title: string;
  items: FAQItem[];
}

export const faqData: FAQCategory[] = [
  {
    title: "Reservas",
    items: [
      {
        question: "¿Puedo llegar sin reservar?",
        answer: "Sí, aceptamos clientes sin reserva, pero recomendamos reservar los fines de semana."
      },
      {
        question: "¿Con cuánta anticipación debo reservar?",
        answer: "Sugerimos al menos 24 horas de anticipación para asegurar su mesa."
      }
    ]
  },
  {
    title: "Servicios",
    items: [
      {
        question: "¿Tienen WiFi?",
        answer: "Sí, ofrecemos WiFi gratuito de alta velocidad para todos nuestros clientes."
      },
      {
        question: "¿Cuentan con parqueo?",
        answer: "Sí, disponemos de amplio parqueo privado y seguro."
      }
    ]
  },
  {
    title: "Bar y bebidas",
    items: [
      {
        question: "¿Qué tipo de cócteles ofrecen?",
        answer: "Ofrecemos mixología de autor, clásicos y opciones sin alcohol."
      }
    ]
  },
  {
    title: "Gastronomía",
    items: [
      {
        question: "¿Tienen opciones vegetarianas?",
        answer: "Sí, contamos con un menú especial para vegetarianos y veganos."
      }
    ]
  }
];

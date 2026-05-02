import type {
  AboutContent,
  ContactContent,
  EventsPageContent,
  SiteFaqCategory,
  GalleryContentItem,
  GalleryPageContent,
  NavbarLink,
  PublicSiteContent,
  SiteEvent,
  SiteTeamMember,
} from '@mandys/shared';

export const defaultNavbarLinks: NavbarLink[] = [
  { label: 'MENÚ', path: '/menu' },
  {
    label: 'ACERCA DE',
    path: '/acerca',
    dropdown: [
      { label: 'Nuestra historia', path: '/acerca/historia' },
      { label: 'Equipo', path: '/acerca/equipo' },
      { label: 'Preguntas frecuentes', path: '/acerca/faq' },
    ],
  },
  { label: 'CONTACTO', path: '/contacto' },
  {
    label: 'EVENTOS',
    path: '/eventos',
    dropdown: [
      { label: 'Todo Público', path: '/eventos/publicos' },
      { label: 'Reservar Espacio Privado', path: '/eventos/privados' },
    ],
  },
  { label: 'GALERÍA', path: '/galeria' },
];

export const defaultAboutContent: AboutContent = {
  historyTitle: 'TODO IMPORTA',
  historyParagraphs: [
    "En Mandy's Bar & Restaurante, creemos que la grandeza de un plato reside en los detalles. Nuestra filosofía se basa en el respeto por los ingredientes y la pasión por la cocina auténtica.",
    'Seleccionamos cuidadosamente productos de proximidad, apoyando a productores locales para garantizar la máxima frescura. Cada receta es elaborada desde cero, buscando siempre el equilibrio perfecto que despierte los sentidos.',
    'Más que un restaurante, somos un espacio donde las historias se comparten, los brindis se multiplican y cada comida se convierte en una celebración de la gastronomía y la buena compañía.',
  ],
  valuesTitleA: 'Todo es personal',
  valuesBodyA:
    'Nuestra atención al cliente no es un proceso, es una oportunidad para conectar. Nos esforzamos por conocer a nuestros visitantes y hacerles sentir en casa.',
  valuesTitleB: 'Hecho desde cero',
  valuesBodyB:
    'Rechazamos los atajos. Nuestras salsas, marinados y bases para cócteles son preparados diariamente en nuestra cocina, garantizando sabores únicos e inigualables.',
  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?controls=1&mute=1',
};

export const defaultTeamMembers: SiteTeamMember[] = [
  {
    id: 'team-1',
    name: 'Carlos Rivera',
    role: 'CHEF EJECUTIVO',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    description:
      'Maestro culinario especializado en cocina fusión con más de 12 años de trayectoria. Pasión por los ingredientes locales y la técnica impecable.',
  },
  {
    id: 'team-2',
    name: 'Ana Soto',
    role: 'HEAD BARTENDER',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    description:
      'Experta en mixología de autor. Transforma sabores en experiencias sensoriales únicas detrás de la barra de Mandy\'s.',
  },
  {
    id: 'team-3',
    name: 'Luis Méndez',
    role: 'GERENTE',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600',
    description:
      'Liderazgo enfocado en la excelencia operativa y la satisfacción total de nuestros clientes. Garantiza que cada visita sea memorable.',
  },
  {
    id: 'team-4',
    name: 'Sofía Castro',
    role: 'EVENTOS',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
    description:
      'Coordinadora detallista dedicada a dar vida a tus celebraciones. Experta en transformar visiones en eventos realidad.',
  },
];

export const defaultFaqCategories: SiteFaqCategory[] = [
  {
    title: 'Reservas',
    items: [
      {
        question: '¿Puedo llegar sin reservar?',
        answer: 'Sí, aceptamos clientes sin reserva, pero recomendamos reservar los fines de semana.',
      },
      {
        question: '¿Con cuánta anticipación debo reservar?',
        answer: 'Sugerimos al menos 24 horas de anticipación para asegurar su mesa.',
      },
    ],
  },
  {
    title: 'Servicios',
    items: [
      {
        question: '¿Tienen WiFi?',
        answer: 'Sí, ofrecemos WiFi gratuito de alta velocidad para todos nuestros clientes.',
      },
      {
        question: '¿Cuentan con parqueo?',
        answer: 'Sí, disponemos de amplio parqueo privado y seguro.',
      },
    ],
  },
  {
    title: 'Bar y bebidas',
    items: [
      {
        question: '¿Qué tipo de cócteles ofrecen?',
        answer: 'Ofrecemos mixología de autor, clásicos y opciones sin alcohol.',
      },
    ],
  },
  {
    title: 'Gastronomía',
    items: [
      {
        question: '¿Tienen opciones vegetarianas?',
        answer: 'Sí, contamos con un menú especial para vegetarianos y veganos.',
      },
    ],
  },
];

export const defaultContactContent: ContactContent = {
  title: ' Te esperamos',
  hours: [
    'Lunes, Miércoles, Jueves: 12 md – 11 pm',
    'Viernes, Sábado, Domingo: 12 md – 12 mn',
  ],
  closedDayLabel: 'Martes: Cerrado',
  address: 'Cañas, Guanacaste, Costa Rica',
  phone: '+506 8888-8888',
  instagramUrl: '#',
  facebookUrl: '#',
};

export const defaultEventsPageContent: EventsPageContent = {
  publicTag: "Experiencias Mandy's",
  publicTitle: 'Eventos para Todo Público',
  publicDescription:
    'Disfruta de la mejor música en vivo, shows exclusivos y entretenimiento de primer nivel. ¡Abierto a todo el público!',
  privateTag: 'Celebraciones Privadas',
  privateTitle: 'RESERVA TU LUGAR & CELEBRA EN GRANDE',
  privateDescription:
    'Cumpleaños, aniversarios, eventos corporativos o simplemente una reunión con amigos. Tenemos el espacio ideal para cada momento.',
  privateButtonLabel: 'Empieza a Planear',
};

export const defaultGalleryPageContent: GalleryPageContent = {
  heroTag: "Mandy's Bar & Restaurante",
  heroTitle: 'GALERÍA',
  heroAccent: 'EXPLORER',
  heroDescription:
    'Vive la intensidad de nuestros sabores y la magia de nuestro refugio. Momentos capturados en la convergencia del arte y la gastronomía.',
  ctaTitle: '¿Listo para la experiencia real?',
  ctaButtonLabel: 'Haz tu Reserva',
};

export const defaultPrivateEventTemplates: SiteEvent[] = [
  {
    id: 'private-birthday',
    slug: 'birthday',
    kind: 'PRIVATE_TEMPLATE',
    title: 'Cumpleaños',
    description: 'Celebración personalizada para cumpleaños.',
    image_url: '/images/event_birthday.jpg',
    price: 45000,
    order_index: 0,
    active: true,
  },
  {
    id: 'private-party',
    slug: 'party',
    kind: 'PRIVATE_TEMPLATE',
    title: 'Fiesta',
    description: 'Espacio ideal para fiestas privadas y encuentros especiales.',
    image_url: '/images/event_party.jpg',
    price: 35000,
    order_index: 1,
    active: true,
  },
  {
    id: 'private-meeting',
    slug: 'meeting',
    kind: 'PRIVATE_TEMPLATE',
    title: 'Reunión',
    description: 'Ambiente reservado para reuniones y encuentros empresariales.',
    image_url: '/images/event_meeting.jpg',
    price: 75000,
    order_index: 2,
    active: true,
  },
  {
    id: 'private-wedding',
    slug: 'wedding',
    kind: 'PRIVATE_TEMPLATE',
    title: 'Boda',
    description: 'Experiencia especial para bodas y celebraciones memorables.',
    image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    price: 120000,
    order_index: 3,
    active: true,
  },
];

export const defaultPublicEvents: SiteEvent[] = [
  {
    id: 'public-friday-1',
    slug: 'viernes-1',
    kind: 'PUBLIC_PROGRAM',
    title: 'Música en Vivo: Grupo Melao',
    day_label: 'VIERNES',
    display_date: '24 de febrero',
    start_time: '8:00 p. m.',
    order_index: 0,
    active: true,
  },
  {
    id: 'public-friday-2',
    slug: 'viernes-2',
    kind: 'PUBLIC_PROGRAM',
    title: 'DJ Set: Noches de Reggaeton',
    day_label: 'VIERNES',
    display_date: '24 de febrero',
    start_time: '10:00 p. m.',
    order_index: 1,
    active: true,
  },
  {
    id: 'public-saturday-1',
    slug: 'sabado-1',
    kind: 'PUBLIC_PROGRAM',
    title: 'Acústico: Juan Gabriel cover',
    day_label: 'SÁBADO',
    display_date: '25 de febrero',
    start_time: '7:00 p. m.',
    order_index: 2,
    active: true,
  },
  {
    id: 'public-saturday-2',
    slug: 'sabado-2',
    kind: 'PUBLIC_PROGRAM',
    title: 'Banda de Rock: Los Renegados',
    day_label: 'SÁBADO',
    display_date: '25 de febrero',
    start_time: '9:30 p. m.',
    order_index: 3,
    active: true,
  },
  {
    id: 'public-sunday-1',
    slug: 'domingo-1',
    kind: 'PUBLIC_PROGRAM',
    title: 'Tarde de Karaoke',
    day_label: 'DOMINGO',
    display_date: '26 de febrero',
    start_time: '1:00 p. m.',
    order_index: 4,
    active: true,
  },
  {
    id: 'public-sunday-2',
    slug: 'domingo-2',
    kind: 'PUBLIC_PROGRAM',
    title: 'Especial de Marimba',
    day_label: 'DOMINGO',
    display_date: '26 de febrero',
    start_time: '4:00 p. m.',
    order_index: 5,
    active: true,
  },
];

export const defaultGalleryItems: GalleryContentItem[] = [
  { id: 'gallery-1', title: 'Fachada Restaurante Madera', alt_text: 'Fachada Restaurante Madera', category: 'lugar', image_url: '/images/paisajes/paisaje_1_nuevo.webp', aspect: 'landscape', order_index: 0, active: true },
  { id: 'gallery-2', title: "Rótulo Principal Mandy's", alt_text: "Rótulo Principal Mandy's", category: 'lugar', image_url: '/images/paisajes/slide1_mandy_sign.webp', aspect: 'landscape', order_index: 1, active: true },
  { id: 'gallery-3', title: 'Salón comedor Interno', alt_text: 'Salón comedor Interno', category: 'lugar', image_url: '/images/paisajes/slide2_tables.webp', aspect: 'landscape', order_index: 2, active: true },
  { id: 'gallery-4', title: 'Escenario de Conciertos en Vivo', alt_text: 'Escenario de Conciertos en Vivo', category: 'lugar', image_url: '/images/paisajes/slide3_band.webp', aspect: 'landscape', order_index: 3, active: true },
  { id: 'gallery-5', title: 'Decoración Temática: Fiesta de XV Años', alt_text: 'Decoración Temática: Fiesta de XV Años', category: 'eventos', image_url: '/images/paisajes_3/paisaje_3_1.webp', aspect: 'portrait', order_index: 4, active: true },
  { id: 'gallery-6', title: 'Baile de Gala - Celebración XV Años', alt_text: 'Baile de Gala - Celebración XV Años', category: 'eventos', image_url: '/images/paisajes_3/paisaje_3_2.webp', aspect: 'portrait', order_index: 5, active: true },
  { id: 'gallery-7', title: 'Brindis de Cumpleaños Especial', alt_text: 'Brindis de Cumpleaños Especial', category: 'eventos', image_url: '/images/paisajes_3/paisaje_3_3.webp', aspect: 'portrait', order_index: 6, active: true },
  { id: 'gallery-8', title: "Nachos Supremos Mandy's", alt_text: "Nachos Supremos Mandy's", category: 'comida', image_url: '/images/paisaje_1/paisaje_1_1.webp', aspect: 'landscape', order_index: 7, active: true },
  { id: 'gallery-9', title: 'Arroz con Pollo y Ensalada Fresh', alt_text: 'Arroz con Pollo y Ensalada Fresh', category: 'comida', image_url: '/images/paisaje_1/paisaje_1_2.webp', aspect: 'landscape', order_index: 8, active: true },
  { id: 'gallery-10', title: 'Café y Tortilla con Vista al Atardecer', alt_text: 'Café y Tortilla con Vista al Atardecer', category: 'comida', image_url: '/images/paisaje_1/paisaje_1_3.webp', aspect: 'portrait', order_index: 9, active: true },
  { id: 'gallery-11', title: "Ensalada Fresh Mandy's", alt_text: "Ensalada Fresh Mandy's", category: 'comida', image_url: '/images/paisaje_1/paisaje_1_4.webp', aspect: 'landscape', order_index: 10, active: true },
  { id: 'gallery-12', title: 'Fajitas de Res y Pollo Especiales', alt_text: 'Fajitas de Res y Pollo Especiales', category: 'comida', image_url: '/images/paisaje_1/WhatsApp Image 2026-02-20 at 00.05.dd33.webp', aspect: 'portrait', order_index: 11, active: true },
  { id: 'gallery-13', title: 'Especialidad en Salsa Blanca Mandy’s', alt_text: 'Especialidad en Salsa Blanca Mandy’s', category: 'comida', image_url: '/images/paisaje_1/WhatsApp Image 2026-02-20 at 0sss0.05.33.webp', aspect: 'portrait', order_index: 12, active: true },
  { id: 'gallery-14', title: 'Smoothie de Fresa y Maracuyá', alt_text: 'Smoothie de Fresa y Maracuyá', category: 'bebida', image_url: '/images/paisaje_2/paisaje_2_1.webp', aspect: 'portrait', order_index: 13, active: true },
  { id: 'gallery-15', title: 'Piña Colada Especial', alt_text: 'Piña Colada Especial', category: 'bebida', image_url: '/images/paisaje_2/paisaje_2_2.webp', aspect: 'portrait', order_index: 14, active: true },
  { id: 'gallery-16', title: 'Nachos de Carne Crujientes', alt_text: 'Nachos de Carne Crujientes', category: 'comida', image_url: '/images/menu/Nachos de carne.webp', aspect: 'portrait', order_index: 15, active: true },
  { id: 'gallery-17', title: 'Chifrijo Tradicional', alt_text: 'Chifrijo Tradicional', category: 'comida', image_url: '/images/menu/Chifrijo mixto.webp', aspect: 'portrait', order_index: 16, active: true },
  { id: 'gallery-18', title: 'Canasta de Patacones', alt_text: 'Canasta de Patacones', category: 'comida', image_url: '/images/menu/Canasta de patacones.webp', aspect: 'portrait', order_index: 17, active: true },
  { id: 'gallery-19', title: 'Ceviche de Pescado', alt_text: 'Ceviche de Pescado', category: 'comida', image_url: '/images/menu/Ceviche de pescado grande.webp', aspect: 'portrait', order_index: 18, active: true },
  { id: 'gallery-20', title: 'Cóctel El Duende', alt_text: 'Cóctel El Duende', category: 'bebida', image_url: '/images/menu/Duende.webp', aspect: 'portrait', order_index: 19, active: true },
  { id: 'gallery-21', title: 'Margarita Frozen', alt_text: 'Margarita Frozen', category: 'bebida', image_url: '/images/menu/Margarita de fresa.webp', aspect: 'portrait', order_index: 20, active: true },
  { id: 'gallery-22', title: 'Michelada Imperial', alt_text: 'Michelada Imperial', category: 'bebida', image_url: '/images/menu/Michelada mexicana.webp', aspect: 'portrait', order_index: 21, active: true },
];

export const defaultSiteContent: PublicSiteContent = {
  navbarLinks: defaultNavbarLinks,
  about: defaultAboutContent,
  teamMembers: defaultTeamMembers,
  faqCategories: defaultFaqCategories,
  contact: defaultContactContent,
  eventsPage: defaultEventsPageContent,
  galleryPage: defaultGalleryPageContent,
  publicEvents: defaultPublicEvents,
  privateEventTemplates: defaultPrivateEventTemplates,
  galleryItems: defaultGalleryItems,
};

export const defaultEventPriceMap: Record<string, number> = {
  ...Object.fromEntries(
    defaultPrivateEventTemplates.map((event) => [event.slug, event.price ?? 30000]),
  ),
  mesa: 0,
};

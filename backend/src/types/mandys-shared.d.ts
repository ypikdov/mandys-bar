declare module '@mandys/shared' {
  export interface NavbarDropdownLink {
    label: string;
    path: string;
  }

  export interface NavbarLink {
    label: string;
    path: string;
    dropdown?: NavbarDropdownLink[];
  }

  export interface AboutContent {
    historyTitle: string;
    historyParagraphs: string[];
    valuesTitleA: string;
    valuesBodyA: string;
    valuesTitleB: string;
    valuesBodyB: string;
    videoUrl: string;
  }

  export interface SiteTeamMember {
    id: string;
    name: string;
    role: string;
    image: string;
    description: string;
  }

  export interface SiteFaqItem {
    question: string;
    answer: string;
  }

  export interface SiteFaqCategory {
    title: string;
    items: SiteFaqItem[];
  }

  export interface ContactContent {
    title: string;
    hours: string[];
    closedDayLabel: string;
    address: string;
    phone: string;
    instagramUrl: string;
    facebookUrl: string;
  }

  export type SiteEventKind = 'PUBLIC_PROGRAM' | 'PRIVATE_TEMPLATE';

  export interface SiteEvent {
    id: string;
    slug: string;
    kind: SiteEventKind;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    day_label?: string | null;
    display_date?: string | null;
    start_time?: string | null;
    image_url?: string | null;
    price?: number | null;
    order_index: number;
    active: boolean;
  }

  export interface GalleryContentItem {
    id: string;
    title: string;
    alt_text: string;
    category: string;
    image_url: string;
    rotation?: number | null;
    aspect?: string | null;
    object_position?: string | null;
    order_index: number;
    active: boolean;
  }

  export interface EventsPageContent {
    publicTag: string;
    publicTitle: string;
    publicDescription: string;
    privateTag: string;
    privateTitle: string;
    privateDescription: string;
    privateButtonLabel: string;
  }

  export interface GalleryPageContent {
    heroTag: string;
    heroTitle: string;
    heroAccent: string;
    heroDescription: string;
    ctaTitle: string;
    ctaButtonLabel: string;
  }

  export interface PublicSiteContent {
    navbarLinks: NavbarLink[];
    about: AboutContent;
    teamMembers: SiteTeamMember[];
    faqCategories: SiteFaqCategory[];
    contact: ContactContent;
    eventsPage: EventsPageContent;
    galleryPage: GalleryPageContent;
    publicEvents: SiteEvent[];
    privateEventTemplates: SiteEvent[];
    galleryItems: GalleryContentItem[];
  }
}

import type { ComponentType } from 'react';

type PublicPageKey = 'home' | 'menu' | 'events' | 'gallery' | 'about' | 'contact' | 'profile';
type PublicPageModule = { default: ComponentType };

const publicPageLoaders: Record<PublicPageKey, () => Promise<PublicPageModule>> = {
  home: () => import('@/pages/Home').then((module) => ({ default: module.Home })),
  menu: () => import('@/modules/menu/pages/MenuPage').then((module) => ({ default: module.Menu })),
  events: () => import('@/modules/events/pages/EventsPage').then((module) => ({ default: module.Events })),
  gallery: () => import('@/modules/gallery/pages/GalleryPage').then((module) => ({ default: module.Gallery })),
  about: () => import('@/modules/about/pages/AboutPage').then((module) => ({ default: module.About })),
  contact: () => import('@/modules/contact/pages/ContactPage').then((module) => ({ default: module.Contact })),
  profile: () => import('@/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
};

const publicPagePromises: Partial<Record<PublicPageKey, Promise<PublicPageModule>>> = {};

export const loadPublicPage = (page: PublicPageKey) => {
  publicPagePromises[page] ??= publicPageLoaders[page]().catch((error) => {
    delete publicPagePromises[page];
    throw error;
  });

  return publicPagePromises[page]!;
};

export const preloadPublicPage = (page: PublicPageKey) => {
  void loadPublicPage(page);
};

export const preloadPublicPages = (pages: PublicPageKey[]) => {
  pages.forEach(preloadPublicPage);
};

export const preloadPublicPageByPath = (path: string) => {
  const normalizedPath = path.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  if (normalizedPath === '/') return preloadPublicPage('home');
  if (normalizedPath.startsWith('/menu')) return preloadPublicPage('menu');
  if (normalizedPath.startsWith('/eventos')) return preloadPublicPage('events');
  if (normalizedPath.startsWith('/galeria')) return preloadPublicPage('gallery');
  if (normalizedPath.startsWith('/acerca')) return preloadPublicPage('about');
  if (normalizedPath.startsWith('/contacto')) return preloadPublicPage('contact');
  if (normalizedPath.startsWith('/perfil')) return preloadPublicPage('profile');
};

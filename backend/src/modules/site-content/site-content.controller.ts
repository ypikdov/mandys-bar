import { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';
import {
  classifyDatabaseError,
  getDatabaseProviderCode,
  getDatabaseUnavailableMessage,
} from '../../lib/databaseDiagnostics.js';
import {
  buildPaginatedResponse,
  parsePaginationParams,
} from '../../utils/pagination.js';
import {
  buildRequestCacheKey,
  cacheJsonPayload,
  getAuthRequestCacheScope,
  sendCachedJson,
} from '../../utils/httpCache.js';
import {
  defaultAboutContent,
  defaultContactContent,
  defaultEventPriceMap,
  defaultEventsPageContent,
  defaultFaqCategories,
  defaultGalleryItems,
  defaultGalleryPageContent,
  defaultNavbarLinks,
  defaultPrivateEventTemplates,
  defaultPublicEvents,
  defaultSiteContent,
  defaultTeamMembers,
} from './site-content.defaults.js';

type SiteContentResponse = typeof defaultSiteContent;

let publicSiteContentCache:
  | {
      content: SiteContentResponse;
      serialized: string;
    }
  | null = null;

let publicSiteContentInFlight: Promise<SiteContentResponse> | null = null;

const galleryPageCache = new NodeCache({ stdTTL: 30, checkperiod: 60 });
const adminSiteContentCache = new NodeCache({ stdTTL: 15, checkperiod: 30 });

const INTERNAL_URL_BASE = 'https://mandys.local';

const collapsePathSlashes = (value: string) =>
  value.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
const decodeRoutePath = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const normalizeRoutePath = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const normalizeInternalPath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(trimmed)) {
    return null;
  }

  try {
    const candidate = new URL(trimmed, INTERNAL_URL_BASE);
    if (candidate.origin !== INTERNAL_URL_BASE) {
      return null;
    }

    const normalizedPath = normalizeRoutePath(
      collapsePathSlashes(decodeRoutePath(candidate.pathname)),
    );
    if (!normalizedPath.startsWith('/')) {
      return null;
    }

    return normalizedPath === '/' ? normalizedPath : normalizedPath.replace(/\/+$/, '');
  } catch {
    return null;
  }
};

const normalizeExternalUrl = (
  value: string,
  options?: { allowHash?: boolean },
) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed === '#' && options?.allowHash) return '#';

  try {
    const candidate = new URL(trimmed);
    return candidate.protocol === 'http:' || candidate.protocol === 'https:'
      ? candidate.toString()
      : null;
  } catch {
    return null;
  }
};

const internalPathSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => normalizeInternalPath(value) !== null, {
    message: 'La ruta debe ser interna y relativa al sitio.',
  })
  .transform((value) => normalizeInternalPath(value)!);

const externalUrlSchema = (options?: { allowHash?: boolean }) =>
  z
    .string()
    .trim()
    .min(1)
    .refine((value) => normalizeExternalUrl(value, options) !== null, {
      message: 'La URL debe usar http o https.',
    })
    .transform((value) => normalizeExternalUrl(value, options)!);

const navbarDropdownLinkSchema = z.object({
  label: z.string().trim().min(1),
  path: internalPathSchema,
});

const navbarLinkSchema = z.object({
  label: z.string().trim().min(1),
  path: internalPathSchema,
  dropdown: z.array(navbarDropdownLinkSchema).optional().default([]),
});

const aboutContentSchema = z.object({
  historyTitle: z.string().trim().min(1),
  historyParagraphs: z.array(z.string().trim().min(1)).min(1),
  valuesTitleA: z.string().trim().min(1),
  valuesBodyA: z.string().trim().min(1),
  valuesTitleB: z.string().trim().min(1),
  valuesBodyB: z.string().trim().min(1),
  videoUrl: externalUrlSchema(),
});

const teamMemberSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  image: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

const faqItemSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

const faqCategorySchema = z.object({
  title: z.string().trim().min(1),
  items: z.array(faqItemSchema).min(1),
});

const contactContentSchema = z.object({
  title: z.string().trim().min(1),
  hours: z.array(z.string().trim().min(1)).min(1),
  closedDayLabel: z.string().trim().min(1),
  address: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  instagramUrl: externalUrlSchema({ allowHash: true }),
  facebookUrl: externalUrlSchema({ allowHash: true }),
});

const eventsPageContentSchema = z.object({
  publicTag: z.string().trim().min(1),
  publicTitle: z.string().trim().min(1),
  publicDescription: z.string().trim().min(1),
  privateTag: z.string().trim().min(1),
  privateTitle: z.string().trim().min(1),
  privateDescription: z.string().trim().min(1),
  privateButtonLabel: z.string().trim().min(1),
});

const galleryPageContentSchema = z.object({
  heroTag: z.string().trim().min(1),
  heroTitle: z.string().trim().min(1),
  heroAccent: z.string().trim().min(1),
  heroDescription: z.string().trim().min(1),
  ctaTitle: z.string().trim().min(1),
  ctaButtonLabel: z.string().trim().min(1),
});

const siteEventSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  kind: z.enum(['PUBLIC_PROGRAM', 'PRIVATE_TEMPLATE']),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  day_label: z.string().trim().optional().nullable(),
  display_date: z.string().trim().optional().nullable(),
  start_time: z.string().trim().optional().nullable(),
  image_url: z.string().trim().optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  order_index: z.number().int().nonnegative(),
  active: z.boolean(),
});

const galleryItemSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  alt_text: z.string().trim().min(1),
  category: z.string().trim().min(1),
  image_url: z.string().trim().min(1),
  rotation: z.number().int().optional().nullable(),
  aspect: z.string().trim().optional().nullable(),
  object_position: z.string().trim().optional().nullable(),
  order_index: z.number().int().nonnegative(),
  active: z.boolean(),
});

const siteContentPayloadSchema = z.object({
  navbarLinks: z.array(navbarLinkSchema).min(1),
  about: aboutContentSchema,
  teamMembers: z.array(teamMemberSchema).min(1),
  faqCategories: z.array(faqCategorySchema).min(1),
  contact: contactContentSchema,
  eventsPage: eventsPageContentSchema,
  galleryPage: galleryPageContentSchema,
  publicEvents: z.array(siteEventSchema),
  privateEventTemplates: z.array(siteEventSchema),
  galleryItems: z.array(galleryItemSchema),
});

const parseArraySettings = <T>(
  value: unknown,
  itemSchema: z.ZodType<T>,
  fallback: T[],
) => {
  if (!Array.isArray(value)) return fallback;
  const parsed = value
    .map((entry) => itemSchema.safeParse(entry))
    .filter((result): result is z.ZodSafeParseSuccess<T> => result.success)
    .map((result) => result.data);

  return parsed.length > 0 ? parsed : fallback;
};

const parseObjectSettings = <T extends object>(
  value: unknown,
  schema: z.ZodType<T>,
  fallback: T,
) => {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }

  const source = value as Record<string, unknown>;
  const merged = { ...(fallback as Record<string, unknown>), ...source } as T;
  const mergedParsed = schema.safeParse(merged);
  if (mergedParsed.success) return mergedParsed.data;

  const next: Record<string, unknown> = { ...(fallback as Record<string, unknown>) };
  for (const [key, defaultValue] of Object.entries(fallback as Record<string, unknown>)) {
    const candidate = source[key];
    if (candidate == null) continue;

    if (typeof defaultValue === 'string') {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        next[key] = candidate;
      }
      continue;
    }

    if (typeof defaultValue === 'number') {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        next[key] = candidate;
      }
      continue;
    }

    if (typeof defaultValue === 'boolean') {
      if (typeof candidate === 'boolean') {
        next[key] = candidate;
      }
      continue;
    }

    if (Array.isArray(defaultValue)) {
      if (Array.isArray(candidate) && candidate.length > 0) {
        next[key] = candidate;
      }
      continue;
    }

    if (defaultValue && typeof defaultValue === 'object') {
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        next[key] = candidate;
      }
      continue;
    }
  }

  const recovered = schema.safeParse(next as T);
  return recovered.success ? recovered.data : fallback;
};

const parseFaqCategoriesValue = (value: unknown, fallback: z.infer<typeof faqCategorySchema>[]) => {
  if (!Array.isArray(value)) return fallback;
  const parsed = value
    .map((entry) => {
      const result = faqCategorySchema.safeParse(entry);
      if (result.success) return result.data;
      if (!entry || typeof entry !== 'object') return null;

      const title = typeof (entry as { title?: unknown }).title === 'string'
        ? (entry as { title: string }).title.trim()
        : '';
      const itemsSource = Array.isArray((entry as { items?: unknown }).items)
        ? (entry as { items: unknown[] }).items
        : [];
      const items = itemsSource
        .map((item) => faqItemSchema.safeParse(item))
        .filter((itemResult): itemResult is z.ZodSafeParseSuccess<z.infer<typeof faqItemSchema>> => itemResult.success)
        .map((itemResult) => itemResult.data);

      if (!title || items.length === 0) return null;
      return { title, items };
    })
    .filter((entry): entry is z.infer<typeof faqCategorySchema> => Boolean(entry));

  return parsed.length > 0 ? parsed : fallback;
};

const MOJIBAKE_REPLACEMENTS: Array<[string, string]> = [
  ['Ã¡', 'á'],
  ['Ã©', 'é'],
  ['Ã­', 'í'],
  ['Ã³', 'ó'],
  ['Ãº', 'ú'],
  ['Ã', 'Á'],
  ['Ã‰', 'É'],
  ['Ã', 'Í'],
  ['Ã“', 'Ó'],
  ['Ãš', 'Ú'],
  ['Ã±', 'ñ'],
  ['Ã‘', 'Ñ'],
  ['Â¿', '¿'],
  ['Â¡', '¡'],
  ['Â·', '·'],
  ['â€“', '–'],
  ['â€”', '—'],
  ['â€œ', '“'],
  ['â€', '”'],
  ['â€˜', '‘'],
  ['â€™', '’'],
];

const applyMojibakeReplacements = (value: string) =>
  MOJIBAKE_REPLACEMENTS.reduce((current, [from, to]) => current.split(from).join(to), value);

const decodeMojibake = (value: string) => {
  let current = value;

  for (let pass = 0; pass < 3; pass += 1) {
    if (!/[\u00C3\u00C2]/.test(current)) break;
    try {
      const decoded = Buffer.from(current, 'latin1').toString('utf8');
      if (!decoded || decoded.includes('\uFFFD') || decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }

  return applyMojibakeReplacements(current);
};

const normalizeVisibleText = (value: string) =>
  decodeMojibake(value)
    .split('\n')
    .map((line) =>
      line
        .replace(/\uFFFD/g, '')
        .replace(/\bTtulo\b/gi, 'Título')
        .replace(/\bDescripcion\b/gi, 'Descripción')
        .replace(/\bCategoria\b/gi, 'Categoría')
        .replace(/\bTelefono\b/gi, 'Teléfono')
        .replace(/\bPublico\b/gi, 'Público')
        .replace(/\bGaleria\b/gi, 'Galería')
        .replace(/\bCafe\b/gi, 'Café')
        .replace(/\bT[ií]tulos\s+galer[ií]as?\b/gi, 'Título galería')
        .replace(/\bT[ií]tulo\s+galer[ií]as\b/gi, 'Título galería')
        .replace(/\bPart[ií]cula\b/gi, 'Imagen')
        .replace(/^\s*[¿?]+\s*(?=(MANDY'S|Redes)\b)/i, '')
        .replace(/¿?\s*Creo\b/gi, '')
        .replace(/^\s*[¿?¡!]*\s*Creo[:\-\s]*/gi, '')
        .replace(/\bTe esperanza\b/gi, 'Te esperamos')
        .replace(/\bEvento publico\b/gi, 'Evento público')
        .replace(/\bEvento privado\b/gi, 'Evento privado')
        .replace(/\u00C2·/g, '·')
        .replace(/\bde\s+de\b/gi, 'de')
        .replace(/\bImagen\s+(\d+)\s*\/{2,}\s*(\d+)\b/gi, 'Imagen $1/$2')
        .replace(/\s{2,}/g, ' ')
        .trim(),
    )
    .join('\n')
    .trim();

const sanitizeContentTree = <T>(value: T): T => {
  if (typeof value === 'string') return normalizeVisibleText(value) as T;
  if (Array.isArray(value)) return value.map((item) => sanitizeContentTree(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sanitizeContentTree(entry)]),
    ) as T;
  }
  return value;
};

const normalizeGalleryObjectPosition = (value?: string | null) => {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, ' ');
  switch (normalized) {
    case 'top':
    case 'arriba':
    case 'top center':
    case 'arriba centro':
      return 'top';
    case 'bottom':
    case 'abajo':
    case 'bottom center':
    case 'abajo centro':
      return 'bottom';
    case 'left':
    case 'izquierda':
      return 'left';
    case 'right':
    case 'derecha':
      return 'right';
    case 'center':
    case 'centro':
    default:
      return 'center';
  }
};

const withResolvedGalleryPosition = <T extends { object_position?: string | null }>(items: T[]) =>
  items.map((item) => ({
    ...item,
    object_position: normalizeGalleryObjectPosition(item.object_position),
  }));

const parseSiteEventRows = (items: unknown[]) =>
  items
    .map((item) => siteEventSchema.safeParse(item))
    .filter((result): result is z.ZodSafeParseSuccess<z.infer<typeof siteEventSchema>> => result.success)
    .map((result) => sanitizeContentTree(result.data));

const parseGalleryRows = (items: unknown[]) =>
  items
    .map((item) => galleryItemSchema.safeParse(item))
    .filter((result): result is z.ZodSafeParseSuccess<z.infer<typeof galleryItemSchema>> => result.success)
    .map((result) => sanitizeContentTree(result.data));

const buildSiteContent = async (includeInactive: boolean) => {
  const [settings, siteEvents, galleryItems] = await Promise.all([
    prisma.siteSetting.findMany({
      select: { key: true, value: true },
      where: {
        key: {
          in: [
            'navbar_links',
            'about_content',
            'team_members',
            'faq_categories',
            'contact_content',
            'events_page_content',
            'gallery_page_content',
          ],
        },
      },
    }),
    prisma.siteEvent.findMany({
      where: includeInactive ? undefined : { active: true },
      select: {
        id: true,
        slug: true,
        kind: true,
        title: true,
        subtitle: true,
        description: true,
        day_label: true,
        display_date: true,
        start_time: true,
        image_url: true,
        price: true,
        order_index: true,
        active: true,
        created_at: true,
      },
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }],
    }),
    prisma.galleryItem.findMany({
      where: includeInactive ? undefined : { active: true },
      select: {
        id: true,
        title: true,
        alt_text: true,
        category: true,
        image_url: true,
        rotation: true,
        aspect: true,
        object_position: true,
        order_index: true,
        active: true,
        created_at: true,
      },
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }],
    }),
  ]);

  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const parsedEvents = parseSiteEventRows(siteEvents);
  const parsedGallery = parseGalleryRows(galleryItems);
  const publicEvents = parsedEvents.filter((item) => item.kind === 'PUBLIC_PROGRAM');
  const privateEventTemplates = parsedEvents.filter((item) => item.kind === 'PRIVATE_TEMPLATE');

  return sanitizeContentTree({
    navbarLinks: parseArraySettings(settingsMap.get('navbar_links'), navbarLinkSchema, defaultNavbarLinks),
    about: parseObjectSettings(settingsMap.get('about_content'), aboutContentSchema, defaultAboutContent),
    teamMembers: parseArraySettings(settingsMap.get('team_members'), teamMemberSchema, defaultTeamMembers),
    faqCategories: parseFaqCategoriesValue(settingsMap.get('faq_categories'), defaultFaqCategories),
    contact: parseObjectSettings(settingsMap.get('contact_content'), contactContentSchema, defaultContactContent),
    eventsPage: parseObjectSettings(settingsMap.get('events_page_content'), eventsPageContentSchema, defaultEventsPageContent),
    galleryPage: parseObjectSettings(settingsMap.get('gallery_page_content'), galleryPageContentSchema, defaultGalleryPageContent),
    publicEvents: publicEvents.length > 0 ? publicEvents : defaultPublicEvents,
    privateEventTemplates: privateEventTemplates.length > 0 ? privateEventTemplates : defaultPrivateEventTemplates,
    galleryItems: withResolvedGalleryPosition(parsedGallery.length > 0 ? parsedGallery : defaultGalleryItems),
  });
};

export const readPublicSiteContent = async () => {
  if (publicSiteContentCache) {
    return publicSiteContentCache.content;
  }

  if (!publicSiteContentInFlight) {
    publicSiteContentInFlight = buildSiteContent(false).then((content) => {
      publicSiteContentCache = {
        content,
        serialized: JSON.stringify(content),
      };
      return content;
    });
  }

  try {
    return await publicSiteContentInFlight;
  } finally {
    publicSiteContentInFlight = null;
  }
};

const invalidatePublicSiteContentCache = () => {
  publicSiteContentCache = null;
  publicSiteContentInFlight = null;
  galleryPageCache.flushAll();
  adminSiteContentCache.flushAll();
};

export const primePublicSiteContentCache = async () => {
  await readPublicSiteContent();
};

type SiteContentPayload = z.infer<typeof siteContentPayloadSchema>;

const persistSiteContent = async (data: SiteContentPayload) => {
  await prisma.$transaction(async (tx) => {
    const settingsToUpsert = [
      { key: 'navbar_links', section: 'navbar', label: 'Links de navegación', value: data.navbarLinks },
      { key: 'about_content', section: 'about', label: 'Contenido Acerca de', value: data.about },
      { key: 'team_members', section: 'about', label: 'Equipo Acerca de', value: data.teamMembers },
      { key: 'faq_categories', section: 'about', label: 'FAQ Acerca de', value: data.faqCategories },
      { key: 'contact_content', section: 'contact', label: 'Contenido Contacto', value: data.contact },
      { key: 'events_page_content', section: 'events', label: 'Cabecera de Eventos', value: data.eventsPage },
      { key: 'gallery_page_content', section: 'gallery', label: 'Cabecera de Galería', value: data.galleryPage },
    ] as const;

    await Promise.all(
      settingsToUpsert.map((setting) =>
        tx.siteSetting.upsert({
          where: { key: setting.key },
          create: setting,
          update: {
            section: setting.section,
            label: setting.label,
            value: setting.value,
          },
        }),
      ),
    );

    await tx.siteEvent.deleteMany({});
    if (data.publicEvents.length + data.privateEventTemplates.length > 0) {
      await tx.siteEvent.createMany({
        data: [...data.publicEvents, ...data.privateEventTemplates].map((event) => ({
          id: event.id,
          slug: event.slug,
          kind: event.kind,
          title: event.title,
          subtitle: event.subtitle ?? null,
          description: event.description ?? null,
          day_label: event.day_label ?? null,
          display_date: event.display_date ?? null,
          start_time: event.start_time ?? null,
          image_url: event.image_url ?? null,
          price: event.price ?? null,
          order_index: event.order_index,
          active: event.active,
        })),
      });
    }

    await tx.galleryItem.deleteMany({});
    if (data.galleryItems.length > 0) {
      await tx.galleryItem.createMany({
        data: data.galleryItems.map((item) => ({
          id: item.id,
          title: item.title,
          alt_text: item.alt_text,
          category: item.category,
          image_url: item.image_url,
          rotation: item.rotation ?? null,
          aspect: item.aspect ?? null,
          object_position: normalizeGalleryObjectPosition(item.object_position),
          order_index: item.order_index,
          active: item.active,
        })),
      });
    }
  });

  invalidatePublicSiteContentCache();
  return buildSiteContent(true);
};

export const getResolvedEventPriceMap = async (): Promise<Record<string, number>> => {
  const templates = await prisma.siteEvent.findMany({
    where: { kind: 'PRIVATE_TEMPLATE', active: true },
    select: { slug: true, price: true },
  });

  if (templates.length === 0) {
    return defaultEventPriceMap;
  }

  return Object.fromEntries(
    templates.map((template) => [template.slug, template.price ?? defaultEventPriceMap[template.slug] ?? 30000]),
  ) as Record<string, number>;
};

export const getPublicSiteContent = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'private, max-age=300');

    const forceRefresh = req.query.refresh === 'true';
    if (!forceRefresh && publicSiteContentCache) {
      return res.type('application/json').send(publicSiteContentCache.serialized);
    }

    if (forceRefresh) {
      invalidatePublicSiteContentCache();
    }

    const content = await readPublicSiteContent();
    return res.json(content);
  } catch (error) {
    const reason = classifyDatabaseError(error);
    console.error('Error fetching public site content:', {
      reason,
      providerCode: getDatabaseProviderCode(error),
    });

    res.setHeader('Cache-Control', 'private, max-age=60');
    res.setHeader('X-Mandys-Data-Source', 'fallback');
    return res.status(200).json(defaultSiteContent);
  }
};

export const getPublicGalleryItems = async (req: Request, res: Response) => {
  const pagination = parsePaginationParams(req.query);
  const forceRefresh = req.query.refresh === 'true';
  const cacheKey = buildRequestCacheKey('site:public_gallery', req);

  try {
    if (!forceRefresh && sendCachedJson(galleryPageCache, cacheKey, res)) {
      return;
    }

    if (forceRefresh) {
      galleryPageCache.flushAll();
    }

    const [totalItems, rows] = await Promise.all([
      prisma.galleryItem.count({ where: { active: true } }),
      prisma.galleryItem.findMany({
        where: { active: true },
        select: {
          id: true,
          title: true,
          alt_text: true,
          category: true,
          image_url: true,
          rotation: true,
          aspect: true,
          object_position: true,
          order_index: true,
          active: true,
          created_at: true,
        },
        orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }],
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    const items = withResolvedGalleryPosition(parseGalleryRows(rows));

    if (totalItems > 0) {
      const payload = buildPaginatedResponse(items, totalItems, pagination);
      cacheJsonPayload(galleryPageCache, cacheKey, payload, 30);
      return res.json(payload);
    }

    const fallbackItems = defaultGalleryItems.slice(pagination.skip, pagination.skip + pagination.take);
    const payload = buildPaginatedResponse(fallbackItems, defaultGalleryItems.length, pagination);
    cacheJsonPayload(galleryPageCache, cacheKey, payload, 30);
    return res.json(payload);
  } catch (error) {
    const reason = classifyDatabaseError(error);
    console.error('Error fetching public gallery page:', {
      reason,
      providerCode: getDatabaseProviderCode(error),
    });

    res.setHeader('Cache-Control', 'private, max-age=60');
    res.setHeader('X-Mandys-Data-Source', 'fallback');
    const fallbackItems = defaultGalleryItems.slice(pagination.skip, pagination.skip + pagination.take);
    return res.status(200).json(buildPaginatedResponse(fallbackItems, defaultGalleryItems.length, pagination));
  }
};

export const getAdminSiteContent = async (req: Request, res: Response) => {
  try {
    const cacheKey = buildRequestCacheKey(
      'site:admin_content',
      req,
      getAuthRequestCacheScope(req),
    );

    if (sendCachedJson(adminSiteContentCache, cacheKey, res)) {
      return;
    }

    const content = await buildSiteContent(true);
    cacheJsonPayload(adminSiteContentCache, cacheKey, content, 15);
    res.json(content);
  } catch (error) {
    const reason = classifyDatabaseError(error);
    console.error('Error fetching admin site content:', {
      reason,
      providerCode: getDatabaseProviderCode(error),
    });

    return res.status(503).json({
      error: getDatabaseUnavailableMessage(reason),
      reason,
      content: defaultSiteContent,
    });
  }
};

const draftIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const getPendingDrafts = async (_req: Request, res: Response) => {
  try {
    const drafts = await prisma.contentRevision.findMany({
      where: { estado: 'PENDING' },
      select: {
        id: true,
        created_at: true,
        author: true,
        section: true,
        estado: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({ drafts });
  } catch (error) {
    const reason = classifyDatabaseError(error);
    console.error('Error fetching pending site-content drafts:', {
      reason,
      providerCode: getDatabaseProviderCode(error),
    });
    return res.status(503).json({ error: getDatabaseUnavailableMessage(reason), reason });
  }
};

export const publishDraft = async (req: Request, res: Response) => {
  const parsedParams = draftIdParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: 'Identificador de borrador inválido.' });
  }

  try {
    const revision = await prisma.contentRevision.findUnique({
      where: { id: parsedParams.data.id },
    });

    if (!revision || revision.estado !== 'PENDING') {
      return res.status(404).json({ error: 'Borrador pendiente no encontrado.' });
    }

    const parsedContent = siteContentPayloadSchema.safeParse(revision.valor_nuevo);
    if (!parsedContent.success) {
      await prisma.contentRevision.update({
        where: { id: revision.id },
        data: { estado: 'REJECTED' },
      });
      return res.status(400).json({
        error: 'El borrador contiene datos inválidos y fue rechazado.',
        details: parsedContent.error.issues,
      });
    }

    const content = await persistSiteContent(sanitizeContentTree(parsedContent.data));
    await prisma.contentRevision.update({
      where: { id: revision.id },
      data: { estado: 'PUBLISHED' },
    });

    return res.json({
      message: 'Borrador publicado correctamente',
      content,
    });
  } catch (error) {
    const reason = classifyDatabaseError(error);
    console.error('Error publishing site-content draft:', {
      reason,
      providerCode: getDatabaseProviderCode(error),
    });
    return res.status(503).json({ error: getDatabaseUnavailableMessage(reason), reason });
  }
};

export const discardDraft = async (req: Request, res: Response) => {
  const parsedParams = draftIdParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: 'Identificador de borrador inválido.' });
  }

  try {
    const result = await prisma.contentRevision.updateMany({
      where: {
        id: parsedParams.data.id,
        estado: 'PENDING',
      },
      data: { estado: 'REJECTED' },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Borrador pendiente no encontrado.' });
    }

    return res.json({ message: 'Borrador descartado correctamente' });
  } catch (error) {
    const reason = classifyDatabaseError(error);
    console.error('Error discarding site-content draft:', {
      reason,
      providerCode: getDatabaseProviderCode(error),
    });
    return res.status(503).json({ error: getDatabaseUnavailableMessage(reason), reason });
  }
};

export const saveSiteContent = async (req: Request, res: Response) => {
  const parsedBody = siteContentPayloadSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      error: 'Datos inválidos para contenido web',
      details: parsedBody.error.issues,
    });
  }

  const data = sanitizeContentTree(parsedBody.data);

  try {
    const content = await persistSiteContent(data);
    return res.json({
      message: 'Contenido web actualizado correctamente',
      content,
    });
  } catch (error) {
    const reason = classifyDatabaseError(error);
    console.error('Error saving site content:', {
      reason,
      providerCode: getDatabaseProviderCode(error),
    });
    return res.status(503).json({ error: getDatabaseUnavailableMessage(reason), reason });
  }
};

import { apiFetch } from '@/lib/api';
import type { GalleryContentItem, PaginatedResponse, PublicSiteContent } from '@mandys/shared';

interface GetPublicSiteContentOptions {
  force?: boolean;
  ttlMs?: number;
}

interface GetGalleryPageOptions {
  page?: number;
  limit?: number;
}

const PUBLIC_SITE_CONTENT_TTL_MS = 300_000;

let cachedContent: PublicSiteContent | null = null;
let cachedAt = 0;
let inFlightRequest: Promise<PublicSiteContent> | null = null;
const SITE_CONTENT_STORAGE_KEY = 'mandys.public-site-content.v3';

const readStoredSiteContent = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SITE_CONTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { content: PublicSiteContent; cachedAt: number };
    if (!parsed?.content || typeof parsed.cachedAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeStoredSiteContent = (content: PublicSiteContent, timestamp: number) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({ content, cachedAt: timestamp }),
    );
  } catch {
    // ignore storage quota / privacy mode
  }
};

export function getCachedPublicSiteContentSnapshot(ttlMs = PUBLIC_SITE_CONTENT_TTL_MS): PublicSiteContent | null {
  const now = Date.now();
  const memoryIsFresh = cachedContent && now - cachedAt < ttlMs;
  if (memoryIsFresh) {
    return cachedContent;
  }

  const stored = readStoredSiteContent();
  if (!stored || now - stored.cachedAt >= ttlMs) {
    return null;
  }

  cachedContent = stored.content;
  cachedAt = stored.cachedAt;
  return stored.content;
}

export async function getPublicSiteContent(
  { force = false, ttlMs = PUBLIC_SITE_CONTENT_TTL_MS }: GetPublicSiteContentOptions = {},
): Promise<PublicSiteContent> {
  const now = Date.now();

  if (!force && cachedContent !== null && now - cachedAt < ttlMs) {
    return cachedContent;
  }

  if (!force) {
    const stored = getCachedPublicSiteContentSnapshot(ttlMs);
    if (stored) {
      return stored;
    }
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = (async () => {
    const response = await apiFetch(force ? '/api/site-content/public?refresh=true' : '/api/site-content/public');
    if (!response.ok) {
      throw new Error('Error obteniendo contenido publico');
    }

    const nextContent = (await response.json()) as PublicSiteContent;
    cachedContent = nextContent;
    cachedAt = Date.now();
    writeStoredSiteContent(nextContent, cachedAt);
    return nextContent;
  })();

  try {
    return await inFlightRequest;
  } finally {
    inFlightRequest = null;
  }
}

export async function getPublicGalleryPage({
  page = 1,
  limit = 10,
}: GetGalleryPageOptions = {}): Promise<PaginatedResponse<GalleryContentItem>> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiFetch(`/api/site-content/gallery?${query.toString()}`);

  if (!response.ok) {
    throw new Error('Error obteniendo galeria');
  }

  return response.json();
}

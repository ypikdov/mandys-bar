import type { Request, Response } from 'express';
import type NodeCache from 'node-cache';

type CacheableRequest = Request & {
  user?: {
    userId?: string;
    role?: string;
  };
};

export const buildRequestCacheKey = (
  prefix: string,
  req: Request,
  scope = 'public',
) => `${prefix}:${scope}:${req.originalUrl || req.url}`;

export const getAuthRequestCacheScope = (req: CacheableRequest) =>
  `${req.user?.role ?? 'anonymous'}:${req.user?.userId ?? 'anonymous'}`;

export const sendCachedJson = (cache: NodeCache, key: string, res: Response) => {
  const cachedJson = cache.get<string>(key);
  if (!cachedJson) return false;

  res.type('application/json').send(cachedJson);
  return true;
};

export const cacheJsonPayload = <T>(
  cache: NodeCache,
  key: string,
  payload: T,
  ttlSeconds?: number,
) => {
  const serialized = JSON.stringify(payload);

  if (typeof ttlSeconds === 'number') {
    cache.set(key, serialized, ttlSeconds);
  } else {
    cache.set(key, serialized);
  }

  return payload;
};

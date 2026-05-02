import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const WEBHOOK_SIGNATURE_PREFIX = 'sha256=';
const WEBHOOK_REPLAY_TOLERANCE_SECONDS = 300;

export const normalizeWebhookSignature = (signature: string) =>
  signature.startsWith(WEBHOOK_SIGNATURE_PREFIX)
    ? signature.slice(WEBHOOK_SIGNATURE_PREFIX.length)
    : signature;

export const createWebhookSignature = (secret: string, timestamp: string, rawBody: Buffer | string) =>
  crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest('hex');

export const safeCompareSignatures = (providedSignature: string, expectedSignature: string) => {
  const provided = Buffer.from(normalizeWebhookSignature(providedSignature), 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
};

const getHeaderValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const isTimestampFresh = (timestamp: string) => {
  const parsed = Number(timestamp);
  if (!Number.isFinite(parsed)) return false;

  const requestTime = parsed > 9999999999 ? Math.floor(parsed / 1000) : Math.floor(parsed);
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - requestTime) <= WEBHOOK_REPLAY_TOLERANCE_SECONDS;
};

export const verifyWebhookSignature = (req: Request, res: Response, next: NextFunction) => {
  const signature = getHeaderValue(req.headers['x-mandy-signature']);
  const timestamp = getHeaderValue(req.headers['x-mandy-timestamp']);
  const secret = process.env.WEBHOOK_SECRET;
  const requestId = req.id ?? 'unknown';
  const allowUnsignedWebhooks = process.env.ALLOW_UNSIGNED_WEBHOOKS === 'true' && process.env.NODE_ENV !== 'production';

  if (!secret) {
    if (allowUnsignedWebhooks) {
      console.warn(`[${requestId}] WEBHOOK_SECRET no configurado; webhook sin firma permitido solo en desarrollo.`);
      return next();
    }

    return res.status(503).json({ error: 'Webhooks no configurados de forma segura.' });
  }

  if (!signature) {
    return res.status(401).json({ error: 'Firma de webhook faltante.' });
  }

  if (!timestamp) {
    return res.status(401).json({ error: 'Timestamp de webhook faltante.' });
  }

  if (!isTimestampFresh(timestamp)) {
    console.warn(`[${requestId}] Webhook expirado o con timestamp invalido desde IP: ${req.ip}`);
    return res.status(401).json({ error: 'Webhook expirado.' });
  }

  if (!req.rawBody) {
    return res.status(400).json({ error: 'Cuerpo raw del webhook no disponible.' });
  }

  try {
    const digest = createWebhookSignature(secret, timestamp, req.rawBody);

    if (!safeCompareSignatures(signature, digest)) {
      console.warn(`[${requestId}] Intento de webhook con firma invalida desde IP: ${req.ip}`);
      return res.status(401).json({ error: 'Firma de webhook invalida.' });
    }

    return next();
  } catch (error) {
    console.error(`[${requestId}] Error en verificacion de firma de webhook:`, error);
    return res.status(401).json({ error: 'Error al procesar la firma del webhook.' });
  }
};

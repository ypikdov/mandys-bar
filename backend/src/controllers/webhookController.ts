import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';

const webhookPayloadSchema = z.object({
  event_id: z.string().trim().min(1).max(128),
  provider: z.string().trim().min(1).max(64),
  payload: z.unknown().optional(),
});

const getAllowedProviders = () =>
  (process.env.WEBHOOK_ALLOWED_PROVIDERS ?? '')
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);

export const handleGenericWebhook = async (req: Request, res: Response) => {
  const parsedBody = webhookPayloadSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: 'Payload de webhook invalido.', details: parsedBody.error.issues });
  }

  const { event_id, provider, payload } = parsedBody.data;
  const allowedProviders = getAllowedProviders();

  if (allowedProviders.length > 0 && !allowedProviders.includes(provider.toLowerCase())) {
    return res.status(403).json({ error: 'Proveedor de webhook no permitido.' });
  }

  if (process.env.NODE_ENV === 'production' && allowedProviders.length === 0) {
    return res.status(503).json({ error: 'Proveedores de webhook no configurados.' });
  }

  try {
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { event_id },
    });

    if (existingEvent) {
      console.log(`[${req.id ?? 'unknown'}] Webhook ignorado: evento duplicado (${event_id})`);
      return res.status(200).json({
        message: 'Evento ya procesado (Idempotencia)',
        status: existingEvent.status,
      });
    }

    await prisma.webhookEvent.create({
      data: {
        event_id,
        provider,
        payload: payload ?? {},
        status: 'PROCESSING',
      },
    });

    console.log(`[${req.id ?? 'unknown'}] Procesando webhook de ${provider}:`, payload);

    await prisma.webhookEvent.update({
      where: { event_id },
      data: { status: 'PROCESSED' },
    });

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error(`[${req.id ?? 'unknown'}] Error procesando webhook:`, error);

    try {
      await prisma.webhookEvent.update({
        where: { event_id },
        data: {
          status: 'FAILED',
          error_reason: (error as Error).message,
        },
      });
    } catch {
      // ignore audit update failure
    }

    return res.status(500).json({ error: 'Fallo interno al procesar webhook.' });
  }
};

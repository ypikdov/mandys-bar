import { Router } from 'express';
import { handleGenericWebhook } from '../controllers/webhookController.js';
import { verifyWebhookSignature } from '../middlewares/webhookAuth.js';

const router = Router();

/**
 * Endpoint para recibir webhooks de proveedores de pago/mensajería
 * Protegido por firma criptográfica
 */
router.post('/generic', verifyWebhookSignature, handleGenericWebhook);

export default router;

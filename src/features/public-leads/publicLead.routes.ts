import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../../lib/logger.js';
import { fieldErrorsFromZod, isHoneypotFilled, publicLeadSchema } from './publicLead.schema.js';
import { capturePublicLead, PublicLeadUnavailableError } from './publicLead.service.js';

export const publicLeadRoutes = Router();

const ACCEPTED_BODY = { ok: true as const };

/**
 * POST /api/public/leads
 * Endpoint público da landing. Sem authenticateToken / requireTenant.
 * O tenant é resolvido exclusivamente por LANDING_LEAD_ORGANIZATION_ID no servidor.
 */
publicLeadRoutes.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Honeypot primeiro: resposta idêntica ao sucesso, sem validar o restante
    // (evita dar sinal de quais campos o bot errou).
    if (isHoneypotFilled(req.body?.website)) {
      logger.info({ event: 'public_lead_honeypot' }, 'Public lead dropped by honeypot');
      res.status(202).json(ACCEPTED_BODY);
      return;
    }

    const parsed = publicLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: 'invalid_payload',
        fields: fieldErrorsFromZod(parsed.error),
      });
      return;
    }

    await capturePublicLead(parsed.data);
    res.status(202).json(ACCEPTED_BODY);
  } catch (err: unknown) {
    if (err instanceof PublicLeadUnavailableError) {
      res.status(503).json({ ok: false, error: 'unavailable' });
      return;
    }
    logger.error({ err, event: 'public_lead_unexpected' }, 'Public lead capture failed');
    res.status(503).json({ ok: false, error: 'unavailable' });
  }
});

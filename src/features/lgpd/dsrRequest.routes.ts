import { type Request, type Response, Router } from 'express';
import { logger } from '../../lib/logger.js';
import {
  DsrInvalidTokenError,
  DsrSubjectNotFoundError,
  DsrUnavailableError,
  createDataSubjectRequest,
  getDataSubjectRequestStatus,
  verifyDataSubjectRequest,
} from './dsrRequest.service.js';
import { dsrRequestSchema, dsrVerifySchema, fieldErrorsFromZod } from './dsrRequest.schema.js';

/**
 * Canal público de solicitação DSR (LGPD art. 18) — handoff 21→01.
 * Montado em `/api/public/data-subject-requests` SEM authenticateToken/requireTenant:
 * o titular ainda não tem conta. O tenant é resolvido no servidor
 * (LANDING_LEAD_ORGANIZATION_ID) dentro do service; rate limit dedicado em
 * rateLimiters.ts. Respostas sempre genéricas — nenhum endpoint revela se um
 * e-mail/protocolo existe (anti-enumeração).
 */
export const dsrRequestRoutes = Router();

function isDsrError(err: unknown): err is { statusCode: number; code: string } {
  return (
    err instanceof DsrUnavailableError ||
    err instanceof DsrInvalidTokenError ||
    err instanceof DsrSubjectNotFoundError ||
    (typeof err === 'object' &&
      err !== null &&
      'statusCode' in err &&
      'code' in err &&
      typeof (err as { statusCode: unknown }).statusCode === 'number')
  );
}

// POST / — registra a solicitação. 202 idêntico exista ou não o titular.
dsrRequestRoutes.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = dsrRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: 'invalid_payload',
        fields: fieldErrorsFromZod(parsed.error),
      });
      return;
    }

    await createDataSubjectRequest(parsed.data);
    // 'created' e 'no_subject' colapsam na MESMA resposta — a existência do
    // titular nunca é revelada no submit (o e-mail de verificação é o único
    // sinal, e ele só sai para e-mails realmente cadastrados).
    res.status(202).json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof DsrUnavailableError) {
      res.status(503).json({ ok: false, error: 'unavailable' });
      return;
    }
    logger.error({ err, event: 'dsr_request_unexpected' }, 'DSR request failed');
    res.status(503).json({ ok: false, error: 'unavailable' });
  }
});

// POST /verify — confere o token de uso único e executa o direito na hora.
dsrRequestRoutes.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = dsrVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: 'invalid_payload' });
      return;
    }

    const result = await verifyDataSubjectRequest(parsed.data);
    res.json({ ok: true, ...result });
  } catch (err: unknown) {
    if (isDsrError(err)) {
      res.status(err.statusCode).json({ ok: false, error: err.code });
      return;
    }
    logger.error({ err, event: 'dsr_verify_unexpected' }, 'DSR verify failed');
    res.status(503).json({ ok: false, error: 'unavailable' });
  }
});

// GET /status/:statusToken — acompanhamento pelo token opaco (só metadados).
dsrRequestRoutes.get('/status/:statusToken', async (req: Request, res: Response): Promise<void> => {
  try {
    const { statusToken } = req.params as { statusToken: string };
    const status = await getDataSubjectRequestStatus(statusToken);
    res.json({
      ok: true,
      protocol: status.protocol,
      rightType: status.rightType,
      status: status.status,
      createdAt: status.createdAt,
      verifiedAt: status.verifiedAt,
    });
  } catch (err: unknown) {
    if (isDsrError(err)) {
      res.status(err.statusCode).json({ ok: false, error: err.code });
      return;
    }
    logger.error({ err, event: 'dsr_status_unexpected' }, 'DSR status failed');
    res.status(503).json({ ok: false, error: 'unavailable' });
  }
});

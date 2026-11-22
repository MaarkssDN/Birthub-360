/**
 * Rotas da Central de Personagens e Agentes — `/api/agent/characters*`.
 *
 * Montado como sub-router dentro de `agent.routes.ts` (herda
 * authenticateToken + requireTenant + aiLimiter de `/api/agent`).
 *
 * Dados servidos são metadado de produto (catálogo) + estado de runtime
 * derivado de registros reais (COMMERCIAL_AGENT_REGISTRY, circuit breaker,
 * gate de concorrência, audit log do enxame) — nunca fabricados.
 */

import { type Request, type Response, Router } from 'express';
import type { AuthRequest } from '../../shared/middlewares/authenticateToken.js';
import { getSwarmAuditLogs } from '../intelligence/services/swarmAudit.service.js';
import { getSwarmConcurrencyState } from '../intelligence/services/swarmConcurrency.service.js';
import { getCharacterRuntimeEntry, listCharacterRuntime } from './characterRuntime.js';

const router = Router();

/** GET /api/agent/characters — catálogo dos 29 personagens + vínculo runtime real. */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const { organizationId } = (req as AuthRequest).user;
    const { getCircuitBreakerState } = await import(
      '../intelligence/services/autonomyCircuitBreaker.service.js'
    );
    const breaker = getCircuitBreakerState(organizationId);
    const breakerOpen = breaker?.state === 'OPEN';

    const characters = listCharacterRuntime().map(({ character, runtime }) => ({
      ...character,
      runtime: {
        ...runtime,
        // Circuit breaker OPEN degrada honestamente qualquer dispatch via swarm.
        status: breakerOpen && runtime.dispatch === 'swarm-stream' ? 'degraded' : runtime.status,
        reason:
          breakerOpen && runtime.dispatch === 'swarm-stream'
            ? 'Circuit breaker de autonomia aberto para esta organização'
            : runtime.reason,
      },
    }));

    res.json({
      success: true,
      data: {
        characters,
        swarm: {
          concurrency: getSwarmConcurrencyState(organizationId),
          circuitBreaker: breaker ? { state: breaker.state } : null,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/agent/characters/activity — execuções recentes do enxame (audit log real, escopo tenant). */
router.get('/activity', async (req: Request, res: Response, next) => {
  try {
    const { organizationId } = (req as AuthRequest).user;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const { logs, total } = await getSwarmAuditLogs({ organizationId, limit });
    res.json({ success: true, data: { logs, total } });
  } catch (err) {
    next(err);
  }
});

/** GET /api/agent/characters/concurrency — estado do gate de missões do enxame. */
router.get('/concurrency', async (req: Request, res: Response, next) => {
  try {
    const { organizationId } = (req as AuthRequest).user;
    res.json({
      success: true,
      data: getSwarmConcurrencyState(organizationId),
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/agent/characters/:id — detalhe de um personagem + vínculo runtime. */
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const { organizationId } = (req as AuthRequest).user;
    const entry = getCharacterRuntimeEntry(String(req.params.id));
    if (!entry) {
      res.status(404).json({ success: false, error: 'Personagem não encontrado.' });
      return;
    }
    res.json({
      success: true,
      data: {
        ...entry.character,
        runtime: entry.runtime,
        // Escopo do tenant sempre respeitado — activity é global do enxame,
        // nunca atribuída artificialmente a um personagem sem rastro real.
        recentActivity: await getSwarmAuditLogs({ organizationId, limit: 10 }),
      },
    });
  } catch (err) {
    next(err);
  }
});

export const characterRuntimeRoutes = router;

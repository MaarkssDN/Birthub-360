import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import { getTenantId } from '../lib/async-context.js';
import { agentQueue } from '../lib/queue/agent.worker.js';
import { leadsQueue } from '../lib/queue/index.js';
import { queuesEnabled } from '../lib/queue/redis.js';
import { searchQueue } from '../lib/queue/search.queue.js';
import { authenticateToken } from '../shared/middlewares/authenticateToken.js';
import { requireTenant } from '../shared/middlewares/authorization.js';
import { requirePlatformOperator } from '../shared/middlewares/requirePlatformOperator.js';
import { requireRole } from '../shared/middlewares/requireRole.js';

/**
 * Limitador específico da rota administrativa do BullBoard para mitigar abuso e
 * satisfazer análise estática de segurança (CodeQL: Missing rate limiting).
 */
const bullBoardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * SEC-003: Isolamento multi-tenant de dados de filas na origem (BullMQ).
 * Garante que dados de uma organização (Org B) não sejam enumerados ou
 * visualizados por usuários de outra organização (Org A) dentro do BullBoard.
 */
export class TenantIsolatedBullMQAdapter extends BullMQAdapter {
  public override async getJobs(jobTypes: any[], start?: number, end?: number): Promise<any[]> {
    const jobs = await super.getJobs(jobTypes, start, end);
    const tenantId = getTenantId();
    if (!tenantId) return jobs;

    return jobs.map((job) => this.sanitizeJobForTenant(job, tenantId));
  }

  public override async getJob(id: string): Promise<any> {
    const job = await super.getJob(id);
    if (!job) return job;
    const tenantId = getTenantId();
    if (!tenantId) return job;

    return this.sanitizeJobForTenant(job, tenantId);
  }

  private sanitizeJobForTenant(job: any, currentTenantId: string): any {
    if (!job?.data) return job;
    const jobOrgId = job.data.organizationId || job.data.tenantId;

    if (!jobOrgId || jobOrgId === currentTenantId) {
      return job;
    }

    return {
      ...job,
      data: {
        _redacted: true,
        organizationId: '[OUTRA ORGANIZAÇÃO]',
        message:
          'Isolamento multi-tenant (SEC-003): payload de job restrito à organização de origem.',
      },
    };
  }
}

export function mountBullBoard(app: Express): void {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  if (queuesEnabled && leadsQueue && searchQueue && agentQueue) {
    createBullBoard({
      queues: [
        new TenantIsolatedBullMQAdapter(leadsQueue as any),
        new TenantIsolatedBullMQAdapter(searchQueue as any),
        new TenantIsolatedBullMQAdapter(agentQueue as any),
      ],
      serverAdapter,
    });
  }

  app.use(
    '/admin/queues',
    bullBoardLimiter,
    authenticateToken,
    requireTenant,
    requireRole(['ADMIN']),
    requirePlatformOperator,
    serverAdapter.getRouter(),
  );
}

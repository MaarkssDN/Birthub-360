import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    organization: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma.js';
import { listActiveTenantIds } from './tenantRepository.js';

beforeEach(() => vi.clearAllMocks());

// Covers `.agents/handoffs/onda-4/10-para-02-sla-telemetria-overview.md` — the SLA sampler in
// `src/services/slaScheduler.ts` fans a `Metric` row out to every active tenant on each tick since
// `Metric.organizationId` is a required FK with no platform-wide sentinel row.
//
// Adaptado ao model canônico (handoff 01-para-12-voicehub-adaptacao-modelos-canonicos): "tenant"
// do voice-hub É `Organization` — não existe `Tenant`/`deletedAt`; toda organização persistida é
// uma organização ativa (remoção é hard delete governado).
describe('tenantRepository.listActiveTenantIds', () => {
  it('returns the ids of all organizations (canonical Organization has no soft-delete flag)', async () => {
    vi.mocked(prisma.organization.findMany).mockResolvedValue([{ id: 't1' }, { id: 't2' }] as any);

    const result = await listActiveTenantIds();

    expect(prisma.organization.findMany).toHaveBeenCalledWith({
      select: { id: true },
    });
    expect(result).toEqual(['t1', 't2']);
  });

  it('returns an empty array when there are no organizations (never fabricates one)', async () => {
    vi.mocked(prisma.organization.findMany).mockResolvedValue([] as any);

    const result = await listActiveTenantIds();

    expect(result).toEqual([]);
  });
});

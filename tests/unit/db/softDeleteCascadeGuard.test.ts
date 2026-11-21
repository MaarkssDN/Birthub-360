import { describe, expect, it, vi } from 'vitest';
import { executeSafeLeadSoftDelete } from '../../../src/lib/db/softDeleteCascadeGuard.js';

describe('[11 · Pietro] Soft Delete em lote para Activity e TimelineEvent (prevenção de lock cascade)', () => {
  it('arquiva Activities e TimelineEvents via soft delete antes de marcar o Lead como excluído', async () => {
    const callOrder: string[] = [];
    const port = {
      softDeleteActivitiesByLead: vi.fn(async () => {
        callOrder.push('activities');
        return 42;
      }),
      softDeleteTimelineByLead: vi.fn(async () => {
        callOrder.push('timeline');
        return 128;
      }),
      softDeleteLead: vi.fn(async () => {
        callOrder.push('lead');
        return true;
      }),
    };

    const result = await executeSafeLeadSoftDelete({
      tenantId: 'tenant-1',
      leadId: 'lead-99',
      deletedBy: 'user-admin-1',
      deleteReason: 'SOLICITACAO_COMERCIAL',
      port,
    });

    expect(callOrder).toEqual(['activities', 'timeline', 'lead']);
    expect(result).toEqual({
      leadSoftDeleted: true,
      activitiesArchivedCount: 42,
      timelineEventsArchivedCount: 128,
    });
  });
});

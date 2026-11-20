import { describe, it, expect, vi, beforeEach } from 'vitest';

const bitrixConnectionFindFirst = vi.fn();
const leadFindFirst = vi.fn();
const bitrixSyncLogCreate = vi.fn().mockResolvedValue({});

vi.mock('../../../../../src/lib/prisma.js', () => ({
  prisma: {
    bitrixConnection: {
      findFirst: (...args: unknown[]) => bitrixConnectionFindFirst(...args),
    },
    lead: {
      findFirst: (...args: unknown[]) => leadFindFirst(...args),
    },
    bitrixSyncLog: {
      create: (...args: unknown[]) => bitrixSyncLogCreate(...args),
    },
  },
}));

const callBitrixMock = vi.fn();
const getConnectionWebhookUrlMock = vi.fn();

vi.mock('../../../../../src/features/integrations/bitrix/service/client.js', () => ({
  callBitrix: (...args: unknown[]) => callBitrixMock(...args),
  getConnectionWebhookUrl: (...args: unknown[]) => getConnectionWebhookUrlMock(...args),
}));

const { syncActivityToBitrix, postCommentToBitrix } = await import(
  '../../../../../src/features/integrations/bitrix/service/outboundSync.js'
);

const WEBHOOK = 'https://bitrix.test/webhook/';

function mockLinkedLead() {
  bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
  getConnectionWebhookUrlMock.mockResolvedValue(WEBHOOK);
  leadFindFirst.mockResolvedValue({
    id: 'lead-1',
    bitrixLeadId: 'b-lead-99',
    bitrixDealId: null,
    contact: { phone: '11988887777', whatsapp: '11988887777', email: 'lead@teste.com' },
  });
}

describe('outboundSync — dedupRef e propagateErrors (handoff 16→06)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bitrixSyncLogCreate.mockResolvedValue({});
  });

  it('syncActivityToBitrix: dedupRef com marcador já existente em crm.activity.list NÃO chama crm.activity.add', async () => {
    mockLinkedLead();
    callBitrixMock.mockImplementation(async (_url: string, method: string) => {
      if (method === 'crm.activity.list') {
        return { result: [{ ID: 777, DESCRIPTION: 'Conteúdo anterior\n[ref:evt-x]' }] };
      }
      return { result: 1 };
    });

    const result = await syncActivityToBitrix(
      'org-1',
      'lead-1',
      { type: 'whatsapp', subject: 'Msg', description: 'oi', completed: true },
      { dedupRef: 'evt-x' },
    );

    expect(result).toEqual({ bitrixActivityId: 777 });
    expect(callBitrixMock).toHaveBeenCalledWith(
      WEBHOOK,
      'crm.activity.list',
      expect.objectContaining({
        filter: { OWNER_TYPE_ID: 1, OWNER_ID: 'b-lead-99' },
      }),
      expect.objectContaining({ maxAttempts: 1 }),
    );
    expect(callBitrixMock).not.toHaveBeenCalledWith(
      WEBHOOK,
      'crm.activity.add',
      expect.anything(),
      expect.anything(),
    );
  });

  it('syncActivityToBitrix: dedupRef sem marcador existente adiciona marcador [ref:] na DESCRIPTION', async () => {
    mockLinkedLead();
    callBitrixMock.mockImplementation(async (_url: string, method: string) => {
      if (method === 'crm.activity.list') return { result: [] };
      return { result: 555 };
    });

    const result = await syncActivityToBitrix(
      'org-1',
      'lead-1',
      { type: 'call', subject: 'Ligação', description: 'Resumo', completed: true },
      { dedupRef: 'evt-y' },
    );

    expect(result).toEqual({ bitrixActivityId: 555 });
    const addCall = callBitrixMock.mock.calls.find((c) => c[1] === 'crm.activity.add');
    expect(addCall).toBeTruthy();
    expect((addCall![2] as { fields: { DESCRIPTION: string } }).fields.DESCRIPTION).toContain(
      '[ref:evt-y]',
    );
  });

  it('syncActivityToBitrix: propagateErrors=true propaga falha; default retorna null', async () => {
    mockLinkedLead();
    callBitrixMock.mockRejectedValue(new Error('Bitrix API 500'));

    await expect(
      syncActivityToBitrix(
        'org-1',
        'lead-1',
        { type: 'whatsapp', subject: 'Msg' },
        { propagateErrors: true },
      ),
    ).rejects.toThrow('Bitrix API 500');

    const result = await syncActivityToBitrix('org-1', 'lead-1', {
      type: 'whatsapp',
      subject: 'Msg',
    });
    expect(result).toBeNull();
  });

  it('postCommentToBitrix: dedupRef com marcador em crm.timeline.comment.list NÃO chama comment.add', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    leadFindFirst.mockResolvedValue({ bitrixLeadId: null, bitrixDealId: 'b-deal-1' });
    callBitrixMock.mockImplementation(async (_url: string, method: string) => {
      if (method === 'crm.timeline.comment.list') {
        return { result: { comments: [{ COMMENT: 'Alerta anterior\n[ref:evt-c]' }] } };
      }
      return { result: 1 };
    });

    const result = await postCommentToBitrix('org-1', 'lead-1', 'comentário', {
      dedupRef: 'evt-c',
    });

    expect(result).toEqual({ entityType: 'deal', bitrixRecordId: 'b-deal-1' });
    expect(callBitrixMock).toHaveBeenCalledWith(
      WEBHOOK,
      'crm.timeline.comment.list',
      expect.objectContaining({
        filter: { ENTITY_ID: 'b-deal-1', ENTITY_TYPE: 'deal' },
      }),
      expect.objectContaining({ maxAttempts: 1 }),
    );
    expect(
      callBitrixMock.mock.calls.some((c) => c[1] === 'crm.timeline.comment.add'),
    ).toBe(false);
  });

  it('postCommentToBitrix: dedupRef sem marcador existente adiciona marcador [ref:] no COMMENT', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    leadFindFirst.mockResolvedValue({ bitrixLeadId: 'b-lead-7', bitrixDealId: null });
    callBitrixMock.mockImplementation(async (_url: string, method: string) => {
      if (method === 'crm.timeline.comment.list') return { result: { comments: [] } };
      return { result: 1 };
    });

    const result = await postCommentToBitrix('org-1', 'lead-1', 'comentário', {
      dedupRef: 'evt-d',
    });

    expect(result).toEqual({ entityType: 'lead', bitrixRecordId: 'b-lead-7' });
    const addCall = callBitrixMock.mock.calls.find((c) => c[1] === 'crm.timeline.comment.add');
    expect(addCall).toBeTruthy();
    expect(
      (addCall![2] as { fields: { COMMENT: string } }).fields.COMMENT,
    ).toContain('[ref:evt-d]');
  });
});

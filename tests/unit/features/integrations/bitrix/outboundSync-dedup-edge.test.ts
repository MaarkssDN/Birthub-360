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

const { syncActivityToBitrix, postCommentToBitrix } =
  await import('../../../../../src/features/integrations/bitrix/service/outboundSync.js');

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

describe('outboundSync — bordas de dedup e propagação de erro (handoff 16→06)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bitrixSyncLogCreate.mockResolvedValue({});
  });

  it('postCommentToBitrix: dedupRef casa marcador quando crm.timeline.comment.list retorna array direto em result', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    leadFindFirst.mockResolvedValue({ bitrixLeadId: 'b-lead-7', bitrixDealId: null });
    callBitrixMock.mockImplementation(async (_url: string, method: string) => {
      if (method === 'crm.timeline.comment.list') {
        return { result: [{ COMMENT: 'Comentário anterior\n[ref:evt-arr]' }] };
      }
      return { result: 1 };
    });

    const result = await postCommentToBitrix('org-1', 'lead-1', 'comentário', {
      dedupRef: 'evt-arr',
    });

    expect(result).toEqual({ entityType: 'lead', bitrixRecordId: 'b-lead-7' });
    expect(callBitrixMock.mock.calls.some((c) => c[1] === 'crm.timeline.comment.add')).toBe(false);
  });

  it('postCommentToBitrix: falha no crm.timeline.comment.list não bloqueia o comment.add (best-effort)', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    leadFindFirst.mockResolvedValue({ bitrixLeadId: 'b-lead-7', bitrixDealId: null });
    callBitrixMock.mockImplementation(async (_url: string, method: string) => {
      if (method === 'crm.timeline.comment.list') {
        throw new Error('method not found');
      }
      return { result: 1 };
    });

    const result = await postCommentToBitrix('org-1', 'lead-1', 'comentário', {
      dedupRef: 'evt-e',
    });

    expect(result).toEqual({ entityType: 'lead', bitrixRecordId: 'b-lead-7' });
    const addCall = callBitrixMock.mock.calls.find((c) => c[1] === 'crm.timeline.comment.add');
    expect(addCall).toBeTruthy();
    expect((addCall![2] as { fields: { COMMENT: string } }).fields.COMMENT).toContain(
      '[ref:evt-e]',
    );
  });

  it('postCommentToBitrix: sem dedupRef não consulta comment.list e posta COMMENT sem marcador', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    leadFindFirst.mockResolvedValue({ bitrixLeadId: 'b-lead-7', bitrixDealId: null });
    callBitrixMock.mockResolvedValue({ result: 1 });

    const result = await postCommentToBitrix('org-1', 'lead-1', 'comentário puro');

    expect(result).toEqual({ entityType: 'lead', bitrixRecordId: 'b-lead-7' });
    expect(callBitrixMock.mock.calls.some((c) => c[1] === 'crm.timeline.comment.list')).toBe(false);
    const addCall = callBitrixMock.mock.calls.find((c) => c[1] === 'crm.timeline.comment.add');
    expect((addCall![2] as { fields: { COMMENT: string } }).fields.COMMENT).toBe('comentário puro');
  });

  it('postCommentToBitrix: dedupRef vazio não gera marcador nem consulta comment.list', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    leadFindFirst.mockResolvedValue({ bitrixLeadId: 'b-lead-7', bitrixDealId: null });
    callBitrixMock.mockResolvedValue({ result: 1 });

    await postCommentToBitrix('org-1', 'lead-1', 'comentário', { dedupRef: '' });

    expect(callBitrixMock.mock.calls.some((c) => c[1] === 'crm.timeline.comment.list')).toBe(false);
    const addCall = callBitrixMock.mock.calls.find((c) => c[1] === 'crm.timeline.comment.add');
    expect((addCall![2] as { fields: { COMMENT: string } }).fields.COMMENT).not.toContain('[ref:');
  });

  it('postCommentToBitrix: lead sem vínculo Bitrix lança AppError 400', async () => {
    leadFindFirst.mockResolvedValue({ bitrixLeadId: null, bitrixDealId: null });

    await expect(postCommentToBitrix('org-1', 'lead-1', 'x')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(bitrixConnectionFindFirst).not.toHaveBeenCalled();
  });

  it('postCommentToBitrix: lead inexistente lança AppError 404', async () => {
    leadFindFirst.mockResolvedValue(null);

    await expect(postCommentToBitrix('org-1', 'lead-x', 'x')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('postCommentToBitrix: sem conexão Bitrix lança AppError 400', async () => {
    leadFindFirst.mockResolvedValue({ bitrixLeadId: 'b-lead-7', bitrixDealId: null });
    bitrixConnectionFindFirst.mockResolvedValue(null);

    await expect(postCommentToBitrix('org-1', 'lead-1', 'x')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('postCommentToBitrix: falha no comment.add é propagada após registrar sync log failed', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    leadFindFirst.mockResolvedValue({ bitrixLeadId: 'b-lead-7', bitrixDealId: null });
    callBitrixMock.mockImplementation(async (_url: string, method: string) => {
      if (method === 'crm.timeline.comment.list') return { result: { comments: [] } };
      throw new Error('Bitrix API 502');
    });

    await expect(
      postCommentToBitrix('org-1', 'lead-1', 'comentário', { dedupRef: 'evt-fail' }),
    ).rejects.toThrow('Bitrix API 502');

    expect(bitrixSyncLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed', errorMessage: 'Bitrix API 502' }),
      }),
    );
  });

  it('syncActivityToBitrix: falha no crm.activity.list segue para crm.activity.add (best-effort)', async () => {
    mockLinkedLead();
    callBitrixMock.mockImplementation(async (_url: string, method: string) => {
      if (method === 'crm.activity.list') throw new Error('list indisponível');
      return { result: 555 };
    });

    const result = await syncActivityToBitrix(
      'org-1',
      'lead-1',
      { type: 'call', subject: 'Ligação', completed: true },
      { dedupRef: 'evt-list-fail' },
    );

    expect(result).toEqual({ bitrixActivityId: 555 });
    const addCall = callBitrixMock.mock.calls.find((c) => c[1] === 'crm.activity.add');
    expect(addCall).toBeTruthy();
    expect((addCall![2] as { fields: { DESCRIPTION: string } }).fields.DESCRIPTION).toContain(
      '[ref:evt-list-fail]',
    );
  });

  it('syncActivityToBitrix: sem dedupRef não consulta crm.activity.list', async () => {
    mockLinkedLead();
    callBitrixMock.mockResolvedValue({ result: 555 });

    await syncActivityToBitrix('org-1', 'lead-1', { type: 'call', subject: 'Ligação' });

    expect(callBitrixMock.mock.calls.some((c) => c[1] === 'crm.activity.list')).toBe(false);
  });

  it('syncActivityToBitrix: lead vinculado a Deal usa OWNER_TYPE_ID=2 na checagem de dedup', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    getConnectionWebhookUrlMock.mockResolvedValue(WEBHOOK);
    leadFindFirst.mockResolvedValue({
      id: 'lead-1',
      bitrixLeadId: null,
      bitrixDealId: 'b-deal-9',
      contact: { phone: null, whatsapp: null, email: null },
    });
    callBitrixMock.mockImplementation(async (_url: string, method: string) => {
      if (method === 'crm.activity.list') return { result: [] };
      return { result: 321 };
    });

    const result = await syncActivityToBitrix(
      'org-1',
      'lead-1',
      { type: 'whatsapp', subject: 'Msg', description: 'oi', completed: true },
      { dedupRef: 'evt-deal' },
    );

    expect(result).toEqual({ bitrixActivityId: 321 });
    expect(callBitrixMock).toHaveBeenCalledWith(
      WEBHOOK,
      'crm.activity.list',
      expect.objectContaining({
        filter: { OWNER_TYPE_ID: 2, OWNER_ID: 'b-deal-9' },
      }),
      expect.objectContaining({ maxAttempts: 1 }),
    );
    const addCall = callBitrixMock.mock.calls.find((c) => c[1] === 'crm.activity.add');
    expect(
      (addCall![2] as { fields: { OWNER_TYPE_ID: number; OWNER_ID: string } }).fields,
    ).toMatchObject({ OWNER_TYPE_ID: 2, OWNER_ID: 'b-deal-9' });
  });

  it('syncActivityToBitrix: sem conexão Bitrix retorna null sem chamar callBitrix', async () => {
    bitrixConnectionFindFirst.mockResolvedValue(null);

    const result = await syncActivityToBitrix('org-1', 'lead-1', {
      type: 'call',
      subject: 'x',
    });

    expect(result).toBeNull();
    expect(callBitrixMock).not.toHaveBeenCalled();
  });

  it('syncActivityToBitrix: lead inexistente retorna null', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    leadFindFirst.mockResolvedValue(null);

    const result = await syncActivityToBitrix('org-1', 'lead-x', {
      type: 'call',
      subject: 'x',
    });

    expect(result).toBeNull();
    expect(callBitrixMock).not.toHaveBeenCalled();
  });

  it('syncActivityToBitrix: lead sem vínculo Bitrix retorna null sem chamar callBitrix', async () => {
    bitrixConnectionFindFirst.mockResolvedValue({ id: 'conn-1', webhookUrl: WEBHOOK });
    leadFindFirst.mockResolvedValue({
      id: 'lead-1',
      bitrixLeadId: null,
      bitrixDealId: null,
      contact: null,
    });

    const result = await syncActivityToBitrix('org-1', 'lead-1', {
      type: 'call',
      subject: 'x',
    });

    expect(result).toBeNull();
    expect(getConnectionWebhookUrlMock).not.toHaveBeenCalled();
    expect(callBitrixMock).not.toHaveBeenCalled();
  });

  it('syncActivityToBitrix: propagateErrors=true repropaga falha na resolução do webhookUrl', async () => {
    mockLinkedLead();
    getConnectionWebhookUrlMock.mockRejectedValue(new Error('webhook criptografado ilegível'));

    await expect(
      syncActivityToBitrix(
        'org-1',
        'lead-1',
        { type: 'call', subject: 'x' },
        { propagateErrors: true },
      ),
    ).rejects.toThrow('webhook criptografado ilegível');
  });
});

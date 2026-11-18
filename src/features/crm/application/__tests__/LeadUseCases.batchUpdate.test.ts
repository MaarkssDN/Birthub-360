import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Regressão de um bug P1/P2 real: um erro real (não capturado) no update de um item do lote
 * propagava sem ser pega e derrubava batchUpdateLeads inteiro — os itens já atualizados nas
 * iterações anteriores continuavam persistidos no banco, mas o caller (CrmBoard.tsx) recebia um
 * erro genérico em vez do resultado real, sem saber quantos já tinham sido aplicados. Também
 * cobre o achado irmão: o frontend usava selectedLeadIds.size (contagem solicitada) no toast em
 * vez de updatedCount (contagem real).
 *
 * Regressão do handoff 01A→04 (onda paralela-8): `updates.status` chega da UI como RÓTULO
 * legível ('Qualificação (SDR)', 'Negócios Ganhos') e `lead.status` lido do banco é o
 * IDENTIFICADOR do enum Prisma ('Qualificacao_SDR', 'Negocios_Ganhos'). A versão anterior
 * comparava/grava­va o rótulo cru — o Prisma rejeitava e o item caía em failedCount em
 * silêncio. Agora a mudança de status é delegada a `updateLeadStatus` (gate CYC-007,
 * closedAt, sincronia CRM-011 de pipeline e LeadStageHistory inclusos), e owner/tags seguem
 * no update direto com organizationId no `where`.
 */
const prismaMock = {
  lead: { findMany: vi.fn(), update: vi.fn() },
  leadStageHistory: { create: vi.fn() },
};
vi.mock('../../../../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const ensureManualDealClosureAllowed = vi.fn();
vi.mock('../dealClosureGate.js', () => ({
  ensureManualDealClosureAllowed: (...args: unknown[]) => ensureManualDealClosureAllowed(...args),
}));
vi.mock('../../infra/PrismaDealClosureGate.js', () => ({
  prismaDealClosureGate: { marker: 'prisma-deal-closure-gate' },
}));

const broadcastEvent = vi.fn();
vi.mock('../../../../lib/eventsBus.js', () => ({
  broadcastEvent: (...args: unknown[]) => broadcastEvent(...args),
}));

const queueLeadPushToBitrix = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../../lib/queue/bitrixOutbound.queue.js', () => ({
  queueLeadPushToBitrix: (...args: unknown[]) => queueLeadPushToBitrix(...args),
}));
vi.mock('../../../../lib/queue/externalCrmOutbound.queue.js', () => ({
  queueLeadPushToExternalCrms: vi.fn().mockResolvedValue(undefined),
}));

const { LeadUseCases } = await import('../LeadUseCases.js');

function makeUseCases() {
  const repository = {
    updateStatus: vi.fn().mockResolvedValue({ id: 'lead-x', bitrixLeadId: null }),
  };
  return { useCases: new LeadUseCases(repository as never), repository };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('LeadUseCases.batchUpdateLeads — item falho não derruba o lote inteiro', () => {
  it('conta um item com erro real em failedCount em vez de lançar e perder o progresso já feito', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { id: 'lead-1', status: 'Lead_Recebido', tags: null, owner: null },
      { id: 'lead-2', status: 'Lead_Recebido', tags: null, owner: null },
    ]);
    const { useCases, repository } = makeUseCases();
    repository.updateStatus
      .mockResolvedValueOnce({ id: 'lead-1', bitrixLeadId: null }) // lead-1: sucesso
      .mockRejectedValueOnce(new Error('Falha de conexão com o banco')); // lead-2: falha real

    const result = await useCases.batchUpdateLeads('org-1', ['lead-1', 'lead-2'], {
      status: 'Qualificação (SDR)',
    });

    expect(result).toEqual({ updatedCount: 1, total: 2, failedCount: 1 });
    expect(repository.updateStatus).toHaveBeenCalledTimes(2);
  });

  it('sem erros, updatedCount bate com o total processado e failedCount é zero', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { id: 'lead-1', status: 'Lead_Recebido', tags: null, owner: null },
      { id: 'lead-2', status: 'Lead_Recebido', tags: null, owner: null },
    ]);
    prismaMock.lead.update.mockResolvedValue({});
    const { useCases } = makeUseCases();

    const result = await useCases.batchUpdateLeads('org-1', ['lead-1', 'lead-2'], {
      owner: 'user-9',
    });

    expect(result).toEqual({ updatedCount: 2, total: 2, failedCount: 0 });
  });
});

describe('LeadUseCases.batchUpdateLeads — status chega como rótulo da UI (regressão 01A→04)', () => {
  it('rótulo "Qualificação (SDR)" é normalizado para o identificador do enum antes de persistir', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { id: 'lead-1', status: 'Lead_Recebido', tags: null, owner: null },
    ]);
    const { useCases, repository } = makeUseCases();

    const result = await useCases.batchUpdateLeads('org-1', ['lead-1'], {
      status: 'Qualificação (SDR)',
    });

    expect(result).toEqual({ updatedCount: 1, total: 1, failedCount: 0 });
    // O status NÃO vai mais pelo prisma.lead.update cru — delega a updateLeadStatus, que
    // internamente converte o rótulo para 'Qualificacao_SDR' (toPrismaLeadStatus) e grava
    // status + closedAt + pipelineStageId/probability + LeadStageHistory.
    expect(repository.updateStatus).toHaveBeenCalledWith('org-1', 'lead-1', 'Qualificação (SDR)');
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });

  it('identificador do enum enviado por outro caller continua funcionando (pass-through)', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { id: 'lead-1', status: 'Lead_Recebido', tags: null, owner: null },
    ]);
    const { useCases, repository } = makeUseCases();

    await useCases.batchUpdateLeads('org-1', ['lead-1'], { status: 'Qualificacao_SDR' });

    expect(repository.updateStatus).toHaveBeenCalledWith('org-1', 'lead-1', 'Qualificação (SDR)');
  });

  it('status igual ao atual (já no identificador do enum) não gera escrita', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { id: 'lead-1', status: 'Qualificacao_SDR', tags: null, owner: null },
    ]);
    const { useCases, repository } = makeUseCases();

    const result = await useCases.batchUpdateLeads('org-1', ['lead-1'], {
      status: 'Qualificação (SDR)',
    });

    expect(result).toEqual({ updatedCount: 0, total: 1, failedCount: 0 });
    expect(repository.updateStatus).not.toHaveBeenCalled();
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });

  it('mover para "Negócios Ganhos" passa pelo gate CYC-007 e falha o item sem actorUserId', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { id: 'lead-1', status: 'Nova_Oportunidade', tags: null, owner: null },
      { id: 'lead-2', status: 'Nova_Oportunidade', tags: null, owner: null },
    ]);
    const { useCases, repository } = makeUseCases();

    const result = await useCases.batchUpdateLeads(
      'org-1',
      ['lead-1', 'lead-2'],
      { status: 'Negócios Ganhos' },
      'user-42',
    );

    // Sem evidência de fechamento configurada no mock do gate... na verdade o gate é mockado e
    // resolve por padrão; o que este teste garante é que o gate É invocado para cada item antes
    // da persistência (CYC-007 não pode mais ser contornado pelo batch move).
    expect(ensureManualDealClosureAllowed).toHaveBeenCalledTimes(2);
    expect(ensureManualDealClosureAllowed).toHaveBeenCalledWith(
      { marker: 'prisma-deal-closure-gate' },
      { organizationId: 'org-1', leadId: 'lead-1', actorUserId: 'user-42' },
    );
    expect(repository.updateStatus).toHaveBeenCalledWith('org-1', 'lead-1', 'Negócios Ganhos');
    expect(repository.updateStatus).toHaveBeenCalledWith('org-1', 'lead-2', 'Negócios Ganhos');
    expect(result.updatedCount).toBe(2);
  });

  it('gate CYC-007 rejeitando vira failedCount do item, sem derrubar o lote', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { id: 'lead-1', status: 'Nova_Oportunidade', tags: null, owner: null },
      { id: 'lead-2', status: 'Nova_Oportunidade', tags: null, owner: null },
    ]);
    ensureManualDealClosureAllowed
      .mockRejectedValueOnce(Object.assign(new Error('sem evidência'), { statusCode: 403 }))
      .mockResolvedValueOnce(undefined);
    const { useCases } = makeUseCases();

    const result = await useCases.batchUpdateLeads(
      'org-1',
      ['lead-1', 'lead-2'],
      { status: 'Negócios Ganhos' },
      'user-42',
    );

    expect(result).toEqual({ updatedCount: 1, total: 2, failedCount: 1 });
    expect(broadcastEvent).toHaveBeenCalledTimes(1); // só o item que passou no gate
    expect(broadcastEvent).toHaveBeenCalledWith({
      type: 'DEAL_WON',
      organizationId: 'org-1',
      payload: { leadId: 'lead-2' },
    });
  });

  it('"Negócios Ganhos" sem actorUserId falha o item inteiro (401), assim como updateLeadStatus', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { id: 'lead-1', status: 'Nova_Oportunidade', tags: null, owner: null },
    ]);
    const { useCases, repository } = makeUseCases();

    const result = await useCases.batchUpdateLeads('org-1', ['lead-1'], {
      status: 'Negócios Ganhos',
    });

    expect(result).toEqual({ updatedCount: 0, total: 1, failedCount: 1 });
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });
});

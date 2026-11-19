import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Priorização de pipeline por probabilidade de fechamento (item 4 de "IA Agêntica de Vendas"):
 * até esta mudança, `findAllWithFilters` ordenava só por `createdAt desc` — o Kanban inteiro
 * herdava essa ordem sem nenhum critério de probabilidade. Cobre o novo `orderBy` e o join
 * (não N+1) com o `forecastProbabilityAi` mais recente do Copiloto IA.
 */
const prismaMock = {
  lead: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  copilotoDealHealthSnapshot: { findMany: vi.fn() },
  crmPipelineStage: { findFirst: vi.fn() },
  // Modelos consultados por assertLeadRelationsInTenant (tenancy, handoff 01A→04).
  company: { findFirst: vi.fn() },
  contact: { findFirst: vi.fn() },
  crmPipeline: { findFirst: vi.fn() },
};

vi.mock('../../../../lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('../../../../lib/search/index.js', () => ({ searchLeadIds: vi.fn() }));
vi.mock('../../../../shared/services/leadFieldChangeHistory.service.js', () => ({
  recordLeadFieldChanges: vi.fn(),
}));
const recordStageTransitionMock = vi.fn();
vi.mock('../../../../shared/services/leadStageHistory.service.js', () => ({
  recordStageTransition: recordStageTransitionMock,
}));

const { PrismaLeadRepository } = await import('../PrismaLeadRepository.js');

afterEach(() => {
  vi.clearAllMocks();
});

describe('PrismaLeadRepository.findAllWithFilters — priorização por probabilidade', () => {
  it('ordena por probabilidade (nulls last), depois última interação (nulls last), depois criação — nunca só por createdAt', async () => {
    prismaMock.lead.findMany.mockResolvedValue([]);
    prismaMock.lead.count.mockResolvedValue(0);

    const repo = new PrismaLeadRepository();
    await repo.findAllWithFilters('org-1');

    expect(prismaMock.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { probability: { sort: 'desc', nulls: 'last' } },
          { lastInteraction: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ],
      }),
    );
  });

  it('anexa o forecastProbabilityAi mais recente por lead, numa única query em lote (sem N+1)', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { id: 'lead-1', status: 'Lead_Recebido' },
      { id: 'lead-2', status: 'Lead_Recebido' },
    ]);
    prismaMock.lead.count.mockResolvedValue(2);
    prismaMock.copilotoDealHealthSnapshot.findMany.mockResolvedValue([
      { leadId: 'lead-1', forecastProbabilityAi: 72 },
    ]);

    const repo = new PrismaLeadRepository();
    const result = await repo.findAllWithFilters('org-1');

    expect(prismaMock.copilotoDealHealthSnapshot.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.copilotoDealHealthSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', leadId: { in: ['lead-1', 'lead-2'] } },
        distinct: ['leadId'],
      }),
    );

    const byId = Object.fromEntries(
      (result.data as unknown as { id: string; forecastProbabilityAi: number | null }[]).map(
        (lead) => [lead.id, lead.forecastProbabilityAi],
      ),
    );
    expect(byId['lead-1']).toBe(72);
    // lead-2 nunca teve conversa processada pelo Copiloto IA — null, nunca 0 fabricado.
    expect(byId['lead-2']).toBeNull();
  });

  it('não consulta o Copiloto IA quando a página de leads vem vazia', async () => {
    prismaMock.lead.findMany.mockResolvedValue([]);
    prismaMock.lead.count.mockResolvedValue(0);

    const repo = new PrismaLeadRepository();
    await repo.findAllWithFilters('org-1');

    expect(prismaMock.copilotoDealHealthSnapshot.findMany).not.toHaveBeenCalled();
  });
});

/**
 * CRM-011 (docs/audits/repository-debt-audit/agents/CRM.md): `Lead.status` (LeadStatus fixo) e
 * `Lead.pipelineStageId` (a etapa de um CrmPipeline configurável por organização) são duas
 * representações independentes do mesmo conceito de "etapa atual". Antes desta correção,
 * `updateStatus`/`update` só escreviam `status`, deixando `pipelineStageId` congelado na etapa
 * anterior — exatamente o caminho usado pelo Kanban legado (`CrmBoard.tsx`, PUT /api/leads/:id
 * {status}) e por `LeadUseCases.updateLeadStatus` (agentes de IA). Estes testes provam que a
 * escrita de `status` por QUALQUER um dos dois métodos agora também resolve e grava a
 * `CrmPipelineStage` correspondente (mais o registro em LeadStageHistory via
 * recordStageTransition) — se a sincronia regredir, `pipelineStageId` volta a divergir
 * silenciosamente de `status` e este teste falha.
 */
describe('PrismaLeadRepository — sincronia CRM-011 (status ⇄ pipelineStage)', () => {
  const matchedStage = {
    id: 'stage-proposta',
    name: 'Proposta Enviada',
    probability: 45,
    isWon: false,
    isLost: false,
    pipelineId: 'pipeline-negocio',
    leadStatus: 'Proposta_Enviada',
  };

  it('updateStatus: além de `status`, grava pipelineId/pipelineStageId/probability e registra a transição', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({
      id: 'lead-1',
      status: 'Nova_Oportunidade',
      pipelineId: 'pipeline-negocio',
      pipelineStageId: 'stage-nova-oportunidade',
    });
    prismaMock.crmPipelineStage.findFirst.mockResolvedValue(matchedStage);
    prismaMock.lead.update.mockResolvedValue({
      id: 'lead-1',
      status: 'Proposta_Enviada',
      company: null,
      contact: null,
      timeline: [],
    });

    const repo = new PrismaLeadRepository();
    await repo.updateStatus('org-1', 'lead-1', 'Proposta Enviada');

    expect(prismaMock.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead-1', organizationId: 'org-1' },
        data: expect.objectContaining({
          status: 'Proposta_Enviada',
          pipelineId: 'pipeline-negocio',
          pipelineStageId: 'stage-proposta',
          probability: 45,
        }),
      }),
    );
    expect(recordStageTransitionMock).toHaveBeenCalledWith(
      'org-1',
      'lead-1',
      expect.objectContaining({ id: 'stage-proposta', name: 'Proposta Enviada' }),
      'pipeline-negocio',
    );
  });

  it('updateStatus: não registra transição nem sobrescreve o pipeline quando nenhuma CrmPipelineStage mapeia o novo status', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({
      id: 'lead-1',
      status: 'Lead_Recebido',
      pipelineId: null,
      pipelineStageId: null,
    });
    prismaMock.crmPipelineStage.findFirst.mockResolvedValue(null);
    prismaMock.lead.update.mockResolvedValue({
      id: 'lead-1',
      status: 'Cadencia_Iniciada',
      company: null,
      contact: null,
      timeline: [],
    });

    const repo = new PrismaLeadRepository();
    await repo.updateStatus('org-1', 'lead-1', 'Cadência Iniciada');

    const call = prismaMock.lead.update.mock.calls[0][0];
    expect(call.data).not.toHaveProperty('pipelineStageId');
    expect(recordStageTransitionMock).not.toHaveBeenCalled();
  });

  it('updateStatus: extraFields (owner/tags) entram na MESMA prisma.lead.update do status — sem segunda escrita', async () => {
    // Regressão do risco de gravação parcial no batchUpdateLeads: status + owner/tags em duas
    // updates separadas deixava o status persistido quando a segunda falhava. Com extraFields
    // os campos de formulário são gravados atomicamente junto do status, numa única query.
    prismaMock.lead.findFirst.mockResolvedValue({
      id: 'lead-1',
      status: 'Nova_Oportunidade',
      pipelineId: 'pipeline-negocio',
      pipelineStageId: 'stage-nova-oportunidade',
    });
    prismaMock.crmPipelineStage.findFirst.mockResolvedValue(null);
    prismaMock.lead.update.mockResolvedValue({
      id: 'lead-1',
      status: 'Qualificacao_SDR',
      company: null,
      contact: null,
      timeline: [],
    });

    const repo = new PrismaLeadRepository();
    await repo.updateStatus('org-1', 'lead-1', 'Qualificação (SDR)', {
      owner: 'user-9',
      tags: ['vip', 'evento'],
    });

    expect(prismaMock.lead.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead-1', organizationId: 'org-1' },
        data: expect.objectContaining({
          status: 'Qualificacao_SDR',
          owner: 'user-9',
          tags: ['vip', 'evento'],
        }),
      }),
    );
  });

  it('update(): quando o payload muda `status` sem gerenciar pipeline explicitamente, sincroniza pipelineId/pipelineStageId/probability', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({
      expectedCloseAt: null,
      owner: null,
      pipelineId: 'pipeline-negocio',
      pipelineStageId: 'stage-nova-oportunidade',
    });
    prismaMock.crmPipelineStage.findFirst.mockResolvedValue(matchedStage);
    prismaMock.lead.update.mockResolvedValue({
      id: 'lead-1',
      status: 'Proposta_Enviada',
      company: null,
      contact: null,
    });

    const repo = new PrismaLeadRepository();
    await repo.update('org-1', 'lead-1', { status: 'Proposta Enviada' });

    expect(prismaMock.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pipelineId: 'pipeline-negocio',
          pipelineStageId: 'stage-proposta',
          probability: 45,
        }),
      }),
    );
    expect(recordStageTransitionMock).toHaveBeenCalledTimes(1);
  });

  it('update(): não sincroniza a partir de `status` quando o payload já traz pipelineId/pipelineStageId explícitos', async () => {
    // assertLeadRelationsInTenant valida as FKs explícitas do payload contra o tenant —
    // o findFirst do stage aqui é a checagem de tenancy, não a sincronia CRM-011.
    prismaMock.crmPipeline.findFirst.mockResolvedValue({ id: 'pipeline-custom' });
    prismaMock.crmPipelineStage.findFirst.mockResolvedValue({ id: 'stage-custom' });
    prismaMock.lead.update.mockResolvedValue({
      id: 'lead-1',
      status: 'Proposta_Enviada',
      company: null,
      contact: null,
    });

    const repo = new PrismaLeadRepository();
    await repo.update('org-1', 'lead-1', {
      status: 'Proposta Enviada',
      pipelineId: 'pipeline-custom',
      pipelineStageId: 'stage-custom',
    });

    // A etapa explícita do payload é preservada (sem sobrescrita pela etapa "casada" do status)…
    const call = prismaMock.lead.update.mock.calls[0][0];
    expect(call.data.pipelineStageId).toBe('stage-custom');
    // …e nenhuma transição de estágio é registrada (recordStageTransition é o marcador da
    // sincronia CRM-011, que não rodou porque o payload já gerencia o pipeline).
    expect(recordStageTransitionMock).not.toHaveBeenCalled();
  });
});

/**
 * Tenancy (handoff 01A→04, onda-paralela-8): `companyId`/`contactId`/`pipelineId`/
 * `pipelineStageId` chegavam do body via leadSchema e eram gravados por spread sem verificar se
 * pertenciam ao organizationId — vínculo cross-tenant persistia (e vazava PII sob ausência de
 * RLS). Agora cada FK referenciada é validada com findFirst escopado por tenant; id estrangeiro
 * → AppError 404 antes de qualquer escrita.
 */
describe('PrismaLeadRepository — validação de tenant das FKs (handoff 01A→04)', () => {
  it('create(): rejeita companyId de outro tenant com 404, sem gravar', async () => {
    prismaMock.company.findFirst.mockResolvedValue(null);
    const repo = new PrismaLeadRepository();

    await expect(
      repo.create('org-1', { status: 'Lead Recebido', companyId: 'company-de-outro-tenant' }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.lead.create).not.toHaveBeenCalled();
  });

  it('create(): rejeita contactId de outro tenant com 404, sem gravar', async () => {
    prismaMock.company.findFirst.mockResolvedValue({ id: 'company-1' });
    prismaMock.contact.findFirst.mockResolvedValue(null);
    const repo = new PrismaLeadRepository();

    await expect(
      repo.create('org-1', {
        status: 'Lead Recebido',
        companyId: 'company-1',
        contactId: 'contact-de-outro-tenant',
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('create(): rejeita pipelineStageId cujo pipeline é de outro tenant com 404', async () => {
    prismaMock.crmPipelineStage.findFirst.mockResolvedValue(null);
    const repo = new PrismaLeadRepository();

    await expect(
      repo.create('org-1', { status: 'Lead Recebido', pipelineStageId: 'stage-estrangeira' }),
    ).rejects.toMatchObject({ statusCode: 404 });
    // A query de validação é escopada pelo tenant do pipeline, nunca pelo id solto.
    expect(prismaMock.crmPipelineStage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'stage-estrangeira', pipeline: { organizationId: 'org-1' } },
      }),
    );
  });

  it('update(): rejeita companyId estrangeiro com 404 antes do update', async () => {
    prismaMock.company.findFirst.mockResolvedValue(null);
    const repo = new PrismaLeadRepository();

    await expect(
      repo.update('org-1', 'lead-1', { companyId: 'company-de-outro-tenant' }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });

  it('update(): FKs nulas (limpeza de vínculo) não disparam validação nem bloqueiam', async () => {
    prismaMock.lead.update.mockResolvedValue({
      id: 'lead-1',
      status: 'Lead_Recebido',
      company: null,
      contact: null,
    });
    const repo = new PrismaLeadRepository();

    await repo.update('org-1', 'lead-1', { companyId: null, contactId: null });

    expect(prismaMock.company.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.contact.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.lead.update).toHaveBeenCalled();
  });
});

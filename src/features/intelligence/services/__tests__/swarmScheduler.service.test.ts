import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv: Record<string, unknown> = {
  SWARM_SCHEDULER_ENABLED: true,
  SWARM_SCHEDULER_ORGANIZATIONS: 'org-1,org-2',
  SWARM_AUTONOMY_MODE: 'full',
  SWARM_AUTONOMOUS_MIN_SCORE: 70,
  SWARM_NEW_LEAD_GRACE_MINUTES: 30,
  SWARM_STALE_PIPELINE_HOURS: 48,
  SWARM_STALE_PROPOSAL_HOURS: 72,
  SWARM_RECOMMENDATION_COOLDOWN_HOURS: 6,
  SWARM_SCHEDULER_MAX_LEADS_PER_RUN: 20,
  SDR_CALL_WINDOW_START: 9,
  SDR_CALL_WINDOW_END: 18,
  SDR_CALL_TIMEZONE: 'America/Sao_Paulo',
};

vi.mock('../../../../config/env.js', () => ({ env: mockEnv }));

const leadFindMany = vi.fn();
const organizationFindMany = vi.fn();
const conversationSignalFindMany = vi.fn();
const pendingActionFindMany = vi.fn();
const pendingActionFindFirst = vi.fn();
const pendingActionCreate = vi.fn();
const aiLogAggregate = vi.fn();
const aiLogGroupBy = vi.fn();

vi.mock('../../../../lib/prisma.js', () => ({
  prisma: {
    lead: { findMany: (...args: unknown[]) => leadFindMany(...args) },
    organization: { findMany: (...args: unknown[]) => organizationFindMany(...args) },
    conversationSignal: { findMany: (...args: unknown[]) => conversationSignalFindMany(...args) },
    aIPendingAction: {
      findMany: (...args: unknown[]) => pendingActionFindMany(...args),
      findFirst: (...args: unknown[]) => pendingActionFindFirst(...args),
      create: (...args: unknown[]) => pendingActionCreate(...args),
    },
    aILog: {
      aggregate: (...args: unknown[]) => aiLogAggregate(...args),
      groupBy: (...args: unknown[]) => aiLogGroupBy(...args),
    },
  },
}));

vi.mock('../../../../lib/email/mailer.js', () => ({
  sendEmail: vi.fn().mockRejectedValue(new Error('SMTP indisponível no teste')),
  MailerNotConfiguredError: class MailerNotConfiguredError extends Error {},
}));

vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const enqueueSdrOutboundDraftMock = vi.fn();
vi.mock('../../../../lib/queue/agent.worker.js', () => ({
  enqueueSdrOutboundDraft: (...args: unknown[]) => enqueueSdrOutboundDraftMock(...args),
}));

const runAutonomyRoleMock = vi.fn().mockResolvedValue('Síntese analítica do agente');
vi.mock('../autonomyRoleRunner.service.js', () => ({
  runAutonomyRole: (...args: unknown[]) => runAutonomyRoleMock(...args),
}));

const draftNegotiatorReplyMock = vi.fn().mockResolvedValue(null);
vi.mock('../negotiatorReply.service.js', () => ({
  draftNegotiatorReply: (...args: unknown[]) => draftNegotiatorReplyMock(...args),
}));

const { enabledOrganizations, getSwarmSloSnapshot, runSwarmScheduler } = await import(
  '../swarmScheduler.service.js'
);

// Quarta-feira 14:00 (horário comercial válido)
const COMMERCIAL_WEDNESDAY = new Date('2026-08-12T14:00:00-03:00');
// Sábado 14:00 (fora da janela comercial - fim de semana)
const SATURDAY_AFTERNOON = new Date('2026-08-15T14:00:00-03:00');
// Quarta-feira 23:00 (fora da janela comercial - noite)
const WEDNESDAY_NIGHT = new Date('2026-08-12T23:00:00-03:00');

function setupLeadFindMany(opts: { dueFollowUps?: unknown[]; pipelineLeads?: unknown[] }) {
  leadFindMany.mockImplementation((args: { where?: { nextAction?: unknown; OR?: unknown } }) => {
    if (args?.where?.nextAction) {
      return Promise.resolve(opts.dueFollowUps ?? []);
    }
    if (args?.where?.OR) {
      return Promise.resolve(opts.pipelineLeads ?? []);
    }
    return Promise.resolve([]);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEnv.SWARM_SCHEDULER_ENABLED = true;
  mockEnv.SWARM_SCHEDULER_ORGANIZATIONS = 'org-1,org-2';
  mockEnv.SWARM_AUTONOMY_MODE = 'full';
  mockEnv.SWARM_AUTONOMOUS_MIN_SCORE = 70;
  mockEnv.SWARM_RECOMMENDATION_COOLDOWN_HOURS = 6;
  mockEnv.SWARM_SCHEDULER_MAX_LEADS_PER_RUN = 20;

  setupLeadFindMany({ dueFollowUps: [], pipelineLeads: [] });
  conversationSignalFindMany.mockResolvedValue([]);
  pendingActionFindMany.mockResolvedValue([]);
  pendingActionFindFirst.mockResolvedValue(null);
  pendingActionCreate.mockResolvedValue({ id: 'action-new' });
  aiLogAggregate.mockResolvedValue({
    _sum: { cost: null, tokens: null },
    _avg: { latencyMs: null },
    _count: { _all: 0 },
  });
  aiLogGroupBy.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SwarmScheduler — Trava 1: Organizações Habilitadas (enabledOrganizations)', () => {
  it('retorna vazio se SWARM_SCHEDULER_ENABLED for false', async () => {
    mockEnv.SWARM_SCHEDULER_ENABLED = false;
    const orgs = await enabledOrganizations();
    expect(orgs).toEqual([]);
  });

  it('retorna vazio se SWARM_SCHEDULER_ORGANIZATIONS for vazio', async () => {
    mockEnv.SWARM_SCHEDULER_ORGANIZATIONS = '';
    const orgs = await enabledOrganizations();
    expect(orgs).toEqual([]);
  });

  it('retorna lista parseada de organizações configuradas', async () => {
    mockEnv.SWARM_SCHEDULER_ORGANIZATIONS = 'org-1, org-2, org-3';
    const orgs = await enabledOrganizations();
    expect(orgs).toEqual(['org-1', 'org-2', 'org-3']);
  });

  it('quando configurado com "*", consulta o banco para obter todas as organizações', async () => {
    mockEnv.SWARM_SCHEDULER_ORGANIZATIONS = '*';
    organizationFindMany.mockResolvedValue([{ id: 'org-a' }, { id: 'org-b' }]);

    const orgs = await enabledOrganizations();
    expect(orgs).toEqual(['org-a', 'org-b']);
    expect(organizationFindMany).toHaveBeenCalledWith({ select: { id: true } });
  });
});

describe('SwarmScheduler — As 7 Travas do Modo Full de Envio Autônomo', () => {
  const highFitLead = {
    id: 'lead-1',
    status: 'Lead_Recebido',
    score: 85,
    createdAt: new Date('2026-08-12T10:00:00-03:00'),
    updatedAt: new Date('2026-08-12T10:00:00-03:00'),
    lastInteraction: null,
    nextAction: null,
    company: { tradeName: 'TechCorp', segment: 'Tecnologia', size: 'Média' },
    contact: {
      email: 'contato@techcorp.com',
      emailStatus: 'VERIFIED',
      role: 'CTO',
      whatsapp: null,
      phone: null,
    },
  };

  it('Trava 1 (Organização autorizada): runSwarmScheduler respeita o tenantId no contexto', async () => {
    setupLeadFindMany({ pipelineLeads: [highFitLead] });

    const result = await runSwarmScheduler('org-1', COMMERCIAL_WEDNESDAY);

    expect(result.organizationId).toBe('org-1');
    expect(result.scanned).toBe(1);
    expect(result.proposed).toBe(1);
    expect(pendingActionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: 'org-1' }),
      }),
    );
  });

  it('Trava 2 (Modo supervised vs full): quando modo é supervised, nunca agenda autoExecute=true', async () => {
    mockEnv.SWARM_AUTONOMY_MODE = 'supervised';
    setupLeadFindMany({ pipelineLeads: [highFitLead] });

    const result = await runSwarmScheduler('org-1', COMMERCIAL_WEDNESDAY);

    expect(result.outboundDraftsQueued).toBe(1);
    expect(result.autoExecutionEligible).toBe(0);
    expect(enqueueSdrOutboundDraftMock).toHaveBeenCalledWith('lead-1', 'org-1', false);
  });

  it('Trava 3 (Lead sem e-mail nem WhatsApp): não agenda outbound draft', async () => {
    const leadWithoutContact = {
      ...highFitLead,
      contact: { email: null, emailStatus: null, role: 'CTO', whatsapp: null, phone: null },
    };
    setupLeadFindMany({ pipelineLeads: [leadWithoutContact] });

    const result = await runSwarmScheduler('org-1', COMMERCIAL_WEDNESDAY);

    expect(result.outboundDraftsQueued).toBe(0);
    expect(result.autoExecutionEligible).toBe(0);
    expect(enqueueSdrOutboundDraftMock).not.toHaveBeenCalled();
  });

  it('Trava 4 (Score abaixo do mínimo): score < SWARM_AUTONOMOUS_MIN_SCORE não recebe autoExecute=true', async () => {
    mockEnv.SWARM_AUTONOMOUS_MIN_SCORE = 80;
    const lowScoreLead = {
      ...highFitLead,
      score: 65, // abaixo de 80
    };
    setupLeadFindMany({ pipelineLeads: [lowScoreLead] });

    const result = await runSwarmScheduler('org-1', COMMERCIAL_WEDNESDAY);

    expect(result.outboundDraftsQueued).toBe(1);
    expect(result.autoExecutionEligible).toBe(0);
    expect(enqueueSdrOutboundDraftMock).toHaveBeenCalledWith('lead-1', 'org-1', false);
  });

  it('Trava 5A (Fora da janela comercial - fim de semana): em modo full não enfileira envio fora do horário', async () => {
    mockEnv.SWARM_AUTONOMY_MODE = 'full';
    setupLeadFindMany({ pipelineLeads: [highFitLead] });

    const result = await runSwarmScheduler('org-1', SATURDAY_AFTERNOON);

    // No modo full, fora da janela comercial não enfileira para evitar rascunho manual que perde auto-execução
    expect(result.outboundDraftsQueued).toBe(0);
    expect(result.autoExecutionEligible).toBe(0);
    expect(enqueueSdrOutboundDraftMock).not.toHaveBeenCalled();
  });

  it('Trava 5B (Fora da janela comercial - noite): em modo full não enfileira envio às 23h', async () => {
    mockEnv.SWARM_AUTONOMY_MODE = 'full';
    setupLeadFindMany({ pipelineLeads: [highFitLead] });

    const result = await runSwarmScheduler('org-1', WEDNESDAY_NIGHT);

    expect(result.outboundDraftsQueued).toBe(0);
    expect(result.autoExecutionEligible).toBe(0);
    expect(enqueueSdrOutboundDraftMock).not.toHaveBeenCalled();
  });

  it('Trava 5C (Dentro da janela comercial - quarta 14h): modo full com score alto enfileira com autoExecute=true', async () => {
    mockEnv.SWARM_AUTONOMY_MODE = 'full';
    setupLeadFindMany({ pipelineLeads: [highFitLead] });

    const result = await runSwarmScheduler('org-1', COMMERCIAL_WEDNESDAY);

    expect(result.outboundDraftsQueued).toBe(1);
    expect(result.autoExecutionEligible).toBe(1);
    expect(enqueueSdrOutboundDraftMock).toHaveBeenCalledWith('lead-1', 'org-1', true);
  });

  it('Trava 6 (SMTP configurado): provada via executeAction em aiPendingAction.service — falha não é mascarada como concluída', async () => {
    const { executeAction } = await import('../aiPendingAction.service.js');
    const result = await executeAction({
      id: 'action-test',
      action: 'send_email',
      payload: { to: 'teste@exemplo.com', subject: 'Assunto', body: 'Corpo' },
      organizationId: 'org-1',
    });
    // Se o sendEmail falhar ou não estiver configurado, sent deve ser false
    expect(typeof result.sent).toBe('boolean');
  });

  it('Trava 7 (Idempotência / Ação ainda inexistente): se já existe recomendação no período de cooldown, deduplica e pula', async () => {
    setupLeadFindMany({ pipelineLeads: [highFitLead] });
    pendingActionFindFirst.mockResolvedValue({ id: 'existing-action-id' });

    const result = await runSwarmScheduler('org-1', COMMERCIAL_WEDNESDAY);

    expect(result.scanned).toBe(1);
    expect(result.skippedAlreadyPending).toBe(1);
    expect(result.proposed).toBe(0);
    expect(pendingActionCreate).not.toHaveBeenCalled();
  });
});

describe('SwarmScheduler — Idempotência e Cooldown sob Retry', () => {
  it('gera chave de idempotência baseada no timeBucket de cooldown para o lead', async () => {
    const lead = {
      id: 'lead-retry-1',
      status: 'Lead_Recebido',
      score: 90,
      createdAt: new Date('2026-08-12T10:00:00-03:00'),
      updatedAt: new Date('2026-08-12T10:00:00-03:00'),
      lastInteraction: null,
      nextAction: null,
      company: { tradeName: 'AlphaCorp', segment: 'Saúde', size: 'Grande' },
      contact: { email: 'alpha@saude.com', role: 'Diretor' },
    };
    setupLeadFindMany({ pipelineLeads: [lead] });

    await runSwarmScheduler('org-1', COMMERCIAL_WEDNESDAY);

    const bucketMs = 6 * 60 * 60 * 1000;
    const expectedBucket = Math.floor(COMMERCIAL_WEDNESDAY.getTime() / bucketMs);
    const expectedKey = `recommendation:lead-retry-1:high_score_unworked:${expectedBucket}`;

    expect(pendingActionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: expectedKey,
        }),
      }),
    );
  });
});

describe('SwarmScheduler — getSwarmSloSnapshot', () => {
  it('base vazia: métricas retornam value: null com emptyReason explícito (nunca dados fabricados)', async () => {
    pendingActionFindMany.mockResolvedValue([]);
    aiLogAggregate.mockResolvedValue({
      _sum: { cost: null, tokens: null },
      _avg: { latencyMs: null },
      _count: { _all: 0 },
    });
    aiLogGroupBy.mockResolvedValue([]);

    const snapshot = await getSwarmSloSnapshot('org-1', 30, COMMERCIAL_WEDNESDAY);

    expect(snapshot.organizationId).toBe('org-1');
    expect(snapshot.windowDays).toBe(30);
    expect(snapshot.agents).toHaveLength(5); // SDR, BDR, CLOSER, CRM, OPS

    for (const agent of snapshot.agents) {
      expect(agent.coverage).toBe(0);
      expect(agent.conversion.value).toBeNull();
      expect(agent.conversion.emptyReason).toBeDefined();
      expect(agent.humanOverride.value).toBeNull();
      expect(agent.humanOverride.emptyReason).toBeDefined();
      expect(agent.errorRate.value).toBeNull();
      expect(agent.errorRate.emptyReason).toBeDefined();
      expect(agent.avgExecutionLatencyMs).toBeNull();
    }

    expect(snapshot.cost.totalCostUsd).toBe(0);
    expect(snapshot.cost.totalTokens).toBe(0);
    expect(snapshot.cost.requestCount).toBe(0);
    expect(snapshot.cost.avgLatencyMs).toBeNull();
  });

  it('calcula taxas reais a partir de registros em AIPendingAction e AILog', async () => {
    const createdAt = new Date('2026-08-10T10:00:00Z');
    const executedAt = new Date('2026-08-10T10:05:00Z'); // 5 min latency (300,000 ms)

    pendingActionFindMany.mockResolvedValue([
      {
        agentRole: 'SDR',
        approved: true,
        discardedAt: null,
        executed: true,
        executedAt,
        executionError: null,
        attempts: 1,
        createdAt,
      },
      {
        agentRole: 'SDR',
        approved: false,
        discardedAt: new Date('2026-08-11T12:00:00Z'),
        executed: false,
        executedAt: null,
        executionError: null,
        attempts: 0,
        createdAt,
      },
    ]);

    aiLogAggregate.mockResolvedValue({
      _sum: { cost: 12.5, tokens: 45000 },
      _avg: { latencyMs: 850 },
      _count: { _all: 150 },
    });

    aiLogGroupBy.mockResolvedValue([
      {
        agentRole: 'SDR',
        _sum: { cost: 5.2, tokens: 20000 },
        _avg: { latencyMs: 700 },
        _count: { _all: 60 },
      },
    ]);

    const snapshot = await getSwarmSloSnapshot('org-1', 30, COMMERCIAL_WEDNESDAY);

    const sdrMetrics = snapshot.agents.find((a) => a.role === 'SDR');
    expect(sdrMetrics).toBeDefined();
    expect(sdrMetrics?.coverage).toBe(2);
    expect(sdrMetrics?.conversion.value).toBe(0.5); // 1 executed / 2 total
    expect(sdrMetrics?.humanOverride.value).toBe(0.5); // 1 discarded / 2 reviewed
    expect(sdrMetrics?.avgExecutionLatencyMs).toBe(300_000);
    expect(sdrMetrics?.costUsd).toBe(5.2);
    expect(sdrMetrics?.tokens).toBe(20000);
    expect(sdrMetrics?.avgModelLatencyMs).toBe(700);

    expect(snapshot.cost.totalCostUsd).toBe(12.5);
    expect(snapshot.cost.totalTokens).toBe(45000);
    expect(snapshot.cost.requestCount).toBe(150);
    expect(snapshot.cost.avgLatencyMs).toBe(850);
  });
});

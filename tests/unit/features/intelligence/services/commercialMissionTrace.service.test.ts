/**
 * Rastro real de missão comercial (`getCommercialMissionTrace`).
 * A rota GET /api/commercial-agent/mission/:id/trace delega a este service
 * (o teste de rota mocka o service). Aqui exercitamos a leitura persistida:
 * handoffs, execuções, consentimento, isolamento por organizationId e
 * agregação de status — nunca um trace sintético a partir do CRM.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsentChainUnavailableError } from '../../../../../src/lib/security/consentAuditChain.service.js';
import { AppError } from '../../../../../src/shared/middlewares/errorHandler.js';

const {
  handoffFindFirst,
  handoffFindMany,
  executionFindFirst,
  executionFindMany,
  definitionFindMany,
  leadFindMany,
  consentFindUnique,
  getChain,
  verifyChain,
  hasPiiExternalConsent,
  db,
} = vi.hoisted(() => {
  const handoffFindFirst = vi.fn();
  const handoffFindMany = vi.fn();
  const executionFindFirst = vi.fn();
  const executionFindMany = vi.fn();
  const definitionFindMany = vi.fn();
  const leadFindMany = vi.fn();
  const consentFindUnique = vi.fn();
  const getChain = vi.fn();
  const verifyChain = vi.fn();
  const hasPiiExternalConsent = vi.fn();
  const db = {
    agentHandoffMessage: {
      findFirst: (...args: unknown[]) => handoffFindFirst(...args),
      findMany: (...args: unknown[]) => handoffFindMany(...args),
    },
    agentExecution: {
      findFirst: (...args: unknown[]) => executionFindFirst(...args),
      findMany: (...args: unknown[]) => executionFindMany(...args),
    },
    agentDefinition: {
      findMany: (...args: unknown[]) => definitionFindMany(...args),
    },
    lead: {
      findMany: (...args: unknown[]) => leadFindMany(...args),
    },
    organizationAiConsent: {
      findUnique: (...args: unknown[]) => consentFindUnique(...args),
    },
  };
  return {
    handoffFindFirst,
    handoffFindMany,
    executionFindFirst,
    executionFindMany,
    definitionFindMany,
    leadFindMany,
    consentFindUnique,
    getChain,
    verifyChain,
    hasPiiExternalConsent,
    db,
  };
});

vi.mock('../../../../../src/lib/prisma.js', () => ({ prisma: db }));

vi.mock('../../../../../src/lib/security/consentChainFactory.js', () => ({
  consentAuditChain: {
    getChain: (...args: unknown[]) => getChain(...args),
    verifyChainIntegrity: (...args: unknown[]) => verifyChain(...args),
  },
}));

vi.mock('../../../../../src/shared/services/aiPiiConsent.service.js', () => ({
  hasPiiExternalConsent: (...args: unknown[]) => hasPiiExternalConsent(...args),
}));

const { getCommercialMissionTrace } = await import(
  '../../../../../src/features/intelligence/services/commercialMissionTrace.service.js'
);

const ORG = 'org-a';
const OTHER_ORG = 'org-b';
const NOW = new Date('2026-11-11T15:00:00.000Z');

function consentEvent(sequence: number) {
  return {
    id: `evt-${sequence}`,
    organizationId: ORG,
    sequence,
    kind: 'CONSENT',
    subjectRef: `subj-${sequence}`,
    purpose: 'ai-processing',
    termsVersion: '1.0',
    status: 'GRANTED' as const,
    occurredAt: `2026-11-01T00:00:${String(sequence).padStart(2, '0')}.000Z`,
    previousHash: sequence === 0 ? 'genesis' : `hash-${sequence - 1}`,
    currentHash: `hash-${sequence}`,
    formatVersion: 1,
  };
}

function stubConsent(options?: {
  row?: 'granted' | 'revoked' | 'missing';
  valid?: boolean;
  eventCount?: number;
  reason?: string | null;
}) {
  const row = options?.row ?? 'granted';
  if (row === 'missing') {
    consentFindUnique.mockResolvedValue(null);
  } else if (row === 'revoked') {
    consentFindUnique.mockResolvedValue({
      granted: false,
      consentVersion: 'v2',
      grantedAt: new Date('2026-10-01T00:00:00.000Z'),
      revokedAt: new Date('2026-11-01T00:00:00.000Z'),
      grantedByUserId: 'admin-1',
    });
  } else {
    consentFindUnique.mockResolvedValue({
      granted: true,
      consentVersion: 'v2',
      grantedAt: new Date('2026-10-01T00:00:00.000Z'),
      revokedAt: null,
      grantedByUserId: 'admin-1',
    });
  }

  const count = options?.eventCount ?? 2;
  getChain.mockResolvedValue(Array.from({ length: count }, (_, i) => consentEvent(i)));

  const valid = options?.valid ?? true;
  verifyChain.mockResolvedValue({
    valid,
    totalRecords: count,
    reason: valid ? undefined : (options?.reason ?? 'hash quebrado'),
  });

  hasPiiExternalConsent.mockReturnValue(true);
}

function makeHandoff(overrides: Record<string, unknown> = {}) {
  return {
    id: 'handoff-1',
    organizationId: ORG,
    missionId: 'mission-1',
    conversationId: 'conv-1',
    fromAgent: 'tagarela-supervisor',
    fromRole: 'SUPERVISOR',
    toAgent: 'giselle-strategy',
    toRole: 'DIRECTOR',
    requestType: 'EXECUTE',
    requestedCapability: 'account.intelligence',
    resourceScope: { leadId: 'lead-1' },
    knownFacts: [{ fact: 'icp-fit' }],
    evidence: [
      {
        sourceAgent: 'tagarela-supervisor',
        sourceExecutionId: 'exec-root',
        capabilityCode: 'route.mission',
        summary: 'Missão roteada para Giselle',
        recordedAt: '2026-11-11T14:00:00.000Z',
      },
    ],
    risks: [{ code: 'pricing' }],
    priority: 'HIGH',
    status: 'COMPLETED',
    response: { ok: true },
    confidence: 0.91,
    errorMessage: null,
    parentHandoffId: null,
    depth: 0,
    executionId: 'exec-1',
    createdAt: NOW,
    updatedAt: NOW,
    acceptedAt: NOW,
    completedAt: NOW,
    expiresAt: null,
    ...overrides,
  };
}

function makeExecution(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exec-1',
    organizationId: ORG,
    agentCode: 'giselle-strategy',
    capabilityCode: 'account.intelligence',
    mission: 'Qualificar conta',
    status: 'SUCCEEDED',
    summary: 'Conta enquadrada no ICP.',
    confidence: 0.88,
    errorMessage: null,
    correlationId: 'mission-1',
    policyDecision: {
      allowed: true,
      reason: 'ROLE_OK',
      requiresApproval: false,
      riskLevel: 'LOW',
      accessLevel: 'READ',
      toolCode: 'crm.lookup',
      toolAvailable: true,
      bindingVerification: 'VERIFIED',
      bindingEvidencePath: 'bindings/crm',
      temporaryGrantId: 'grant-1',
    },
    toolCalls: [
      {
        toolCode: 'crm.lookup',
        startedAt: '2026-11-11T14:01:00.000Z',
        finishedAt: '2026-11-11T14:01:02.000Z',
        ok: true,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
    completedAt: NOW,
    agentDefinition: { name: 'Giselle Estratégia', domain: 'Vendas' },
    agentVersion: { version: '3.1.0' },
    ...overrides,
  };
}

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    organizationId: ORG,
    title: 'Oportunidade TransLog',
    deletedAt: null,
    company: { tradeName: 'TransLogística Express', legalName: 'TransLogística Ltda' },
    contact: { name: 'Ana Compradora' },
    ...overrides,
  };
}

async function loadTrace(requestedMissionId = 'mission-1', organizationId = ORG) {
  return getCommercialMissionTrace({
    db,
    organizationId,
    requestedMissionId,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  handoffFindFirst.mockReset();
  handoffFindMany.mockReset();
  executionFindFirst.mockReset();
  executionFindMany.mockReset();
  definitionFindMany.mockReset();
  leadFindMany.mockReset();
  consentFindUnique.mockReset();
  getChain.mockReset();
  verifyChain.mockReset();
  hasPiiExternalConsent.mockReset();

  handoffFindFirst.mockResolvedValue(null);
  handoffFindMany.mockResolvedValue([]);
  executionFindFirst.mockResolvedValue(null);
  executionFindMany.mockResolvedValue([]);
  definitionFindMany.mockResolvedValue([]);
  leadFindMany.mockResolvedValue([]);
  stubConsent();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getCommercialMissionTrace — ausência de registro', () => {
  it('retorna null para missionId explícito sem handoff nem execução (nunca fabrica trace)', async () => {
    const trace = await loadTrace('mission-ausente');

    expect(trace).toBeNull();
    expect(handoffFindFirst).not.toHaveBeenCalled();
    expect(handoffFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, missionId: 'mission-ausente' },
      }),
    );
    expect(consentFindUnique).not.toHaveBeenCalled();
    expect(getChain).not.toHaveBeenCalled();
  });

  it('retorna null para default quando a org não tem handoff nem execução com correlationId', async () => {
    const trace = await loadTrace('default');

    expect(trace).toBeNull();
    expect(handoffFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG },
        orderBy: { createdAt: 'desc' },
        select: { missionId: true },
      }),
    );
    expect(executionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, correlationId: { not: null } },
      }),
    );
    expect(handoffFindMany).not.toHaveBeenCalled();
  });

  it('retorna null para default quando a execução mais recente não tem correlationId', async () => {
    executionFindFirst.mockResolvedValue({ correlationId: null });

    expect(await loadTrace('default')).toBeNull();
  });
});

describe('getCommercialMissionTrace — resolução de default', () => {
  it('resolve default para a missão do handoff mais recente e não consulta execução de fallback', async () => {
    handoffFindFirst.mockResolvedValue({ missionId: 'mission-recente' });
    handoffFindMany.mockResolvedValue([makeHandoff({ missionId: 'mission-recente' })]);
    executionFindMany.mockResolvedValue([
      makeExecution({ correlationId: 'mission-recente' }),
    ]);
    definitionFindMany.mockResolvedValue([
      { code: 'tagarela-supervisor', name: 'Tagarela Supervisor', domain: 'Operações' },
      { code: 'giselle-strategy', name: 'Giselle Estratégia', domain: 'Vendas' },
    ]);
    leadFindMany.mockResolvedValue([makeLead()]);

    const trace = await loadTrace('default');

    expect(trace).not.toBeNull();
    expect(trace?.missionId).toBe('mission-recente');
    expect(trace?.requestedMissionId).toBe('default');
    expect(trace?.missionKey).toBe('mission-recente');
    expect(executionFindFirst).not.toHaveBeenCalled();
  });

  it('cai na execução mais recente quando não há handoff para default', async () => {
    executionFindFirst.mockResolvedValue({ correlationId: 'corr-exec-9' });
    handoffFindMany.mockResolvedValue([]);
    executionFindMany.mockResolvedValue([
      makeExecution({
        id: 'exec-9',
        correlationId: 'corr-exec-9',
        agentCode: 'giselle-strategy',
      }),
    ]);
    definitionFindMany.mockResolvedValue([
      { code: 'giselle-strategy', name: 'Giselle Estratégia', domain: 'Vendas' },
    ]);

    const trace = await loadTrace('default');

    expect(trace?.missionId).toBe('corr-exec-9');
    expect(trace?.requestedMissionId).toBe('default');
    expect(trace?.executions).toHaveLength(1);
    expect(trace?.handoffs).toHaveLength(0);
    expect(handoffFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, missionId: 'corr-exec-9' },
      }),
    );
  });
});

describe('getCommercialMissionTrace — sucesso e mapeamento', () => {
  it('monta o trace persistido com título da conta, política, tools, evidências e consentimento verificado', async () => {
    const routing = makeHandoff({
      id: 'handoff-0',
      fromAgent: 'tagarela-supervisor',
      toAgent: 'tagarela-supervisor',
      requestedCapability: 'route.mission',
      executionId: null,
      createdAt: new Date('2026-11-11T14:00:00.000Z'),
      updatedAt: new Date('2026-11-11T14:00:00.000Z'),
      completedAt: new Date('2026-11-11T14:00:00.000Z'),
    });
    const handoff = makeHandoff();
    const execution = makeExecution();
    handoffFindMany.mockResolvedValue([routing, handoff]);
    executionFindMany.mockResolvedValue([execution]);
    definitionFindMany.mockResolvedValue([
      { code: 'tagarela-supervisor', name: 'Tagarela Supervisor', domain: 'Operações' },
      { code: 'giselle-strategy', name: 'Giselle Estratégia', domain: 'Vendas' },
    ]);
    leadFindMany.mockResolvedValue([makeLead()]);
    stubConsent({ eventCount: 21, valid: true });

    const trace = await loadTrace('mission-1');

    expect(trace).not.toBeNull();
    expect(trace?.title).toBe('Missão autônoma mission-1 — TransLogística Express');
    expect(trace?.accountName).toBe('TransLogística Express');
    expect(trace?.status).toBe('COMPLETED');
    expect(trace?.root).toBe('Tagarela (Supervisor Geral)');
    expect(trace?.rootNodes.map((n) => n.agentCode)).toEqual(['tagarela-supervisor']);
    expect(trace?.directors.giselle.specialists.map((n) => n.agentCode)).toContain(
      'giselle-strategy',
    );
    expect(trace?.directors.giselle.status).toBe('COMPLETED');
    expect(trace?.generatedAt).toBe(NOW.toISOString());

    expect(trace?.executions[0]).toMatchObject({
      executionId: 'exec-1',
      agentCode: 'giselle-strategy',
      agentName: 'Giselle Estratégia',
      agentVersion: '3.1.0',
      capabilityCode: 'account.intelligence',
      status: 'SUCCEEDED',
      summary: 'Conta enquadrada no ICP.',
      correlationId: 'mission-1',
      completedAt: NOW.toISOString(),
    });
    expect(trace?.executions[0].policyDecision).toEqual({
      allowed: true,
      reason: 'ROLE_OK',
      requiresApproval: false,
      riskLevel: 'LOW',
      accessLevel: 'READ',
      toolCode: 'crm.lookup',
      toolAvailable: true,
      bindingVerification: 'VERIFIED',
      bindingEvidencePath: 'bindings/crm',
      temporaryGrantId: 'grant-1',
    });
    expect(trace?.executions[0].toolCalls).toEqual([
      {
        toolCode: 'crm.lookup',
        startedAt: '2026-11-11T14:01:00.000Z',
        finishedAt: '2026-11-11T14:01:02.000Z',
        ok: true,
      },
    ]);

    expect(trace?.handoffs).toHaveLength(2);
    const delegated = trace?.handoffs.find((row) => row.handoffId === 'handoff-1');
    expect(delegated).toMatchObject({
      handoffId: 'handoff-1',
      status: 'COMPLETED',
      effectiveStatus: 'COMPLETED',
      risksCount: 1,
      knownFactsCount: 1,
      depth: 0,
    });
    expect(delegated?.evidence).toEqual([
      {
        sourceAgent: 'tagarela-supervisor',
        sourceExecutionId: 'exec-root',
        capabilityCode: 'route.mission',
        summary: 'Missão roteada para Giselle',
        recordedAt: '2026-11-11T14:00:00.000Z',
      },
    ]);

    expect(trace?.consent.organizationAiConsent).toEqual({
      granted: true,
      consentVersion: 'v2',
      grantedAt: '2026-10-01T00:00:00.000Z',
      revokedAt: null,
      grantedByUserId: 'admin-1',
    });
    expect(trace?.consent.externalPiiConsentGranted).toBe(true);
    expect(trace?.consent.auditChain.status).toBe('VERIFIED');
    expect(trace?.consent.auditChain.valid).toBe(true);
    expect(trace?.consent.auditChain.totalRecords).toBe(21);
    expect(trace?.consent.auditChain.reason).toBeNull();
    // CONSENT_EVENTS_LIMIT = 20: descarta o evento mais antigo (sequence 0).
    expect(trace?.consent.auditChain.events).toHaveLength(20);
    expect(trace?.consent.auditChain.events[0].sequence).toBe(1);
    expect(trace?.consent.auditChain.events[19].sequence).toBe(20);
    expect(hasPiiExternalConsent).toHaveBeenCalledWith(ORG);

    expect(executionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: ORG,
          OR: [
            { id: { in: ['exec-1'] } },
            { correlationId: { in: ['mission-1', 'handoff-0', 'handoff-1'] } },
          ],
        },
      }),
    );
    expect(leadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, id: { in: ['lead-1'] }, deletedAt: null },
      }),
    );
    expect(consentFindUnique).toHaveBeenCalledWith({ where: { organizationId: ORG } });
  });

  it('redige PII em resumo, erro e evidência e ignora evidência/tool sem campos obrigatórios', async () => {
    handoffFindMany.mockResolvedValue([
      makeHandoff({
        errorMessage: 'Falha ao avisar joao@empresa.com',
        evidence: [
          { summary: 'sem agente' },
          { sourceAgent: 'giselle-strategy', summary: '' },
          { sourceAgent: 'giselle-strategy', summary: 42 },
          {
            sourceAgent: 'giselle-strategy',
            summary: 'Lead 123.456.789-00 aprovado',
          },
          'nao-objeto',
        ],
        risks: 'nao-array',
        knownFacts: null,
      }),
    ]);
    executionFindMany.mockResolvedValue([
      makeExecution({
        summary: 'Contato ana@translog.com com telefone (11) 98765-4321',
        errorMessage: '',
        policyDecision: 'nao-objeto',
        toolCalls: [
          { startedAt: 'x' },
          { toolCode: 'crm.lookup', ok: 'sim' },
          null,
        ],
        agentDefinition: null,
        agentVersion: null,
      }),
    ]);
    definitionFindMany.mockResolvedValue([]);
    leadFindMany.mockResolvedValue([]);

    const trace = await loadTrace();

    expect(trace?.executions[0].summary).toContain('[EMAIL REDIGIDO]');
    expect(trace?.executions[0].summary).toContain('[TELEFONE REDIGIDO]');
    expect(trace?.executions[0].errorMessage).toBeNull();
    expect(trace?.executions[0].agentName).toBe('giselle-strategy');
    expect(trace?.executions[0].agentVersion).toBeNull();
    expect(trace?.executions[0].policyDecision).toBeNull();
    expect(trace?.executions[0].toolCalls).toEqual([
      { toolCode: 'crm.lookup', startedAt: undefined, finishedAt: undefined, ok: undefined },
    ]);
    expect(trace?.handoffs[0].errorMessage).toBe('Falha ao avisar [EMAIL REDIGIDO]');
    expect(trace?.handoffs[0].evidence).toEqual([
      {
        sourceAgent: 'giselle-strategy',
        sourceExecutionId: undefined,
        capabilityCode: undefined,
        summary: 'Lead [CPF REDIGIDO] aprovado',
        recordedAt: new Date(0).toISOString(),
      },
    ]);
    expect(trace?.handoffs[0].risksCount).toBe(0);
    expect(trace?.handoffs[0].knownFactsCount).toBe(0);
    expect(trace?.accountName).toBe('Conta não identificada');
    expect(trace?.title).toBe('Missão autônoma mission-1');
  });

  it('preenche policyDecision com defaults seguros quando campos opcionais faltam ou são do tipo errado', async () => {
    handoffFindMany.mockResolvedValue([]);
    executionFindMany.mockResolvedValue([
      makeExecution({
        policyDecision: { allowed: 'yes', requiresApproval: 1, toolAvailable: 'no' },
      }),
    ]);

    const trace = await loadTrace();

    expect(trace?.executions[0].policyDecision).toEqual({
      allowed: false,
      reason: 'UNSPECIFIED',
      requiresApproval: false,
      riskLevel: null,
      accessLevel: null,
      toolCode: null,
      toolAvailable: false,
      bindingVerification: null,
      bindingEvidencePath: null,
      temporaryGrantId: null,
    });
  });
});

describe('getCommercialMissionTrace — conta e resourceScope', () => {
  it('resolve leadId a partir de resourceScope.type=LEAD e usa legalName se não houver tradeName', async () => {
    handoffFindMany.mockResolvedValue([
      makeHandoff({
        resourceScope: { type: 'LEAD', id: 'lead-2' },
        executionId: null,
      }),
    ]);
    executionFindMany.mockResolvedValue([]);
    definitionFindMany.mockResolvedValue([
      { code: 'tagarela-supervisor', name: 'Tagarela Supervisor', domain: 'Operações' },
      { code: 'giselle-strategy', name: 'Giselle Estratégia', domain: 'Vendas' },
    ]);
    leadFindMany.mockResolvedValue([
      makeLead({
        id: 'lead-2',
        company: { tradeName: '', legalName: 'TransLogística Ltda' },
        contact: { name: 'Ana' },
      }),
    ]);

    const trace = await loadTrace();

    expect(leadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, id: { in: ['lead-2'] }, deletedAt: null },
      }),
    );
    expect(trace?.accountName).toBe('TransLogística Ltda');
  });

  it('cai para o nome do contato e depois para o título do lead', async () => {
    handoffFindMany.mockResolvedValue([makeHandoff()]);
    executionFindMany.mockResolvedValue([]);
    definitionFindMany.mockResolvedValue([]);
    leadFindMany.mockResolvedValue([
      makeLead({
        company: { tradeName: '', legalName: '' },
        contact: { name: 'Ana Compradora' },
      }),
    ]);
    expect((await loadTrace())?.accountName).toBe('Ana Compradora');

    leadFindMany.mockResolvedValue([
      makeLead({
        title: 'Oportunidade sem empresa',
        company: null,
        contact: { name: '' },
      }),
    ]);
    expect((await loadTrace())?.accountName).toBe('Oportunidade sem empresa');
  });

  it('ignora resourceScope inválido e não consulta Lead', async () => {
    handoffFindMany.mockResolvedValue([
      makeHandoff({ resourceScope: ['lead-1'], executionId: 'exec-1' }),
    ]);
    executionFindMany.mockResolvedValue([makeExecution()]);
    definitionFindMany.mockResolvedValue([]);

    await loadTrace();
    expect(leadFindMany).not.toHaveBeenCalled();

    // Objeto sem leadId utilizável (type ≠ LEAD ou id/leadId vazio) também não vira consulta.
    handoffFindMany.mockResolvedValue([
      makeHandoff({ resourceScope: { type: 'ACCOUNT', id: 'acc-1', leadId: '' }, executionId: 'exec-1' }),
    ]);
    await loadTrace();
    expect(leadFindMany).not.toHaveBeenCalled();
  });
});

describe('getCommercialMissionTrace — status da missão e handoff expirado', () => {
  it('marca handoff pendente com expiresAt no passado como EXPIRED e a missão como CANCELLED', async () => {
    handoffFindMany.mockResolvedValue([
      makeHandoff({
        status: 'QUEUED',
        expiresAt: new Date('2026-11-11T14:59:59.000Z'),
        completedAt: null,
        executionId: null,
      }),
    ]);
    executionFindMany.mockResolvedValue([]);
    definitionFindMany.mockResolvedValue([]);

    const trace = await loadTrace();

    expect(trace?.handoffs[0].status).toBe('QUEUED');
    expect(trace?.handoffs[0].effectiveStatus).toBe('EXPIRED');
    expect(trace?.status).toBe('CANCELLED');
    expect(trace?.directors.giselle.specialists[0]?.status).toBe('CANCELLED');
  });

  it('não expira handoff já aceito mesmo com expiresAt no passado', async () => {
    handoffFindMany.mockResolvedValue([
      makeHandoff({
        status: 'ACCEPTED',
        expiresAt: new Date('2026-11-11T14:00:00.000Z'),
        executionId: null,
        completedAt: null,
      }),
    ]);
    executionFindMany.mockResolvedValue([]);
    definitionFindMany.mockResolvedValue([]);

    const trace = await loadTrace();

    expect(trace?.handoffs[0].effectiveStatus).toBe('ACCEPTED');
    expect(trace?.status).toBe('IN_PROGRESS');
  });

  it.each([
    { exec: 'RUNNING', handoff: 'COMPLETED', expected: 'IN_PROGRESS' },
    { exec: 'AUTHORIZING', handoff: 'COMPLETED', expected: 'IN_PROGRESS' },
    { exec: 'SUCCEEDED', handoff: 'AUTHORIZING', expected: 'IN_PROGRESS' },
    { exec: 'SUCCEEDED', handoff: 'QUEUED', expected: 'IN_PROGRESS' },
    { exec: 'SUCCEEDED', handoff: 'RUNNING', expected: 'IN_PROGRESS' },
    { exec: 'PENDING', handoff: 'COMPLETED', expected: 'PENDING' },
    { exec: 'SUCCEEDED', handoff: 'CREATED', expected: 'PENDING' },
    { exec: 'FAILED', handoff: 'COMPLETED', expected: 'FAILED' },
    { exec: 'SUCCEEDED', handoff: 'FAILED', expected: 'FAILED' },
    { exec: 'DENIED', handoff: 'COMPLETED', expected: 'DENIED' },
    { exec: 'SUCCEEDED', handoff: 'DENIED', expected: 'DENIED' },
    { exec: 'CANCELLED', handoff: 'COMPLETED', expected: 'CANCELLED' },
    { exec: 'SUCCEEDED', handoff: 'CANCELLED', expected: 'CANCELLED' },
    { exec: 'SUCCEEDED', handoff: 'COMPLETED', expected: 'COMPLETED' },
  ] as const)(
    'status da missão é $expected quando execução=$exec e handoff=$handoff',
    async ({ exec, handoff, expected }) => {
      handoffFindMany.mockResolvedValue([
        makeHandoff({
          status: handoff,
          expiresAt: handoff === 'CREATED' ? new Date('2026-11-12T00:00:00.000Z') : null,
        }),
      ]);
      executionFindMany.mockResolvedValue([makeExecution({ status: exec })]);
      definitionFindMany.mockResolvedValue([]);

      const trace = await loadTrace();
      expect(trace?.status).toBe(expected);
    },
  );

  it('fica PENDING quando execução e handoff terminam em estados mistos que não fecham a missão', async () => {
    handoffFindMany.mockResolvedValue([makeHandoff({ status: 'COMPLETED' })]);
    executionFindMany.mockResolvedValue([makeExecution({ status: 'SUCCEEDED' }), makeExecution({ id: 'exec-2', status: 'UNKNOWN_STATE' })]);
    definitionFindMany.mockResolvedValue([]);

    expect((await loadTrace())?.status).toBe('PENDING');
  });
});

describe('getCommercialMissionTrace — nós, diretores e nomes', () => {
  it('classifica nós na tríade (Tagarela, Giselle, Patrícia, Guardião) e agrega status dos diretores', async () => {
    const t0 = new Date('2026-11-11T14:00:00.000Z');
    const t1 = new Date('2026-11-11T14:05:00.000Z');
    const t2 = new Date('2026-11-11T14:10:00.000Z');
    const t3 = new Date('2026-11-11T14:15:00.000Z');

    handoffFindMany.mockResolvedValue([
      makeHandoff({
        id: 'h-tagarela',
        fromAgent: 'tagarela-supervisor',
        toAgent: 'tagarela-supervisor',
        status: 'COMPLETED',
        executionId: null,
        createdAt: t0,
        updatedAt: t0,
        completedAt: t0,
      }),
    ]);
    executionFindMany.mockResolvedValue([
      makeExecution({
        id: 'e-giselle',
        agentCode: 'giselle-strategy',
        status: 'RUNNING',
        completedAt: null,
        updatedAt: t1,
        createdAt: t1,
        agentDefinition: { name: 'Giselle Estratégia', domain: 'Vendas' },
      }),
      makeExecution({
        id: 'e-patricia',
        agentCode: 'copy-writer',
        status: 'PENDING',
        completedAt: null,
        updatedAt: t2,
        createdAt: t2,
        agentDefinition: { name: 'Copy Writer', domain: 'Marketing' },
      }),
      makeExecution({
        id: 'e-guardiao',
        agentCode: 'crm-sync',
        status: 'FAILED',
        completedAt: t3,
        updatedAt: t3,
        createdAt: t3,
        summary: null,
        errorMessage: 'Falha no CRM',
        agentDefinition: { name: 'CRM Sync', domain: 'Operações' },
      }),
    ]);
    definitionFindMany.mockResolvedValue([
      { code: 'tagarela-supervisor', name: 'Tagarela Supervisor', domain: 'Operações' },
    ]);

    const trace = await loadTrace();

    expect(trace?.root).toBe('Tagarela (Supervisor Geral)');
    expect(trace?.rootNodes).toHaveLength(1);
    expect(trace?.directors.giselle.status).toBe('RUNNING');
    expect(trace?.directors.patricia.status).toBe('PENDING');
    expect(trace?.directors.guardiao.status).toBe('FAILED');
    expect(trace?.directors.guardiao.specialists[0].resultSummary).toBe('Falha no CRM');
    expect(trace?.directors.giselle.specialists[0].status).toBe('RUNNING');
    // Ordem cronológica dos nós brutos (timestamp crescente).
    const stamps = [
      ...trace!.rootNodes,
      ...trace!.directors.giselle.specialists,
      ...trace!.directors.patricia.specialists,
      ...trace!.directors.guardiao.specialists,
    ]
      .map((n) => n.timestamp)
      .sort();
    expect(stamps).toEqual([
      t0.toISOString(),
      t1.toISOString(),
      t2.toISOString(),
      t3.toISOString(),
    ]);
  });

  it('usa o nome do catálogo no nó de handoff e o agentCode quando o catálogo não tem o código', async () => {
    handoffFindMany.mockResolvedValue([
      makeHandoff({
        toAgent: 'agente-desconhecido',
        fromAgent: 'outro-agente',
        executionId: null,
      }),
    ]);
    executionFindMany.mockResolvedValue([]);
    definitionFindMany.mockResolvedValue([]);

    const trace = await loadTrace();

    expect(trace?.directors.giselle.specialists[0].agentName).toBe('agente-desconhecido');
    expect(trace?.root).toBe('Agent Runtime (execução persistida)');
    expect(trace?.rootNodes).toHaveLength(0);
  });

  it.each([
    { status: 'SUCCEEDED', node: 'COMPLETED' },
    { status: 'RUNNING', node: 'RUNNING' },
    { status: 'AUTHORIZING', node: 'RUNNING' },
    { status: 'DENIED', node: 'DENIED' },
    { status: 'FAILED', node: 'FAILED' },
    { status: 'CANCELLED', node: 'CANCELLED' },
    { status: 'PENDING', node: 'PENDING' },
    { status: 'SOMETHING_ELSE', node: 'PENDING' },
  ] as const)('nó de execução $status vira $node', async ({ status, node }) => {
    handoffFindMany.mockResolvedValue([]);
    executionFindMany.mockResolvedValue([
      makeExecution({
        status,
        summary: status === 'FAILED' ? null : 'ok',
        errorMessage: status === 'FAILED' ? 'boom' : null,
        completedAt: status === 'RUNNING' ? null : NOW,
      }),
    ]);
    definitionFindMany.mockResolvedValue([]);

    const trace = await loadTrace();
    expect(trace?.directors.giselle.specialists[0].status).toBe(node);
    if (status === 'FAILED') {
      expect(trace?.directors.giselle.specialists[0].resultSummary).toBe('boom');
    }
    if (status === 'RUNNING') {
      expect(trace?.directors.giselle.specialists[0].timestamp).toBe(NOW.toISOString());
    }
  });

  it.each([
    { status: 'COMPLETED', node: 'COMPLETED' },
    { status: 'RUNNING', node: 'RUNNING' },
    { status: 'AUTHORIZING', node: 'RUNNING' },
    { status: 'QUEUED', node: 'RUNNING' },
    { status: 'ACCEPTED', node: 'RUNNING' },
    { status: 'DENIED', node: 'DENIED' },
    { status: 'FAILED', node: 'FAILED' },
    { status: 'CANCELLED', node: 'CANCELLED' },
    { status: 'CREATED', node: 'PENDING' },
  ] as const)('nó de handoff $status vira $node', async ({ status, node }) => {
    handoffFindMany.mockResolvedValue([
      makeHandoff({
        status,
        executionId: null,
        expiresAt: new Date('2026-11-12T00:00:00.000Z'),
      }),
    ]);
    executionFindMany.mockResolvedValue([]);
    definitionFindMany.mockResolvedValue([]);

    const specialists = (await loadTrace())?.directors.giselle.specialists ?? [];
    // toAgent é giselle-strategy → diretor GISELLE
    expect(specialists[0].status).toBe(node);
  });

  it('agrega diretor como DENIED quando não há FAILED/RUNNING/PENDING e há DENIED, e CANCELLED no restante', async () => {
    handoffFindMany.mockResolvedValue([]);
    executionFindMany.mockResolvedValue([
      makeExecution({ id: 'e1', status: 'DENIED', agentCode: 'giselle-strategy' }),
      makeExecution({ id: 'e2', status: 'CANCELLED', agentCode: 'giselle-strategy' }),
    ]);
    definitionFindMany.mockResolvedValue([
      { code: 'giselle-strategy', name: 'Giselle Estratégia', domain: 'Vendas' },
    ]);
    expect((await loadTrace())?.directors.giselle.status).toBe('DENIED');

    executionFindMany.mockResolvedValue([
      makeExecution({ id: 'e1', status: 'CANCELLED', agentCode: 'giselle-strategy' }),
    ]);
    expect((await loadTrace())?.directors.giselle.status).toBe('CANCELLED');
  });

  it('agrega diretor COMPLETED só quando todos os especialistas concluíram', async () => {
    handoffFindMany.mockResolvedValue([]);
    executionFindMany.mockResolvedValue([
      makeExecution({ id: 'e1', status: 'SUCCEEDED', agentCode: 'giselle-strategy' }),
      makeExecution({ id: 'e2', status: 'SUCCEEDED', agentCode: 'account-intelligence' }),
    ]);
    definitionFindMany.mockResolvedValue([]);
    expect((await loadTrace())?.directors.giselle.status).toBe('COMPLETED');
  });
});

describe('getCommercialMissionTrace — consentimento e erros', () => {
  it('expõe cadeia inválida sem eventos e consentimento da org ausente', async () => {
    handoffFindMany.mockResolvedValue([makeHandoff({ executionId: null })]);
    executionFindMany.mockResolvedValue([]);
    definitionFindMany.mockResolvedValue([]);
    stubConsent({ row: 'missing', valid: false, reason: 'elo ausente', eventCount: 3 });
    hasPiiExternalConsent.mockReturnValue(false);

    const trace = await loadTrace();

    expect(trace?.consent.organizationAiConsent).toBeNull();
    expect(trace?.consent.externalPiiConsentGranted).toBe(false);
    expect(trace?.consent.auditChain).toMatchObject({
      status: 'INVALID',
      valid: false,
      totalRecords: 3,
      reason: 'elo ausente',
      events: [],
    });
  });

  it('expõe consentimento revogado quando a cadeia ainda é válida', async () => {
    handoffFindMany.mockResolvedValue([makeHandoff({ executionId: null })]);
    executionFindMany.mockResolvedValue([]);
    definitionFindMany.mockResolvedValue([]);
    stubConsent({ row: 'revoked', valid: true, eventCount: 1 });

    const trace = await loadTrace();

    expect(trace?.consent.organizationAiConsent).toMatchObject({
      granted: false,
      revokedAt: '2026-11-01T00:00:00.000Z',
    });
    expect(trace?.consent.auditChain.status).toBe('VERIFIED');
  });

  it('traduz ConsentChainUnavailableError em AppError 503', async () => {
    handoffFindMany.mockResolvedValue([makeHandoff()]);
    executionFindMany.mockResolvedValue([makeExecution()]);
    getChain.mockRejectedValue(new ConsentChainUnavailableError('backend down'));

    const error = await loadTrace().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(503);
    expect((error as AppError).message).toBe('Cadeia de auditoria de consentimento indisponível.');
  });

  it('propaga erro inesperado da cadeia de consentimento sem mascarar', async () => {
    handoffFindMany.mockResolvedValue([makeHandoff()]);
    executionFindMany.mockResolvedValue([makeExecution()]);
    verifyChain.mockRejectedValue(new Error('timeout redis'));

    await expect(loadTrace()).rejects.toThrow('timeout redis');
  });
});


describe('getCommercialMissionTrace — catálogo e missionId vazio', () => {
  it('preenche nome do handoff a partir do include da execução quando o catálogo omite o código', async () => {
    handoffFindMany.mockResolvedValue([
      makeHandoff({
        fromAgent: 'giselle-strategy',
        toAgent: 'giselle-strategy',
      }),
    ]);
    executionFindMany.mockResolvedValue([
      makeExecution({
        agentDefinition: { name: 'Giselle (via include)', domain: 'Vendas' },
      }),
    ]);
    definitionFindMany.mockResolvedValue([]);

    const trace = await loadTrace();
    const handoffNode = trace?.directors.giselle.specialists.find(
      (node) => node.id === 'handoff-handoff-1',
    );

    expect(handoffNode?.agentName).toBe('Giselle (via include)');
    expect(trace?.executions[0].agentName).toBe('Giselle (via include)');
  });

  it('não consulta execuções quando o missionId é vazio e não há handoff (unique descarta string vazia)', async () => {
    expect(await loadTrace('')).toBeNull();
    expect(executionFindMany).not.toHaveBeenCalled();
    expect(consentFindUnique).not.toHaveBeenCalled();
  });
});

describe('getCommercialMissionTrace — isolamento por tenant', () => {
  it('escopa todas as consultas pelo organizationId informado e não vaza missão de outra org', async () => {
    handoffFindMany.mockImplementation(async (args: { where: { organizationId: string } }) => {
      if (args.where.organizationId !== ORG) return [];
      return [makeHandoff()];
    });
    executionFindMany.mockImplementation(async (args: { where: { organizationId: string } }) => {
      if (args.where.organizationId !== ORG) return [makeExecution({ organizationId: OTHER_ORG })];
      return [makeExecution()];
    });
    definitionFindMany.mockResolvedValue([
      { code: 'tagarela-supervisor', name: 'Tagarela Supervisor', domain: 'Operações' },
      { code: 'giselle-strategy', name: 'Giselle Estratégia', domain: 'Vendas' },
    ]);
    leadFindMany.mockResolvedValue([makeLead()]);

    const own = await loadTrace('mission-1', ORG);
    expect(own?.executions[0].executionId).toBe('exec-1');

    handoffFindMany.mockResolvedValue([]);
    executionFindMany.mockResolvedValue([]);
    const other = await loadTrace('mission-1', OTHER_ORG);
    expect(other).toBeNull();

    const orgIds = [
      ...handoffFindMany.mock.calls.map((c) => c[0].where.organizationId),
      ...executionFindMany.mock.calls.map((c) => c[0].where.organizationId),
      ...leadFindMany.mock.calls.map((c) => c[0].where.organizationId),
      ...consentFindUnique.mock.calls.map((c) => c[0].where.organizationId),
    ];
    expect(orgIds).toContain(ORG);
    expect(orgIds).toContain(OTHER_ORG);
    // organizationId é um escalar por consulta (nunca uma união de tenants).
    // O OR de execução filtra id/correlationId da mesma org, não mistura tenants.
    for (const call of [...handoffFindMany.mock.calls, ...executionFindMany.mock.calls]) {
      expect(typeof call[0].where.organizationId).toBe('string');
      const orFilters = call[0].where.OR;
      if (orFilters) {
        for (const clause of orFilters) {
          expect(clause).not.toHaveProperty('organizationId');
        }
      }
    }
  });

  it('observa que loadConsentTrace usa o prisma do módulo, não o db injetado (acoplamento)', async () => {
    const injectedConsent = vi.fn();
    const injectedDb = {
      agentHandoffMessage: db.agentHandoffMessage,
      agentExecution: db.agentExecution,
      agentDefinition: db.agentDefinition,
      lead: db.lead,
      organizationAiConsent: { findUnique: injectedConsent },
    };
    handoffFindMany.mockResolvedValue([makeHandoff({ executionId: null })]);
    executionFindMany.mockResolvedValue([]);
    definitionFindMany.mockResolvedValue([]);

    await getCommercialMissionTrace({
      db: injectedDb as typeof db,
      organizationId: ORG,
      requestedMissionId: 'mission-1',
    });

    expect(consentFindUnique).toHaveBeenCalled();
    expect(injectedConsent).not.toHaveBeenCalled();
  });
});

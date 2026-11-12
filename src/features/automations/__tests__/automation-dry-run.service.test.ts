import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dryRunAutomation } from '../automation-dry-run.service.js';
import type { Automation } from '../domain/Automation.js';

/**
 * Testes do modo sandbox do dry-run (`automation-dry-run.service.ts`, Onda coordenador-20261112 /
 * achado do supervisor Onda 00 — "dry-run em memória sem sandbox real").
 *
 * O contrato provado aqui: o dry-run NUNCA executa efeito colateral — nenhum sender real (e-mail,
 * voz, webhook HTTP), nenhuma escrita no CRM, nenhuma publicação em fila e nenhuma mutação de
 * cadência (que é o caminho que leva a envios de WhatsApp) — e ainda assim registra cada ação
 * simulada em `records` para a UI exibir "o que aconteceria".
 *
 * Todos os módulos de efeito são mockados com spies: se qualquer caminho do dry-run passar a
 * chamar um deles de verdade, o `not.toHaveBeenCalled()` correspondente quebra o teste.
 */

const leadFindMany = vi.fn();
const activityFindMany = vi.fn();
const leadUpdate = vi.fn();
const activityCreate = vi.fn();
const automationUpdate = vi.fn();

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    lead: {
      findMany: (...args: unknown[]) => leadFindMany(...args),
      update: (...args: unknown[]) => leadUpdate(...args),
    },
    activity: {
      findMany: (...args: unknown[]) => activityFindMany(...args),
      create: (...args: unknown[]) => activityCreate(...args),
    },
    automation: {
      update: (...args: unknown[]) => automationUpdate(...args),
    },
  },
}));

vi.mock('../../../lib/queue/redis.js', () => ({
  connection: {},
  queuesEnabled: false,
}));

vi.mock('../../../lib/email/mailer.js', () => ({
  sendEmail: vi.fn(),
  MailerNotConfiguredError: class MailerNotConfiguredError extends Error {},
}));

const publishMock = vi.fn();
vi.mock('../../../lib/queue/domainEventMesh.service.js', () => ({
  domainEventMesh: {
    publish: (...args: unknown[]) => publishMock(...args),
  },
}));

const executeCadenceActionMock = vi.fn();
vi.mock('../cadenceIntegration.service.js', () => ({
  CadenceIntegrationService: class {},
  cadenceIntegrationService: {
    executeCadenceAction: (...args: unknown[]) => executeCadenceActionMock(...args),
  },
}));

const callLeadMock = vi.fn();
vi.mock('../../integrations/birth-voice/birthVoice.service.js', () => ({
  callLead: (...args: unknown[]) => callLeadMock(...args),
  SuppressedNumberError: class SuppressedNumberError extends Error {},
}));

// Módulos somente-leitura que o preview de "Ligar via SDR de Voz" importa dinamicamente —
// mockados para o teste ser determinístico (janela aberta, número discável, sem opt-out).
vi.mock('../../integrations/birth-voice/coldCall.policy.js', () => ({
  isWithinCallWindow: () => true,
}));
vi.mock('../../integrations/birth-voice/coldCall.service.js', () => ({
  callWindowFromEnv: () => ({}),
}));
vi.mock('../../integrations/birth-voice/birthVoice.helpers.js', () => ({
  pickCallablePhone: () => '+5511999990000',
}));
vi.mock('../../integrations/birth-voice/callSuppression.service.js', () => ({
  isSuppressed: vi.fn().mockResolvedValue(false),
}));

// O motor real (importado pelo dry-run só para `matchesConditions`/`renderTemplate`) puxa estes
// serviços no topo do módulo — mockados para garantir que nada de efeito escape via engine.
vi.mock('../../notifications/notification.service.js', () => ({
  notificationService: { create: vi.fn() },
}));
vi.mock('../automation-history.service.js', () => ({
  automationHistoryService: { record: vi.fn() },
}));
vi.mock('../automation-idempotency.service.js', () => ({
  buildTriggerIdempotencyKey: () => 'dry-run-test-key',
  claimAutomationTrigger: vi.fn().mockResolvedValue('claimed'),
}));

function buildLeadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    status: 'Lead_Recebido',
    owner: 'Ana',
    temperature: 'Morno',
    score: 50,
    funnel: 'Vendas',
    companyId: 'comp-1',
    contactId: 'cont-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    lastInteraction: null,
    contact: { name: 'Maria Silva', phone: null, whatsapp: null },
    company: { tradeName: 'Empresa X', legalName: null, phones: null },
    ...overrides,
  };
}

function buildAutomation(
  action: string,
  actionConfig: Record<string, unknown> = {},
  overrides: Partial<Automation> = {},
): Pick<Automation, 'id' | 'name' | 'enabled' | 'trigger' | 'conditions' | 'action' | 'actionConfig'> {
  return {
    id: 'auto-1',
    name: 'Regra de teste',
    enabled: true,
    trigger: 'Lead criado',
    conditions: null,
    action: action as Automation['action'],
    actionConfig,
    ...overrides,
  };
}

/** Afirma que NENHUM efeito colateral real aconteceu durante o dry-run. */
function expectNoSideEffects() {
  expect(leadUpdate).not.toHaveBeenCalled();
  expect(activityCreate).not.toHaveBeenCalled();
  expect(automationUpdate).not.toHaveBeenCalled();
  expect(publishMock).not.toHaveBeenCalled();
  expect(executeCadenceActionMock).not.toHaveBeenCalled();
  expect(callLeadMock).not.toHaveBeenCalled();
}

describe('dryRunAutomation — modo sandbox (nenhum efeito real)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leadFindMany.mockResolvedValue([buildLeadRow()]);
    activityFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('webhook externo: registra a ação simulada SEM chamar fetch', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await dryRunAutomation(
      'org-1',
      buildAutomation('Chamar webhook externo', {
        url: 'https://api.exemplo.com/hook/{{status}}',
        method: 'POST',
      }),
    );

    expect(result.matchedCount).toBe(1);
    expect(result.wouldFireCount).toBe(1);
    const record = result.records[0];
    expect(record.outcome.wouldFire).toBe(true);
    expect(record.outcome.details.url).toBe('https://api.exemplo.com/hook/Lead Recebido');
    expect(record.outcome.details.method).toBe('POST');

    expect(fetchSpy).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it('webhook externo sem url: marca wouldFire=false com o motivo (paridade com runAction)', async () => {
    const result = await dryRunAutomation(
      'org-1',
      buildAutomation('Chamar webhook externo', {}),
    );

    expect(result.records[0].outcome.wouldFire).toBe(false);
    expect(result.records[0].outcome.blockedReason).toContain('url');
    expectNoSideEffects();
  });

  it('atualizar campo customizado: registra campo/valor renderizados SEM gravar no lead', async () => {
    const result = await dryRunAutomation(
      'org-1',
      buildAutomation('Atualizar campo customizado', {
        entity: 'Lead',
        field: 'notes',
        value: 'Lead de {{owner}}',
      }),
    );

    expect(result.records[0].outcome.wouldFire).toBe(true);
    expect(result.records[0].outcome.details).toMatchObject({
      entity: 'Lead',
      entityId: 'lead-1',
      field: 'notes',
      value: 'Lead de Ana',
    });
    expectNoSideEffects();
  });

  it('enrich lead: registra o lead SEM publicar na fila de jobs', async () => {
    const result = await dryRunAutomation('org-1', buildAutomation('Enrich lead'));

    expect(result.records[0].outcome.wouldFire).toBe(true);
    expect(result.records[0].outcome.details.leadId).toBe('lead-1');
    expect(result.records[0].outcome.details.queuedEvent).toBe('LEAD_ENRICHMENT_REQUESTED');
    expectNoSideEffects();
  });

  it('mover para etapa de cadência: registra a mutação pretendida SEM tocar em enrollment/WhatsApp', async () => {
    // Este é o caminho que leva a envios reais de WhatsApp: `executeCadenceAction` altera o
    // enrollment e o worker de cadência dispara as mensagens multicanal. O dry-run não pode
    // chamar esse serviço — a asserção abaixo prova isso.
    const result = await dryRunAutomation(
      'org-1',
      buildAutomation('Mover para outra etapa de cadência', {
        cadenceId: 'cad-1',
        action: 'move_to_step',
        stepIndex: 3,
      }),
    );

    expect(result.records[0].outcome.wouldFire).toBe(true);
    expect(result.records[0].outcome.details).toMatchObject({
      cadenceId: 'cad-1',
      leadId: 'lead-1',
      cadenceAction: 'move_to_step',
      stepIndex: 3,
    });
    expectNoSideEffects();
  });

  it('mover para cadência sem cadenceId: wouldFire=false', async () => {
    const result = await dryRunAutomation(
      'org-1',
      buildAutomation('Mover para outra etapa de cadência', { action: 'pause' }),
    );

    expect(result.records[0].outcome.wouldFire).toBe(false);
    expect(result.records[0].outcome.blockedReason).toContain('cadenceId');
    expectNoSideEffects();
  });

  it('notificar equipe por e-mail: registra destinatário renderizado SEM enviar e-mail', async () => {
    const { sendEmail } = await import('../../../lib/email/mailer.js');

    const result = await dryRunAutomation(
      'org-1',
      buildAutomation('Notificar equipe', {
        channel: 'email',
        to: 'vendas@exemplo.com',
        title: 'Novo lead {{status}}',
      }),
    );

    expect(result.records[0].outcome.wouldFire).toBe(true);
    expect(result.records[0].outcome.details).toMatchObject({
      channel: 'email',
      to: 'vendas@exemplo.com',
      title: 'Novo lead Lead Recebido',
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it('criar atividade: registra a atividade que seria criada SEM gravar no CRM', async () => {
    const result = await dryRunAutomation(
      'org-1',
      buildAutomation('Criar atividade', { type: 'Follow_up', dueInDays: 2 }),
    );

    expect(result.records[0].outcome.wouldFire).toBe(true);
    expect(result.records[0].outcome.details).toMatchObject({
      leadId: 'lead-1',
      type: 'Follow_up',
      owner: 'Ana',
    });
    expectNoSideEffects();
  });

  it('ligar via SDR de voz: registra o número SEM discar', async () => {
    const result = await dryRunAutomation(
      'org-1',
      buildAutomation('Ligar via SDR de Voz'),
    );

    expect(result.records[0].outcome.wouldFire).toBe(true);
    expect(result.records[0].outcome.details.targetNumber).toBe('+5511999990000');
    expectNoSideEffects();
  });

  it('enrich lead em evento de atividade sem leadId: wouldFire=false', async () => {
    activityFindMany.mockResolvedValue([
      { id: 'act-1', type: 'Follow_up', owner: 'Ana', leadId: null, updatedAt: new Date() },
    ]);

    const result = await dryRunAutomation(
      'org-1',
      buildAutomation('Enrich lead', {}, { trigger: 'Atividade concluída' as Automation['trigger'] }),
    );

    expect(result.sampleSize).toBe(1);
    expect(result.records[0].entity).toBe('Activity');
    expect(result.records[0].outcome.wouldFire).toBe(false);
    expect(result.records[0].outcome.blockedReason).toContain('lead');
    expectNoSideEffects();
  });
});

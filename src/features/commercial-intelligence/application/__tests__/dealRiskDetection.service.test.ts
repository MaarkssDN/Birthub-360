import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Item 5 de "IA Agêntica de Vendas": detecção de deal em risco (silêncio/tom negativo/concorrente
 * mencionado) e alerta aos gestores reais — nunca um broadcast silencioso quando existe
 * destinatário certo, nunca repete o mesmo alerta dentro do cooldown, nunca chama IA sem
 * conversa recente pra analisar.
 */
const leadFindManyMock = vi.fn();
const whatsAppFindManyMock = vi.fn();
const notificationFindManyMock = vi.fn();
const userFindManyMock = vi.fn();
const notificationCreateMock = vi.fn();
const invokeMock = vi.fn();
const getAiModelMock = vi.fn((..._args: unknown[]) => ({ invoke: invokeMock }));
const cleanAndParseJsonMock = vi.fn();

vi.mock('../../../../lib/prisma.js', () => ({
  prisma: {
    lead: { findMany: (...args: unknown[]) => leadFindManyMock(...args) },
    whatsAppMessage: { findMany: (...args: unknown[]) => whatsAppFindManyMock(...args) },
    notification: { findMany: (...args: unknown[]) => notificationFindManyMock(...args) },
    user: { findMany: (...args: unknown[]) => userFindManyMock(...args) },
  },
}));

vi.mock('../../../../lib/ai/gateway.js', () => ({
  getAiModel: (...args: unknown[]) => getAiModelMock(...args),
  cleanAndParseJson: (...args: unknown[]) => cleanAndParseJsonMock(...args),
  logAiUsage: vi.fn(),
}));

vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../../notifications/notification.service.js', () => ({
  notificationService: { create: (...args: unknown[]) => notificationCreateMock(...args) },
}));

const {
  detectDealRisks,
  evaluateLiveCallInsightRisk,
  ingestLiveCallInsight,
  buildDealNegotiationExecutiveSummary,
} = await import('../dealRiskDetection.service');

beforeEach(() => {
  vi.clearAllMocks();
  leadFindManyMock.mockResolvedValue([]);
  whatsAppFindManyMock.mockResolvedValue([]);
  notificationFindManyMock.mockResolvedValue([]);
  userFindManyMock.mockResolvedValue([]);
  notificationCreateMock.mockResolvedValue({ id: 'notif-1' });
});

describe('detectDealRisks', () => {
  it('detecta lead silencioso e alerta os gestores reais da organização, um por pessoa', async () => {
    leadFindManyMock.mockResolvedValue([
      {
        id: 'lead-1',
        lastInteraction: new Date('2026-09-01T00:00:00Z'),
        createdAt: new Date('2026-08-01T00:00:00Z'),
        company: { tradeName: 'Empresa X' },
      },
    ]);
    userFindManyMock.mockResolvedValue([{ id: 'gestor-1' }, { id: 'gestor-2' }]);

    const result = await detectDealRisks('org-1', new Date('2026-09-10T00:00:00Z'));

    expect(result.alertsCreated).toBe(1);
    expect(notificationCreateMock).toHaveBeenCalledTimes(2);
    expect(notificationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'gestor-1',
        kind: 'Alerta',
        entity: 'Lead',
        entityId: 'lead-1',
      }),
    );
    expect(notificationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'gestor-2' }),
    );
  });

  it('sem nenhum ADMIN/GESTOR cadastrado, faz broadcast pra organização em vez de perder o alerta', async () => {
    leadFindManyMock.mockResolvedValue([
      {
        id: 'lead-1',
        lastInteraction: new Date('2026-09-01T00:00:00Z'),
        createdAt: new Date('2026-08-01T00:00:00Z'),
        company: null,
      },
    ]);
    userFindManyMock.mockResolvedValue([]);

    await detectDealRisks('org-1', new Date('2026-09-10T00:00:00Z'));

    expect(notificationCreateMock).toHaveBeenCalledTimes(1);
    const [callArgs] = notificationCreateMock.mock.calls[0];
    expect(callArgs.entityId).toBe('lead-1');
    expect(callArgs.userId).toBeUndefined();
  });

  it('não repete o mesmo alerta dentro do cooldown', async () => {
    leadFindManyMock.mockResolvedValue([
      {
        id: 'lead-1',
        lastInteraction: new Date('2026-09-01T00:00:00Z'),
        createdAt: new Date('2026-08-01T00:00:00Z'),
        company: null,
      },
    ]);
    notificationFindManyMock.mockResolvedValue([
      {
        entityId: 'lead-1',
        title: 'Risco de perda — silêncio do lead',
      },
    ]);

    const result = await detectDealRisks('org-1', new Date('2026-09-10T00:00:00Z'));

    expect(result.skippedCooldown).toBe(1);
    expect(result.alertsCreated).toBe(0);
    expect(notificationCreateMock).not.toHaveBeenCalled();
  });

  it('não chama a IA quando não há mensagem inbound recente pra analisar', async () => {
    leadFindManyMock.mockResolvedValue([]);
    whatsAppFindManyMock.mockResolvedValue([]);

    await detectDealRisks('org-1');

    expect(getAiModelMock).not.toHaveBeenCalled();
  });

  it('detecta tom negativo e concorrente mencionado a partir da análise real da conversa', async () => {
    leadFindManyMock.mockResolvedValue([]);
    whatsAppFindManyMock
      .mockResolvedValueOnce([{ leadId: 'lead-2' }]) // findLeadsWithRecentInbound
      .mockResolvedValueOnce([
        { direction: 'inbound', body: 'Vocês estão cobrando muito mais que a Empresa Rival.' },
      ]); // loadRecentConversation
    invokeMock.mockResolvedValue({
      content: 'x',
      response_metadata: { model: 'm', tokenUsage: {} },
    });
    cleanAndParseJsonMock.mockReturnValue([
      { toneNegative: true, competitorMentioned: 'Empresa Rival' },
    ]);
    userFindManyMock.mockResolvedValue([{ id: 'gestor-1' }]);

    const result = await detectDealRisks('org-1');

    expect(result.alertsCreated).toBe(2); // tom_negativo + concorrente_mencionado
    expect(notificationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('mudança de tom'),
        entityId: 'lead-2',
      }),
    );
    expect(notificationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('concorrente mencionado'),
        body: expect.stringContaining('Empresa Rival'),
      }),
    );
  });

  it('descarta a rodada de análise de conversa quando a IA devolve formato inesperado — nunca casa dado errado', async () => {
    leadFindManyMock.mockResolvedValue([]);
    whatsAppFindManyMock
      .mockResolvedValueOnce([{ leadId: 'lead-2' }])
      .mockResolvedValueOnce([{ direction: 'inbound', body: 'Oi' }]);
    invokeMock.mockResolvedValue({
      content: 'x',
      response_metadata: { model: 'm', tokenUsage: {} },
    });
    cleanAndParseJsonMock.mockReturnValue([]); // 0 resultados para 1 conversa enviada

    const result = await detectDealRisks('org-1');

    expect(result.alertsCreated).toBe(0);
    expect(notificationCreateMock).not.toHaveBeenCalled();
  });

  describe('LiveCallInsight - Integração e Ingestão Reativa', () => {
    it('avalia sentimento negativo em chamada ao vivo e gera candidato a risco', () => {
      const candidates = evaluateLiveCallInsightRisk({
        callId: 'call-101',
        dealId: 'deal-99',
        timestamp: new Date('2026-09-10T14:00:00Z'),
        sentimentScore: -0.65,
      });

      expect(candidates).toHaveLength(1);
      expect(candidates[0].reason).toBe('sentimento_negativo_chamada');
      expect(candidates[0].leadId).toBe('deal-99');
      expect(candidates[0].detail).toContain('call-101');
    });

    it('avalia menção de concorrente com sugestão de contorno', () => {
      const candidates = evaluateLiveCallInsightRisk({
        callId: 'call-102',
        dealId: 'deal-99',
        timestamp: new Date('2026-09-10T14:05:00Z'),
        sentimentScore: 0.1,
        objectionCategory: 'concorrente',
        competitorMentioned: 'Logix Competitor',
        suggestedRebuttal: 'Destacar SLAs superiores e integração direta.',
      });

      expect(candidates).toHaveLength(1);
      expect(candidates[0].reason).toBe('concorrente_mencionado');
      expect(candidates[0].detail).toContain('Logix Competitor');
      expect(candidates[0].detail).toContain('SLAs superiores');
    });

    it('avalia objeção crítica de preço com sugestão de contorno', () => {
      const candidates = evaluateLiveCallInsightRisk({
        callId: 'call-103',
        dealId: 'deal-99',
        timestamp: new Date('2026-09-10T14:10:00Z'),
        sentimentScore: -0.3,
        objectionCategory: 'preco_ou_orcamento',
        suggestedRebuttal: 'Apresentar modelo de ROI em 3 meses.',
      });

      // Sentimento negativo (-0.3) e objeção crítica de preço geram 2 candidatos complementares
      expect(candidates).toHaveLength(2);
      expect(candidates.map((c) => c.reason)).toEqual([
        'sentimento_negativo_chamada',
        'objecao_chamada',
      ]);
      expect(candidates[1].detail).toContain('preco_ou_orcamento');
      expect(candidates[1].detail).toContain('modelo de ROI em 3 meses');
    });

    it('ingestLiveCallInsight notifica gestores imediatamente quando há risco e fora do cooldown', async () => {
      userFindManyMock.mockResolvedValue([{ id: 'manager-1' }]);

      const result = await ingestLiveCallInsight('org-1', {
        callId: 'call-200',
        dealId: 'deal-88',
        timestamp: new Date('2026-09-10T15:00:00Z'),
        sentimentScore: -0.7,
        objectionCategory: 'concorrente',
        competitorMentioned: 'OmniTransport',
      });

      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.alertsCreated).toBe(result.candidates.length);
      expect(result.skippedCooldown).toBe(0);
      expect(notificationCreateMock).toHaveBeenCalledTimes(result.candidates.length);
    });

    it('ingestLiveCallInsight respeita cooldown e não duplica notificação recente', async () => {
      notificationFindManyMock.mockResolvedValue([
        {
          entityId: 'deal-88',
          title: 'Risco de perda — sentimento negativo em chamada',
        },
      ]);

      const result = await ingestLiveCallInsight('org-1', {
        callId: 'call-201',
        dealId: 'deal-88',
        timestamp: new Date('2026-09-10T15:05:00Z'),
        sentimentScore: -0.8,
      });

      expect(result.candidates).toHaveLength(1);
      expect(result.alertsCreated).toBe(0);
      expect(result.skippedCooldown).toBe(1);
      expect(notificationCreateMock).not.toHaveBeenCalled();
    });

    it('detectDealRisks inclui live insights no escopo global de análise', async () => {
      leadFindManyMock.mockResolvedValue([]);
      whatsAppFindManyMock.mockResolvedValue([]);
      userFindManyMock.mockResolvedValue([{ id: 'admin-1' }]);

      const liveInsights = [
        {
          callId: 'call-live-1',
          dealId: 'deal-live-1',
          timestamp: new Date(),
          sentimentScore: -0.5,
          objectionCategory: 'timing_ou_prioridade',
        },
      ];

      const result = await detectDealRisks('org-1', new Date(), liveInsights);

      expect(result.scanned).toBe(2); // 1 sentimento negativo + 1 objeção crítica
      expect(result.alertsCreated).toBe(2);
    });

    it('buildDealNegotiationExecutiveSummary consolida insights e ajusta status de risco da negociação', () => {
      const summary = buildDealNegotiationExecutiveSummary(
        {
          id: 'deal-55',
          title: 'Contrato Anual TransLog',
          amount: 150_000,
          stageName: 'Proposta Apresentada',
          probability: 70,
        },
        [
          {
            callId: 'call-live-9',
            dealId: 'deal-55',
            timestamp: new Date(),
            sentimentScore: -0.4,
            objectionCategory: 'concorrente',
            competitorMentioned: 'Competitor Corp',
            suggestedRebuttal: 'Destacar tecnologia proprietária.',
          },
        ],
      );

      expect(summary.dealId).toBe('deal-55');
      expect(summary.sentimentLabel).toBe('negativo');
      expect(summary.competitorsMentioned).toContain('Competitor Corp');
      expect(summary.activeObjections).toHaveLength(1);
      expect(summary.healthScore).toBeLessThan(70);
      expect(summary.riskStatus).toBe('alto_risco');
      expect(summary.executiveTakeaway).toContain('Competitor Corp');
    });
  });
});

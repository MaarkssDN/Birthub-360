import { describe, expect, it } from 'vitest';
import { CopilotoIaUseCases } from '../CopilotoIaUseCases.js';
import type {
  CopilotoIaRepository,
  CopilotoDealHealthSnapshotDTO,
} from '../../domain/CopilotoIa.js';
import type { WhatsAppMessageTiming } from '../whatsappResponseTime.js';

class MockCopilotoRepository implements Partial<CopilotoIaRepository> {
  dealHealthSnapshot: CopilotoDealHealthSnapshotDTO | null = null;
  timings: WhatsAppMessageTiming[] = [];

  async latestDealHealthSnapshot(): Promise<CopilotoDealHealthSnapshotDTO | null> {
    return this.dealHealthSnapshot;
  }

  async getWhatsAppMessageTimingsForLead(): Promise<WhatsAppMessageTiming[]> {
    return this.timings;
  }
}

describe('Trilha C.1 — CopilotoIaUseCases.getNextBestAction', () => {
  it('sugere resposta imediata quando há mensagem pendente do lead no WhatsApp', async () => {
    const repo = new MockCopilotoRepository();
    repo.timings = [
      {
        direction: 'inbound', // Mensagem do cliente
        receivedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
      },
    ];

    const useCases = new CopilotoIaUseCases(repo as unknown as CopilotoIaRepository);
    const nba = await useCases.getNextBestAction('org-1', 'lead-1');

    expect(nba.leadId).toBe('lead-1');
    expect(nba.action).toBe('Responder mensagem pendente do Lead no WhatsApp');
    expect(nba.priority).toBe('ALTA');
    expect(nba.suggestedChannel).toBe('WHATSAPP');
    expect(nba.responseTimeSlaStatus).toBe('ALERTA');
  });

  it('indica status CRITICO quando a mensagem do lead aguarda retorno há mais de 4 horas', async () => {
    const repo = new MockCopilotoRepository();
    repo.timings = [
      {
        direction: 'inbound',
        receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
      },
    ];

    const useCases = new CopilotoIaUseCases(repo as unknown as CopilotoIaRepository);
    const nba = await useCases.getNextBestAction('org-1', 'lead-1');

    expect(nba.priority).toBe('ALTA');
    expect(nba.responseTimeSlaStatus).toBe('CRITICO');
    expect(nba.reason).toContain('SLA estourado');
  });

  it('sugere reunião de resgate quando o Deal Health Score está crítico (< 50)', async () => {
    const repo = new MockCopilotoRepository();
    repo.dealHealthSnapshot = {
      id: 'snap-1',
      leadId: 'lead-1',
      score: 35,
      forecastProbabilityAi: 30,
      forecastReasons: ['Objeção de preço'],
      churnRiskScore: 70,
      factorsJson: {},
      churnFactorsJson: {},
      createdAt: new Date(),
    };

    const useCases = new CopilotoIaUseCases(repo as unknown as CopilotoIaRepository);
    const nba = await useCases.getNextBestAction('org-1', 'lead-1');

    expect(nba.action).toBe('Agendar Alinhamento / Reunião de Resgate de Oportunidade');
    expect(nba.priority).toBe('ALTA');
    expect(nba.suggestedChannel).toBe('REUNIAO');
    expect(nba.dealHealthScore).toBe(35);
  });

  it('sugere envio de proposta e fechamento quando Deal Health Score é alto (>= 75)', async () => {
    const repo = new MockCopilotoRepository();
    repo.dealHealthSnapshot = {
      id: 'snap-2',
      leadId: 'lead-2',
      score: 85,
      forecastProbabilityAi: 80,
      forecastReasons: ['Decisor engajado'],
      churnRiskScore: 10,
      factorsJson: {},
      churnFactorsJson: {},
      createdAt: new Date(),
    };

    const useCases = new CopilotoIaUseCases(repo as unknown as CopilotoIaRepository);
    const nba = await useCases.getNextBestAction('org-1', 'lead-2');

    expect(nba.action).toBe('Enviar Proposta Comercial e Fechamento');
    expect(nba.priority).toBe('ALTA');
    expect(nba.suggestedChannel).toBe('EMAIL');
    expect(nba.dealHealthScore).toBe(85);
  });

  it('sugere follow-up padrão de qualificação quando não há alertas nem score extremo', async () => {
    const repo = new MockCopilotoRepository();
    const useCases = new CopilotoIaUseCases(repo as unknown as CopilotoIaRepository);
    const nba = await useCases.getNextBestAction('org-1', 'lead-3');

    expect(nba.action).toBe('Follow-up de Qualificação e Próximos Passos');
    expect(nba.priority).toBe('MEDIA');
    expect(nba.suggestedChannel).toBe('WHATSAPP');
    expect(nba.responseTimeSlaStatus).toBe('OK');
  });
});

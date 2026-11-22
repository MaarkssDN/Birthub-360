import { describe, expect, it, vi } from 'vitest';
import {
  AnalyticsUseCases,
  buildUnifiedTimelineCsv,
} from '../../../../src/features/analytics/application/AnalyticsUseCases.js';
import type {
  AnalyticsRepository,
  UnifiedTimelineEvent,
  UnifiedTimelineResult,
} from '../../../../src/features/analytics/domain/Analytics.js';

describe('AnalyticsUseCases — Unified Timeline Cross-Entity', () => {
  const sampleEvents: UnifiedTimelineEvent[] = [
    {
      id: 'act_1',
      timestamp: '2026-11-03T14:30:00.000Z',
      entityType: 'call',
      title: 'Ligação: Alinhamento de Proposta',
      description: 'Cliente confirmou interesse na solução corporativa.',
      actor: 'Carlos SDR',
      targetName: 'Empresa Alfa Ltda',
      targetId: 'lead_1',
      outcome: 'success',
      metadata: { status: 'Concluida' },
    },
    {
      id: 'wa_1',
      timestamp: '2026-11-03T15:00:00.000Z',
      entityType: 'whatsapp',
      title: 'WhatsApp Enviado',
      description: 'Olá, segue apresentação comercial.',
      actor: 'Atendente / IA',
      targetName: 'Beatriz Gestora',
      targetId: 'lead_2',
      outcome: 'pending',
    },
    {
      id: 'deal_1',
      timestamp: '2026-11-03T16:00:00.000Z',
      entityType: 'deal',
      title: 'Negócio Ganho: Expansão Nacional',
      description: 'Valor R$ 120.000,00',
      actor: 'Mariana Closer',
      targetName: 'Hospital Beta',
      targetId: 'lead_3',
      outcome: 'success',
      metadata: { amount: 120000 },
    },
    {
      id: 'cad_1',
      timestamp: '2026-11-03T16:30:00.000Z',
      entityType: 'automation',
      title: 'Automação de Cadência: Régua Inbound',
      description: 'Parada: Lead respondeu no WhatsApp',
      actor: 'Motor de Cadência',
      targetName: 'Carlos Lead',
      targetId: 'lead_4',
      outcome: 'failed',
    },
  ];

  it('deve delegar a busca da timeline unificada para o repository com parâmetros corretos', async () => {
    const mockRepoResult: UnifiedTimelineResult = {
      events: sampleEvents,
      total: 4,
      page: 1,
      limit: 50,
      totalPages: 1,
    };

    const mockRepo: Partial<AnalyticsRepository> = {
      getUnifiedTimeline: vi.fn().mockResolvedValue(mockRepoResult),
    };

    const useCases = new AnalyticsUseCases(mockRepo as AnalyticsRepository);
    const result = await useCases.unifiedTimeline('org-test-123', {
      period: '7d',
      entityType: 'call',
      outcome: 'success',
      search: 'Alfa',
    });

    expect(mockRepo.getUnifiedTimeline).toHaveBeenCalledWith('org-test-123', {
      period: '7d',
      entityType: 'call',
      outcome: 'success',
      search: 'Alfa',
    });
    expect(result.events).toHaveLength(4);
    expect(result.total).toBe(4);
  });

  it('deve gerar CSV formatado para auditoria com BOM UTF-8 e delimitador ponto-e-vírgula', () => {
    const csv = buildUnifiedTimelineCsv(sampleEvents);

    // BOM UTF-8 (\uFEFF) para compatibilidade nativa com Excel
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Cabeçalho esperado
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(
      '\uFEFFData e Hora;Tipo;Título;Descrição;Responsável;Alvo/Contato;Resultado',
    );

    // Linha 1 (Chamada)
    expect(lines[1]).toContain('Chamada');
    expect(lines[1]).toContain('Ligação: Alinhamento de Proposta');
    expect(lines[1]).toContain('Carlos SDR');
    expect(lines[1]).toContain('Empresa Alfa Ltda');
    expect(lines[1]).toContain('Concluído/Sucesso');

    // Linha 2 (WhatsApp)
    expect(lines[2]).toContain('WhatsApp');
    expect(lines[2]).toContain('Pendente');

    // Linha 3 (Negócio)
    expect(lines[3]).toContain('Negociação');
    expect(lines[3]).toContain('Hospital Beta');

    // Linha 4 (Automação)
    expect(lines[4]).toContain('Automação');
    expect(lines[4]).toContain('Falha/Cancelado');
  });

  it('deve escapar adequadamente aspas e quebras de linha no CSV', () => {
    const eventWithQuotes: UnifiedTimelineEvent = {
      id: 'act_quote',
      timestamp: '2026-11-03T10:00:00.000Z',
      entityType: 'lead',
      title: 'Reunião com "Diretoria" Executiva',
      description: 'Linha 1\nLinha 2 com "detalhe"',
      actor: 'João "Admin"',
      targetName: 'Empresa "XYZ"',
      outcome: 'success',
    };

    const csv = buildUnifiedTimelineCsv([eventWithQuotes]);
    expect(csv).toContain('Reunião com ""Diretoria"" Executiva');
    expect(csv).toContain('Linha 1 Linha 2 com ""detalhe""');
  });

  it('deve lidar com lista vazia de eventos gerando apenas o cabeçalho', () => {
    const csv = buildUnifiedTimelineCsv([]);
    expect(csv).toBe('\uFEFFData e Hora;Tipo;Título;Descrição;Responsável;Alvo/Contato;Resultado');
  });
});

import { describe, it, expect } from 'vitest';
import { normalizeCrmStage, DEFAULT_CRM_STAGE_MAPPINGS } from '@/shared/types/crm.js';

describe('normalizeCrmStage — Mapeamento Canônico de Estágios de CRM', () => {
  it('mapeia estágios nativos do HubSpot corretamente', () => {
    expect(normalizeCrmStage('appointmentscheduled')).toEqual({ stage: 'PROSPECTING', probability: 0.2 });
    expect(normalizeCrmStage('presentationscheduled')).toEqual({ stage: 'PROPOSAL', probability: 0.6 });
    expect(normalizeCrmStage('closedwon')).toEqual({ stage: 'WON', probability: 1.0 });
    expect(normalizeCrmStage('closedlost')).toEqual({ stage: 'LOST', probability: 0.0 });
  });

  it('mapeia estágios nativos do Pipedrive corretamente', () => {
    expect(normalizeCrmStage('lead_in')).toEqual({ stage: 'PROSPECTING', probability: 0.15 });
    expect(normalizeCrmStage('demo_scheduled')).toEqual({ stage: 'PROPOSAL', probability: 0.55 });
    expect(normalizeCrmStage('negotiations_started')).toEqual({ stage: 'NEGOTIATION', probability: 0.85 });
    expect(normalizeCrmStage('won')).toEqual({ stage: 'WON', probability: 1.0 });
  });

  it('mapeia estágios do RD Station CRM corretamente', () => {
    expect(normalizeCrmStage('sem_contato')).toEqual({ stage: 'PROSPECTING', probability: 0.1 });
    expect(normalizeCrmStage('reuniao_agendada')).toEqual({ stage: 'PROPOSAL', probability: 0.5 });
    expect(normalizeCrmStage('fechado_ganho')).toEqual({ stage: 'WON', probability: 1.0 });
  });

  it('resolve por heurística quando recebe label customizado em português ou inglês', () => {
    expect(normalizeCrmStage('Proposta Enviada para Diretoria')).toEqual({ stage: 'PROPOSAL', probability: 0.6 });
    expect(normalizeCrmStage('Negociação Final de Contrato')).toEqual({ stage: 'NEGOTIATION', probability: 0.85 });
    expect(normalizeCrmStage('Fechado e Ganho')).toEqual({ stage: 'WON', probability: 1.0 });
    expect(normalizeCrmStage('Perdido por Preço')).toEqual({ stage: 'LOST', probability: 0.0 });
  });

  it('usa fallback seguro quando recebe valor nulo ou desconhecido sem gerar NaN', () => {
    const resultNull = normalizeCrmStage(null);
    expect(resultNull.stage).toBe('PROSPECTING');
    expect(Number.isNaN(resultNull.probability)).toBe(false);

    const resultUnknown = normalizeCrmStage('estagio_inexistente_xyz');
    expect(resultUnknown.stage).toBe('PROSPECTING');
    expect(resultUnknown.probability).toBe(0.2);
  });
});

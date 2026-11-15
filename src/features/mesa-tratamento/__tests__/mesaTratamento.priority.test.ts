import type { Lead } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { computeQueuePriorityScore, rankLeadsForQueue } from '../mesaTratamento.priority.js';

/**
 * Testes da ordenação e do score de prioridade da fila da Mesa de Tratamento — funções puras
 * que decidem "qual lead o SDR atende agora". A ordem real vem SEMPRE de rankLeadsForQueue
 * (etapa → dias sem toque → temperatura); computeQueuePriorityScore é só a explicação
 * pedagógica em pontos (0-100) mostrada na UI.
 */

type QueueLead = Pick<Lead, 'status' | 'lastInteraction' | 'temperature'>;

function lead(
  status: string,
  lastInteraction: Date | null,
  temperature: string | null = null,
): QueueLead {
  return { status, lastInteraction, temperature } as QueueLead;
}

describe('rankLeadsForQueue', () => {
  it('etapa mais urgente vem primeiro, independente dos demais fatores', () => {
    const reuniao = lead('Reuniao_Agendada', new Date()); // acabou de ser tocado
    const recebidoAntigo = lead('Lead_Recebido', new Date(Date.now() - 300 * 86_400_000));
    const ranked = rankLeadsForQueue([recebidoAntigo, reuniao]);
    expect(ranked[0]).toBe(reuniao);
  });

  it('na mesma etapa, quem está há mais tempo sem toque vem primeiro; nunca tocado = máxima prioridade', () => {
    const tocadoAgora = lead('Lead_Recebido', new Date());
    const tocadoHa30d = lead('Lead_Recebido', new Date(Date.now() - 30 * 86_400_000));
    const nuncaTocado = lead('Lead_Recebido', null);
    const ranked = rankLeadsForQueue([tocadoAgora, tocadoHa30d, nuncaTocado]);
    expect(ranked.map((l) => l.lastInteraction)).toEqual([
      null,
      tocadoHa30d.lastInteraction,
      tocadoAgora.lastInteraction,
    ]);
  });

  it('desempata por temperatura: Quente antes de Morno antes de Frio', () => {
    const mesmoToque = new Date(Date.now() - 10 * 86_400_000);
    const frio = lead('Lead_Recebido', mesmoToque, 'Frio');
    const morno = lead('Lead_Recebido', mesmoToque, 'Morno');
    const quente = lead('Lead_Recebido', mesmoToque, 'Quente');
    const ranked = rankLeadsForQueue([frio, morno, quente]);
    expect(ranked).toEqual([quente, morno, frio]);
  });

  it('não muta o array original', () => {
    const a = lead('Lead_Recebido', new Date());
    const b = lead('Reuniao_Agendada', new Date());
    const input = [a, b];
    rankLeadsForQueue(input);
    expect(input).toEqual([a, b]);
  });
});

describe('computeQueuePriorityScore', () => {
  it('lead de reunião agendada quente e nunca tocado atinge o teto da régua', () => {
    const score = computeQueuePriorityScore(lead('Reuniao_Agendada', null, 'Quente'));
    // 45 (etapa) + 40 (dias sem toque, cap 120d) + 15 (temperatura) = 100
    expect(score.score).toBe(100);
    expect(score.breakdown).toHaveLength(3);
    expect(score.breakdown.map((b) => b.label)).toEqual([
      'Etapa do funil',
      'Dias sem toque',
      'Temperatura',
    ]);
  });

  it('dias sem toque têm teto de 120 — lead esquecido há 10 anos não passa de 40 pontos', () => {
    const antigo = computeQueuePriorityScore(
      lead('Lead_Recebido', new Date(Date.now() - 3650 * 86_400_000), 'Frio'),
    );
    const diasItem = antigo.breakdown.find((b) => b.label === 'Dias sem toque');
    expect(diasItem?.points).toBe(40);
    expect(antigo.score).toBe(5 + 40 + 0);
  });

  it('status desconhecido zera os pontos de etapa mas mantém os demais fatores', () => {
    const score = computeQueuePriorityScore(lead('Etapa_Inventada', null, 'Morno'));
    expect(score.score).toBe(0 + 40 + 8);
    expect(score.breakdown[0].detail).toContain('Etapa Inventada');
  });

  it('lead recém-tocado e frio tem score baixo — explica visualmente por que está no fim da fila', () => {
    const score = computeQueuePriorityScore(lead('Lead_Recebido', new Date(), 'Frio'));
    expect(score.score).toBeLessThan(20);
  });
});

import { describe, expect, it } from 'vitest';
import {
  isHandoffLoop,
  MAX_HANDOFF_DEPTH,
  MAX_HANDOFF_STEPS_PER_MISSION,
} from '@/features/job-roles/config/agent-bus-policy';

// Handoff 23-para-13 (DIV-AGENTE-13-001) — o bus REAL de produção
// (src/features/job-roles/services/agentBus.service.ts) já implementa o equivalente a
// hopCount/maxHops via `AgentHandoffMessage.depth` + `parentHandoffId`, com dois tetos
// independentes em agent-bus-policy.ts:
//   - isHandoffLoop: corta ciclo estrutural (A -> B -> A) já na publicação;
//   - MAX_HANDOFF_DEPTH: teto de profundidade da cadeia (= hopCount máximo);
//   - MAX_HANDOFF_STEPS_PER_MISSION: teto total de handoffs por missão (defesa extra
//     contra cadeias que não fecham ciclo mas nunca terminam).
// Estes testes exercitam a política pura (sem banco) — a prova ponta a ponta com
// persistência está em tests/integration/agent-bus.test.ts.
describe('agent-bus-policy — trava de recursão do Agent Bus real', () => {
  it('rejeita handoff do agente para si mesmo (ciclo de tamanho 1)', () => {
    expect(isHandoffLoop('agent-a', 'agent-a', [])).toBe(true);
  });

  it('corta o loop A -> B -> A: o retorno ao agente de origem é detectado como ciclo', () => {
    // Cadeia já publicada: A -> B (ancestrais carregam fromAgent/toAgent de cada elo,
    // exatamente como collectAncestorAgentCodes monta em agentBus.service.ts).
    const ancestorsAfterAB = ['agent-a', 'agent-b'];
    // Próximo handoff seria B -> A: 'agent-a' já está na cadeia -> LOOP.
    expect(isHandoffLoop('agent-a', 'agent-b', ancestorsAfterAB)).toBe(true);
  });

  it('corta loop alternado A -> B -> A -> B em qualquer profundidade da cadeia', () => {
    // Simula a cadeia crescendo hop a hop (depth = hopCount) e garante que, em QUALQUER
    // tentativa de fechar ciclo, isHandoffLoop dispara — o loop infinito nunca passa do
    // primeiro retorno a um agente já visitado.
    const visited = new Set<string>();
    const chain: Array<[string, string]> = [
      ['agent-a', 'agent-b'],
      ['agent-b', 'agent-a'],
      ['agent-a', 'agent-b'],
      ['agent-b', 'agent-a'],
    ];

    for (const [fromAgent, toAgent] of chain) {
      const ancestors = [...visited];
      const isLoop = isHandoffLoop(toAgent, fromAgent, ancestors);
      if (isLoop) {
        // Loop detectado — a cadeia é abortada aqui; nenhum hop adicional é publicado.
        expect(isLoop).toBe(true);
        return;
      }
      visited.add(fromAgent);
      visited.add(toAgent);
    }
    // Se nenhum ciclo tivesse sido detectado, a cadeia teria passado — falha explícita.
    throw new Error('Loop A<->B não foi detectado pela política do bus real.');
  });

  it('permite cadeia legítima sem repetição de agentes (sem falso positivo)', () => {
    const ancestors = ['agent-a', 'agent-b', 'agent-c'];
    expect(isHandoffLoop('agent-d', 'agent-c', ancestors)).toBe(false);
  });

  it('expõe tetos finitos de hops e de passos por missão (loop nunca é infinito)', () => {
    expect(MAX_HANDOFF_DEPTH).toBeGreaterThan(0);
    expect(MAX_HANDOFF_DEPTH).toBeLessThanOrEqual(10);
    expect(MAX_HANDOFF_STEPS_PER_MISSION).toBeGreaterThan(MAX_HANDOFF_DEPTH);
    expect(Number.isInteger(MAX_HANDOFF_DEPTH)).toBe(true);
    expect(Number.isInteger(MAX_HANDOFF_STEPS_PER_MISSION)).toBe(true);
  });
});

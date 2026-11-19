import { HumanMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';
import { SwarmState } from '../../../../../../src/features/intelligence/agents/supervisor/swarm.state.js';

describe('SwarmState Annotation Root', () => {
  it('deve definir a estrutura de canais e reducers do grafo do enxame', () => {
    expect(SwarmState).toBeDefined();
    expect(SwarmState.spec).toBeDefined();
  });

  describe('canais e reducers individuais', () => {
    it('messages: inicializa com array vazio e concatena mensagens', () => {
      const channel = SwarmState.spec.messages as any;
      expect(channel.initialValueFactory()).toEqual([]);
      const m1 = new HumanMessage('msg 1');
      const m2 = new HumanMessage('msg 2');
      expect(channel.operator([m1], [m2])).toEqual([m1, m2]);
    });

    it('mission: inicializa vazio e substitui pelo novo ou preserva', () => {
      const channel = SwarmState.spec.mission as any;
      expect(channel.initialValueFactory()).toBe('');
      expect(channel.operator('missao A', 'missao B')).toBe('missao B');
      expect(channel.operator('missao A', undefined)).toBe('missao A');
    });

    it('instruction: inicializa vazio e substitui pelo novo ou preserva', () => {
      const channel = SwarmState.spec.instruction as any;
      expect(channel.initialValueFactory()).toBe('');
      expect(channel.operator('instrucao A', 'instrucao B')).toBe('instrucao B');
      expect(channel.operator('instrucao A', undefined)).toBe('instrucao A');
    });

    it('leadId: inicializa vazio e substitui pelo novo ou preserva', () => {
      const channel = SwarmState.spec.leadId as any;
      expect(channel.initialValueFactory()).toBe('');
      expect(channel.operator('lead-1', 'lead-2')).toBe('lead-2');
      expect(channel.operator('lead-1', undefined)).toBe('lead-1');
    });

    it('subSwarm: inicializa commercial e substitui pelo novo ou preserva', () => {
      const channel = SwarmState.spec.subSwarm as any;
      expect(channel.initialValueFactory()).toBe('commercial');
      expect(channel.operator('commercial', 'operational')).toBe('operational');
      expect(channel.operator('operational', undefined)).toBe('operational');
    });

    it('catalogMatches: inicializa vazio e substitui quando lista nova contem itens', () => {
      const channel = SwarmState.spec.catalogMatches as any;
      expect(channel.initialValueFactory()).toEqual([]);
      const match1: any = { agentKey: 'sdr', score: 0.9 };
      const match2: any = { agentKey: 'closer', score: 0.95 };
      expect(channel.operator([match1], [match2])).toEqual([match2]);
      expect(channel.operator([match1], [])).toEqual([match1]);
      expect(channel.operator([match1], undefined)).toEqual([match1]);
    });

    it('selectedCatalogAgent: inicializa null e substitui pelo novo ou preserva', () => {
      const channel = SwarmState.spec.selectedCatalogAgent as any;
      expect(channel.initialValueFactory()).toBeNull();
      expect(channel.operator(null, 'agent-xyz')).toBe('agent-xyz');
      expect(channel.operator('agent-xyz', undefined)).toBe('agent-xyz');
    });

    it('next: inicializa sdr e substitui pelo novo ou preserva', () => {
      const channel = SwarmState.spec.next as any;
      expect(channel.initialValueFactory()).toBe('sdr');
      expect(channel.operator('sdr', 'closer')).toBe('closer');
      expect(channel.operator('closer', undefined)).toBe('closer');
    });

    it('completed: inicializa vazio e acumula chaves de agentes concluidos', () => {
      const channel = SwarmState.spec.completed as any;
      expect(channel.initialValueFactory()).toEqual([]);
      expect(channel.operator(['sdr'], ['closer'])).toEqual(['sdr', 'closer']);
    });

    it('results: inicializa objeto vazio e mescla os resultados de cada agente', () => {
      const channel = SwarmState.spec.results as any;
      expect(channel.initialValueFactory()).toEqual({});
      const r1 = { sdr: 'qualificado' };
      const r2 = { closer: 'proposta enviada' };
      expect(channel.operator(r1, r2)).toEqual({
        sdr: 'qualificado',
        closer: 'proposta enviada',
      });
    });

    it('step: inicializa 0 e incrementa ou atualiza o passo', () => {
      const channel = SwarmState.spec.step as any;
      expect(channel.initialValueFactory()).toBe(0);
      expect(channel.operator(1, 2)).toBe(2);
      expect(channel.operator(2, undefined)).toBe(2);
    });
  });
});

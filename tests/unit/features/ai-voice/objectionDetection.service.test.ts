import { describe, it, expect, beforeEach } from 'vitest';
import {
  objectionDetectionService,
  type StreamingTranscriptionChunk,
  type ObjectionCategory,
} from '../../../../src/features/ai-voice/objectionDetection.service.js';

describe('ObjectionDetectionService', () => {
  const sessionId = 'session-test-realtime-call-1';

  beforeEach(() => {
    objectionDetectionService.clearSession(sessionId);
    objectionDetectionService.clearSession('session-test-realtime-call-2');
  });

  describe('Classification Precision Across Categories', () => {
    describe('Preço (Price / Budget)', () => {
      const pricePhrases = [
        'Olha, achei a ferramenta interessante, mas está muito caro para nossa realidade.',
        'Infelizmente esse valor está totalmente fora do orçamento deste semestre.',
        'No momento estamos sem verba para novos investimentos de software.',
        'O custo está muito alto em relação ao que podemos dispor agora.',
        'Não podemos pagar esse valor mensal.',
        'Vocês conseguem reduzir o preço ou dar um desconto?',
      ];

      it.each(pricePhrases)('should classify as "price": "%s"', async (phrase) => {
        const result = await objectionDetectionService.detect(phrase, { sessionId });
        expect(result).not.toBeNull();
        expect(result?.category).toBe('price');
        expect(result?.confidence).toBeGreaterThanOrEqual(0.85);
        expect(result?.matchedSnippet).toBeTruthy();
        expect(result?.suggestedRebuttals.length).toBe(4);
      });
    });

    describe('Timing (Momento / Prioridade)', () => {
      const timingPhrases = [
        'Agradeço o contato, mas agora não é o momento certo para nós.',
        'Estamos sem tempo nenhum agora, a equipe está na correria com a Black Friday.',
        'Pode me ligar no próximo trimestre? Vamos rever isso mais adiante.',
        'Vamos avaliar isso só no ano que vem.',
        'Nossa prioridade agora é outra, estamos focados em migração de ERP.',
        'Vamos deixar pra depois, agora não conseguimos parar para ver isso.',
      ];

      it.each(timingPhrases)('should classify as "timing": "%s"', async (phrase) => {
        const result = await objectionDetectionService.detect(phrase, { sessionId });
        expect(result).not.toBeNull();
        expect(result?.category).toBe('timing');
        expect(result?.confidence).toBeGreaterThanOrEqual(0.85);
        expect(result?.matchedSnippet).toBeTruthy();
        expect(result?.suggestedRebuttals.length).toBe(4);
      });
    });

    describe('Concorrência (Competition / Solução Existente)', () => {
      const competitionPhrases = [
        'Já usamos outro concorrente de vocês há quase três anos.',
        'Estamos muito bem atendidos com o nosso fornecedor atual.',
        'Fechamos com outra empresa recentemente, então temos contrato em vigor.',
        'Nossa solução atual já nos atende bem no dia a dia.',
        'Já trabalhamos com outro sistema que faz essa mesma função.',
      ];

      it.each(competitionPhrases)('should classify as "competition": "%s"', async (phrase) => {
        const result = await objectionDetectionService.detect(phrase, { sessionId });
        expect(result).not.toBeNull();
        expect(result?.category).toBe('competition');
        expect(result?.confidence).toBeGreaterThanOrEqual(0.85);
        expect(result?.matchedSnippet).toBeTruthy();
        expect(result?.suggestedRebuttals.length).toBe(4);
      });
    });

    describe('Autoridade (Authority / Decisor / Comitê)', () => {
      const authorityPhrases = [
        'Gostei muito da apresentação, mas preciso falar com meu diretor antes de avançar.',
        'Não sou eu quem decide isso aqui na empresa, a decisão final é do comitê.',
        'Não tenho autonomia para assinar nem aprovar novos custos.',
        'A decisão é da diretoria e do CFO, vou precisar apresentar para eles.',
        'Quem assina o contrato não sou eu, é o proprietário.',
      ];

      it.each(authorityPhrases)('should classify as "authority": "%s"', async (phrase) => {
        const result = await objectionDetectionService.detect(phrase, { sessionId });
        expect(result).not.toBeNull();
        expect(result?.category).toBe('authority');
        expect(result?.confidence).toBeGreaterThanOrEqual(0.88);
        expect(result?.matchedSnippet).toBeTruthy();
        expect(result?.suggestedRebuttals.length).toBe(4);
      });
    });

    describe('Neutral / Non-objection Utterances', () => {
      const neutralPhrases = [
        'Bom dia, tudo bem? Podemos falar rapidamente?',
        'Entendi a demonstração, me manda o material por e-mail para eu dar uma olhada.',
        'Perfeito, vamos nos falando então. Um abraço!',
        'Quantos usuários estão inclusos nessa modalidade?',
        'Qual o horário de atendimento do suporte técnico?',
      ];

      it.each(neutralPhrases)('should return null for non-objection: "%s"', async (phrase) => {
        const result = await objectionDetectionService.detect(phrase, { sessionId });
        expect(result).toBeNull();
      });
    });
  });

  describe('Rebuttal Generation & Strategic Pillars', () => {
    const categories: ObjectionCategory[] = ['price', 'timing', 'competition', 'authority'];

    it.each(categories)('should provide all 4 strategies for %s', (category) => {
      const rebuttals = objectionDetectionService.getRebuttals(category);
      expect(rebuttals).toHaveLength(4);

      const strategies = rebuttals.map((r) => r.strategy);
      expect(strategies).toContain('reframe');
      expect(strategies).toContain('pivot');
      expect(strategies).toContain('case_study');
      expect(strategies).toContain('discovery_question');

      for (const rebuttal of rebuttals) {
        expect(rebuttal.title).toBeTruthy();
        expect(rebuttal.script).toBeTruthy();
        expect(rebuttal.keyTakeaway).toBeTruthy();
      }
    });

    it('should enrich rebuttal scripts when segment and brand context is provided', () => {
      const enrichedRebuttals = objectionDetectionService.getRebuttals('price', {
        segment: 'Logística Rodoviária',
        brand: 'Birth Voice 360',
      });

      const caseStudy = enrichedRebuttals.find((r) => r.strategy === 'case_study');
      expect(caseStudy?.script).toContain('segmento de Logística Rodoviária');

      const reframe = enrichedRebuttals.find((r) => r.strategy === 'reframe');
      expect(reframe?.script).toContain('solução Birth Voice 360');
    });
  });

  describe('Real-Time Streaming Chunk Ingestion', () => {
    it('should ignore agent speech and never trigger false alarms', async () => {
      const agentChunk: StreamingTranscriptionChunk = {
        sessionId,
        speaker: 'agent',
        text: 'Nosso preço é muito caro caso você compare com ferramentas genéricas.',
        timestamp: Date.now(),
      };

      const result = await objectionDetectionService.processChunk(agentChunk);
      expect(result).toBeNull();
    });

    it('should detect objections spanning multiple streaming chunks in a rolling buffer', async () => {
      const chunk1: StreamingTranscriptionChunk = {
        sessionId,
        speaker: 'lead',
        text: 'O problema é que o orçamento da nossa área',
        timestamp: Date.now(),
      };

      const res1 = await objectionDetectionService.processChunk(chunk1);
      expect(res1).toBeNull(); // Incomplete context, no trigger yet

      const chunk2: StreamingTranscriptionChunk = {
        sessionId,
        speaker: 'lead',
        text: 'está completamente estourado e fora do orçamento previsto.',
        timestamp: Date.now() + 100,
      };

      const res2 = await objectionDetectionService.processChunk(chunk2);
      expect(res2).not.toBeNull();
      expect(res2?.category).toBe('price');
      expect(res2?.matchedSnippet).toBeTruthy();
    });

    it('should suppress repeated alerts for the same category within cooldown window', async () => {
      const chunk1: StreamingTranscriptionChunk = {
        sessionId,
        speaker: 'lead',
        text: 'Está muito caro para nós agora.',
        timestamp: Date.now(),
      };

      const firstDetection = await objectionDetectionService.processChunk(chunk1, {
        cooldownMs: 5000,
      });
      expect(firstDetection).not.toBeNull();
      expect(firstDetection?.category).toBe('price');

      // Immediate subsequent chunk with similar objection words
      const chunk2: StreamingTranscriptionChunk = {
        sessionId,
        speaker: 'lead',
        text: 'Sim, o valor está muito pesado.',
        timestamp: Date.now() + 500,
      };

      const suppressedDetection = await objectionDetectionService.processChunk(chunk2, {
        cooldownMs: 5000,
      });
      expect(suppressedDetection).toBeNull(); // Suppressed by cooldown

      // New distinct category should bypass previous category cooldown
      const chunk3: StreamingTranscriptionChunk = {
        sessionId,
        speaker: 'lead',
        text: 'Além disso, preciso falar com meu diretor antes de decidir.',
        timestamp: Date.now() + 600,
      };

      const authorityDetection = await objectionDetectionService.processChunk(chunk3, {
        cooldownMs: 5000,
      });
      expect(authorityDetection).not.toBeNull();
      expect(authorityDetection?.category).toBe('authority');
    });

    it('should maintain session state and allow clean reset on call completion', async () => {
      const chunk: StreamingTranscriptionChunk = {
        sessionId,
        speaker: 'lead',
        text: 'Não é o momento certo agora.',
        timestamp: Date.now(),
      };

      await objectionDetectionService.processChunk(chunk);
      const state = objectionDetectionService.getSessionState(sessionId);
      expect(state).toBeDefined();
      expect(state?.detectedObjections.length).toBe(1);
      expect(state?.lastCategory).toBe('timing');

      objectionDetectionService.clearSession(sessionId);
      expect(objectionDetectionService.getSessionState(sessionId)).toBeUndefined();
    });
  });

  describe('Latency Performance & SLA Guarantee (<800ms)', () => {
    it('should execute local heuristic classification under 50ms', async () => {
      const text = 'O valor está muito salgado para nossa empresa neste momento.';
      const startTime = performance.now();
      const result = await objectionDetectionService.detect(text, { sessionId });
      const duration = performance.now() - startTime;

      expect(result).not.toBeNull();
      expect(duration).toBeLessThan(50);
      expect(result?.latencyMs).toBeLessThan(50);
    });

    it('should satisfy the <800ms SLA under simulated latency conditions', async () => {
      const text = 'Já usamos um concorrente direto de vocês que nos atende bem.';
      const simulatedDelayMs = 350; // simulated remote model inference hop

      const startTime = performance.now();
      const result = await objectionDetectionService.detect(text, {
        sessionId,
        simulatedDelayMs,
      });
      const totalDuration = performance.now() - startTime;

      expect(result).not.toBeNull();
      expect(result?.category).toBe('competition');
      expect(result?.latencyMs).toBeGreaterThanOrEqual(300);
      expect(result?.latencyMs).toBeLessThan(800); // Strict SLA check
      expect(totalDuration).toBeLessThan(800);
    });
  });
});

import { logger } from '../../lib/logger.js';

export type ObjectionCategory = 'price' | 'timing' | 'competition' | 'authority';

export type RebuttalStrategy = 'reframe' | 'pivot' | 'case_study' | 'discovery_question';

export interface SuggestedRebuttal {
  strategy: RebuttalStrategy;
  title: string;
  script: string;
  keyTakeaway: string;
}

export interface StreamingTranscriptionChunk {
  sessionId: string;
  text: string;
  speaker?: 'lead' | 'agent' | 'user' | 'prospect' | 'unknown';
  isFinal?: boolean;
  timestamp?: number;
  sequenceNumber?: number;
}

export interface ObjectionDetectionResult {
  id: string;
  sessionId: string;
  category: ObjectionCategory;
  confidence: number; // 0.0 to 1.0
  matchedSnippet: string;
  matchedPattern: string;
  explanation: string;
  timestamp: number;
  latencyMs: number;
  suggestedRebuttals: SuggestedRebuttal[];
  context?: {
    segment?: string;
    persona?: string;
    brand?: string;
  };
}

export interface DetectionOptions {
  confidenceThreshold?: number; // default: 0.65
  cooldownMs?: number; // default: 3000ms
  sessionId?: string;
  speaker?: 'lead' | 'agent' | 'user' | 'prospect' | 'unknown';
  segment?: string;
  persona?: string;
  brand?: string;
  simulatedDelayMs?: number; // used to test/simulate latency budgets (<800ms)
}

export interface SessionObjectionState {
  sessionId: string;
  transcriptBuffer: string;
  detectedObjections: ObjectionDetectionResult[];
  lastObjectionAt?: number;
  lastCategory?: ObjectionCategory;
}

interface ObjectionRule {
  category: ObjectionCategory;
  pattern: RegExp;
  weight: number;
  description: string;
}

/**
 * High-precision Portuguese objection patterns calibrated for B2B sales calls.
 */
const OBJECTION_RULES: ObjectionRule[] = [
  // 1. PREÇO (Price / Budget)
  {
    category: 'price',
    pattern: /(?:muito|bastante|meio|t[aá]|est[aá]\s+muito)\s+(?:caro|puxado|salgado|pesado)/i,
    weight: 0.95,
    description: 'Declaração explícita de preço alto / fora do alcance',
  },
  {
    category: 'price',
    pattern: /(?:fora|al[eé]m)\s+do\s+(?:nosso\s+)?(?:or[cç]amento|budget|esperado|previsto|teto)/i,
    weight: 0.95,
    description: 'Valor excede o orçamento ou teto disponível',
  },
  {
    category: 'price',
    pattern:
      /(?:sem|n[aã]o\s+temos?|falta)\s+(?:verba|or[cç]amento|dinheiro|budget|recurso|caixa)/i,
    weight: 0.92,
    description: 'Ausência de orçamento ou verba no período',
  },
  {
    category: 'price',
    pattern:
      /(?:pre[cç]o|valor|custo|investimento)\s+(?:[eé]|est[aá])\s+(?:muito|bastante)?\s*(?:alto|elevado|invi[aá]vel|pesado|salgado)/i,
    weight: 0.9,
    description: 'Qualificação do custo/investimento como elevado',
  },
  {
    category: 'price',
    pattern:
      /(?:n[aã]o\s+(?:consigo|podemos?|temos\s+como))\s+pagar\s+(?:esse|esse\s+valor|tanto|isso)/i,
    weight: 0.92,
    description: 'Incapacidade financeira de arcar com o investimento',
  },
  {
    category: 'price',
    pattern:
      /(?:reduzir|baixar|diminuir)\s+(?:o\s+)?(?:pre[cç]o|valor|custo)|dar\s+(?:um\s+)?desconto/i,
    weight: 0.85,
    description: 'Pedido de desconto ou redução de custo',
  },
  {
    category: 'price',
    pattern:
      /(?:invi[aá]vel|pesado)\s+(?:para\s+o|no|pro)\s+(?:nosso\s+)?(?:bolso|momento\s+financeiro|caixa)/i,
    weight: 0.88,
    description: 'Inviabilidade de caixa',
  },

  // 2. TIMING (Momento / Prioridade / Falta de Tempo)
  {
    category: 'timing',
    pattern: /(?:n[aã]o\s+[eé]|est[aá]\s+fora\s+do)\s+(?:o\s+)?(?:momento|timing|hora)/i,
    weight: 0.95,
    description: 'Declaração explícita de timing desfavorável',
  },
  {
    category: 'timing',
    pattern: /(?:estamos|estou)\s+(?:sem\s+tempo|muito\s+ocupado|na\s+correria|muito\s+corrido)/i,
    weight: 0.88,
    description: 'Falta de tempo da equipe ou do lead',
  },
  {
    category: 'timing',
    pattern:
      /(?:me\s+)?liga(?:r)?\s+(?:no\s+)?(?:pr[oó]ximo\s+)?(?:trimestre|m[eê]s|ano|semestre|semana\s+que\s+vem)/i,
    weight: 0.92,
    description: 'Postergação para período futuro',
  },
  {
    category: 'timing',
    pattern:
      /(?:ver|avaliar|pensar|conversar|falar).*(?:ano|m[eê]s|semestre)\s+que\s+vem|(?:ano|semestre)\s+que\s+vem/i,
    weight: 0.9,
    description: 'Adiar avaliação para o próximo ciclo',
  },
  {
    category: 'timing',
    pattern:
      /(?:prioridade|foco)\s+(?:agora|no\s+momento|atual)\s+[eé]\s+(?:outr[ao]|outras\s+coisas)/i,
    weight: 0.92,
    description: 'Outra prioridade concorrendo pela atenção',
  },
  {
    category: 'timing',
    pattern:
      /(?:agora\s+n[aã]o|n[aã]o\s+agora|deixa\s+mais\s+pra\s+frente|vamos\s+deixar\s+pra\s+depois)/i,
    weight: 0.85,
    description: 'Recusa temporal imediata',
  },
  {
    category: 'timing',
    pattern:
      /(?:em\s+meio\s+a\s+uma|durante\s+uma)\s+(?:reestrutura[cç][aã]o|mudan[cç]a|fus[aã]o|auditoria)/i,
    weight: 0.86,
    description: 'Período de transição interna ou reestruturação',
  },

  // 3. CONCORRÊNCIA (Competition / Fornecedor Existente)
  {
    category: 'competition',
    pattern:
      /(?:j[aá]\s+(?:usamos?|temos?|contamos\s+com|trabalhamos\s+com))\s+(?:um[a]?\s+)?(?:outr[ao]|concorrente|sistema|solu[cç][aã]o|plataforma|ferramenta|fornecedor)/i,
    weight: 0.95,
    description: 'Uso de concorrente ou solução similar já contratada',
  },
  {
    category: 'competition',
    pattern:
      /(?:satisfeito[s]?|(?:muito\s+)?bem\s+atendido[s]?)\s+com\s+(?:o|a|nosso)\s+(?:fornecedor|parceiro|sistema|software|solu[cç][aã]o)\s+atual/i,
    weight: 0.92,
    description: 'Satisfação expressa com fornecedor atual',
  },
  {
    category: 'competition',
    pattern:
      /(?:fechamos|assinamos|contratamos)\s+(?:com\s+)?(?:outr[ao]|concorrente|outra\s+empresa)/i,
    weight: 0.95,
    description: 'Contrato recém-fechado com competidor',
  },
  {
    category: 'competition',
    pattern:
      /(?:j[aá]\s+(?:nos\s+)?atende|est[aá]\s+nos\s+atendendo)\s+(?:bem|muito\s+bem|suficiente)/i,
    weight: 0.88,
    description: 'Solução incumbente considerada suficiente',
  },
  {
    category: 'competition',
    pattern: /(?:concorrente\s+direto|fornecedor\s+atual)/i,
    weight: 0.86,
    description: 'Referência a concorrente direto ou fornecedor atual',
  },
  {
    category: 'competition',
    pattern:
      /(?:comparando\s+com|em\s+rela[cç][aã]o\s+a[o]?)\s+(?:concorrente|outra\s+op[cç][aã]o)/i,
    weight: 0.82,
    description: 'Comparação direta com alternativas de mercado',
  },

  // 4. AUTORIDADE (Authority / Decisor / Comitê)
  {
    category: 'authority',
    pattern:
      /(?:preciso|tenho\s+que)\s+(?:falar|conversar|alinhar|validar|aprovar)\s+com\s+(?:o|a|meu|minha)\s+(?:diretor|chefe|s[oó]cio|gerente|comit[eê]|presid[eên]cia|cfo|ceo)/i,
    weight: 0.96,
    description: 'Necessidade de aprovação de superior ou sócio',
  },
  {
    category: 'authority',
    pattern:
      /(?:n[aã]o\s+sou\s+eu|n[aã]o\s+tenho)\s+(?:quem\s+decide|autonomia|o\s+poder\s+de\s+decis[aã]o|autoriza[cç][aã]o)/i,
    weight: 0.95,
    description: 'Falta declarada de poder decisório ou autonomia',
  },
  {
    category: 'authority',
    pattern:
      /(?:decis[aã]o\s+[eé]|quem\s+bate\s+o\s+martelo\s+[eé])\s+(?:do|da|com)\s+(?:diretoria|conselho|financeiro|propriet[aá]rio)/i,
    weight: 0.94,
    description: 'Decisão reservada à diretoria ou conselho',
  },
  {
    category: 'authority',
    pattern:
      /(?:vou\s+passar|preciso\s+apresentar)\s+(?:para|pro|pros)\s+(?:superiores|gestores|diretores|meus\s+superiores)/i,
    weight: 0.88,
    description: 'Encaminhamento para escalão superior',
  },
  {
    category: 'authority',
    pattern:
      /(?:quem\s+assina(?:\s+o\s+contrato)?\s+n[aã]o\s+sou\s+eu|n[aã]o\s+sou\s+eu\s+quem\s+assina|n[aã]o\s+tomo\s+essa\s+decis[aã]o)/i,
    weight: 0.9,
    description: 'Não assina contratos nem toma a decisão final',
  },
];

/**
 * Standard strategic rebuttal templates for real-time B2B sales assistance.
 */
const BASE_REBUTTALS: Record<ObjectionCategory, SuggestedRebuttal[]> = {
  price: [
    {
      strategy: 'reframe',
      title: 'Reframe: ROI e Custo da Inação',
      script:
        'Entendo perfeitamente sua atenção com o investimento. Nossos clientes costumam notar que o custo de continuar com o gargalo operacional atual é 3 a 5 vezes maior que a ferramenta, e o retorno sobre o investimento se paga em menos de 90 dias.',
      keyTakeaway: 'Desloque o foco do custo nominal para o retorno financeiro e perdas evitadas.',
    },
    {
      strategy: 'pivot',
      title: 'Pivot: Implantação Modular por Etapas',
      script:
        'Se o desembolso imediato for uma barreira, podemos estruturar uma implantação gradual, começando pelo módulo que destrava resultado mais rápido para o seu caixa.',
      keyTakeaway: 'Ofereça fases menores para reduzir o risco percebido e viabilizar o início.',
    },
    {
      strategy: 'case_study',
      title: 'Case Study: Recuperação Financeira Rápida',
      script:
        'Tivemos uma empresa do mesmo setor que tinha essa exata restrição orçamentária; ao implementar a solução, recuperaram R$ 45.000 já no primeiro mês reduzindo perdas e retrabalho.',
      keyTakeaway: 'Use prova social concreta de empresas que tinham a mesma restrição e venceram.',
    },
    {
      strategy: 'discovery_question',
      title: 'Pergunta de Discovery: Isolamento de Objeção',
      script:
        'Se colocarmos a questão do valor financeiro entre parênteses por um instante, a solução em si atende com precisão aos desafios que você enfrenta hoje?',
      keyTakeaway: 'Isole se o preço é a única barreira ou se há dúvida sobre o valor da solução.',
    },
  ],
  timing: [
    {
      strategy: 'reframe',
      title: 'Reframe: Liberação de Tempo Imediata',
      script:
        'Compreendo que a rotina está cheia. Justamente por isso nossa plataforma foi desenhada para liberar até 12 horas semanais da equipe, sem exigir semanas de treinamento complexo.',
      keyTakeaway: 'Mostre que a solução resolve a própria falta de tempo alegada pelo prospect.',
    },
    {
      strategy: 'pivot',
      title: 'Pivot: Setup em Modo Observação',
      script:
        'Não precisamos virar nenhuma chave agora. O que acha de deixarmos apenas o ambiente preparado em modo observação, para que quando você quiser acelerar no próximo trimestre já tenha dados prontos?',
      keyTakeaway: 'Garanta compromisso leve hoje sem pressão de virada operacional imediata.',
    },
    {
      strategy: 'case_study',
      title: 'Case Study: Custo de Adiar a Decisão',
      script:
        'Muitos parceiros nossos diziam que o momento não era ideal até perceberem que cada mês adiado representava oportunidades comerciais perdidas para quem agiu antes no mercado.',
      keyTakeaway: 'Crie urgência gentil evidenciando o custo de adiar a resolução.',
    },
    {
      strategy: 'discovery_question',
      title: 'Pergunta de Discovery: Mapeamento de Gatilho',
      script:
        'O que precisa acontecer internamente entre hoje e o próximo trimestre para que essa iniciativa se torne prioritária para vocês?',
      keyTakeaway: 'Descubra os marcos reais que determinam a prioridade na agenda do prospect.',
    },
  ],
  competition: [
    {
      strategy: 'reframe',
      title: 'Reframe: Complementaridade e Inovação',
      script:
        'Excelente, ter um fornecedor atual mostra que vocês já entendem o valor desse processo. Nossa proposta não é necessariamente substituir de imediato, mas cobrir as lacunas de automação em tempo real que sistemas legados não alcançam.',
      keyTakeaway: 'Valide a escolha atual do cliente antes de apontar diferenciais modernos.',
    },
    {
      strategy: 'pivot',
      title: 'Pivot: Benchmark Comparativo Sem Risco',
      script:
        'Podemos rodar um diagnóstico comparativo em paralelo em uma operação piloto, sem afetar seu fluxo atual, para você ver na prática o delta de conversão.',
      keyTakeaway: 'Proponha teste paralelo sem risco de ruptura operacional.',
    },
    {
      strategy: 'case_study',
      title: 'Case Study: Ganho de Eficiência Pós-Migração',
      script:
        'Recentemente um cliente que utilizava essa mesma ferramenta identificou um ganho de 35% de produtividade ao integrar nossa inteligência de voz às rotinas deles.',
      keyTakeaway: 'Apresente ganhos percentuais obtidos por quem já operava a concorrência.',
    },
    {
      strategy: 'discovery_question',
      title: 'Pergunta de Discovery: Identificação de Atrito',
      script:
        'O que a ferramenta atual de vocês entrega perfeitamente hoje, e qual é aquele ponto que a equipe sempre comenta que ainda gera atrito ou trabalho manual?',
      keyTakeaway: 'Encontre a insatisfação oculta ou a limitação do incumbente.',
    },
  ],
  authority: [
    {
      strategy: 'reframe',
      title: 'Reframe: Empoderamento do Campeão Interno',
      script:
        'Perfeito! Sei que uma decisão desse porte envolve a diretoria. Meu papel é justamente municiar você com um business case executivo resumido para facilitar essa apresentação interna.',
      keyTakeaway: 'Transforme o contato no campeão interno municiado com argumentos sólidos.',
    },
    {
      strategy: 'pivot',
      title: 'Pivot: Alinhamento Executivo Conjunto',
      script:
        'O que acha de fazermos um alinhamento direto de 15 minutos com o seu diretor? Assim você não precisa gastar seu tempo repassando aspectos técnicos e nós respondemos as dúvidas estratégicas dele juntos.',
      keyTakeaway: 'Retire o fardo de vendas das costas do lead e acesse o decisor.',
    },
    {
      strategy: 'case_study',
      title: 'Case Study: Aprovação Ágil em 48 Horas',
      script:
        'Costumamos preparar uma folha de retorno financeiro de uma página que ajudou coordenadores de outras operações a aprovarem o projeto com o comitê em menos de 48 horas.',
      keyTakeaway: 'Forneça material executivo mastigado para encurtar o ciclo decisório.',
    },
    {
      strategy: 'discovery_question',
      title: 'Pergunta de Discovery: Antecipação de Objeções do Chefe',
      script:
        'Quando você levar essa proposta para o seu diretor, quais são as 2 principais perguntas ou preocupações que você sabe que ele vai levantar de imediato?',
      keyTakeaway: 'Descubra a mentalidade do decisor real e antecipe as respostas.',
    },
  ],
};

/**
 * ObjectionDetectionService
 *
 * Real-time streaming objection detector and counter-argument recommendation engine.
 * Tailored for live phone/WebRTC calls with strict latency (<800ms) guarantee.
 */
export class ObjectionDetectionService {
  private sessions = new Map<string, SessionObjectionState>();

  /**
   * Processes an incoming streaming transcript chunk from WebRTC/LiveKit/Telephony.
   * Maintains session history, sliding window buffer, and deduplication cooldown.
   */
  async processChunk(
    chunk: StreamingTranscriptionChunk,
    options?: DetectionOptions,
  ): Promise<ObjectionDetectionResult | null> {
    const startTime = performance.now();
    const sessionId = chunk.sessionId || 'default-session';
    const speaker = chunk.speaker || options?.speaker || 'lead';

    // Agent's own speech should not trigger prospect objection detection alerts
    if (speaker === 'agent') {
      return null;
    }

    let state = this.sessions.get(sessionId);
    if (!state) {
      state = {
        sessionId,
        transcriptBuffer: '',
        detectedObjections: [],
      };
      this.sessions.set(sessionId, state);
    }

    // Append text to rolling buffer for multi-chunk context
    state.transcriptBuffer = `${state.transcriptBuffer} ${chunk.text}`.trim();
    // Keep rolling window reasonable (last ~600 chars)
    if (state.transcriptBuffer.length > 600) {
      state.transcriptBuffer = state.transcriptBuffer.slice(-600);
    }

    const detection = await this.detect(state.transcriptBuffer, {
      ...options,
      sessionId,
      speaker,
    });

    if (!detection) {
      return null;
    }

    const cooldown = options?.cooldownMs ?? 3000;
    const now = Date.now();

    // Check cooldown for identical category in the same session
    if (
      state.lastCategory === detection.category &&
      state.lastObjectionAt &&
      now - state.lastObjectionAt < cooldown
    ) {
      logger.debug(
        { sessionId, category: detection.category },
        'Objection suppressed by real-time cooldown window',
      );
      return null;
    }

    state.lastCategory = detection.category;
    state.lastObjectionAt = now;
    state.detectedObjections.push(detection);

    const totalLatency = performance.now() - startTime;
    detection.latencyMs = Math.round(totalLatency);

    logger.info(
      {
        sessionId,
        category: detection.category,
        confidence: detection.confidence,
        latencyMs: detection.latencyMs,
      },
      'Real-time objection detected during call',
    );

    return detection;
  }

  /**
   * Core detection algorithm: analyzes text against calibrated objection rules,
   * evaluates highest matching score, and generates recommended rebuttals.
   */
  async detect(text: string, options?: DetectionOptions): Promise<ObjectionDetectionResult | null> {
    const startTime = performance.now();

    // Support simulated latency testing (e.g. 50ms, 300ms, 500ms < 800ms)
    if (options?.simulatedDelayMs && options.simulatedDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.simulatedDelayMs));
    }

    if (!text || text.trim().length === 0) {
      return null;
    }

    const threshold = options?.confidenceThreshold ?? 0.65;
    const normalizedText = text.trim();

    let bestMatch: {
      category: ObjectionCategory;
      rule: ObjectionRule;
      matchSnippet: string;
      confidence: number;
    } | null = null;

    for (const rule of OBJECTION_RULES) {
      const match = rule.pattern.exec(normalizedText);
      if (match) {
        const snippet = match[0];
        const confidence = rule.weight;

        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            category: rule.category,
            rule,
            matchSnippet: snippet,
            confidence,
          };
        }
      }
    }

    if (!bestMatch || bestMatch.confidence < threshold) {
      return null;
    }

    const suggestedRebuttals = this.getRebuttals(bestMatch.category, {
      segment: options?.segment,
      persona: options?.persona,
      brand: options?.brand,
    });

    const latencyMs = Math.round(performance.now() - startTime);

    const result: ObjectionDetectionResult = {
      id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId: options?.sessionId || 'unknown-session',
      category: bestMatch.category,
      confidence: Number(bestMatch.confidence.toFixed(2)),
      matchedSnippet: bestMatch.matchSnippet,
      matchedPattern: bestMatch.rule.description,
      explanation: `Objeção de ${this.getCategoryLabel(bestMatch.category)} detectada pelo trecho: "${bestMatch.matchSnippet}"`,
      timestamp: Date.now(),
      latencyMs,
      suggestedRebuttals,
      context: {
        segment: options?.segment,
        persona: options?.persona,
        brand: options?.brand,
      },
    };

    return result;
  }

  /**
   * Retrieves recommended objection rebuttals with optional contextual personalization.
   */
  getRebuttals(
    category: ObjectionCategory,
    context?: { segment?: string; persona?: string; brand?: string },
  ): SuggestedRebuttal[] {
    const base = BASE_REBUTTALS[category] || [];
    if (!context?.segment && !context?.persona && !context?.brand) {
      return base;
    }

    // Apply contextual enrichment when segment or persona is known
    return base.map((reb) => {
      let enrichedScript = reb.script;
      if (context.segment) {
        enrichedScript = enrichedScript.replace('mesmo setor', `segmento de ${context.segment}`);
      }
      if (context.brand) {
        enrichedScript = enrichedScript.replace('ferramenta', `solução ${context.brand}`);
      }
      return {
        ...reb,
        script: enrichedScript,
      };
    });
  }

  /**
   * Returns human-readable Portuguese label for the objection category.
   */
  getCategoryLabel(category: ObjectionCategory): string {
    switch (category) {
      case 'price':
        return 'Preço';
      case 'timing':
        return 'Timing';
      case 'competition':
        return 'Concorrência';
      case 'authority':
        return 'Autoridade';
      default:
        return category;
    }
  }

  /**
   * Retrieves session state and historical objections detected during the call.
   */
  getSessionState(sessionId: string): SessionObjectionState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Clears session buffers and detection memory after call completion.
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const objectionDetectionService = new ObjectionDetectionService();

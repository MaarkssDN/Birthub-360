import { observability } from '../Observability.js';
import type { ConversationTurn } from '../types.js';

export type PrimaryIntentType =
  | 'Suporte'
  | 'Agendamento'
  | 'Financeiro'
  | 'Dúvida'
  | 'Interesse'
  | 'Objeção'
  | 'Desistência'
  | 'Outro';

export interface IntentAnalysisResult {
  primaryIntent: PrimaryIntentType;
  confidence: number;
  entities: Record<string, string>;
  summary: string;
  actionRequested?: string;
  detectedAt: number;
}

export class IntentEngine {
  /**
   * Analisa a intenção do usuário em tempo real durante uma chamada WebRTC/Whisper.
   * Emite o evento `IntentEngine.analyzeIntent` no Observability para alimentar dashboards em tempo real.
   */
  public analyzeIntent(
    sessionId: string,
    text: string,
    contextTurns: ConversationTurn[] = [],
  ): IntentAnalysisResult {
    const cleanText = text.trim().toLowerCase();
    let primaryIntent: PrimaryIntentType = 'Outro';
    let confidence = 0.6;
    const entities: Record<string, string> = {};
    let actionRequested: string | undefined;

    // Regras de detecção heurística rápida em tempo real (fallback zero-latency)
    if (cleanText.match(/suporte|problema|erro|ajuda|bug|não funciona|parou/i)) {
      primaryIntent = 'Suporte';
      confidence = 0.9;
      actionRequested = 'Abertura ou consulta de chamado de suporte';
    } else if (cleanText.match(/agendar|agendamento|reunião|horário|marcar|demo|demostração/i)) {
      primaryIntent = 'Agendamento';
      confidence = 0.92;
      actionRequested = 'Agendamento de reunião ou demonstração';
    } else if (cleanText.match(/preço|valor|custo|fatura|pagamento|desconto|boleto|financeiro/i)) {
      primaryIntent = 'Financeiro';
      confidence = 0.88;
      actionRequested = 'Consulta ou envio de proposta/fatura';
    } else if (cleanText.match(/como funciona|o que é|qual o prazo|duvida|dúvida|explicar/i)) {
      primaryIntent = 'Dúvida';
      confidence = 0.85;
    } else if (cleanText.match(/tenho interesse|quero contratar|vamos fechar|gostei|comprar/i)) {
      primaryIntent = 'Interesse';
      confidence = 0.95;
      actionRequested = 'Avançar no funil de vendas / Fechamento';
    } else if (cleanText.match(/muito caro|concorrente|depois vejo|não sei se|complicado/i)) {
      primaryIntent = 'Objeção';
      confidence = 0.82;
      actionRequested = 'Contorno de objeção comercial';
    } else if (cleanText.match(/cancelar|não quero|desistir|remova meu|pare de ligar/i)) {
      primaryIntent = 'Desistência';
      confidence = 0.96;
      actionRequested = 'Registro de opt-out ou cancelamento';
    }

    // Extração simples de entidades
    const dateMatch = cleanText.match(
      /(?:^|\s)(\d{1,2}\/\d{1,2}|hoje|amanhã|amanha|segunda|terça|terca|quarta|quinta|sexta)(?:\s|$|[.,!?])/i,
    );
    if (dateMatch) {
      entities.dataMencionada = dateMatch[1];
    }

    const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      entities.email = emailMatch[0];
    }

    const phoneMatch = cleanText.match(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}\b/);
    if (phoneMatch) {
      entities.telefone = phoneMatch[0];
    }

    const result: IntentAnalysisResult = {
      primaryIntent,
      confidence,
      entities,
      summary: `Intenção detectada: ${primaryIntent} (${Math.round(confidence * 100)}% de confiança)`,
      actionRequested,
      detectedAt: Date.now(),
    };

    // Log de evento de observabilidade esperado pelas telas de Dashboard (Observability.tsx)
    observability.logEvent(sessionId, 'IntentEngine.analyzeIntent', {
      primaryIntent,
      confidence,
      entities,
      actionRequested,
      textSample: text.slice(0, 100),
      turnsCount: contextTurns.length,
    });

    return result;
  }
}

export const intentEngine = new IntentEngine();

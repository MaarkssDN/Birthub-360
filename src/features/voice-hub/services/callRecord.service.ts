/**
 * callRecord.service.ts (Passo 039)
 * Serviço de gravação de telemetria de chamadas de voz com redação mandatória de PII.
 */

import {
  type CallRecordData,
  type CallRecordRepository,
  type DiarizedTurn,
  InMemoryCallRecordRepository,
} from '../infra/PrismaCallRecordRepository.js';

const POSITIVE_TRIGGERS = [
  'excelente',
  'ótimo',
  'perfeito',
  'fechado',
  'fechar',
  'vamos fechar',
  'adorei',
  'gostei muito',
  'faz sentido',
  'com certeza',
  'aprovado',
  'ótima proposta',
];

const NEGATIVE_TRIGGERS = [
  'caro',
  'muito caro',
  'não tenho interesse',
  'não quero',
  'cancelar',
  'insatisfeito',
  'reclamar',
  'péssimo',
  'ruim',
  'problema',
  'furada',
  'golpe',
  'desistir',
];

export class CallRecordService {
  constructor(private readonly repo: CallRecordRepository = new InMemoryCallRecordRepository()) {}

  /**
   * Redige dados pessoais (CPF, telefones, cartões de crédito e emails) antes da persistência.
   */
  public redactPii(transcript: string): string {
    if (!transcript) return '';

    return (
      transcript
        // CPF: 000.000.000-00 ou 11 dígitos
        .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[REDACTED_CPF]')
        // Cartão de Crédito: 16 dígitos
        .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED_CREDIT_CARD]')
        // E-mails
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]')
        // Telefones: (XX) 9XXXX-XXXX ou variações
        .replace(
          /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/g,
          (match) => {
            if (match.trim().length <= 5) return match;
            return '[REDACTED_PHONE]';
          },
        )
    );
  }

  /**
   * Trilha C.3 — Classificação de Sentimento em Voo para Chamadas.
   */
  public analyzeSentiment(transcript: string): {
    sentiment: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO';
    score: number;
    keyPhrases: string[];
  } {
    if (!transcript) {
      return { sentiment: 'NEUTRO', score: 0, keyPhrases: [] };
    }

    const lower = transcript.toLowerCase();
    const matchedPositive = POSITIVE_TRIGGERS.filter((trigger) => lower.includes(trigger));
    const matchedNegative = NEGATIVE_TRIGGERS.filter((trigger) => lower.includes(trigger));

    const positiveWeight = matchedPositive.length * 0.4;
    const negativeWeight = matchedNegative.length * 0.5;

    let score = positiveWeight - negativeWeight;
    score = Math.max(-1, Math.min(1, Math.round(score * 100) / 100));

    let sentiment: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO' = 'NEUTRO';
    if (score >= 0.2) sentiment = 'POSITIVO';
    else if (score <= -0.2) sentiment = 'NEGATIVO';

    const keyPhrases = [...matchedPositive, ...matchedNegative];

    return { sentiment, score, keyPhrases };
  }

  /**
   * Trilha C.3 — Diarização e segmentação por turnos de locutor.
   */
  public parseDiarizedTurns(transcript: string): DiarizedTurn[] {
    if (!transcript) return [];

    const lines = transcript.split('\n').map((l) => l.trim()).filter(Boolean);
    const turns: DiarizedTurn[] = [];

    for (const line of lines) {
      const isSeller = /^(vendedor|seller|closer|sdr)[\s:]+/i.test(line);
      const isCustomer = /^(cliente|customer|lead|contato)[\s:]+/i.test(line);

      if (isSeller || isCustomer) {
        const speaker: 'SELLER' | 'CUSTOMER' = isSeller ? 'SELLER' : 'CUSTOMER';
        const cleanText = line.replace(/^(vendedor|seller|closer|sdr|cliente|customer|lead|contato)[\s:]+/i, '').trim();
        turns.push({ speaker, text: this.redactPii(cleanText) });
      } else {
        // Turno padrão atribuído ao locutor anterior ou customer
        const lastSpeaker = turns.length > 0 ? turns[turns.length - 1].speaker : 'CUSTOMER';
        turns.push({ speaker: lastSpeaker, text: this.redactPii(line) });
      }
    }

    return turns;
  }

  async recordCallTelemetry(params: {
    organizationId: string;
    callId: string;
    sellerId: string;
    customerRef: string;
    durationMs: number;
    aiLatencyMs: number;
    rawTranscript: string;
    talkRatioSeller: number;
    talkRatioCustomer: number;
    sentiment?: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO';
    sentimentScore?: number;
    diarizedTurns?: DiarizedTurn[];
  }): Promise<CallRecordData> {
    if (!params.organizationId || !params.callId) {
      throw new Error('Tenancy violation: organizationId e callId obrigatórios');
    }

    const redactedTranscript = this.redactPii(params.rawTranscript);
    const sentimentAnalysis = this.analyzeSentiment(params.rawTranscript);
    const parsedTurns = params.diarizedTurns ?? this.parseDiarizedTurns(params.rawTranscript);

    return this.repo.saveCallRecord({
      organizationId: params.organizationId,
      callId: params.callId,
      sellerId: params.sellerId,
      customerRef: params.customerRef,
      durationMs: params.durationMs,
      aiLatencyMs: params.aiLatencyMs,
      redactedTranscript,
      talkRatioSeller: params.talkRatioSeller,
      talkRatioCustomer: params.talkRatioCustomer,
      sentiment: params.sentiment ?? sentimentAnalysis.sentiment,
      sentimentScore: params.sentimentScore ?? sentimentAnalysis.score,
      diarizedTurns: parsedTurns,
    });
  }

  async getCallRecord(organizationId: string, callId: string): Promise<CallRecordData | null> {
    return this.repo.findByCallId(organizationId, callId);
  }
}

export const callRecordService = new CallRecordService();

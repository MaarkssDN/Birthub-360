/**
 * src/services/telephony/transcription.service.ts
 * Servico de higienizacao e mascaramento de PII em transcricoes de telefonia (Handoff 15-para-12 / LGPD B-13).
 */
import { redactResidualPii } from '../../shared/security/piiRedaction.js';
import { piiTokenizer } from '../../lib/security/piiTokenizer.service.js';

export interface MaskTranscriptionResult {
  sanitizedText: string;
  hasPii: boolean;
}

export class TelephonyTranscriptionService {
  /**
   * Sanitiza PII (CPF, Cartao de Credito, Email, Telefone) substituindo por tags deterministicas [REDACTED_*].
   */
  public maskPii(transcript: string): string {
    if (!transcript) return '';

    return transcript
      // CPF
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[REDACTED_CPF]')
      // Cartao de Credito
      .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED_CARD]')
      // Email
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED_EMAIL]')
      // Telefone
      .replace(
        /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/g,
        (match) => (match.trim().length <= 5 ? match : '[REDACTED_PHONE]'),
      );
  }

  /**
   * Processa a transcricao para persistencia segura e geracao de embeddings vetoriais.
   */
  public sanitizeForPersistence(transcript: string): MaskTranscriptionResult {
    const sanitizedText = this.maskPii(transcript);
    const hasPii = sanitizedText !== transcript;
    return { sanitizedText, hasPii };
  }
}

export const telephonyTranscriptionService = new TelephonyTranscriptionService();

import { describe, expect, it } from 'vitest';
import { telephonyTranscriptionService } from '../../../../src/services/telephony/transcription.service.js';

describe('TelephonyTranscriptionService — PII Masking', () => {
  it('mascara CPF explicitamente', () => {
    const raw = 'O cliente informou o CPF 123.456.789-00 durante o atendimento.';
    const { sanitizedText, hasPii } = telephonyTranscriptionService.sanitizeForPersistence(raw);
    expect(hasPii).toBe(true);
    expect(sanitizedText).toBe('O cliente informou o CPF [REDACTED_CPF] durante o atendimento.');
    expect(sanitizedText).not.toContain('123.456.789-00');
  });

  it('mascara cartao de credito e email', () => {
    const raw = 'Cartao 4111-2222-3333-4444 e contato teste@empresa.com';
    const { sanitizedText, hasPii } = telephonyTranscriptionService.sanitizeForPersistence(raw);
    expect(hasPii).toBe(true);
    expect(sanitizedText).toContain('[REDACTED_CARD]');
    expect(sanitizedText).toContain('[REDACTED_EMAIL]');
    expect(sanitizedText).not.toContain('4111-2222-3333-4444');
    expect(sanitizedText).not.toContain('teste@empresa.com');
  });

  it('preserva texto sem dados sensiveis', () => {
    const raw = 'Bom dia, gostaria de agendar uma demonstracao do software.';
    const { sanitizedText, hasPii } = telephonyTranscriptionService.sanitizeForPersistence(raw);
    expect(hasPii).toBe(false);
    expect(sanitizedText).toBe(raw);
  });
});

import { describe, expect, it } from 'vitest';
import { CallRecordService } from '../callRecord.service.js';
import { InMemoryCallRecordRepository } from '../../infra/PrismaCallRecordRepository.js';

describe('Trilha C.3 — CallRecordService: Sentimento, Diarização e Mascaramento PII', () => {
  it('classifica sentimento positivo e captura gatilhos comerciais', () => {
    const service = new CallRecordService();
    const transcript = 'Adorei a demonstração, achei excelente e vamos fechar o contrato hoje.';

    const result = service.analyzeSentiment(transcript);
    expect(result.sentiment).toBe('POSITIVO');
    expect(result.score).toBeGreaterThan(0.2);
    expect(result.keyPhrases).toContain('excelente');
    expect(result.keyPhrases).toContain('vamos fechar');
  });

  it('classifica sentimento negativo quando há objeções e reclamações', () => {
    const service = new CallRecordService();
    const transcript = 'Achei o valor muito caro e estou insatisfeito com o atendimento anterior.';

    const result = service.analyzeSentiment(transcript);
    expect(result.sentiment).toBe('NEGATIVO');
    expect(result.score).toBeLessThan(-0.2);
    expect(result.keyPhrases).toContain('muito caro');
    expect(result.keyPhrases).toContain('insatisfeito');
  });

  it('separa turnos de locutor (diarização) com redação de PII nos turnos', () => {
    const service = new CallRecordService();
    const rawTranscript = [
      'Vendedor: Olá João, meu CPF é 123.456.789-00, como posso ajudar?',
      'Cliente: Olá, meu telefone para contato é (11) 98765-4321 e gostei muito da proposta.',
    ].join('\n');

    const turns = service.parseDiarizedTurns(rawTranscript);

    expect(turns).toHaveLength(2);
    expect(turns[0].speaker).toBe('SELLER');
    expect(turns[0].text).toContain('[REDACTED_CPF]');
    expect(turns[0].text).not.toContain('123.456.789-00');

    expect(turns[1].speaker).toBe('CUSTOMER');
    expect(turns[1].text).toContain('[REDACTED_PHONE]');
    expect(turns[1].text).not.toContain('98765-4321');
  });

  it('persiste registro de chamada completo com telemetria, sentimento e diarização', async () => {
    const repo = new InMemoryCallRecordRepository();
    const service = new CallRecordService(repo);

    const record = await service.recordCallTelemetry({
      organizationId: 'org-voice-1',
      callId: 'call-100',
      sellerId: 'seller-42',
      customerRef: 'lead-99',
      durationMs: 180000,
      aiLatencyMs: 320,
      rawTranscript: 'Vendedor: Excelente conversa!\nCliente: Perfeito, vamos fechar!',
      talkRatioSeller: 0.45,
      talkRatioCustomer: 0.55,
    });

    expect(record.organizationId).toBe('org-voice-1');
    expect(record.callId).toBe('call-100');
    expect(record.sentiment).toBe('POSITIVO');
    expect(record.diarizedTurns).toHaveLength(2);
    expect(record.diarizedTurns?.[0].speaker).toBe('SELLER');
    expect(record.diarizedTurns?.[1].speaker).toBe('CUSTOMER');
  });
});

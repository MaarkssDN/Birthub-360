import { describe, expect, it } from 'vitest';
import {
  createSttTranscriptEvent,
  isCommandDispatchable,
  mapDiarizedUtterancesToEvents,
  SttTranscriptContractError,
  toVoiceCommandRequest,
  type SttTranscriptContext,
} from '../sttTranscript.contract.js';
import type { DiarizedUtterance } from '../whisper.worker.js';

const CONTEXT: SttTranscriptContext = {
  sessionId: 'sess-1',
  organizationId: 'org-1',
  userId: 'user-1',
};

describe('[Agente 63 · Lira] Contrato STT → Voice Command Router', () => {
  describe('createSttTranscriptEvent', () => {
    it('normaliza transcript com trim e preserva campos opcionais', () => {
      const event = createSttTranscriptEvent(CONTEXT, {
        transcript: '  criar lead Maria  ',
        isFinal: true,
        speaker: 'CUSTOMER',
        confidence: 0.9,
        startSec: 1.2,
        endSec: 2.4,
      });

      expect(event).toEqual({
        sessionId: 'sess-1',
        organizationId: 'org-1',
        userId: 'user-1',
        transcript: 'criar lead Maria',
        isFinal: true,
        speaker: 'CUSTOMER',
        confidence: 0.9,
        startSec: 1.2,
        endSec: 2.4,
      });
    });

    it.each(['sessionId', 'organizationId', 'userId'] as const)(
      'rejeita contexto sem %s',
      (field) => {
        expect(() =>
          createSttTranscriptEvent({ ...CONTEXT, [field]: '  ' }, {
            transcript: 'oi',
            isFinal: true,
          }),
        ).toThrow(SttTranscriptContractError);
      },
    );

    it('rejeita transcript vazio ou só espaços', () => {
      expect(() =>
        createSttTranscriptEvent(CONTEXT, { transcript: '   ', isFinal: true }),
      ).toThrow(SttTranscriptContractError);
    });

    it('rejeita confidence fora de [0,1] ou não numérica', () => {
      for (const confidence of [-0.1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() =>
          createSttTranscriptEvent(CONTEXT, {
            transcript: 'oi',
            isFinal: true,
            confidence,
          }),
        ).toThrow(SttTranscriptContractError);
      }
    });

    it('rejeita isFinal não booleano', () => {
      expect(() =>
        createSttTranscriptEvent(CONTEXT, {
          transcript: 'oi',
          isFinal: 'yes' as unknown as boolean,
        }),
      ).toThrow(SttTranscriptContractError);
    });
  });

  describe('isCommandDispatchable / toVoiceCommandRequest', () => {
    it('só eventos finais com texto são despacháveis', () => {
      const interim = createSttTranscriptEvent(CONTEXT, {
        transcript: 'criar',
        isFinal: false,
      });
      const final = createSttTranscriptEvent(CONTEXT, {
        transcript: 'criar lead Maria',
        isFinal: true,
      });

      expect(isCommandDispatchable(interim)).toBe(false);
      expect(isCommandDispatchable(final)).toBe(true);
    });

    it('converte evento final em VoiceCommandRequest com actor do contexto', () => {
      const event = createSttTranscriptEvent(CONTEXT, {
        transcript: 'criar lead Maria Silva',
        isFinal: true,
      });

      const request = toVoiceCommandRequest(event, 'agent');

      expect(request).toEqual({
        transcript: 'criar lead Maria Silva',
        actor: {
          userId: 'user-1',
          organizationId: 'org-1',
          role: 'agent',
        },
      });
      // O role vem do parâmetro (sessão autenticada), nunca do transcript.
      expect(request.actor.role).toBe('agent');
    });

    it('lança erro ao tentar converter evento interim', () => {
      const interim = createSttTranscriptEvent(CONTEXT, {
        transcript: 'criar lead',
        isFinal: false,
      });
      expect(() => toVoiceCommandRequest(interim, 'admin')).toThrow(
        SttTranscriptContractError,
      );
    });
  });

  describe('mapDiarizedUtterancesToEvents', () => {
    it('mapeia enunciados diarizados para eventos finais com speaker/timestamps', () => {
      const utterances: DiarizedUtterance[] = [
        {
          speaker: 'CUSTOMER',
          channelIndex: 1,
          startSec: 0.5,
          endSec: 2.0,
          text: '  quero agendar uma consulta  ',
          confidence: 0.82,
        },
        {
          speaker: 'AGENT',
          channelIndex: 0,
          startSec: 2.2,
          endSec: 3.0,
          text: 'claro, vou verificar',
        },
      ];

      const events = mapDiarizedUtterancesToEvents(utterances, CONTEXT);

      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        transcript: 'quero agendar uma consulta',
        isFinal: true,
        speaker: 'CUSTOMER',
        confidence: 0.82,
        startSec: 0.5,
        endSec: 2.0,
        sessionId: 'sess-1',
        organizationId: 'org-1',
        userId: 'user-1',
      });
      // Sem confidence reportada → campo ausente (não fabricado).
      expect(events[1].confidence).toBeUndefined();
      expect(events[1].speaker).toBe('AGENT');
    });

    it('descarta enunciados sem texto e propaga erro de contexto', () => {
      const utterances: DiarizedUtterance[] = [
        {
          speaker: 'AGENT',
          channelIndex: 0,
          startSec: 0,
          endSec: 0.1,
          text: '   ',
        },
      ];
      expect(mapDiarizedUtterancesToEvents(utterances, CONTEXT)).toEqual([]);

      const valid: DiarizedUtterance[] = [
        {
          speaker: 'AGENT',
          channelIndex: 0,
          startSec: 0,
          endSec: 1,
          text: 'olá',
        },
      ];
      expect(() =>
        mapDiarizedUtterancesToEvents(valid, { ...CONTEXT, organizationId: '' }),
      ).toThrow(SttTranscriptContractError);
    });
  });
});

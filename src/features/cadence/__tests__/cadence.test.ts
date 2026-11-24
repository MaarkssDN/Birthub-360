import { describe, expect, it } from 'vitest';
import {
  applyOptOutStop,
  applyPolicyGuardrailFailure,
  applyReplyStop,
  applyStopDecision,
  type CadenceDecisionContext,
  type CadenceSequenceDefinition,
  decideCadenceAction,
  expireStalePendingTouchAttempts,
  PENDING_TOUCH_CONFIRMATION_TTL_MS,
  PENDING_TOUCH_EXPIRED_ERROR,
  pauseCadenceRun,
  recordTouchAttempt,
  resolvePendingTouchAttempt,
  resumeCadenceRun,
  sanitizeTouchError,
  sequenceDefinitionForRun,
  startCadenceRun,
  stopCadenceManually,
  validateSequence,
} from '../domain/cadence.js';

const NOW = new Date('2026-08-03T12:00:00Z'); // segunda, 09:00 SP
const ALWAYS_WITHIN_WINDOW = () => true;
const NEVER_WITHIN_WINDOW = () => false;

function ctx(overrides: Partial<CadenceDecisionContext> = {}): CadenceDecisionContext {
  return {
    isOptedOut: false,
    hasLeadReplied: false,
    isWithinBusinessWindow: ALWAYS_WITHIN_WINDOW,
    rateLimitBlock: null,
    ...overrides,
  };
}

const SEQUENCE: CadenceSequenceDefinition = {
  id: 'seq-1',
  name: 'E-mail → WhatsApp → Voz',
  touches: [
    { order: 1, channel: 'email', delayHoursFromPrevious: 0, templateRef: 'tmpl-email-1' },
    { order: 2, channel: 'whatsapp', delayHoursFromPrevious: 24, templateRef: 'tmpl-whatsapp-2' },
    { order: 3, channel: 'voice', delayHoursFromPrevious: 48 },
  ],
};

describe('validateSequence', () => {
  it('aceita sequência ordenada 1..N sem lacunas', () => {
    expect(validateSequence(SEQUENCE)).toEqual([]);
  });

  it('rejeita sequência vazia', () => {
    expect(validateSequence({ id: 's', name: 'vazia', touches: [] })).toContain(
      'Sequência sem nenhum toque.',
    );
  });

  it('rejeita lacuna de ordem', () => {
    const errors = validateSequence({
      id: 's',
      name: 'com lacuna',
      touches: [
        { order: 1, channel: 'email', delayHoursFromPrevious: 0, templateRef: 'tmpl-email' },
        { order: 3, channel: 'voice', delayHoursFromPrevious: 24 },
      ],
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('aceita fallbackTouchOrder apontando para um toque real da sequência', () => {
    const errors = validateSequence({
      id: 's',
      name: 'com fallback válido',
      touches: [
        {
          order: 1,
          channel: 'whatsapp',
          delayHoursFromPrevious: 0,
          fallbackTouchOrder: 3,
          templateRef: 'tmpl-whatsapp',
        },
        { order: 2, channel: 'voice', delayHoursFromPrevious: 24 },
        {
          order: 3,
          channel: 'email',
          delayHoursFromPrevious: 24,
          templateRef: 'tmpl-email',
        },
      ],
    });
    expect(errors).toEqual([]);
  });

  it('rejeita toque de email ou whatsapp sem templateRef', () => {
    const errors = validateSequence({
      id: 's',
      name: 'sem template',
      touches: [
        { order: 1, channel: 'email', delayHoursFromPrevious: 0 },
        { order: 2, channel: 'whatsapp', delayHoursFromPrevious: 24, templateRef: '   ' },
      ],
    });
    expect(errors).toContain('Toque 1: conteúdo obrigatório para email.');
    expect(errors).toContain('Toque 2: conteúdo obrigatório para whatsapp.');
  });

  it('rejeita fallbackTouchOrder apontando para o próprio toque', () => {
    const errors = validateSequence({
      id: 's',
      name: 'com laço',
      touches: [{ order: 1, channel: 'email', delayHoursFromPrevious: 0, fallbackTouchOrder: 1 }],
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita fallbackTouchOrder para um toque inexistente', () => {
    const errors = validateSequence({
      id: 's',
      name: 'com fallback quebrado',
      touches: [{ order: 1, channel: 'email', delayHoursFromPrevious: 0, fallbackTouchOrder: 9 }],
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('decideCadenceAction — precedência de opt-out e resposta', () => {
  it('opt-out para a cadência mesmo se o run está ativo e dentro da janela', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const decision = decideCadenceAction(run, SEQUENCE, NOW, ctx({ isOptedOut: true }));
    expect(decision).toEqual({ type: 'stop', reason: 'opt-out' });
  });

  it('resposta do lead para a cadência mesmo dentro da janela', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const decision = decideCadenceAction(run, SEQUENCE, NOW, ctx({ hasLeadReplied: true }));
    expect(decision).toEqual({ type: 'stop', reason: 'lead-reply' });
  });

  it('opt-out tem precedência mesmo sobre um run já pausado', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = pauseCadenceRun(run, NOW);
    const decision = decideCadenceAction(run, SEQUENCE, NOW, ctx({ isOptedOut: true }));
    expect(decision).toEqual({ type: 'stop', reason: 'opt-out' });
  });
});

describe('decideCadenceAction — janela comercial e progressão', () => {
  it('primeiro toque dispara imediatamente quando dentro da janela', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const decision = decideCadenceAction(run, SEQUENCE, NOW, ctx());
    expect(decision).toEqual({ type: 'dispatch', touch: SEQUENCE.touches[0] });
  });

  it('toque fora da janela comercial NÃO sai — devolve wait, nunca dispatch', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const decision = decideCadenceAction(
      run,
      SEQUENCE,
      NOW,
      ctx({ isWithinBusinessWindow: NEVER_WITHIN_WINDOW }),
    );
    expect(decision).toEqual({ type: 'wait', reason: 'outside-business-window' });
  });

  it('respeita o intervalo mínimo entre toques (delayHoursFromPrevious)', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, SEQUENCE, SEQUENCE.touches[0], NOW, { result: 'sent' });
    expect(run.currentTouchOrder).toBe(2);

    // Só 1h depois — o segundo toque exige 24h de intervalo.
    const umaHoraDepois = new Date(NOW.getTime() + 3_600_000);
    const decision = decideCadenceAction(run, SEQUENCE, umaHoraDepois, ctx());
    expect(decision.type).toBe('wait');
    if (decision.type === 'wait') expect(decision.reason).toBe('delay-not-elapsed');
  });

  it('libera o próximo toque assim que o intervalo é cumprido', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, SEQUENCE, SEQUENCE.touches[0], NOW, { result: 'sent' });

    const vinteQuatroHorasDepois = new Date(NOW.getTime() + 24 * 3_600_000);
    const decision = decideCadenceAction(run, SEQUENCE, vinteQuatroHorasDepois, ctx());
    expect(decision).toEqual({ type: 'dispatch', touch: SEQUENCE.touches[1] });
  });

  it('conclui a cadência (status completed, reason completed) após o último toque enviado — CYC-002: completed é estado próprio, não reaproveita stopped', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, SEQUENCE, SEQUENCE.touches[0], NOW, { result: 'sent' });
    run = recordTouchAttempt(run, SEQUENCE, SEQUENCE.touches[1], NOW, { result: 'sent' });
    run = recordTouchAttempt(run, SEQUENCE, SEQUENCE.touches[2], NOW, { result: 'sent' });

    expect(run.status).toBe('completed');
    expect(run.stopReason).toBe('completed');

    const decision = decideCadenceAction(run, SEQUENCE, NOW, ctx());
    expect(decision).toEqual({ type: 'stop', reason: 'completed' });
  });

  it('status completed/failed são terminais para decideCadenceAction, igual a stopped', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const completed = { ...run, status: 'completed' as const, stopReason: 'completed' as const };
    expect(decideCadenceAction(completed, SEQUENCE, NOW, ctx())).toEqual({
      type: 'stop',
      reason: 'completed',
    });

    const failed = applyPolicyGuardrailFailure(run, NOW);
    expect(decideCadenceAction(failed, SEQUENCE, NOW, ctx())).toEqual({
      type: 'stop',
      reason: 'policy-guardrail',
    });
  });
});

// Auditoria transversal (Agente 17): rate limit por contato/domínio — ver `domain/rateLimit.ts`
// para a política e `application/rateLimitService.ts` para a contagem real (I/O). Aqui só a
// checagem PURA de `decideCadenceAction`: dado um `rateLimitBlock` já calculado pelo chamador, o
// run continua `active` (é `wait`, nunca `stop` — bloqueio de volume não é o mesmo que opt-out ou
// resposta do lead) e o motivo do bloqueio chega intacto na decisão.
describe('decideCadenceAction — rate limit por contato/domínio', () => {
  it('rateLimitBlock bloqueia o despacho mesmo com tudo mais elegível (dentro da janela, delay cumprido)', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const decision = decideCadenceAction(
      run,
      SEQUENCE,
      NOW,
      ctx({ rateLimitBlock: 'contact-rate-limit' }),
    );
    expect(decision).toEqual({ type: 'wait', reason: 'contact-rate-limit' });
  });

  it('rateLimitBlock por domínio também bloqueia, com o motivo correto', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const decision = decideCadenceAction(
      run,
      SEQUENCE,
      NOW,
      ctx({ rateLimitBlock: 'domain-rate-limit' }),
    );
    expect(decision).toEqual({ type: 'wait', reason: 'domain-rate-limit' });
  });

  it('run bloqueado por rate limit continua active — nunca stopped/failed', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    decideCadenceAction(run, SEQUENCE, NOW, ctx({ rateLimitBlock: 'contact-rate-limit' }));
    expect(run.status).toBe('active'); // decideCadenceAction não muta nada — só decide
  });

  it('opt-out ainda tem precedência sobre rate limit (mais forte do domínio inteiro)', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const decision = decideCadenceAction(
      run,
      SEQUENCE,
      NOW,
      ctx({ isOptedOut: true, rateLimitBlock: 'contact-rate-limit' }),
    );
    expect(decision).toEqual({ type: 'stop', reason: 'opt-out' });
  });

  it('janela comercial fechada é checada antes do rate limit — motivo continua sendo o da janela', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const decision = decideCadenceAction(
      run,
      SEQUENCE,
      NOW,
      ctx({ isWithinBusinessWindow: NEVER_WITHIN_WINDOW, rateLimitBlock: 'contact-rate-limit' }),
    );
    expect(decision).toEqual({ type: 'wait', reason: 'outside-business-window' });
  });

  it('sem rateLimitBlock (null), despacha normalmente', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const decision = decideCadenceAction(run, SEQUENCE, NOW, ctx({ rateLimitBlock: null }));
    expect(decision).toEqual({ type: 'dispatch', touch: SEQUENCE.touches[0] });
  });
});

describe('applyPolicyGuardrailFailure — CYC-002: único caminho para status failed', () => {
  it('encerra um run ativo como failed/policy-guardrail', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const failed = applyPolicyGuardrailFailure(run, NOW);
    expect(failed.status).toBe('failed');
    expect(failed.stopReason).toBe('policy-guardrail');
    expect(failed.stoppedAt).toEqual(NOW);
  });

  it('é idempotente — não sobrescreve um run já terminal (ex.: já completed)', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = applyStopDecision(run, 'completed', NOW);
    const attempted = applyPolicyGuardrailFailure(run, new Date(NOW.getTime() + 1000));
    expect(attempted).toEqual(run);
  });
});

describe('applyStopDecision — único ponto que decide completed vs stopped a partir de um motivo', () => {
  it('motivo "completed" resulta em status completed', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    expect(applyStopDecision(run, 'completed', NOW).status).toBe('completed');
  });

  it('qualquer outro motivo (opt-out/lead-reply/manual-stop/policy-guardrail) resulta em status stopped', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    for (const reason of ['opt-out', 'lead-reply', 'manual-stop', 'policy-guardrail'] as const) {
      expect(applyStopDecision(run, reason, NOW).status).toBe('stopped');
    }
  });
});

describe('recordTouchAttempt — attemptNumber (CYC-002)', () => {
  it('começa em 1 e incrementa por touchOrder, não globalmente entre toques diferentes', () => {
    const seqComRetry: CadenceSequenceDefinition = {
      id: 'seq-retry',
      name: 'com retry',
      touches: [
        { order: 1, channel: 'email', delayHoursFromPrevious: 0, maxAttempts: 3 },
        { order: 2, channel: 'whatsapp', delayHoursFromPrevious: 0 },
      ],
    };
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-retry',
      startedAt: NOW,
    });

    run = recordTouchAttempt(run, seqComRetry, seqComRetry.touches[0], NOW, { result: 'failed' });
    expect(run.attempts[0].attemptNumber).toBe(1);

    run = recordTouchAttempt(run, seqComRetry, seqComRetry.touches[0], NOW, { result: 'sent' });
    expect(run.attempts[1].attemptNumber).toBe(2); // 2ª tentativa do MESMO toque (order 1)

    run = recordTouchAttempt(run, seqComRetry, seqComRetry.touches[1], NOW, { result: 'sent' });
    expect(run.attempts[2].attemptNumber).toBe(1); // toque DIFERENTE (order 2) — reinicia em 1
  });
});

describe('recordTouchAttempt — sanitização de erro (CYC-002)', () => {
  it('grava o erro sanitizado, nunca o texto cru com PII do lead', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const updated = recordTouchAttempt(run, SEQUENCE, SEQUENCE.touches[0], NOW, {
      result: 'failed',
      error: 'Falha ao enviar para lead@empresa.com',
    });
    expect(updated.attempts[0].error).toBe(
      sanitizeTouchError('Falha ao enviar para lead@empresa.com'),
    );
    expect(updated.attempts[0].error).not.toContain('lead@empresa.com');
  });
});

describe('recordTouchAttempt — honestidade de resultado', () => {
  it('toque skipped não avança a sequência nem marca lastTouchAt como sucesso', () => {
    const run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    const updated = recordTouchAttempt(run, SEQUENCE, SEQUENCE.touches[0], NOW, {
      result: 'skipped',
      skipReason: 'outside-business-window',
    });
    expect(updated.currentTouchOrder).toBe(1);
    expect(updated.attempts).toHaveLength(1);
    expect(updated.attempts[0].result).toBe('skipped');
  });

  it('provedor recusando marca failed, nunca sent — e mantém o toque até esgotar maxAttempts', () => {
    const seqComRetry: CadenceSequenceDefinition = {
      id: 'seq-retry',
      name: 'com retry',
      touches: [{ order: 1, channel: 'email', delayHoursFromPrevious: 0, maxAttempts: 2 }],
    };
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-retry',
      startedAt: NOW,
    });

    run = recordTouchAttempt(run, seqComRetry, seqComRetry.touches[0], NOW, {
      result: 'failed',
      error: 'SMTP indisponível',
    });
    expect(run.currentTouchOrder).toBe(1); // ainda tem 1 tentativa disponível
    expect(run.attempts[0].result).toBe('failed');
    expect(run.attempts[0].error).toBe('SMTP indisponível');

    run = recordTouchAttempt(run, seqComRetry, seqComRetry.touches[0], NOW, {
      result: 'failed',
      error: 'SMTP indisponível',
    });
    // esgotou as 2 tentativas — sequência acaba (era o único toque), mas nunca marcado como sent
    expect(run.status).toBe('completed');
    expect(run.stopReason).toBe('completed');
    expect(run.attempts.every((a) => a.result !== 'sent')).toBe(true);
  });
});

describe('recordTouchAttempt — cadência multicanal adaptativa (item 26, fallbackTouchOrder)', () => {
  const seqComFallback: CadenceSequenceDefinition = {
    id: 'seq-fallback',
    name: 'WhatsApp com fallback para e-mail, pulando a ligação',
    touches: [
      {
        order: 1,
        channel: 'whatsapp',
        delayHoursFromPrevious: 0,
        maxAttempts: 1,
        fallbackTouchOrder: 3,
      },
      { order: 2, channel: 'voice', delayHoursFromPrevious: 24 },
      { order: 3, channel: 'email', delayHoursFromPrevious: 24 },
    ],
  };

  it('toque esgotado por falha real de canal desvia para fallbackTouchOrder, não para order + 1', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-fallback',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, seqComFallback, seqComFallback.touches[0], NOW, {
      result: 'failed',
      error: 'Número de WhatsApp inválido',
    });
    // maxAttempts: 1 já esgotou na primeira tentativa — desvia direto para order 3 (e-mail),
    // pulando a ligação (order 2), que dependeria do mesmo telefone já comprovado inválido.
    expect(run.currentTouchOrder).toBe(3);
    expect(run.status).toBe('active');
  });

  it('toque ENVIADO com sucesso ignora fallbackTouchOrder e segue a ordem normal (order + 1)', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-fallback',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, seqComFallback, seqComFallback.touches[0], NOW, {
      result: 'sent',
    });
    expect(run.currentTouchOrder).toBe(2); // ordem normal, não o fallback (3)
  });

  it('sem fallbackTouchOrder declarado, esgotar por falha continua indo para order + 1 (compatível com sequências antigas)', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, SEQUENCE, SEQUENCE.touches[0], NOW, {
      result: 'failed',
      error: 'SMTP indisponível',
    });
    expect(run.currentTouchOrder).toBe(2);
  });

  it('fallbackTouchOrder apontando além do fim da sequência conclui o run normalmente', () => {
    const seq: CadenceSequenceDefinition = {
      id: 'seq-fallback-fim',
      name: 'fallback aponta pro fim',
      touches: [
        {
          order: 1,
          channel: 'whatsapp',
          delayHoursFromPrevious: 0,
          maxAttempts: 1,
          fallbackTouchOrder: 2,
        },
        { order: 2, channel: 'email', delayHoursFromPrevious: 0, maxAttempts: 1 },
      ],
    };
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-fallback-fim',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, seq, seq.touches[0], NOW, {
      result: 'failed',
      error: 'Número inválido',
    });
    expect(run.currentTouchOrder).toBe(2);
    run = recordTouchAttempt(run, seq, seq.touches[1], NOW, { result: 'sent' });
    expect(run.status).toBe('completed');
  });
});

describe('pausa e retomada manual', () => {
  it('pausa impede dispatch mesmo dentro da janela, sem perder o estado (run não é stopped)', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = pauseCadenceRun(run, NOW);
    expect(run.status).toBe('paused');

    const decision = decideCadenceAction(run, SEQUENCE, NOW, ctx());
    expect(decision).toEqual({ type: 'wait', reason: 'paused' });
  });

  it('retomada volta a permitir dispatch', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = pauseCadenceRun(run, NOW);
    run = resumeCadenceRun(run);
    expect(run.status).toBe('active');

    const decision = decideCadenceAction(run, SEQUENCE, NOW, ctx());
    expect(decision).toEqual({ type: 'dispatch', touch: SEQUENCE.touches[0] });
  });

  it('resumeCadenceRun nunca reabre um run já parado (opt-out/reply/completed são definitivos)', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = applyOptOutStop(run, NOW);
    const attempted = resumeCadenceRun(run);
    expect(attempted).toEqual(run); // sem efeito — continua stopped/opt-out
  });

  it('stopCadenceManually é definitivo, distinto de pausa', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = stopCadenceManually(run, NOW);
    expect(run.status).toBe('stopped');
    expect(run.stopReason).toBe('manual-stop');
    expect(resumeCadenceRun(run)).toEqual(run);
  });
});

describe('applyOptOutStop / applyReplyStop — idempotência', () => {
  it('não sobrescreve o motivo original de parada ao reaplicar', () => {
    let run = startCadenceRun({
      id: 'r1',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-1',
      startedAt: NOW,
    });
    run = applyReplyStop(run, NOW);
    const reapplied = applyOptOutStop(run, new Date(NOW.getTime() + 1000));
    expect(reapplied.stopReason).toBe('lead-reply'); // primeiro motivo prevalece
  });
});

// DEBT-0009 — toque `pending` (voz, confirmação assíncrona via webhook) sem TTL travava o run
// em `wait/locked` para sempre quando o webhook se perdia; e, pior, a forma persistida pelo
// adaptador Prisma (`skipped` + `providerMessageId`, pois o enum do banco não tem `Pending`)
// não era reconhecida como pendente — o run re-despachava o toque de voz em loop.
describe('DEBT-0009 — confirmação pendente de toque assíncrono (voz)', () => {
  const VOICE_SEQ: CadenceSequenceDefinition = {
    id: 'seq-voice',
    name: 'Só voz',
    touches: [{ order: 1, channel: 'voice', delayHoursFromPrevious: 0 }],
  };

  function runWithPending(attemptedAt: Date) {
    let run = startCadenceRun({
      id: 'r-voice',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-voice',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, VOICE_SEQ, VOICE_SEQ.touches[0], attemptedAt, {
      result: 'pending',
      providerMessageId: 'call-123',
    });
    return run;
  }

  /** Simula o round-trip pelo PostgreSQL: `pending` volta como `skipped` + `providerMessageId`. */
  function asPersisted(run: ReturnType<typeof runWithPending>) {
    return {
      ...run,
      attempts: run.attempts.map((a) => ({ ...a, result: 'skipped' as const })),
    };
  }

  it('decideCadenceAction aguarda (locked) enquanto há pending dentro do TTL', () => {
    const run = runWithPending(NOW);
    expect(decideCadenceAction(run, VOICE_SEQ, NOW, ctx())).toEqual({
      type: 'wait',
      reason: 'locked',
    });
  });

  it('a forma persistida (skipped + providerMessageId) TAMBÉM bloqueia novo despacho', () => {
    const run = asPersisted(runWithPending(NOW));
    // Antes da correção isto devolvia `dispatch` — re-chamada ao lead a cada ciclo do scanner.
    expect(decideCadenceAction(run, VOICE_SEQ, NOW, ctx())).toEqual({
      type: 'wait',
      reason: 'locked',
    });
  });

  it('skipped legítimo (rate limit/janela) SEM providerMessageId não é tratado como pendente', () => {
    let run = startCadenceRun({
      id: 'r-voice',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-voice',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, VOICE_SEQ, VOICE_SEQ.touches[0], NOW, {
      result: 'skipped',
      skipReason: 'contact-rate-limit',
    });
    expect(decideCadenceAction(run, VOICE_SEQ, NOW, ctx())).toEqual({
      type: 'dispatch',
      touch: VOICE_SEQ.touches[0],
    });
  });

  it('pending recente NÃO é expirado', () => {
    const run = runWithPending(NOW);
    const later = new Date(NOW.getTime() + 60_000);
    expect(expireStalePendingTouchAttempts(run, VOICE_SEQ, later)).toBe(run);
  });

  it('pending stale vira failed e a sequência avança/completa conforme maxAttempts', () => {
    const run = runWithPending(NOW);
    const afterTtl = new Date(NOW.getTime() + PENDING_TOUCH_CONFIRMATION_TTL_MS + 1);
    const expired = expireStalePendingTouchAttempts(run, VOICE_SEQ, afterTtl);

    expect(expired).not.toBe(run);
    expect(expired.attempts[0].result).toBe('failed');
    expect(expired.attempts[0].error).toBe(PENDING_TOUCH_EXPIRED_ERROR);
    // maxAttempts default 1 → esgotado → avança; sequência de 1 toque → completed.
    expect(expired.currentTouchOrder).toBe(2);
    expect(expired.status).toBe('completed');
    expect(expired.stopReason).toBe('completed');
  });

  it('pending stale com maxAttempts > 1 permanece no toque para retry (não avança)', () => {
    const seqRetry: CadenceSequenceDefinition = {
      id: 'seq-voice-retry',
      name: 'Voz com retry',
      touches: [{ order: 1, channel: 'voice', delayHoursFromPrevious: 0, maxAttempts: 2 }],
    };
    let run = startCadenceRun({
      id: 'r-voice',
      organizationId: 'org',
      leadId: 'lead',
      sequenceId: 'seq-voice-retry',
      startedAt: NOW,
    });
    run = recordTouchAttempt(run, seqRetry, seqRetry.touches[0], NOW, {
      result: 'pending',
      providerMessageId: 'call-123',
    });
    const afterTtl = new Date(NOW.getTime() + PENDING_TOUCH_CONFIRMATION_TTL_MS + 1);
    const expired = expireStalePendingTouchAttempts(run, seqRetry, afterTtl);

    expect(expired.attempts[0].result).toBe('failed');
    expect(expired.currentTouchOrder).toBe(1); // retry ainda disponível
    expect(expired.status).toBe('active');
  });

  it('run terminal nunca tem tentativas reescritas pelo sweeper', () => {
    let run = runWithPending(NOW);
    run = applyReplyStop(run, NOW);
    const afterTtl = new Date(NOW.getTime() + PENDING_TOUCH_CONFIRMATION_TTL_MS + 1);
    expect(expireStalePendingTouchAttempts(run, VOICE_SEQ, afterTtl)).toBe(run);
  });

  it('webhook tardio após expiração é inócuo (resolvePendingTouchAttempt não acha pending)', () => {
    const run = runWithPending(NOW);
    const afterTtl = new Date(NOW.getTime() + PENDING_TOUCH_CONFIRMATION_TTL_MS + 1);
    const expired = expireStalePendingTouchAttempts(run, VOICE_SEQ, afterTtl);
    const resolved = resolvePendingTouchAttempt(expired, VOICE_SEQ, 'call-123', afterTtl, {
      result: 'sent',
    });
    expect(resolved).toBe(expired);
  });

  it('resolvePendingTouchAttempt resolve a forma persistida (skipped + providerMessageId)', () => {
    const run = asPersisted(runWithPending(NOW));
    const later = new Date(NOW.getTime() + 60_000);
    const resolved = resolvePendingTouchAttempt(run, VOICE_SEQ, 'call-123', later, {
      result: 'sent',
    });
    expect(resolved).not.toBe(run);
    expect(resolved.attempts[0].result).toBe('sent');
    expect(resolved.status).toBe('completed'); // único toque enviado → fim natural
  });
});

// POS4-17-CADENCE-TZ / achado 2 do handoff 44→17 — o scan descobre runs sob bypassRls; a
// sequência resolvida para um run precisa ser do MESMO tenant, senão os touches de outra
// organização seriam despachados. A regra vive no domínio para ser testável sem banco; o filtro
// de `deletedAt`/`active` é da query (coberto por teste de integração, ver handoff POS4).
describe('sequenceDefinitionForRun — isolamento de tenant no scan (POS4-17-CADENCE-TZ)', () => {
  const lookup = {
    organizationId: 'org-A',
    definition: { id: 'seq-1', name: 'Seq', touches: SEQUENCE.touches },
  };

  it('mesmo tenant devolve a definição parseada', () => {
    expect(sequenceDefinitionForRun(lookup, 'org-A')).toBe(lookup.definition);
  });

  it('sequência de OUTRO tenant devolve null — run é encerrado, nunca despacha touches alheios', () => {
    expect(sequenceDefinitionForRun(lookup, 'org-B')).toBeNull();
  });

  it('sequência ausente do mapa (inclui soft-deletada, filtrada na query) devolve null', () => {
    expect(sequenceDefinitionForRun(undefined, 'org-A')).toBeNull();
    expect(sequenceDefinitionForRun(null, 'org-A')).toBeNull();
  });

  it('definição malformada (null) devolve null mesmo no tenant correto', () => {
    expect(
      sequenceDefinitionForRun({ organizationId: 'org-A', definition: null }, 'org-A'),
    ).toBeNull();
  });
});

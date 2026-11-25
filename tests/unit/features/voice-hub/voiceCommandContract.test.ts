import { describe, expect, it, vi } from 'vitest';
import {
  createVoiceCommandRouter,
  type VoiceCommandExecutorRegistry,
  type VoiceCommandRequest,
  type VoiceCommandRouterResult,
} from '../../../../src/features/voice-hub/commands/voice-command-router.js';
import type { VoiceCommandActor } from '../../../../src/features/voice-hub/commands/permission.guard.js';
import type { DatabaseMutationRunner } from '../../../../src/features/voice-hub/commands/command.processor.js';

/**
 * Contrato de consumo do pipeline de comandos de voz (B-07) — Agente 64.
 *
 * Este arquivo prova o fluxo que o call-site de produção futuro DEVE exercitar:
 *   transcript → processVoiceCommand → (comando crítico) needs_confirmation
 *   → decisão 'confirm' → execução única → confirmed:true SOMENTE após commit.
 *
 * Enquanto não houver call-site montado (ver handoff
 * `.agents/handoffs/squad-60/64-para-60-voice-commands-wiring.md`), este teste
 * é a prova executável do contrato que o consumidor (rota HTTP/WS, gateway de
 * tempo real ou hook de voz) deve satisfazer.
 */

const ACTOR: VoiceCommandActor = {
  userId: 'user-agent-001',
  organizationId: 'tenant-voice-001',
  role: 'agent',
};

function makeExecutors(overrides?: Partial<VoiceCommandExecutorRegistry>) {
  const createLead: DatabaseMutationRunner = {
    mutate: vi.fn().mockResolvedValue({ leadId: 'lead-committed-1' }),
  };
  const scheduleMeeting: DatabaseMutationRunner = {
    mutate: vi.fn().mockResolvedValue({ activityId: 'activity-committed-1' }),
  };
  const executors: VoiceCommandExecutorRegistry = {
    create_lead: createLead,
    schedule_meeting: scheduleMeeting,
    ...overrides,
  };
  return { executors, createLead, scheduleMeeting };
}

/** Simula o call-site futuro: uma função fina que repassa request ao router. */
async function dispatch(
  router: ReturnType<typeof createVoiceCommandRouter>,
  request: VoiceCommandRequest,
): Promise<VoiceCommandRouterResult> {
  return router.processVoiceCommand(request);
}

describe('Contrato comando→confirmação→commit (B-07) — call-site futuro', () => {
  it('comando crítico: transcript gera needs_confirmation SEM tocar no executor', async () => {
    const { executors, scheduleMeeting } = makeExecutors();
    const router = createVoiceCommandRouter({ executors });

    const result = await dispatch(router, {
      transcript: 'agendar reunião amanhã',
      actor: ACTOR,
    });

    expect(result.status).toBe('needs_confirmation');
    expect(result.type).toBe('schedule_meeting');
    expect(result.confirmationId).toBeDefined();
    expect(result.expiresAt).toBeDefined();
    expect(scheduleMeeting.mutate).not.toHaveBeenCalled();
  });

  it('fluxo completo: needs_confirmation → confirm → executed com confirmed:true após commit', async () => {
    const { executors, scheduleMeeting } = makeExecutors();
    const router = createVoiceCommandRouter({ executors });

    const pending = await dispatch(router, {
      transcript: 'agendar reunião amanhã',
      actor: ACTOR,
    });
    expect(pending.status).toBe('needs_confirmation');

    const executed = await dispatch(router, {
      transcript: '', // decisão de confirmação não depende de novo transcript
      actor: ACTOR,
      confirmation: {
        confirmationId: pending.confirmationId!,
        decision: 'confirm',
      },
    });

    expect(executed.status).toBe('executed');
    expect(executed.execution?.success).toBe(true);
    expect(executed.execution?.confirmed).toBe(true);
    expect(executed.execution?.committedAt).toBeDefined();
    // O comando executado é o ORIGINAL pendente — não o transcript vazio.
    expect(executed.execution?.type).toBe('schedule_meeting');
    expect(scheduleMeeting.mutate).toHaveBeenCalledTimes(1);
    expect(scheduleMeeting.mutate).toHaveBeenCalledWith(
      ACTOR.organizationId,
      expect.objectContaining({ type: 'schedule_meeting', organizationId: ACTOR.organizationId }),
    );
  });

  it('execução única: segundo confirm com o mesmo confirmationId é bloqueado', async () => {
    const { executors, scheduleMeeting } = makeExecutors();
    const router = createVoiceCommandRouter({ executors });

    const pending = await dispatch(router, {
      transcript: 'agendar reunião amanhã',
      actor: ACTOR,
    });

    await dispatch(router, {
      transcript: '',
      actor: ACTOR,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'confirm' },
    });

    const replay = await dispatch(router, {
      transcript: '',
      actor: ACTOR,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'confirm' },
    });

    expect(replay.status).toBe('confirmation_expired');
    expect(scheduleMeeting.mutate).toHaveBeenCalledTimes(1); // nunca executa duas vezes
  });

  it('falha de commit nunca produz confirmed:true — resposta honesta de falha', async () => {
    const failingRunner: DatabaseMutationRunner = {
      mutate: vi.fn().mockRejectedValue(new Error('deadlock no commit')),
    };
    const router = createVoiceCommandRouter({
      executors: { schedule_meeting: failingRunner },
    });

    const pending = await dispatch(router, {
      transcript: 'agendar reunião amanhã',
      actor: ACTOR,
    });
    const executed = await dispatch(router, {
      transcript: '',
      actor: ACTOR,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'confirm' },
    });

    expect(executed.status).toBe('failed');
    expect(executed.execution?.confirmed).toBe(false);
    expect(executed.execution?.success).toBe(false);
    expect(executed.execution?.committedAt).toBeUndefined();
    expect(executed.execution?.error).toContain('deadlock');
  });

  it('comando não crítico executa direto e só confirma após commit real', async () => {
    const { executors, createLead } = makeExecutors();
    const router = createVoiceCommandRouter({ executors });

    const result = await dispatch(router, {
      transcript: 'criar lead Acme Health',
      actor: ACTOR,
    });

    expect(result.status).toBe('executed');
    expect(result.execution?.confirmed).toBe(true);
    expect(result.execution?.committedAt).toBeDefined();
    expect(createLead.mutate).toHaveBeenCalledTimes(1);
  });

  it('cancelamento descarta a pendência sem nenhuma mutação', async () => {
    const { executors, scheduleMeeting } = makeExecutors();
    const router = createVoiceCommandRouter({ executors });

    const pending = await dispatch(router, {
      transcript: 'agendar reunião amanhã',
      actor: ACTOR,
    });

    const cancelled = await dispatch(router, {
      transcript: '',
      actor: ACTOR,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'cancel' },
    });

    expect(cancelled.status).toBe('confirmation_cancelled');
    expect(scheduleMeeting.mutate).not.toHaveBeenCalled();

    // pendência consumida: um confirm posterior não executa nada
    const late = await dispatch(router, {
      transcript: '',
      actor: ACTOR,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'confirm' },
    });
    expect(late.status).toBe('confirmation_expired');
    expect(scheduleMeeting.mutate).not.toHaveBeenCalled();
  });

  it('executor não vinculado é falha honesta — nunca falso positivo', async () => {
    const router = createVoiceCommandRouter({ executors: {} });

    const result = await dispatch(router, {
      transcript: 'criar lead Acme Health',
      actor: ACTOR,
    });

    expect(result.status).toBe('executor_not_bound');
    expect(result.execution).toBeUndefined();
  });
});

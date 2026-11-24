import { describe, expect, it, vi } from 'vitest';
import type {
  DatabaseMutationRunner,
  VoiceCommandPayload,
} from '../../../../src/features/voice-hub/commands/command.processor.js';
import { VoiceCommandConfirmationManager } from '../../../../src/features/voice-hub/commands/confirmation.manager.js';
import { parseVoiceTranscript } from '../../../../src/features/voice-hub/commands/intent.parser.js';
import type { VoiceCommandActor } from '../../../../src/features/voice-hub/commands/permission.guard.js';
import {
  createVoiceCommandRouter,
  type VoiceCommandExecutorRegistry,
} from '../../../../src/features/voice-hub/commands/voice-command-router.js';

const ORG = 'tenant-voice-hub';

const agent: VoiceCommandActor = { userId: 'u-agent', organizationId: ORG, role: 'agent' };
const manager: VoiceCommandActor = { userId: 'u-manager', organizationId: ORG, role: 'manager' };
const admin: VoiceCommandActor = { userId: 'u-admin', organizationId: ORG, role: 'admin' };
const viewer: VoiceCommandActor = { userId: 'u-viewer', organizationId: ORG, role: 'viewer' };

function realRunner(result: unknown = { id: 'persisted-1' }): DatabaseMutationRunner & {
  mutate: ReturnType<typeof vi.fn>;
} {
  return { mutate: vi.fn().mockResolvedValue(result) };
}

function simulationRunner(): DatabaseMutationRunner & {
  mutate: ReturnType<typeof vi.fn>;
} {
  return { mutate: vi.fn().mockResolvedValue({ simulated: true }), simulation: true };
}

function allExecutors(overrides: VoiceCommandExecutorRegistry = {}): VoiceCommandExecutorRegistry {
  return {
    create_lead: realRunner({ id: 'lead-1' }),
    log_activity: realRunner({ id: 'act-1' }),
    schedule_meeting: realRunner({ id: 'mtg-1' }),
    update_deal_stage: realRunner({ id: 'deal-1' }),
    generic_action: realRunner({ id: 'gen-1' }),
    ...overrides,
  };
}

describe('Voice Command Intent Parser (B-07 Tito)', () => {
  it('classifica comando de criação de lead com parâmetros', () => {
    const result = parseVoiceTranscript('criar lead chamado Acme Health');
    expect(result.status).toBe('parsed');
    expect(result.intent?.type).toBe('create_lead');
    expect(result.intent?.parameters.leadName).toBe('Acme Health');
  });

  it('retorna ambiguous quando mais de uma intenção é detectada', () => {
    const result = parseVoiceTranscript('criar lead e agendar reunião amanhã');
    expect(result.status).toBe('ambiguous');
    expect(result.candidates).toContain('create_lead');
    expect(result.candidates).toContain('schedule_meeting');
  });

  it('retorna incomplete quando slot obrigatório está ausente', () => {
    const result = parseVoiceTranscript('agendar reunião');
    expect(result.status).toBe('incomplete');
    expect(result.missingSlots).toContain('dateTime');
  });

  it('retorna unrecognized para fala sem ação executável', () => {
    const result = parseVoiceTranscript('bom dia, tudo bem?');
    expect(result.status).toBe('unrecognized');
  });
});

describe('Voice Command Router — autorização por comando', () => {
  it('nega execução para papel insuficiente sem tocar no executor', async () => {
    const executors = allExecutors();
    const router = createVoiceCommandRouter({ executors });

    const result = await router.processVoiceCommand({
      transcript: 'criar lead chamado Maria Silva',
      actor: viewer,
    });

    expect(result.status).toBe('denied');
    expect(result.reason).toContain('Permissão negada');
    expect(executors.create_lead!.mutate).not.toHaveBeenCalled();
  });

  it('exige papel manager para update_deal_stage', async () => {
    const executors = allExecutors();
    const router = createVoiceCommandRouter({ executors });

    const result = await router.processVoiceCommand({
      transcript: 'mover deal DEAL-42 para Ganho',
      actor: agent,
    });

    expect(result.status).toBe('denied');
    expect(executors.update_deal_stage!.mutate).not.toHaveBeenCalled();
  });
});

describe('Voice Command Router — comandos não críticos executam com commit real', () => {
  it('executa create_lead diretamente e só confirma após commit', async () => {
    const executors = allExecutors();
    const router = createVoiceCommandRouter({ executors });

    const result = await router.processVoiceCommand({
      transcript: 'criar lead chamado Maria Silva',
      actor: agent,
    });

    expect(result.status).toBe('executed');
    expect(result.execution?.confirmed).toBe(true);
    expect(result.execution?.committedAt).toBeDefined();
    expect(executors.create_lead!.mutate).toHaveBeenCalledTimes(1);
  });

  it('retorna falha honesta quando o commit no banco falha', async () => {
    const failing: DatabaseMutationRunner = {
      mutate: vi.fn().mockRejectedValue(new Error('deadlock no Postgres')),
    };
    const router = createVoiceCommandRouter({
      executors: allExecutors({ create_lead: failing }),
    });

    const result = await router.processVoiceCommand({
      transcript: 'criar lead chamado Maria Silva',
      actor: agent,
    });

    expect(result.status).toBe('failed');
    expect(result.execution?.confirmed).toBe(false);
    expect(result.execution?.success).toBe(false);
  });

  it('falha honestamente quando não há executor vinculado (sem falso positivo)', async () => {
    const router = createVoiceCommandRouter({ executors: {} });

    const result = await router.processVoiceCommand({
      transcript: 'criar lead chamado Maria Silva',
      actor: agent,
    });

    expect(result.status).toBe('executor_not_bound');
  });
});

describe('Voice Command Router — execução real vs simulação (B-07)', () => {
  it('executor SIMULADO nunca produz confirmação positiva', async () => {
    const sim = simulationRunner();
    const router = createVoiceCommandRouter({
      executors: allExecutors({ create_lead: sim }),
    });

    const result = await router.processVoiceCommand({
      transcript: 'criar lead chamado Maria Silva',
      actor: agent,
    });

    expect(result.status).toBe('failed');
    expect(result.execution?.confirmed).toBe(false);
    expect(result.execution?.success).toBe(false);
    expect(result.execution?.simulated).toBe(true);
    expect(result.execution?.committedAt).toBeUndefined();
    // Simulação não chega nem a mutar: bloqueio ocorre antes do commit.
    expect(sim.mutate).not.toHaveBeenCalled();
  });
});

describe('Voice Command Router — confirmação ativa para comandos críticos', () => {
  const criticalTranscript = 'mover deal DEAL-42 para Ganho';

  async function startCritical(
    executors: VoiceCommandExecutorRegistry,
    confirmations?: VoiceCommandConfirmationManager,
  ) {
    const router = createVoiceCommandRouter({ executors, confirmations });
    const pending = await router.processVoiceCommand({
      transcript: criticalTranscript,
      actor: manager,
    });
    return { router, pending };
  }

  it('comando crítico NÃO executa sem confirmação — cria pendência', async () => {
    const executors = allExecutors();
    const { pending } = await startCritical(executors);

    expect(pending.status).toBe('needs_confirmation');
    expect(pending.confirmationId).toBeDefined();
    expect(pending.expiresAt).toBeDefined();
    expect(executors.update_deal_stage!.mutate).not.toHaveBeenCalled();
  });

  it('confirmação válida executa o comando pendente original exatamente uma vez', async () => {
    const executors = allExecutors();
    const { router, pending } = await startCritical(executors);

    const confirmed = await router.processVoiceCommand({
      transcript: 'confirmo', // transcript irrelevante na decisão de confirmação
      actor: manager,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'confirm' },
    });

    expect(confirmed.status).toBe('executed');
    expect(confirmed.execution?.confirmed).toBe(true);
    expect(executors.update_deal_stage!.mutate).toHaveBeenCalledTimes(1);

    // Reuso do mesmo token: execução única garantida.
    const replay = await router.processVoiceCommand({
      transcript: 'confirmo',
      actor: manager,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'confirm' },
    });
    expect(replay.status).toBe('confirmation_expired');
    expect(executors.update_deal_stage!.mutate).toHaveBeenCalledTimes(1);
  });

  it('cancelamento explícito não executa nada', async () => {
    const executors = allExecutors();
    const { router, pending } = await startCritical(executors);

    const cancelled = await router.processVoiceCommand({
      transcript: 'cancela',
      actor: manager,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'cancel' },
    });

    expect(cancelled.status).toBe('confirmation_cancelled');
    expect(executors.update_deal_stage!.mutate).not.toHaveBeenCalled();
  });

  it('confirmação expirada é bloqueada honestamente', async () => {
    let currentTime = 1_000_000;
    const confirmations = new VoiceCommandConfirmationManager({
      ttlMs: 1_000,
      now: () => currentTime,
    });
    const executors = allExecutors();
    const router = createVoiceCommandRouter({ executors, confirmations });

    const pending = await router.processVoiceCommand({
      transcript: criticalTranscript,
      actor: manager,
    });
    expect(pending.status).toBe('needs_confirmation');

    currentTime += 2_000; // TTL expirado

    const expired = await router.processVoiceCommand({
      transcript: 'confirmo',
      actor: manager,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'confirm' },
    });

    expect(expired.status).toBe('confirmation_expired');
    expect(expired.reason).toContain('expirada');
    expect(executors.update_deal_stage!.mutate).not.toHaveBeenCalled();
  });

  it('confirmação de comando inexistente é bloqueada', async () => {
    const executors = allExecutors();
    const router = createVoiceCommandRouter({ executors });

    const result = await router.processVoiceCommand({
      transcript: 'confirmo',
      actor: manager,
      confirmation: { confirmationId: 'vconf-inexistente', decision: 'confirm' },
    });

    expect(result.status).toBe('confirmation_expired');
    expect(executors.update_deal_stage!.mutate).not.toHaveBeenCalled();
  });

  it('autorização é revalidada no momento da confirmação', async () => {
    const executors = allExecutors();
    const { router, pending } = await startCritical(executors);

    // Mesmo confirmationId, mas ator sem papel suficiente (agent < manager).
    const denied = await router.processVoiceCommand({
      transcript: 'confirmo',
      actor: agent,
      confirmation: { confirmationId: pending.confirmationId!, decision: 'confirm' },
    });

    expect(denied.status).toBe('confirmation_denied');
    expect(executors.update_deal_stage!.mutate).not.toHaveBeenCalled();
  });
});

describe('Voice Command Router — respostas honestas sem falso positivo', () => {
  it('ambíguo, incompleto e irreconhecível nunca executam', async () => {
    const executors = allExecutors();
    const router = createVoiceCommandRouter({ executors });

    const ambiguous = await router.processVoiceCommand({
      transcript: 'criar lead e agendar reunião amanhã',
      actor: admin,
    });
    expect(ambiguous.status).toBe('ambiguous');

    const incomplete = await router.processVoiceCommand({
      transcript: 'agendar reunião',
      actor: agent,
    });
    expect(incomplete.status).toBe('incomplete');
    expect(incomplete.missingSlots).toContain('dateTime');

    const unrecognized = await router.processVoiceCommand({
      transcript: 'como está o tempo hoje?',
      actor: agent,
    });
    expect(unrecognized.status).toBe('unrecognized');

    for (const runner of Object.values(executors)) {
      expect(runner!.mutate).not.toHaveBeenCalled();
    }
  });

  it('resultado executado carrega commandId, type e organizationId do comando real', async () => {
    const executors = allExecutors();
    const router = createVoiceCommandRouter({ executors });

    const result = await router.processVoiceCommand({
      transcript: 'registrar atividade descrição: cliente pediu retorno',
      actor: agent,
      commandId: 'cmd-fixed-001',
    });

    expect(result.status).toBe('executed');
    expect(result.commandId).toBe('cmd-fixed-001');
    expect(result.type).toBe('log_activity');
    expect(result.organizationId).toBe(ORG);

    const payload = executors.log_activity!.mutate.mock.calls[0][1] as VoiceCommandPayload;
    expect(payload.organizationId).toBe(ORG);
    expect(payload.userId).toBe(agent.userId);
  });
});

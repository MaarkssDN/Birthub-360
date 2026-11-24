import { describe, expect, it, vi } from 'vitest';
import type { DatabaseMutationRunner } from '../command.processor.js';
import { VoiceCommandConfirmationManager } from '../confirmation.manager.js';
import {
  createDomainVoiceCommandExecutors,
  createSttVoiceCommandAdapter,
  extractSttTranscript,
  mapSystemRoleToVoiceRole,
  resolveVoiceActorFromSession,
} from '../stt-adapter.js';
import type { VoiceCommandExecutorRegistry } from '../voice-command-router.js';

const ORG = 'tenant-voice-hub';

/** Sessão autenticada — shape de `req.user`/`{user}` do better-auth. */
const sessionAgent = {
  user: { id: 'u-agent', organizationId: ORG, role: 'SDR', email: 'a@x.com' },
};
const sessionManager = {
  user: { id: 'u-manager', organizationId: ORG, role: 'GESTOR' },
};
const sessionViewer = {
  user: { id: 'u-viewer', organizationId: ORG, role: 'VISUALIZADOR' },
};
const sessionOtherOrg = {
  user: { id: 'u-intruso', organizationId: 'tenant-invasor', role: 'ADMIN' },
};

function realRunner(result: unknown = { id: 'persisted-1' }): DatabaseMutationRunner & {
  mutate: ReturnType<typeof vi.fn>;
} {
  return { mutate: vi.fn().mockResolvedValue(result) };
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

// ---------------------------------------------------------------------------
// Extração de transcript STT (contrato tolerante)
// ---------------------------------------------------------------------------

describe('extractSttTranscript — contrato STT tolerante', () => {
  it('aceita string pura', () => {
    expect(extractSttTranscript('criar lead chamado Ana')).toEqual({
      kind: 'final',
      transcript: 'criar lead chamado Ana',
    });
  });

  it('aceita { transcript, isFinal: true } (contrato assumido do Agente 63)', () => {
    expect(
      extractSttTranscript({ transcript: 'criar lead', isFinal: true, sessionId: 's1' }),
    ).toEqual({ kind: 'final', transcript: 'criar lead' });
  });

  it('aceita alias { text } (Whisper) e { finalTranscript }', () => {
    expect(extractSttTranscript({ text: 'olá', isFinal: true })).toEqual({
      kind: 'final',
      transcript: 'olá',
    });
    expect(extractSttTranscript({ finalTranscript: 'tchau' })).toEqual({
      kind: 'final',
      transcript: 'tchau',
    });
  });

  it('aceita Whisper { text, segments }', () => {
    const result = extractSttTranscript({
      text: 'criar lead chamado Bob',
      segments: [{ start: 0, end: 1, text: 'criar lead ' }, { start: 1, end: 2, text: 'chamado Bob' }],
    });
    expect(result.kind).toBe('final');
    if (result.kind === 'final') expect(result.transcript).toContain('criar lead');
  });

  it('aceita Web Speech API results[] com resultado final', () => {
    const event = {
      results: [
        { 0: { transcript: 'criar lead chamado ' }, isFinal: false },
        { 0: { transcript: 'criar lead chamado Carla' }, isFinal: true },
      ],
    };
    const result = extractSttTranscript(event);
    expect(result).toEqual({ kind: 'final', transcript: 'criar lead chamado Carla' });
  });

  it('results[] só com interinos → interim', () => {
    const event = { results: [{ 0: { transcript: 'cri' }, isFinal: false }] };
    expect(extractSttTranscript(event)).toEqual({ kind: 'interim' });
  });

  it('isFinal:false explícito → interim mesmo com transcript presente', () => {
    expect(extractSttTranscript({ transcript: 'parcial', isFinal: false })).toEqual({
      kind: 'interim',
    });
  });

  it('transcrição vazia/branca → empty', () => {
    expect(extractSttTranscript({ transcript: '   ', isFinal: true })).toEqual({ kind: 'empty' });
    expect(extractSttTranscript(null)).toEqual({ kind: 'empty' });
    expect(extractSttTranscript({})).toEqual({ kind: 'empty' });
  });
});

// ---------------------------------------------------------------------------
// Resolução de ator a partir da sessão (nunca do payload STT)
// ---------------------------------------------------------------------------

describe('resolveVoiceActorFromSession / mapSystemRoleToVoiceRole', () => {
  it('mapeia papéis reais do sistema para VoiceActorRole', () => {
    expect(mapSystemRoleToVoiceRole('ADMIN')).toBe('admin');
    expect(mapSystemRoleToVoiceRole('GESTOR')).toBe('manager');
    expect(mapSystemRoleToVoiceRole('CLOSER')).toBe('agent');
    expect(mapSystemRoleToVoiceRole('SDR')).toBe('agent');
    expect(mapSystemRoleToVoiceRole('VISUALIZADOR')).toBe('viewer');
    expect(mapSystemRoleToVoiceRole('QUALQUER_COISA')).toBe('viewer'); // fail-closed
    expect(mapSystemRoleToVoiceRole(undefined)).toBe('viewer');
  });

  it('resolve {user:{id,organizationId,role}}', () => {
    expect(resolveVoiceActorFromSession(sessionManager)).toEqual({
      userId: 'u-manager',
      organizationId: ORG,
      role: 'manager',
    });
  });

  it('resolve user direto e aliases de tenant', () => {
    expect(
      resolveVoiceActorFromSession({ id: 'u1', tenantId: 't1', role: 'ADMIN' }),
    ).toEqual({ userId: 'u1', organizationId: 't1', role: 'admin' });
  });

  it('retorna null sem userId ou organizationId — nunca inventa tenant', () => {
    expect(resolveVoiceActorFromSession(null)).toBeNull();
    expect(resolveVoiceActorFromSession({ user: { id: 'u1' } })).toBeNull();
    expect(resolveVoiceActorFromSession({ user: { organizationId: ORG } })).toBeNull();
    expect(resolveVoiceActorFromSession({})).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Adapter STT → Router — respostas honestas sem execução
// ---------------------------------------------------------------------------

describe('createSttVoiceCommandAdapter — gates honestos', () => {
  it('resultado interim NUNCA chega ao router nem toca executores', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    const result = await adapter.handleTranscript({
      stt: { transcript: 'cri', isFinal: false },
      session: sessionAgent,
    });

    expect(result.status).toBe('stt_interim');
    for (const runner of Object.values(executors)) {
      expect(runner!.mutate).not.toHaveBeenCalled();
    }
  });

  it('transcrição vazia → stt_empty sem executar', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    const result = await adapter.handleTranscript({
      stt: { transcript: '   ', isFinal: true },
      session: sessionAgent,
    });

    expect(result.status).toBe('stt_empty');
    for (const runner of Object.values(executors)) {
      expect(runner!.mutate).not.toHaveBeenCalled();
    }
  });

  it('sessão sem contexto de ator → actor_unauthenticated sem executar', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    const result = await adapter.handleTranscript({
      stt: { transcript: 'criar lead chamado Maria', isFinal: true },
      session: null,
    });

    expect(result.status).toBe('actor_unauthenticated');
    for (const runner of Object.values(executors)) {
      expect(runner!.mutate).not.toHaveBeenCalled();
    }
  });

  it('payload STT com organizationId/userId NÃO define tenancy — sessão vence', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    // Payload tenta se passar por outro tenant — deve ser ignorado.
    const result = await adapter.handleTranscript({
      stt: {
        transcript: 'criar lead chamado Maria Silva',
        isFinal: true,
        organizationId: 'tenant-invasor',
        userId: 'u-intruso',
      },
      session: sessionAgent,
    });

    expect(result.status).toBe('executed');
    expect(result.organizationId).toBe(ORG);
    const payload = executors.create_lead!.mutate.mock.calls[0][1] as {
      organizationId: string;
      userId: string;
    };
    expect(payload.organizationId).toBe(ORG);
    expect(payload.userId).toBe('u-agent');
  });
});

// ---------------------------------------------------------------------------
// Adapter STT → Router — pipeline completo transcript→execute
// ---------------------------------------------------------------------------

describe('createSttVoiceCommandAdapter — pipeline ponta a ponta', () => {
  it('transcript final → parse → authorize → commit real (create_lead, agent)', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    const result = await adapter.handleTranscript({
      stt: { transcript: 'criar lead chamado Maria Silva', isFinal: true, sessionId: 'sess-1' },
      session: sessionAgent,
      commandId: 'cmd-stt-001',
    });

    expect(result.status).toBe('executed');
    expect(result.transcript).toBe('criar lead chamado Maria Silva');
    expect(result.commandId).toBe('cmd-stt-001');
    expect(result.execution?.confirmed).toBe(true);
    expect(result.execution?.committedAt).toBeDefined();
    expect(executors.create_lead!.mutate).toHaveBeenCalledTimes(1);
  });

  it('transcrição ambígua → ambiguous sem executar', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    const result = await adapter.handleTranscript({
      stt: 'criar lead e agendar reunião amanhã',
      session: sessionManager,
    });

    expect(result.status).toBe('ambiguous');
    expect(result.candidates).toContain('create_lead');
    expect(result.candidates).toContain('schedule_meeting');
    for (const runner of Object.values(executors)) {
      expect(runner!.mutate).not.toHaveBeenCalled();
    }
  });

  it('transcrição irreconhecível → unrecognized sem executar', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    const result = await adapter.handleTranscript({
      stt: 'como está o tempo hoje?',
      session: sessionAgent,
    });

    expect(result.status).toBe('unrecognized');
    for (const runner of Object.values(executors)) {
      expect(runner!.mutate).not.toHaveBeenCalled();
    }
  });

  it('papel insuficiente (VISUALIZADOR→viewer) → denied sem executar', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    const result = await adapter.handleTranscript({
      stt: 'criar lead chamado Maria',
      session: sessionViewer,
    });

    expect(result.status).toBe('denied');
    expect(result.reason).toContain('Permissão negada');
    expect(executors.create_lead!.mutate).not.toHaveBeenCalled();
  });

  it('comando crítico via STT → needs_confirmation; confirmação por handleConfirmationDecision executa 1x', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    const pending = await adapter.handleTranscript({
      stt: 'mover deal DEAL-42 para Ganho',
      session: sessionManager,
    });

    expect(pending.status).toBe('needs_confirmation');
    expect(pending.confirmationId).toBeDefined();
    expect(executors.update_deal_stage!.mutate).not.toHaveBeenCalled();

    const confirmed = await adapter.handleConfirmationDecision({
      confirmationId: pending.confirmationId!,
      decision: 'confirm',
      session: sessionManager,
    });

    expect(confirmed.status).toBe('executed');
    expect(confirmed.execution?.confirmed).toBe(true);
    expect(executors.update_deal_stage!.mutate).toHaveBeenCalledTimes(1);

    // Uso único: replay é bloqueado.
    const replay = await adapter.handleConfirmationDecision({
      confirmationId: pending.confirmationId!,
      decision: 'confirm',
      session: sessionManager,
    });
    expect(replay.status).toBe('confirmation_expired');
    expect(executors.update_deal_stage!.mutate).toHaveBeenCalledTimes(1);
  });

  it('cross-tenant: confirmação de OUTRA organização é negada — zero mutação', async () => {
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors });

    const pending = await adapter.handleTranscript({
      stt: 'mover deal DEAL-42 para Ganho',
      session: sessionManager,
    });
    expect(pending.status).toBe('needs_confirmation');

    // Atacante de outro tenant tenta confirmar com o confirmationId vazado.
    const denied = await adapter.handleConfirmationDecision({
      confirmationId: pending.confirmationId!,
      decision: 'confirm',
      session: sessionOtherOrg,
    });

    expect(denied.status).toBe('confirmation_denied');
    expect(executors.update_deal_stage!.mutate).not.toHaveBeenCalled();
  });

  it('executor SIMULADO via STT → failed/simulated, nunca confirmed', async () => {
    const sim: DatabaseMutationRunner = {
      mutate: vi.fn().mockResolvedValue({ ok: true }),
      simulation: true,
    };
    const executors = allExecutors({ create_lead: sim });
    const adapter = createSttVoiceCommandAdapter({ executors });

    const result = await adapter.handleTranscript({
      stt: 'criar lead chamado Maria',
      session: sessionAgent,
    });

    expect(result.status).toBe('failed');
    expect(result.execution?.confirmed).toBe(false);
    expect(result.execution?.simulated).toBe(true);
    expect(sim.mutate).not.toHaveBeenCalled();
  });

  it('executor ausente → executor_not_bound honesto', async () => {
    const adapter = createSttVoiceCommandAdapter({ executors: {} });

    const result = await adapter.handleTranscript({
      stt: 'criar lead chamado Maria',
      session: sessionAgent,
    });

    expect(result.status).toBe('executor_not_bound');
  });

  it('confirmação com TTL: expiração bloqueia execução via adapter', async () => {
    let currentTime = 5_000_000;
    const confirmations = new VoiceCommandConfirmationManager({
      ttlMs: 1_000,
      now: () => currentTime,
    });
    const executors = allExecutors();
    const adapter = createSttVoiceCommandAdapter({ executors, confirmations });

    const pending = await adapter.handleTranscript({
      stt: 'agendar reunião amanhã',
      session: sessionAgent,
    });
    // 'amanhã' satisfaz dateTime → schedule_meeting é crítico → needs_confirmation
    expect(pending.status).toBe('needs_confirmation');

    currentTime += 5_000;

    const expired = await adapter.handleConfirmationDecision({
      confirmationId: pending.confirmationId!,
      decision: 'confirm',
      session: sessionAgent,
    });

    expect(expired.status).toBe('confirmation_expired');
    expect(executors.schedule_meeting!.mutate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Executores de domínio reais (createDomainVoiceCommandExecutors)
// ---------------------------------------------------------------------------

describe('createDomainVoiceCommandExecutors — binding honesto', () => {
  it('vincula SOMENTE create_lead — demais tipos ficam executor_not_bound', () => {
    const executors = createDomainVoiceCommandExecutors();

    expect(Object.keys(executors)).toEqual(['create_lead']);
    expect(executors.update_deal_stage).toBeUndefined();
    expect(executors.schedule_meeting).toBeUndefined();
    expect(executors.log_activity).toBeUndefined();
    expect(executors.generic_action).toBeUndefined();
  });

  it('mutate de create_lead falha honestamente quando LeadUseCases não está no container', async () => {
    const executors = createDomainVoiceCommandExecutors();
    const runner = executors.create_lead!;

    await expect(
      runner.mutate(ORG, {
        type: 'create_lead',
        organizationId: ORG,
        userId: 'u1',
        parameters: { leadName: 'Teste' },
      }),
    ).rejects.toThrow(/not found in container|LeadUseCases/);
  });

  it('mutate de create_lead rejeita leadName ausente antes de resolver o container', async () => {
    const executors = createDomainVoiceCommandExecutors();
    const runner = executors.create_lead!;

    await expect(
      runner.mutate(ORG, {
        type: 'create_lead',
        organizationId: ORG,
        userId: 'u1',
        parameters: {},
      }),
    ).rejects.toThrow(/leadName/);
  });

  it('pipeline STT→domínio: sem container → failed honesto, nunca confirmed', async () => {
    const adapter = createSttVoiceCommandAdapter({
      executors: createDomainVoiceCommandExecutors(),
    });

    const result = await adapter.handleTranscript({
      stt: 'criar lead chamado Maria Silva',
      session: sessionAgent,
    });

    // Passa por parse+autorização e falha no commit — resposta honesta.
    expect(result.status).toBe('failed');
    expect(result.execution?.confirmed).toBe(false);
    expect(result.execution?.success).toBe(false);
  });
});

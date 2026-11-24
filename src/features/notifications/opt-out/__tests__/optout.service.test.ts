import { describe, expect, it, vi } from 'vitest';
import type { OptOutRepository } from '../../../../shared/domain/optOut.js';
import { cancelPendingJobsForOptOut, recordOptOutAndPurgePendingJobs } from '../optout.service.js';

/**
 * Regressão Onda4-69: a purga de opt-out precisa cobrir TODOS os estados BullMQ v6 em que um
 * job ainda não foi executado ('waiting', 'delayed', 'prioritized', 'waiting-children') e não
 * pode abortar o restante da varredura quando UM job falha no remove() (ex.: job que transitou
 * para 'active' entre o getJobs e o remove — race condition real de revogação).
 */

function createMockJob(id: string, data: any, overrides: { removeError?: Error } = {}) {
  return {
    id,
    data,
    remove: overrides.removeError
      ? vi.fn().mockRejectedValue(overrides.removeError)
      : vi.fn().mockResolvedValue(undefined),
  };
}

function createMockQueue(initialJobs: any[]) {
  return {
    name: 'mock-whatsapp-queue',
    getJobs: vi.fn().mockResolvedValue(initialJobs),
  } as any;
}

describe('cancelPendingJobsForOptOut — cobertura de estados e resiliência (Agente 69)', () => {
  it('consulta todos os estados pendentes do BullMQ v6 (waiting, delayed, prioritized, waiting-children)', async () => {
    const queue = createMockQueue([]);

    await cancelPendingJobsForOptOut({ organizationId: 'org-1', leadId: 'lead-1' }, queue);

    expect(queue.getJobs).toHaveBeenCalledWith([
      'waiting',
      'delayed',
      'prioritized',
      'waiting-children',
    ]);
  });

  it('remove jobs prioritizados/filhos pendentes que casam com o opt-out', async () => {
    const prioritized = createMockJob('job-prio', {
      organizationId: 'org-1',
      context: { leadId: 'lead-target' },
    });
    const waitingChildren = createMockJob('job-wc', {
      organizationId: 'org-1',
      number: '+5511987654321',
    });
    const queue = createMockQueue([prioritized, waitingChildren]);

    const result = await cancelPendingJobsForOptOut(
      { organizationId: 'org-1', leadId: 'lead-target', phoneE164: '+5511987654321' },
      queue,
    );

    expect(result.cancelledJobsCount).toBe(2);
    expect(prioritized.remove).toHaveBeenCalledOnce();
    expect(waitingChildren.remove).toHaveBeenCalledOnce();
  });

  it('continua purgando os demais jobs quando o remove() de um job falha (job já ativo)', async () => {
    // Race: o job saiu de 'waiting' para 'active' entre getJobs() e remove() — BullMQ rejeita
    // o remove. Os jobs seguintes que também casam com o opt-out NÃO podem ficar para trás.
    const failing = createMockJob(
      'job-raced',
      { organizationId: 'org-1', context: { leadId: 'lead-target' } },
      { removeError: new Error('Job is locked / already active') },
    );
    const surviving = createMockJob('job-survivor', {
      organizationId: 'org-1',
      context: { leadId: 'lead-target' },
    });
    const otherTenant = createMockJob('job-other-org', {
      organizationId: 'org-2',
      context: { leadId: 'lead-target' },
    });
    const queue = createMockQueue([failing, surviving, otherTenant]);

    const result = await cancelPendingJobsForOptOut(
      { organizationId: 'org-1', leadId: 'lead-target' },
      queue,
    );

    expect(surviving.remove).toHaveBeenCalledOnce();
    expect(otherTenant.remove).not.toHaveBeenCalled();
    // O job que falhou não é contado como cancelado; o que sobreviveu é.
    expect(result.cancelledJobsCount).toBe(1);
    expect(result.jobIds).toEqual(['job-survivor']);
  });

  it('não aborta a varredura quando um job tem payload malformado (email/number não-string)', async () => {
    const malformed = createMockJob('job-bad', {
      organizationId: 'org-1',
      email: 12345, // tipo inesperado — não pode derrubar o loop
      number: { unexpected: true },
    });
    const valid = createMockJob('job-valid', {
      organizationId: 'org-1',
      context: { leadId: 'lead-target' },
    });
    const queue = createMockQueue([malformed, valid]);

    const result = await cancelPendingJobsForOptOut(
      { organizationId: 'org-1', leadId: 'lead-target', email: 'titular@example.com' },
      queue,
    );

    expect(valid.remove).toHaveBeenCalledOnce();
    expect(malformed.remove).not.toHaveBeenCalled();
    expect(result.cancelledJobsCount).toBe(1);
  });

  it('sem nenhum identificador aproveitável, não varre a fila (early return antes do getJobs)', async () => {
    const queue = createMockQueue([createMockJob('j1', { organizationId: 'org-1' })]);

    const result = await cancelPendingJobsForOptOut(
      { organizationId: 'org-1', leadId: '   ', phoneE164: null, email: null },
      queue,
    );

    expect(queue.getJobs).not.toHaveBeenCalled();
    expect(result).toEqual({ cancelledJobsCount: 0, jobIds: [] });
  });

  it('retorna resultado vazio sem lançar quando a fila está indisponível (queues desabilitadas)', async () => {
    const result = await cancelPendingJobsForOptOut(
      { organizationId: 'org-1', leadId: 'lead-target' },
      null as any,
    );

    expect(result.cancelledJobsCount).toBe(0);
    expect(result.jobIds).toEqual([]);
  });

  it('opt-out por sujeito identificável SEM lead: persiste por telefone e purga jobs do mesmo número', async () => {
    // Cenário POS4-69-OPTOUT2: contato sem Lead aberto diz STOP — o serviço precisa
    // registrar o opt-out por phoneE164 (leadId null) e purgar os jobs pendentes dele.
    const mockRepo: OptOutRepository = {
      create: vi.fn().mockImplementation((record) =>
        Promise.resolve({
          id: 'optout-rec-phone',
          createdAt: new Date(),
          ...record,
        }),
      ),
      findMatches: vi.fn().mockResolvedValue([]),
      list: vi.fn().mockResolvedValue([]),
    };

    const matchingJob = createMockJob('job-send-pending', {
      type: 'send',
      organizationId: 'org-1',
      number: '+55 11 98765-4321',
      context: { email: null, leadId: null },
    });
    const otherPhoneJob = createMockJob('job-other-phone', {
      type: 'send',
      organizationId: 'org-1',
      number: '+5511911111111',
    });
    const otherTenantJob = createMockJob('job-other-tenant', {
      type: 'send',
      organizationId: 'org-2',
      number: '+5511987654321',
    });
    const queue = createMockQueue([matchingJob, otherPhoneJob, otherTenantJob]);

    const outcome = await recordOptOutAndPurgePendingJobs(
      mockRepo,
      {
        organizationId: 'org-1',
        scope: 'global',
        originChannel: 'whatsapp',
        // Sem leadId — só o telefone identifica o titular.
        subject: { phoneE164: '5511987654321' },
      },
      queue,
    );

    // 1. Persistência: registro criado com leadId null e telefone normalizado E.164.
    expect(mockRepo.create).toHaveBeenCalledOnce();
    const persisted = (mockRepo.create as any).mock.calls[0][0];
    expect(persisted.leadId).toBeNull();
    expect(persisted.phoneE164).toBe('+5511987654321');
    expect(persisted.organizationId).toBe('org-1');
    expect(outcome.record?.id).toBe('optout-rec-phone');

    // 2. Purga: só o job do mesmo número no mesmo tenant foi removido.
    expect(matchingJob.remove).toHaveBeenCalledOnce();
    expect(otherPhoneJob.remove).not.toHaveBeenCalled();
    expect(otherTenantJob.remove).not.toHaveBeenCalled();
    expect(outcome.purgeResult).toEqual({
      cancelledJobsCount: 1,
      jobIds: ['job-send-pending'],
    });
  });

  it('opt-out por e-mail sem lead: purga job que carrega o e-mail no payload/context', async () => {
    const mockRepo: OptOutRepository = {
      create: vi
        .fn()
        .mockImplementation((record) =>
          Promise.resolve({ id: 'optout-rec-email', createdAt: new Date(), ...record }),
        ),
      findMatches: vi.fn().mockResolvedValue([]),
      list: vi.fn().mockResolvedValue([]),
    };

    const jobByEmail = createMockJob('job-email', {
      organizationId: 'org-1',
      number: '+5511000000000',
      context: { email: 'Titular@Example.com ' },
    });
    const queue = createMockQueue([jobByEmail]);

    const outcome = await recordOptOutAndPurgePendingJobs(
      mockRepo,
      {
        organizationId: 'org-1',
        scope: 'email',
        originChannel: 'email',
        subject: { email: '  titular@example.com' },
      },
      queue,
    );

    expect(jobByEmail.remove).toHaveBeenCalledOnce();
    expect(outcome.purgeResult.cancelledJobsCount).toBe(1);
    // O registro persistido carrega o e-mail já normalizado (minúsculo/trim).
    const persisted = (mockRepo.create as any).mock.calls[0][0];
    expect(persisted.email).toBe('titular@example.com');
    expect(persisted.leadId).toBeNull();
  });

  it('sujeito sem nenhum identificador: não varre a fila e retorna purga vazia', async () => {
    const mockRepo: OptOutRepository = {
      create: vi.fn(),
      findMatches: vi.fn().mockResolvedValue([]),
      list: vi.fn().mockResolvedValue([]),
    };
    const queue = createMockQueue([createMockJob('j1', { organizationId: 'org-1' })]);

    const outcome = await recordOptOutAndPurgePendingJobs(
      mockRepo,
      {
        organizationId: 'org-1',
        scope: 'global',
        originChannel: 'manual',
        subject: { leadId: '  ', email: null, phoneE164: null },
      },
      queue,
    );

    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(outcome.record).toBeNull();
    expect(queue.getJobs).not.toHaveBeenCalled();
    expect(outcome.purgeResult).toEqual({ cancelledJobsCount: 0, jobIds: [] });
  });

  it('aceita array de filas e agrega a purga de todas', async () => {
    const mockRepo: OptOutRepository = {
      create: vi
        .fn()
        .mockImplementation((record) =>
          Promise.resolve({ id: 'optout-rec-multi', createdAt: new Date(), ...record }),
        ),
      findMatches: vi.fn().mockResolvedValue([]),
      list: vi.fn().mockResolvedValue([]),
    };

    const jobA = createMockJob('job-q1', {
      organizationId: 'org-1',
      context: { leadId: 'lead-x' },
    });
    const jobB = createMockJob('job-q2', {
      organizationId: 'org-1',
      context: { leadId: 'lead-x' },
    });
    const queueA = createMockQueue([jobA]);
    const queueB = createMockQueue([jobB]);

    const outcome = await recordOptOutAndPurgePendingJobs(
      mockRepo,
      {
        organizationId: 'org-1',
        scope: 'global',
        originChannel: 'manual',
        subject: { leadId: 'lead-x' },
      },
      [queueA, queueB],
    );

    expect(jobA.remove).toHaveBeenCalledOnce();
    expect(jobB.remove).toHaveBeenCalledOnce();
    expect(outcome.purgeResult.cancelledJobsCount).toBe(2);
    expect(outcome.purgeResult.jobIds).toEqual(['job-q1', 'job-q2']);
  });

  it('recordOptOutAndPurgePendingJobs registra o opt-out mesmo se a fila estiver nula', async () => {
    const mockRepo: OptOutRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'optout-rec-1',
        organizationId: 'org-test',
        scope: 'global',
        leadId: 'lead-1',
        email: null,
        phoneE164: null,
        originChannel: 'manual',
        reason: null,
        evidence: null,
        requestedBy: null,
        createdAt: new Date(),
      }),
      findMatches: vi.fn().mockResolvedValue([]),
      list: vi.fn().mockResolvedValue([]),
    };

    const outcome = await recordOptOutAndPurgePendingJobs(
      mockRepo,
      {
        organizationId: 'org-test',
        scope: 'global',
        originChannel: 'manual',
        subject: { leadId: 'lead-1' },
      },
      null as any,
    );

    expect(outcome.record?.id).toBe('optout-rec-1');
    expect(outcome.purgeResult.cancelledJobsCount).toBe(0);
  });
});

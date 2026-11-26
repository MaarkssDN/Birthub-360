import { describe, expect, it, vi } from 'vitest';
import { cancelPendingJobsForOptOut, recordOptOutAndPurgePendingJobs } from '../optout.service.js';
import type { OptOutRepository } from '../../../../shared/domain/optOut.js';

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

  it('retorna resultado vazio sem lançar quando a fila está indisponível (queues desabilitadas)', async () => {
    const result = await cancelPendingJobsForOptOut(
      { organizationId: 'org-1', leadId: 'lead-target' },
      null as any,
    );

    expect(result.cancelledJobsCount).toBe(0);
    expect(result.jobIds).toEqual([]);
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

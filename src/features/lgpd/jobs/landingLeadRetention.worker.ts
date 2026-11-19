import type { LeadStatus } from '@prisma/client';
import { type ConnectionOptions, Queue, Worker } from 'bullmq';
import { requestContext } from '../../../lib/async-context.js';
import { logger } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';
import { isFinalAttempt, recordDeadLetter } from '../../../lib/queue/deadLetter.js';
import { registerQueueForMetrics } from '../../../lib/queue/metrics.js';
import { connection } from '../../../lib/queue/redis.js';
import { LANDING_LEAD_SOURCE } from '../../../shared/contracts/publicLead.constants.js';
import {
  ANONYMIZED_CONTACT_NAME,
  eraseDataSubject,
} from '../../../shared/services/dataSubjectErasure.service.js';

export const LANDING_LEAD_RETENTION_QUEUE_NAME = 'landing-lead-retention-queue';

/**
 * Sweep de retenção dos leads da landing (handoff
 * `.agents/handoffs/21-para-01-retencao-leads-landing-lgpd.md`, decisão do Marcelo em
 * 2026-11-11 registrada em `docs/lgpd/consentimento-lead.md` §3.4): leads
 * `source='landing_360'` retidos por **90 dias sem avanço**, com destino
 * anonimização/exclusão via `eraseDataSubject` (que já grava `OptOutRecord` de
 * supressão antes de destruir os identificadores — B-13).
 *
 * Critério conservador adotado (documentado no handoff): o prazo alternativo
 * "duração da demonstração + 30 dias" NÃO se aplica porque não existe campo de
 * "demo agendada em" no model `Lead` (verificado em prisma/schema.prisma —
 * `customFields` da landing só carrega equipe/origem/finalidade). "Sem avanço"
 * é implementado como `status = 'Lead_Recebido'` (status inicial do funil —
 * qualquer progressão muda o status) + `updatedAt <= 90d`, o mesmo relógio do
 * worker `autoAnonymizeDisqualified`: qualquer toque no registro adia a
 * anonimização, nunca a antecipa.
 *
 * Guarda adicional de segurança: `eraseDataSubject` anonimiza o CONTATO
 * inteiro (todos os leads/touchpoints do titular), não só o lead da landing.
 * Por isso o sweep pula o titular quando ele tem OUTRO lead em andamento
 * (status não-terminal atualizado dentro dos 90 dias) — a regra de retenção
 * mira o lead de demonstração abandonado, não uma relação comercial ativa.
 */
const RETENTION_DAYS = 90;
const BATCH_SIZE = 100;

// Status terminais/não-comerciais: um lead neles não conta como "em andamento"
// para a guarda de contato ativo (espelha o conjunto usado em relatórios de
// funil — mantido local de propósito, este worker não deve importar do CRM).
const NON_ACTIVE_STATUSES: LeadStatus[] = [
  'Lead_Desqualificado',
  'Negocios_Perdidos',
  'Negocios_Ganhos',
];

export async function runLandingLeadRetentionSweep(): Promise<{ anonymizedCount: number }> {
  logger.info('Iniciando sweep de retenção de leads da landing (> 90 dias sem avanço)');

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    // Descoberta cross-tenant SOMENTE sobre `Lead` (mesmo padrão do
    // autoAnonymizeDisqualified.worker.ts): bypass de RLS aqui, e cada
    // anonimização roda escopada ao tenant dentro de `eraseDataSubject`.
    // O `await` precisa estar DENTRO do callback — PrismaPromise é lazy e só
    // enxerga o AsyncLocalStorage corrente quando awaited ali.
    const eligibleLeads = await requestContext.run({ bypassRls: true }, () =>
      prisma.lead.findMany({
        where: {
          source: LANDING_LEAD_SOURCE,
          status: 'Lead_Recebido',
          updatedAt: { lte: cutoff },
        },
        select: {
          id: true,
          organizationId: true,
          contactId: true,
        },
        take: BATCH_SIZE,
      }),
    );

    let anonymizedCount = 0;
    for (const lead of eligibleLeads) {
      if (!lead.contactId || !lead.organizationId) continue;
      const { contactId, organizationId } = lead;

      const outcome = await requestContext.run({ tenantId: organizationId }, async () => {
        const contact = await prisma.contact.findFirst({
          where: { id: contactId, deletedAt: null },
          select: { id: true, name: true },
        });
        if (!contact) return 'skip' as const;

        // Já anonimizado por uma rodada anterior (deste ou do sweep de
        // desqualificados) — `eraseDataSubject` também é idempotente, mas
        // evitar a chamada economiza a transação inteira.
        if (contact.name === ANONYMIZED_CONTACT_NAME) return 'skip' as const;

        // Guarda de relacionamento ativo: se o titular tem outro lead em
        // andamento (não-terminal, tocado dentro da janela de retenção), a
        // anonimização do contato inteiro seria destrutiva demais — pular.
        const activeOtherLead = await prisma.lead.findFirst({
          where: {
            contactId,
            id: { not: lead.id },
            status: { notIn: NON_ACTIVE_STATUSES },
            updatedAt: { gt: cutoff },
          },
          select: { id: true },
        });
        if (activeOtherLead) return 'skip' as const;

        await eraseDataSubject({ organizationId, contactId });
        return 'anonymized' as const;
      });

      if (outcome === 'anonymized') anonymizedCount++;
    }

    logger.info({ anonymizedCount }, 'Sweep de retenção de leads da landing concluído');
    return { anonymizedCount };
  } catch (err: any) {
    logger.error({ err }, 'Erro ao executar sweep de retenção de leads da landing');
    throw err;
  }
}

export function createLandingLeadRetentionWorker() {
  const worker = new Worker(
    LANDING_LEAD_RETENTION_QUEUE_NAME,
    async (_job) => runLandingLeadRetentionSweep(),
    {
      connection: connection as ConnectionOptions,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Landing lead retention worker job falhou');
    if (!job || !isFinalAttempt(job.attemptsMade, job.opts.attempts)) return;
    void recordDeadLetter({
      queue: LANDING_LEAD_RETENTION_QUEUE_NAME,
      jobId: job.id,
      jobName: job.name,
      attemptsMade: job.attemptsMade,
      error: err,
    });
  });

  worker.on('error', (err) => {
    logger.warn(
      { message: err.message },
      'LandingLeadRetention worker error suppressed (Redis offline)',
    );
  });

  return worker;
}

export async function scheduleLandingLeadRetentionJob() {
  if (!connection) return;
  const queue = new Queue(LANDING_LEAD_RETENTION_QUEUE_NAME, {
    connection: connection as ConnectionOptions,
  });
  registerQueueForMetrics(LANDING_LEAD_RETENTION_QUEUE_NAME, queue);
  // BullMQ v6: agendamento recorrente exige `upsertJobScheduler` (idempotente pelo id).
  // 04:15 — depois do auto-anonymize das 03:00, janela distinta para não
  // disputar o mesmo batch de anonimizações no mesmo minuto.
  await queue.upsertJobScheduler(
    'landing-lead-retention-daily',
    { pattern: '15 4 * * *' },
    { name: 'landing-lead-retention-sweep', data: {} },
  );
}

/**
 * Opt-Out Real: Cancelamento e expurgo imediato de mensagens pendentes em filas BullMQ
 * Requisito Eli (Squad 60 - Agente 69)
 *
 * Ao receber um pedido de opt-out (STOP/SAIR), remove imediatamente jobs agendados/em espera
 * para o titular nas filas de mensageria (WhatsApp, Cadência, Notificações), prevenindo disparos indevidos.
 */

import type { Queue, JobType } from 'bullmq';
import { logger } from '../../../lib/logger.js';
import {
  whatsappCommandQueue,
  type WhatsAppCommand,
} from '../../../lib/queue/whatsappCommand.queue.js';
import {
  recordOptOut,
  type RecordOptOutInput,
  type OptOutRecord,
  type OptOutRepository,
} from '../../../shared/services/optOutService.js';

export interface CancelPendingJobsParams {
  organizationId: string;
  leadId?: string | null;
  phoneE164?: string | null;
  email?: string | null;
}

export interface CancelJobsResult {
  cancelledJobsCount: number;
  jobIds: string[];
}

/**
 * Normaliza número para dígitos significativos (últimos 8 ou 9 dígitos) para correspondência flexível.
 */
function extractSignificantDigits(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(-8) : null;
}

/**
 * Cancela jobs pendentes/agendados em uma fila BullMQ que casem com o sujeito que solicitou opt-out.
 */
/**
 * Estados BullMQ em que um job ainda NÃO foi executado e pode ser suprimido. Cobre todos os
 * estados pendentes do BullMQ v6: 'waiting', 'delayed' (backoff/retry agendado), 'prioritized'
 * (jobs com priority) e 'waiting-children' (jobs bloqueados por filho). Omitir 'prioritized' ou
 * 'waiting-children' deixaria escapar exatamente os envios comerciais mais "quentes" do opt-out —
 * a revogação precisa ser a trava mais forte (LGPD).
 */
const PENDING_JOB_STATES: JobType[] = [
  'waiting',
  'delayed',
  'prioritized',
  'waiting-children',
];

/** Extrai string de forma defensiva — payloads de fila não são contratualmente confiáveis. */
function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function cancelPendingJobsForOptOut(
  params: CancelPendingJobsParams,
  queueInstance: Queue<any> = whatsappCommandQueue as Queue<any>,
): Promise<CancelJobsResult> {
  const { organizationId, leadId, phoneE164, email } = params;
  const targetPhoneSuffix = extractSignificantDigits(phoneE164);
  const targetEmail = email ? email.trim().toLowerCase() : null;

  const cancelledJobIds: string[] = [];

  // A fila pode estar nula quando queues estão desabilitadas (ENABLE_QUEUES=false) ou em
  // contextos de teste — nesse caso não há nada a purgar, mas o registro do opt-out (feito por
  // recordOptOutAndPurgePendingJobs) continua válido e os gates de envio por canal seguem
  // bloqueando. Retornar vazio aqui é correto; logar como erro seria falso alarme.
  if (!queueInstance || typeof queueInstance.getJobs !== 'function') {
    logger.warn(
      { organizationId, queueName: queueInstance?.name ?? null },
      'Opt-Out Real: fila BullMQ indisponível/nula — purga de jobs pendentes ignorada (opt-out permanece registrado).',
    );
    return { cancelledJobsCount: 0, jobIds: [] };
  }

  try {
    // Buscar jobs em TODOS os estados ainda não executados (ver PENDING_JOB_STATES).
    const pendingJobs = await queueInstance.getJobs(PENDING_JOB_STATES);

    for (const job of pendingJobs) {
      // Isolamento por job: um remove() que falha (ex.: job transitou para 'active' entre o
      // getJobs e o remove — race real de revogação) ou um payload malformado NÃO pode abortar
      // a purga dos jobs restantes que também casam com o opt-out.
      try {
        const data = job.data as Partial<WhatsAppCommand> & {
          organizationId?: string;
          leadId?: string;
          email?: string;
          number?: string;
          context?: { leadId?: string | null; email?: string | null };
        };

        if (data.organizationId !== organizationId) {
          continue;
        }

        let matches = false;

        // 1. Casamento por Lead ID
        const jobLeadId = asNonEmptyString(data.leadId) ?? asNonEmptyString(data.context?.leadId);
        if (leadId && jobLeadId && jobLeadId === leadId) {
          matches = true;
        }

        // 2. Casamento por Telefone
        if (!matches) {
          const jobNumber = asNonEmptyString(data.number);
          if (targetPhoneSuffix && jobNumber) {
            const jobPhoneSuffix = extractSignificantDigits(jobNumber);
            if (jobPhoneSuffix && jobPhoneSuffix === targetPhoneSuffix) {
              matches = true;
            }
          }
        }

        // 3. Casamento por E-mail
        if (!matches && targetEmail) {
          const rawJobEmail = asNonEmptyString(data.email) ?? asNonEmptyString(data.context?.email);
          const jobEmail = rawJobEmail ? rawJobEmail.toLowerCase() : null;
          if (jobEmail && jobEmail === targetEmail) {
            matches = true;
          }
        }

        if (matches) {
          await job.remove();
          cancelledJobIds.push(job.id ?? 'unknown');
          logger.info(
            {
              organizationId,
              jobId: job.id,
              queueName: queueInstance.name,
              matchedBy: leadId ? 'leadId' : targetPhoneSuffix ? 'phone' : 'email',
            },
            'Opt-Out Real: job agendado/pendente cancelado e removido imediatamente da fila BullMQ.',
          );
        }
      } catch (jobErr) {
        // Job que falhou no remove (provavelmente já ativo) ou payload ilegível: registra e
        // segue para o próximo — a supressão residual fica a cargo do gate de envio por canal
        // (isOptedOut/checkOptOutStatus), que consulta o registro de opt-out no momento do envio.
        logger.error(
          { err: jobErr, organizationId, jobId: job.id, queueName: queueInstance.name },
          'Opt-Out Real: falha ao remover um job pendente — continuando varredura dos demais.',
        );
      }
    }
  } catch (err) {
    logger.error(
      { err, organizationId, queueName: queueInstance?.name },
      'Opt-Out Real: erro ao cancelar jobs pendentes na fila BullMQ.',
    );
  }

  return {
    cancelledJobsCount: cancelledJobIds.length,
    jobIds: cancelledJobIds,
  };
}

/**
 * Ponto de entrada unificado: registra o opt-out e purga mensagens agendadas simultaneamente.
 */
export async function recordOptOutAndPurgePendingJobs(
  repo: OptOutRepository,
  input: RecordOptOutInput,
  queueInstance?: Queue<any>,
): Promise<{ record: OptOutRecord | null; purgeResult: CancelJobsResult }> {
  const record = await recordOptOut(repo, input);

  const purgeResult = await cancelPendingJobsForOptOut(
    {
      organizationId: input.organizationId,
      leadId: input.subject.leadId,
      phoneE164: input.subject.phoneE164,
      email: input.subject.email,
    },
    queueInstance,
  );

  return {
    record,
    purgeResult,
  };
}

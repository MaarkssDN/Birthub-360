/**
 * Opt-Out Real: Cancelamento e expurgo imediato de mensagens pendentes em filas BullMQ
 * Requisito Eli (Squad 60 - Agente 69)
 *
 * Ao receber um pedido de opt-out (STOP/SAIR), remove imediatamente jobs agendados/em espera
 * para o titular nas filas de mensageria (WhatsApp, Cadência, Notificações), prevenindo disparos indevidos.
 */

import type { Queue, Job } from 'bullmq';
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
export async function cancelPendingJobsForOptOut(
  params: CancelPendingJobsParams,
  queueInstance: Queue<any> = whatsappCommandQueue as Queue<any>,
): Promise<CancelJobsResult> {
  const { organizationId, leadId, phoneE164, email } = params;
  const targetPhoneSuffix = extractSignificantDigits(phoneE164);
  const targetEmail = email ? email.trim().toLowerCase() : null;

  const cancelledJobIds: string[] = [];

  try {
    // Buscar jobs nos estados que ainda não foram executados: 'waiting', 'delayed'
    const pendingJobs = await queueInstance.getJobs(['waiting', 'delayed']);

    for (const job of pendingJobs) {
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
      const jobLeadId = data.leadId ?? data.context?.leadId;
      if (leadId && jobLeadId && jobLeadId === leadId) {
        matches = true;
      }

      // 2. Casamento por Telefone
      if (!matches && targetPhoneSuffix && data.number) {
        const jobPhoneSuffix = extractSignificantDigits(data.number);
        if (jobPhoneSuffix && jobPhoneSuffix === targetPhoneSuffix) {
          matches = true;
        }
      }

      // 3. Casamento por E-mail
      if (!matches && targetEmail) {
        const jobEmail = (data.email ?? data.context?.email ?? '').trim().toLowerCase();
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

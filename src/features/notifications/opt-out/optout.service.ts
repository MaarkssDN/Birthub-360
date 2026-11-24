/**
 * Opt-Out Real: Cancelamento e expurgo imediato de mensagens pendentes em filas BullMQ
 * Requisito Eli (Squad 60 - Agente 69)
 *
 * Ao receber um pedido de opt-out (STOP/SAIR), remove imediatamente jobs agendados/em espera
 * para o titular nas filas de mensageria (WhatsApp, Cadência, Notificações), prevenindo disparos indevidos.
 */

import type { JobType, Queue } from 'bullmq';
import { logger } from '../../../lib/logger.js';
import {
  type WhatsAppCommand,
  whatsappCommandQueue,
} from '../../../lib/queue/whatsappCommand.queue.js';
import { hasAnyIdentifier, normalizeOptOutSubject } from '../../../shared/domain/optOut.js';
import {
  type OptOutRecord,
  type OptOutRepository,
  type RecordOptOutInput,
  recordOptOut,
} from '../../../shared/services/optOutService.js';

export interface CancelPendingJobsParams {
  organizationId: string;
  /**
   * Sujeito identificável — NENHUM campo é obrigatório isoladamente, mas pelo menos um
   * identificador aproveitável (leadId, telefone ou e-mail) precisa existir para a purga
   * ter o que casar. Um opt-out por contato SEM lead aberto (ex.: STOP de número que só
   * existe como Contact, ou telefone ainda não sincronizado) é válido: `leadId` fica
   * `null` e o casamento acontece por `phoneE164`/`email` — mesma regra de
   * `normalizeOptOutSubject`/`hasAnyIdentifier` usada na persistência do `OptOutRecord`.
   */
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
const PENDING_JOB_STATES: JobType[] = ['waiting', 'delayed', 'prioritized', 'waiting-children'];

/** Extrai string de forma defensiva — payloads de fila não são contratualmente confiáveis. */
function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function cancelPendingJobsForOptOut(
  params: CancelPendingJobsParams,
  // `null` explícito é aceito (e tratado com WARN + purga vazia abaixo): callers como
  // `recordOptOutAndPurgePendingJobs` repassam filas que podem estar desabilitadas
  // (`whatsappCommandQueue` é `null` quando ENABLE_QUEUES=false).
  queueInstance: Queue<any> | null = whatsappCommandQueue as Queue<any>,
): Promise<CancelJobsResult> {
  const { organizationId, leadId, phoneE164, email } = params;
  const targetPhoneSuffix = extractSignificantDigits(phoneE164);
  const targetEmail = email ? email.trim().toLowerCase() : null;

  // Sem NENHUM identificador aproveitável não há o que casar — evita varrer a fila inteira
  // à toa (e mantém simetria com `recordOptOut`, que também não grava registro inerte).
  // `hasAnyIdentifier` espera a forma normalizada; aqui os alvos já são derivadas
  // (sufixo de telefone/e-mail normalizado), então a checagem equivalente é direta.
  const hasMatchableIdentifier =
    (leadId?.trim().length ?? 0) > 0 || targetPhoneSuffix !== null || targetEmail !== null;
  if (!hasMatchableIdentifier) {
    logger.warn(
      { organizationId },
      'Opt-Out Real: purga de jobs ignorada — sujeito sem identificador aproveitável (leadId, telefone ou e-mail).',
    );
    return { cancelledJobsCount: 0, jobIds: [] };
  }

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
 *
 * Sujeito identificável SEM lead: `input.subject` aceita `phoneE164`/`email` sem `leadId`
 * (ex.: STOP inbound de um número que só existe como Contact, ou ainda não sincronizado).
 * O registro é persistido por esses identificadores (`OptOutRecord.leadId` fica `null`) e a
 * purga casa os jobs pendentes pelos mesmos identificadores normalizados — a normalização
 * (`normalizeOptOutSubject`: E.164 via `toE164BR`, e-mail minúsculo/trim) é a MESMA aplicada
 * por `recordOptOut` na gravação, garantindo que o que foi persistido é o que a purga persegue.
 *
 * `queueInstance` aceita uma fila única, um array de filas (ex.: whatsapp-command + futuras
 * filas de envio comercial) ou `null`/`undefined` (queues desabilitadas — purga vazia, WARN).
 */
export async function recordOptOutAndPurgePendingJobs(
  repo: OptOutRepository,
  input: RecordOptOutInput,
  queueInstance?: Queue<any> | Queue<any>[] | null,
): Promise<{ record: OptOutRecord | null; purgeResult: CancelJobsResult }> {
  const record = await recordOptOut(repo, input);

  const normalized = normalizeOptOutSubject(input.subject);

  // Sem identificador aproveitável não há registro nem o que purgar — `recordOptOut` já
  // devolveu `null` com WARN; pular a varredura da fila é só higiene (mesmo resultado).
  if (!hasAnyIdentifier(normalized)) {
    return {
      record,
      purgeResult: { cancelledJobsCount: 0, jobIds: [] },
    };
  }

  // Retrocompatível: argumento omitido (`undefined`) mantém o default histórico —
  // `whatsappCommandQueue` (que pode ser `null` com queues desabilitadas; a função de
  // purga trata isso com WARN + resultado vazio). `null` explícito = "não purgar fila".
  const queues =
    queueInstance === undefined
      ? [whatsappCommandQueue as Queue<any>]
      : Array.isArray(queueInstance)
        ? queueInstance
        : [queueInstance];

  const jobIds: string[] = [];
  for (const queue of queues) {
    const result = await cancelPendingJobsForOptOut(
      {
        organizationId: input.organizationId,
        leadId: normalized.leadId,
        phoneE164: normalized.phoneE164,
        email: normalized.email,
      },
      queue,
    );
    jobIds.push(...result.jobIds);
  }

  return {
    record,
    purgeResult: {
      cancelledJobsCount: jobIds.length,
      jobIds,
    },
  };
}

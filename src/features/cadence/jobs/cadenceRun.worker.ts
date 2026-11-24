import { type ConnectionOptions, type Job, Queue, Worker } from 'bullmq';
import { requestContext } from '../../../lib/async-context.js';
import { logger } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';
import { isFinalAttempt, recordDeadLetter } from '../../../lib/queue/deadLetter.js';
import { registerQueueForMetrics } from '../../../lib/queue/metrics.js';
import { connection } from '../../../lib/queue/redis.js';
import { SCHEDULER_SCAN_DEFAULTS } from '../../../lib/queue/queueDefaults.js';
import { container } from '../../../shared/di/container.js';
import { isWithinCadenceBusinessWindow } from '../domain/businessWindow.js';
import { type AdvanceCadenceRunDeps, advanceCadenceRun } from '../application/cadenceService.js';
import { loadCadenceRateLimitPolicy } from '../application/rateLimitConfig.js';
import {
  applyPolicyGuardrailFailure,
  type CadenceChannel,
  type CadenceSequenceDefinition,
  type CadenceSequenceLookup,
  type CadenceTouch,
  sequenceDefinitionForRun,
  validateSequence,
} from '../domain/cadence.js';
import {
  buildProductionCadenceDispatcher,
  type VoiceCallPort,
} from '../infra/dispatchers/CadenceDispatchers.js';
import { hasLeadReplied } from '../infra/hasLeadReplied.js';
import { prismaCadenceRateLimitPort } from '../infra/PrismaCadenceRateLimitPort.js';
import { prismaCadenceRunRepository } from '../infra/PrismaCadenceRunRepository.js';
import { prismaLeadSubjectResolver } from '../infra/PrismaLeadSubjectResolver.js';
import { prismaOptOutRepository } from '../infra/PrismaOptOutRepository.js';
import { redisCadenceRunLock } from '../infra/RedisCadenceRunLock.js';

// VoiceCallPort resolvido via container DI (no-cross-feature-imports): evita importar internals
// de src/features/integrations/birth-voice/** diretamente. Registrado em src/shared/di/setup.ts.
function getVoicePort(): VoiceCallPort | undefined {
  try {
    return container.resolve<VoiceCallPort>('VoiceCallPort');
  } catch {
    return undefined;
  }
}

/**
 * Runtime real da cadência multicanal (CYC-008, onda-19) — até aqui `advanceCadenceRun` (domínio
 * puro, Onda 10) só era chamado por teste; nenhum worker/scheduler existia. Este arquivo é o que
 * falta para uma `CadenceRun` ativa de fato avançar sozinha.
 *
 * Mesmo padrão de `followUp.worker.ts`/`bitrixSync.worker.ts`: varredura cross-tenant sem
 * `requestContext.run` (segue o precedente já em produção — RLS sem tenant setado é o modo usado
 * hoje por todo job em lote que precisa enxergar mais de uma organização por tick), BullMQ
 * `Worker` + `Queue.upsertJobScheduler` para o agendamento recorrente (BullMQ v6 não tem mais
 * `repeat` em `Queue.add`).
 *
 * CYC-002 (onda 22): quando a sequência de um run ativo não pode ser resolvida (dados
 * malformados ou linha ausente — `parseCadenceSequenceDefinition` devolve `null`), o run agora é
 * encerrado com `status: 'failed'`/`stopReason: 'policy-guardrail'` em vez de ficar pulado
 * silenciosamente para sempre a cada tick — antes desta correção, um run nessa condição nunca
 * saía de `Active`, sendo re-tentado (e re-pulado) a cada 5 minutos indefinidamente, invisível
 * para o vendedor.
 */

export const CADENCE_RUN_QUEUE_NAME = 'cadence-run-scanner';
const SCAN_INTERVAL_MS = 5 * 60 * 1000;
const MAX_RUNS_PER_TICK = 500;

const VALID_CHANNELS: CadenceChannel[] = ['email', 'whatsapp', 'voice'];

function isCadenceTouch(value: unknown): value is CadenceTouch {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.order === 'number' &&
    typeof v.channel === 'string' &&
    VALID_CHANNELS.includes(v.channel as CadenceChannel) &&
    typeof v.delayHoursFromPrevious === 'number' &&
    (v.maxAttempts === undefined || typeof v.maxAttempts === 'number') &&
    (v.templateRef === undefined || v.templateRef === null || typeof v.templateRef === 'string')
  );
}

/** `CadenceSequence.touches` é `Json` no schema — sem validação em runtime, um registro malformado quebraria o scan inteiro. Nunca lança: registro inválido é pulado e logado. */
export function parseCadenceSequenceDefinition(row: {
  id: string;
  name: string;
  touches: unknown;
}): CadenceSequenceDefinition | null {
  if (!Array.isArray(row.touches) || !row.touches.every(isCadenceTouch)) {
    logger.error(
      { sequenceId: row.id },
      'CadenceSequence.touches malformado — sequência ignorada nesta varredura.',
    );
    return null;
  }
  const sequence: CadenceSequenceDefinition = { id: row.id, name: row.name, touches: row.touches };
  const errors = validateSequence(sequence);
  if (errors.length > 0) {
    logger.error(
      { sequenceId: row.id, errors },
      'CadenceSequence inválida — sequência ignorada nesta varredura.',
    );
    return null;
  }
  return sequence;
}

export function buildDeps(): AdvanceCadenceRunDeps {
  return {
    runRepo: prismaCadenceRunRepository,
    optOutRepo: prismaOptOutRepository,
    subjectResolver: prismaLeadSubjectResolver,
    dispatcher: buildProductionCadenceDispatcher(getVoicePort()),
    lock: redisCadenceRunLock,
    // POS4-17-CADENCE-TZ: a janela comercial agora é avaliada no fuso do DESTINATÁRIO (lead),
    // resolvido por `prismaLeadSubjectResolver` — não mais fixa em America/Sao_Paulo para todos.
    // Lead sem sinal de localização cai no fallback SP documentado em `domain/businessWindow.ts`.
    isWithinBusinessWindow: (now, leadTimeZone) =>
      isWithinCadenceBusinessWindow(now, leadTimeZone),
    hasLeadReplied,
    // Rate limit por contato/domínio (auditoria transversal, Agente 17) — ver
    // `application/rateLimitService.ts`/`rateLimitConfig.ts`. Política lida do ambiente a cada
    // tick (custo irrelevante) para que uma mudança de env var em produção valha a partir do
    // próximo scan, sem exigir redeploy do worker.
    rateLimit: prismaCadenceRateLimitPort,
    rateLimitPolicy: loadCadenceRateLimitPolicy(),
  };
}

/**
 * Varre os `CadenceRun` ativos e chama `advanceCadenceRun` para cada um. Exportado à parte do
 * worker BullMQ (mesmo padrão de `runColdLeadsScan`) para permitir teste de integração direto,
 * sem esperar o tick da fila. Uma falha em UM run é isolada e logada — nunca aborta o restante da
 * varredura.
 */
export async function scanAndAdvanceCadenceRuns(
  now: Date = new Date(),
): Promise<{ processed: number; errors: number; failedInvalidSequence: number }> {
  // Descoberta cross-tenant: nenhum organizationId conhecido ainda, então precisa do bypass de RLS
  // (só liberado para os models CadenceRun/CadenceSequence — ver comentário em src/lib/prisma.ts).
  // A partir daqui, cada run é processado com o tenant real escopado — nunca com bypass.
  const { activeRuns, sequences } = await requestContext.run({ bypassRls: true }, async () => {
    const runs = await prisma.cadenceRun.findMany({
      where: { status: 'Active' },
      select: { id: true, organizationId: true, sequenceId: true },
      // orderBy torna a varredura justa/determinística com >500 runs ativos (achado 3 do handoff
      // 44→17): sem ordenação o Postgres poderia devolver sempre o mesmo subconjunto e runs no fim
      // da fila nunca seriam processados. `startedAt` asc = quem espera há mais tempo vai primeiro.
      orderBy: { startedAt: 'asc' },
      take: MAX_RUNS_PER_TICK,
    });

    if (runs.length === 0)
      return { activeRuns: runs, sequences: new Map<string, CadenceSequenceLookup>() };

    const sequenceIds = [...new Set(runs.map((r) => r.sequenceId))];
    const runOrgIds = [...new Set(runs.map((r) => r.organizationId))];
    // Defesa em profundidade (achado da auditoria ONDA3-44): a FK CadenceRun.sequenceId →
    // CadenceSequence.id NÃO é composta por tenant — se uma linha cross-tenant existir, o
    // worker despacharia o templateRef da sequência de OUTRA organização para o lead deste
    // run. O filtro por organizationId restringe a carga às sequências dos tenants dos runs
    // encontrados, e o consumidor abaixo ainda confere par (run.organizationId, seq.org).
    const sequenceRows = await prisma.cadenceSequence.findMany({
      // `deletedAt: null`: sequência soft-deletada não pode continuar despachando toques
      // (achado 2 do handoff 44→17). `active` NÃO é filtrado de propósito: o contrato documentado
      // em `application/sequenceService.ts`/`cadence.routes.ts` diz que desativar uma sequência
      // só impede NOVOS runs — runs já em andamento a partir dela continuam (decisão de produto,
      // não defeito). A validação de tenant (`organizationId` vs `run.organizationId`) acontece
      // no consumidor do mapa, porque a consulta em lote não conhece o par run↔sequência —
      // o filtro por `runOrgIds` acima segue como defesa em profundidade (achado ONDA3-44).
      where: {
        id: { in: sequenceIds },
        organizationId: { in: runOrgIds },
        deletedAt: null,
      },
      select: { id: true, organizationId: true, name: true, touches: true },
    });
    const seqMap = new Map<string, CadenceSequenceLookup>();
    for (const row of sequenceRows) {
      seqMap.set(row.id, {
        organizationId: row.organizationId,
        definition: parseCadenceSequenceDefinition(row),
      });
    }
    return { activeRuns: runs, sequences: seqMap };
  });

  if (activeRuns.length === 0) return { processed: 0, errors: 0, failedInvalidSequence: 0 };

  const deps = buildDeps();
  let processed = 0;
  let errors = 0;
  let failedInvalidSequence = 0;

  for (const run of activeRuns) {
    const lookup = sequences.get(run.sequenceId);
    // Sequência ausente (inclui soft-deletada, filtrada na query), de outro tenant, ou
    // malformada — nos três casos o run não pode avançar com segurança e é encerrado como
    // `failed`/`policy-guardrail` (mesmo tratamento de antes para "inválida/inacessível").
    // A checagem de tenant mora no domínio (`sequenceDefinitionForRun`) para ser testável sem banco.
    const sequence = sequenceDefinitionForRun(lookup, run.organizationId);
    if (!sequence) {
      // Sequência ausente/malformada — encerra o run como `failed` em vez de deixá-lo `Active`
      // para sempre (o próximo tick voltaria a pular exatamente do mesmo jeito). Roda com o
      // tenant real (nunca bypass) para respeitar RLS na escrita, mesmo padrão do ciclo normal.
      try {
        await requestContext.run({ tenantId: run.organizationId }, async () => {
          const full = await prismaCadenceRunRepository.findById(run.organizationId, run.id);
          if (!full) return;
          await prismaCadenceRunRepository.save(applyPolicyGuardrailFailure(full, now));
        });
        failedInvalidSequence++;
        logger.error(
          {
            organizationId: run.organizationId,
            runId: run.id,
            sequenceId: run.sequenceId,
            sequenceOrganizationId: lookup?.organizationId ?? null,
          },
          'CadenceRun encerrado como failed: sequência associada inválida/inacessível/de outro tenant.',
        );
      } catch (err: any) {
        errors++;
        logger.error(
          { err, organizationId: run.organizationId, runId: run.id },
          'Falha ao encerrar CadenceRun com sequência inválida.',
        );
      }
      continue;
    }
    try {
      await requestContext.run({ tenantId: run.organizationId }, () =>
        advanceCadenceRun(deps, run.organizationId, run.id, sequence, now),
      );
      processed++;
    } catch (err: any) {
      errors++;
      logger.error(
        { err, organizationId: run.organizationId, runId: run.id },
        'Falha ao avançar CadenceRun nesta varredura.',
      );
    }
  }

  logger.info(
    { activeRuns: activeRuns.length, processed, errors, failedInvalidSequence },
    'Varredura de cadência concluída.',
  );
  return { processed, errors, failedInvalidSequence };
}

export function createCadenceRunWorker(): Worker {
  const worker = new Worker(
    CADENCE_RUN_QUEUE_NAME,
    async (_job: Job) => {
      await scanAndAdvanceCadenceRuns();
    },
    { connection: connection as ConnectionOptions, concurrency: 1 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Cadence run worker job falhou');
    if (!job || !isFinalAttempt(job.attemptsMade, job.opts.attempts)) return;
    void recordDeadLetter({
      queue: CADENCE_RUN_QUEUE_NAME,
      jobId: job.id,
      jobName: job.name,
      attemptsMade: job.attemptsMade,
      error: err,
    });
  });

  worker.on('error', (err) => {
    logger.warn({ err }, 'Cadence run worker error suppressed (Redis offline)');
  });

  return worker;
}

export async function scheduleCadenceRunJob(): Promise<void> {
  const queue = new Queue(CADENCE_RUN_QUEUE_NAME, {
    connection: connection as ConnectionOptions,
    defaultJobOptions: SCHEDULER_SCAN_DEFAULTS,
  });
  registerQueueForMetrics(CADENCE_RUN_QUEUE_NAME, queue);
  await queue.upsertJobScheduler(
    'cadence-run-tick',
    { every: SCAN_INTERVAL_MS },
    { name: 'scan-cadence-runs', data: {} },
  );
  logger.info({ everyMs: SCAN_INTERVAL_MS }, 'Cadence run scan job scheduled');
}

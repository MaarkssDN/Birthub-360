import type { JobsOptions } from 'bullmq';

/**
 * Política padrão de governança BullMQ (MEL-48, Onda 6 — Agente 16).
 *
 * Por que existe: várias filas de domínio (`src/features/**/jobs/**`) são criadas com
 * `new Queue(name, { connection })` sem `defaultJobOptions`. Sem isso o BullMQ assume
 * `attempts: 1` (nenhum retry — uma falha transitória vira perda) e `removeOnFail`
 * indefinido (falhas acumulam no Redis para sempre). Este objeto é o ponto único de adoção:
 * filas de domínio devem passar `defaultJobOptions: GOVERNED_QUEUE_JOB_OPTIONS` (ou
 * `...GOVERNED_QUEUE_JOB_OPTIONS` mesclado com overrides específicos do domínio).
 *
 * Filas de `src/lib/queue/**` já declaram opções equivalentes inline (QUEUE-001) — a
 * migração delas para esta constante é cosmética e fica para uma onda futura; filas novas
 * devem usar daqui.
 *
 * Limites deliberados:
 * - `attempts: 3` com backoff exponencial: cobre falha transitória (timeout de provedor,
 *   banco reiniciando) sem retry infinito (AGENTS.md de src/lib/queue proíbe).
 * - `removeOnComplete`/`removeOnFail` com idade+contagem: retenção limitada evita crescer
 *   o Redis sem bound — a janela de dedup por `jobId` é a idade de `removeOnComplete`.
 * - Filas cujo job é auto-recorrente (scheduler re-enfileira sozinho) ou cujo reprocesso
 *   causaria efeito colateral duplicado (ex.: campanha de ligações) devem manter
 *   `attempts: 1` explícito e documentar o motivo — ver coldCall/bitrixSync/checkpointerPrune.
 */
export const GOVERNED_QUEUE_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
};

/**
 * Dedup de enqueue por chave de negócio estável (MEL-41/MEL-48).
 *
 * Retorna o `jobId` determinístico para uma operação enfileirada. Regra: a chave deve
 * conter TODOS os identificadores que tornam a operação única (organizationId sempre —
 * leadId não é único entre tenants) e NENHUM componente volátil (timestamp, uuid por
 * chamada). Se o payload pode mudar legitimamente (ex.: valor/estágio do lead), inclua
 * um hash estável do payload — ver `externalCrmOutbound.queue.ts`.
 *
 * Limitação conhecida e documentada: o BullMQ deduplica por `jobId` apenas enquanto o job
 * existir; `removeOnComplete`/`removeOnFail` da fila definem a janela real de dedup.
 * Para dedup de NEGÓCIO além dessa janela (ex.: "esta fatura já foi paga?"), a chave
 * precisa viver no banco (constraint unique / tabela de idempotency) — ver
 * `Transaction.idempotencyKey` (voice-hub billing) e `webhookReplayGuard` como padrões.
 */
export function buildDedupJobId(queuePrefix: string, ...parts: Array<string | number>): string {
  return `${queuePrefix}:${parts.map((part) => String(part)).join(':')}`;
}

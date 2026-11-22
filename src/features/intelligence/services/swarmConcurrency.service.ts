/**
 * Gate de concorrência e idempotência para missões do enxame (`/api/agent/swarm/*`).
 *
 * - Concorrência configurável por organização: `SWARM_MAX_CONCURRENT_MISSIONS`
 *   (default 4, clamp 1–8 — nunca assume que 8 são sempre possíveis).
 * - Fila FIFO por organização com timeout (`SWARM_MISSION_QUEUE_TIMEOUT_MS`,
 *   default 60s) — excedeu, a missão é recusada com 429 antes do SSE abrir.
 * - Idempotência: o mesmo `sessionId` (executionId) não pode ter duas missões
 *   ativas na mesma organização — reenvio/refresh/reconexão recebe 409 em vez
 *   de executar a missão duplicada.
 *
 * Estado em memória do processo (single-instance). Em deploy multi-réplica,
 * trocar por store compartilhado é trabalho futuro documentado — nunca fingir
 * garantia distribuída com mapa local.
 */

export type AcquireResult = 'acquired' | 'queued' | 'duplicate' | 'timeout';

interface Waiter {
  sessionId: string;
  resolve: (result: AcquireResult) => void;
  timer: NodeJS.Timeout;
}

const DEFAULT_MAX = 4;
const MAX_LIMIT = 8;
const DEFAULT_QUEUE_TIMEOUT_MS = 60_000;

function maxConcurrent(): number {
  const raw = Number(process.env.SWARM_MAX_CONCURRENT_MISSIONS ?? DEFAULT_MAX);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_MAX;
  return Math.min(Math.floor(raw), MAX_LIMIT);
}

function queueTimeoutMs(): number {
  const raw = Number(process.env.SWARM_MISSION_QUEUE_TIMEOUT_MS ?? DEFAULT_QUEUE_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_QUEUE_TIMEOUT_MS;
}

/** orgId -> sessionIds com missão em voo (ativa ou aguardando na fila). */
const inFlight = new Map<string, Map<string, 'active' | 'waiting'>>();
/** orgId -> fila FIFO de waiters. */
const queues = new Map<string, Waiter[]>();

function orgSessions(orgId: string): Map<string, 'active' | 'waiting'> {
  let m = inFlight.get(orgId);
  if (!m) {
    m = new Map();
    inFlight.set(orgId, m);
  }
  return m;
}

function activeCount(orgId: string): number {
  const m = inFlight.get(orgId);
  if (!m) return 0;
  let n = 0;
  for (const v of m.values()) if (v === 'active') n++;
  return n;
}

function orgQueue(orgId: string): Waiter[] {
  let q = queues.get(orgId);
  if (!q) {
    q = [];
    queues.set(orgId, q);
  }
  return q;
}

/** Remove waiter da fila (timeout ou cancelamento) — resolve 'timeout' para não vazar promise. */
function dequeue(orgId: string, sessionId: string): Waiter | undefined {
  const q = orgQueue(orgId);
  const idx = q.findIndex((w) => w.sessionId === sessionId);
  if (idx === -1) return undefined;
  const [w] = q.splice(idx, 1);
  clearTimeout(w.timer);
  w.resolve('timeout');
  orgSessions(orgId).delete(sessionId);
  if (q.length === 0) queues.delete(orgId);
  return w;
}

/**
 * Tenta reservar um slot de execução para a missão.
 * Resolve 'acquired' quando o slot é concedido (imediato ou após fila).
 * 'duplicate' = mesmo sessionId já em voo na org (idempotência).
 * 'timeout'  = fila cheia/tempo esgotado — o chamador deve recusar com 429.
 */
export function acquireMissionSlot(
  organizationId: string,
  sessionId: string,
  onQueued?: (position: number) => void,
): Promise<AcquireResult> {
  const sessions = orgSessions(organizationId);
  const existing = sessions.get(sessionId);
  if (existing) return Promise.resolve('duplicate');

  if (activeCount(organizationId) < maxConcurrent()) {
    sessions.set(sessionId, 'active');
    return Promise.resolve('acquired');
  }

  return new Promise<AcquireResult>((resolve) => {
    const q = orgQueue(organizationId);
    const position = q.length + 1;
    sessions.set(sessionId, 'waiting');
    const waiter: Waiter = {
      sessionId,
      resolve,
      timer: setTimeout(() => {
        dequeue(organizationId, sessionId);
      }, queueTimeoutMs()),
    };
    q.push(waiter);
    onQueued?.(position);
  });
}

/** Libera o slot e promove o próximo da fila, se houver capacidade. */
export function releaseMissionSlot(organizationId: string, sessionId: string): void {
  const sessions = inFlight.get(organizationId);
  if (!sessions) return;
  sessions.delete(sessionId);

  const q = queues.get(organizationId);
  if (q && q.length > 0) {
    while (q.length > 0 && activeCount(organizationId) < maxConcurrent()) {
      const next = q.shift();
      if (!next) break;
      clearTimeout(next.timer);
      orgSessions(organizationId).set(next.sessionId, 'active');
      next.resolve('acquired');
    }
    if (q.length === 0) queues.delete(organizationId);
  }
  if (orgSessions(organizationId).size === 0) inFlight.delete(organizationId);
}

/** Cancela uma espera na fila (ex.: cliente desconectou antes do slot). */
export function cancelMissionWait(organizationId: string, sessionId: string): void {
  dequeue(organizationId, sessionId);
}

/** Estado atual para observabilidade/testes. */
export function getSwarmConcurrencyState(organizationId?: string) {
  if (organizationId) {
    return {
      maxConcurrent: maxConcurrent(),
      active: activeCount(organizationId),
      waiting: orgQueue(organizationId).length,
    };
  }
  let active = 0;
  let waiting = 0;
  const orgs = new Set([...inFlight.keys(), ...queues.keys()]);
  for (const org of orgs) {
    active += activeCount(org);
    waiting += orgQueue(org).length;
  }
  return { maxConcurrent: maxConcurrent(), active, waiting, organizations: orgs.size };
}

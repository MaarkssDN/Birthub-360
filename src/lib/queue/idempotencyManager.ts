/**
 * Barramento de Idempotência (Passo 23 / Agente 16; bounds adicionados na Onda 6 — MEL-48).
 * Previne consumo duplicado de DomainEventConsumption.
 *
 * ATENÇÃO — escopo real deste componente:
 * - É um cache EM MEMÓRIA do processo: morre no restart e NÃO é compartilhado entre
 *   réplicas. Serve para dedup dentro de um único worker de vida curta; para dedup
 *   durável/distribuído use `jobId` determinístico do BullMQ (dedup de enqueue) ou uma
 *   constraint/tabela no Postgres (dedup de negócio — ver `jobPolicy.ts`).
 * - O `Set` anterior crescia sem limite: cada chave processada ficava retida para sempre,
 *   um memory leak em processo longevo. Agora as chaves expiram por TTL e o mapa tem
 *   teto de tamanho com despejo das entradas mais antigas (ordem de inserção do Map).
 */

export interface IdempotencyManagerOptions {
  /** Tempo de vida de uma chave já processada, em ms. Default: 24h. */
  ttlMs?: number;
  /** Teto de chaves retidas; ao exceder, as mais antigas são removidas. Default: 50_000. */
  maxKeys?: number;
  /** Intervalo de varredura de expirados, em ms. Default: 5min. `0` desativa o timer. */
  sweepIntervalMs?: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_KEYS = 50_000;
const DEFAULT_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

export class IdempotencyManager {
  /** chave -> timestamp de inserção/expiração lógica (usado para TTL e despejo por idade). */
  private processedKeys = new Map<string, number>();
  private readonly ttlMs: number;
  private readonly maxKeys: number;
  private readonly sweepTimer: ReturnType<typeof setInterval> | null;

  constructor(options: IdempotencyManagerOptions = {}) {
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.maxKeys = Math.max(1, options.maxKeys ?? DEFAULT_MAX_KEYS);
    const sweepMs = options.sweepIntervalMs ?? DEFAULT_SWEEP_INTERVAL_MS;
    if (sweepMs <= 0) {
      this.sweepTimer = null;
    } else {
      const timer = setInterval(() => this.sweep(), sweepMs);
      // Não segura o event loop em shutdown (Node); no-op em ambientes sem `unref`.
      (timer as { unref?: () => void }).unref?.();
      this.sweepTimer = timer;
    }
  }

  /** Despeja as entradas mais antigas (Map preserva ordem de inserção) até caber no teto. */
  private evictOverflow(): void {
    while (this.processedKeys.size > this.maxKeys) {
      const oldest = this.processedKeys.keys().next();
      if (oldest.done) break;
      this.processedKeys.delete(oldest.value);
    }
  }

  /** Remove chaves expiradas; chamado pelo timer e defensivamente em cada acquire. */
  private sweep(now = Date.now()): void {
    for (const [key, expiresAt] of this.processedKeys) {
      if (expiresAt <= now) this.processedKeys.delete(key);
    }
    this.evictOverflow();
  }

  public async acquireLock(idempotencyKey: string): Promise<boolean> {
    const now = Date.now();
    // Varredura preguiçosa amortizada: só roda quando o mapa está grande, para não pagar
    // O(n) a cada acquire em mapas pequenos.
    if (this.processedKeys.size >= this.maxKeys) this.sweep(now);

    const expiresAt = this.processedKeys.get(idempotencyKey);
    if (expiresAt !== undefined && expiresAt > now) {
      return false; // Chave já processada e ainda válida
    }
    // Chave expirada: remove antes de reinserir para atualizar a posição no Map (despejo
    // por idade depende da ordem de inserção).
    this.processedKeys.delete(idempotencyKey);
    this.processedKeys.set(idempotencyKey, now + this.ttlMs);
    // O teto é aplicado DEPOIS do insert: evictar antes permitiria size = maxKeys + 1.
    this.evictOverflow();
    return true;
  }

  public async releaseLock(idempotencyKey: string): Promise<void> {
    this.processedKeys.delete(idempotencyKey);
  }

  public isProcessed(idempotencyKey: string): boolean {
    const expiresAt = this.processedKeys.get(idempotencyKey);
    if (expiresAt === undefined) return false;
    if (expiresAt <= Date.now()) {
      this.processedKeys.delete(idempotencyKey);
      return false;
    }
    return true;
  }

  /** Para testes/shutdown: para o timer de varredura. */
  public dispose(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    this.processedKeys.clear();
  }
}

export const idempotencyManager = new IdempotencyManager();

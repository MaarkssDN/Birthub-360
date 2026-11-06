export type DownstreamCircuitName =
  | 'redis'
  | 'database'
  | 'bitrix'
  | 'telephony'
  | 'ai'
  | (string & {});

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitConfig {
  failureThreshold: number;
  cooldownMs: number;
}

export interface CircuitStatusSnapshot {
  service: string;
  state: CircuitState;
  failures: number;
  failureThreshold: number;
  cooldownMs: number;
  openedAt: string | null;
  openUntil: string | null;
  lastError: string | null;
}

interface InternalCircuitEntry {
  config: CircuitConfig;
  failures: number;
  state: CircuitState;
  openedAtMs: number | null;
  openUntilMs: number | null;
  lastError: string | null;
}

const DEFAULT_CIRCUIT_CONFIG: CircuitConfig = {
  failureThreshold: 3,
  cooldownMs: 30_000,
};

const KNOWN_SERVICES: DownstreamCircuitName[] = ['redis', 'database', 'bitrix', 'telephony', 'ai'];

export class CircuitOpenError extends Error {
  public readonly service: string;
  public readonly openUntil: Date | null;

  constructor(service: string, openUntilMs: number | null) {
    super(
      `Circuit breaker OPEN for downstream dependency "${service}". Calls are temporarily blocked.`,
    );
    this.name = 'CircuitOpenError';
    this.service = service;
    this.openUntil = openUntilMs ? new Date(openUntilMs) : null;
  }
}

export class CircuitGuardRegistry {
  private readonly circuits = new Map<string, InternalCircuitEntry>();

  constructor(initialServices: string[] = KNOWN_SERVICES) {
    for (const service of initialServices) {
      this.ensureEntry(service);
    }
  }

  private ensureEntry(
    service: string,
    customConfig?: Partial<CircuitConfig>,
  ): InternalCircuitEntry {
    let entry = this.circuits.get(service);
    if (!entry) {
      entry = {
        config: {
          failureThreshold:
            customConfig?.failureThreshold ?? DEFAULT_CIRCUIT_CONFIG.failureThreshold,
          cooldownMs: customConfig?.cooldownMs ?? DEFAULT_CIRCUIT_CONFIG.cooldownMs,
        },
        failures: 0,
        state: 'CLOSED',
        openedAtMs: null,
        openUntilMs: null,
        lastError: null,
      };
      this.circuits.set(service, entry);
    } else if (customConfig) {
      entry.config = {
        failureThreshold: customConfig.failureThreshold ?? entry.config.failureThreshold,
        cooldownMs: customConfig.cooldownMs ?? entry.config.cooldownMs,
      };
    }
    return entry;
  }

  private refreshState(entry: InternalCircuitEntry, nowMs = Date.now()): CircuitState {
    if (entry.state === 'OPEN' && entry.openUntilMs !== null && nowMs >= entry.openUntilMs) {
      entry.state = 'HALF_OPEN';
    }
    return entry.state;
  }

  public isOpen(service: DownstreamCircuitName, nowMs = Date.now()): boolean {
    const entry = this.ensureEntry(service);
    return this.refreshState(entry, nowMs) === 'OPEN';
  }

  public getState(service: DownstreamCircuitName, nowMs = Date.now()): CircuitState {
    const entry = this.ensureEntry(service);
    return this.refreshState(entry, nowMs);
  }

  public recordSuccess(service: DownstreamCircuitName): void {
    const entry = this.ensureEntry(service);
    entry.failures = 0;
    entry.state = 'CLOSED';
    entry.openedAtMs = null;
    entry.openUntilMs = null;
    entry.lastError = null;
  }

  public recordFailure(
    service: DownstreamCircuitName,
    err?: unknown,
    nowMs = Date.now(),
  ): CircuitState {
    const entry = this.ensureEntry(service);
    this.refreshState(entry, nowMs);

    entry.failures += 1;
    entry.lastError = err instanceof Error ? err.message : err ? String(err) : 'Unknown failure';

    if (entry.state === 'HALF_OPEN' || entry.failures >= entry.config.failureThreshold) {
      entry.state = 'OPEN';
      entry.openedAtMs = nowMs;
      entry.openUntilMs = nowMs + entry.config.cooldownMs;
    }

    return entry.state;
  }

  public async execute<T>(
    service: DownstreamCircuitName,
    operation: () => Promise<T>,
    options?: Partial<CircuitConfig> & { nowMs?: number },
  ): Promise<T> {
    const entry = this.ensureEntry(service, options);
    const nowMs = options?.nowMs ?? Date.now();
    const currentState = this.refreshState(entry, nowMs);

    if (currentState === 'OPEN') {
      throw new CircuitOpenError(service, entry.openUntilMs);
    }

    try {
      const result = await operation();
      this.recordSuccess(service);
      return result;
    } catch (err) {
      this.recordFailure(service, err, Date.now());
      throw err;
    }
  }

  public getSnapshot(nowMs = Date.now()): Record<string, CircuitStatusSnapshot> {
    const snapshot: Record<string, CircuitStatusSnapshot> = {};
    for (const [service, entry] of this.circuits.entries()) {
      const state = this.refreshState(entry, nowMs);
      snapshot[service] = {
        service,
        state,
        failures: entry.failures,
        failureThreshold: entry.config.failureThreshold,
        cooldownMs: entry.config.cooldownMs,
        openedAt: entry.openedAtMs ? new Date(entry.openedAtMs).toISOString() : null,
        openUntil: entry.openUntilMs ? new Date(entry.openUntilMs).toISOString() : null,
        lastError: entry.lastError,
      };
    }
    return snapshot;
  }

  public reset(service?: DownstreamCircuitName): void {
    if (service) {
      this.circuits.delete(service);
      this.ensureEntry(service);
      return;
    }
    this.circuits.clear();
    for (const known of KNOWN_SERVICES) {
      this.ensureEntry(known);
    }
  }
}

export const circuitGuard = new CircuitGuardRegistry();

export function getCircuitHealthSnapshot(
  nowMs = Date.now(),
): Record<string, CircuitStatusSnapshot> {
  return circuitGuard.getSnapshot(nowMs);
}

export interface HeartbeatClientSocket {
  id: string;
  isAlive: boolean;
  ping(payload?: string): void;
  terminate(): void;
}

export const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

export class RealtimeWebSocketHeartbeatManager {
  private readonly clients = new Map<string, HeartbeatClientSocket>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;

  constructor(options?: { intervalMs?: number }) {
    this.intervalMs = options?.intervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
  }

  registerClient(client: HeartbeatClientSocket): void {
    client.isAlive = true;
    this.clients.set(client.id, client);
  }

  recordPong(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.isAlive = true;
    }
  }

  unregisterClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  /**
   * Executa um ciclo de verificação de heartbeat:
   * - Clientes marcados com `isAlive === false` (não responderam ao ping anterior) são encerrados
   *   via `terminate()` e removidos da lista ativa;
   * - Clientes vivos têm `isAlive` marcado como `false` e recebem um novo `ping()`.
   */
  runHeartbeatSweep(): { pingedCount: number; terminatedClientIds: string[] } {
    const terminatedClientIds: string[] = [];
    let pingedCount = 0;

    for (const [id, client] of this.clients.entries()) {
      if (!client.isAlive) {
        client.terminate();
        this.clients.delete(id);
        terminatedClientIds.push(id);
        continue;
      }
      client.isAlive = false;
      client.ping('hb');
      pingedCount += 1;
    }

    return { pingedCount, terminatedClientIds };
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.runHeartbeatSweep();
    }, this.intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getActiveClientCount(): number {
    return this.clients.size;
  }
}

export interface EphemeralDbCleanupPort {
  terminateIdleBackends(databaseName: string, idleTimeoutMs: number): Promise<number>;
  closePool(): Promise<void>;
}

export async function destroyZombieDatabaseConnections(params: {
  databaseName: string;
  idleTimeoutMs?: number;
  port: EphemeralDbCleanupPort;
}): Promise<{ terminatedBackends: number; poolClosed: boolean }> {
  if (!params.databaseName?.trim()) {
    throw new Error('databaseName é obrigatório para limpeza de conexões efêmeras.');
  }
  const idleTimeoutMs = Math.max(100, params.idleTimeoutMs ?? 5_000);
  const terminatedBackends = await params.port.terminateIdleBackends(
    params.databaseName.trim(),
    idleTimeoutMs,
  );
  await params.port.closePool();
  return {
    terminatedBackends,
    poolClosed: true,
  };
}

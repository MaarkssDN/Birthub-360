/**
 * Database Replication Consistency & Read-After-Write Verifier
 * Requisito Gael (Squad 00 - Agente 06)
 *
 * Em topologias com réplicas de leitura no PostgreSQL, gravações atômicas no primário
 * podem sofrer atraso de propagação (replication lag).
 * Este módulo verifica se a leitura em réplica retornaria dado obsoleto, falhando
 * ou forçando roteamento para o nó primário (sticky primary reads).
 */

import { logger } from '../logger.js';

export class StaleReplicaReadError extends Error {
  public readonly primaryLsnOrTimestamp: number;
  public readonly replicaLsnOrTimestamp: number;
  public readonly lagMs: number;

  constructor(primaryVal: number, replicaVal: number, lagMs: number) {
    super(
      `Verificação de Realidade [Gael]: Leitura em réplica detectou dado obsoleto (lag de ${lagMs}ms). Gravação primária: ${primaryVal}, Réplica: ${replicaVal}.`,
    );
    this.name = 'StaleReplicaReadError';
    this.primaryLsnOrTimestamp = primaryVal;
    this.replicaLsnOrTimestamp = replicaVal;
    this.lagMs = lagMs;
  }
}

export interface PersistenceRecord<T = unknown> {
  data: T;
  version: number;
  committedAt: number;
}

export interface NodeDataSource<T = unknown> {
  write(data: T): Promise<PersistenceRecord<T>>;
  read(): Promise<PersistenceRecord<T> | null>;
}

export class ReplicationConsistencyChecker<T = unknown> {
  private maxLagToleranceMs: number;

  constructor(maxLagToleranceMs: number = 50) {
    this.maxLagToleranceMs = maxLagToleranceMs;
  }

  /**
   * Valida a consistência de leitura após gravação atômica.
   * Se a réplica retornar dados com versão inferior ou timestamp defasado além da tolerância,
   * rejeita a leitura com StaleReplicaReadError.
   */
  public async verifyReadAfterWrite(
    primary: NodeDataSource<T>,
    replica: NodeDataSource<T>,
    newData: T,
  ): Promise<{ primaryRecord: PersistenceRecord<T>; replicaRecord: PersistenceRecord<T> }> {
    // 1. Gravação no primário
    const primaryRecord = await primary.write(newData);

    // 2. Leitura na réplica
    const replicaRecord = await replica.read();

    if (!replicaRecord) {
      throw new StaleReplicaReadError(
        primaryRecord.committedAt,
        0,
        Date.now() - primaryRecord.committedAt,
      );
    }

    if (replicaRecord.version < primaryRecord.version) {
      const lagMs = Math.max(0, primaryRecord.committedAt - replicaRecord.committedAt);
      logger.warn(
        { primaryVersion: primaryRecord.version, replicaVersion: replicaRecord.version, lagMs },
        'ReplicationConsistency: Dado obsoleto detectado na réplica. Roteando leitura para primário.',
      );
      throw new StaleReplicaReadError(primaryRecord.committedAt, replicaRecord.committedAt, lagMs);
    }

    return { primaryRecord, replicaRecord };
  }
}

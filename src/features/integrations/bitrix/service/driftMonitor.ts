import { createHash } from 'node:crypto';
import client from 'prom-client';
import { logger } from '../../../../lib/logger.js';

/**
 * Série Prometheus de drift detectado entre registros do Bitrix24 e o banco local (Agente 59 — Ruy).
 */
export const bitrixSyncDriftDetectedTotal =
  (client.register.getSingleMetric('bitrix_sync_drift_detected_total') as
    | client.Counter<'tenant' | 'entity' | 'reason'>
    | undefined) ??
  new client.Counter({
    name: 'bitrix_sync_drift_detected_total',
    help: 'Total de divergências (drift) detectadas por checksum entre registros do Bitrix24 e o banco local.',
    labelNames: ['tenant', 'entity', 'reason'] as const,
  });

export interface CanonicalSyncRecord {
  /** ID do registro no Bitrix24 (`bitrixLeadId` ou `bitrixDealId`). */
  bitrixRecordId: string;
  /** ID local do Lead no banco (`Lead.id`), quando presente. */
  localId?: string | null;
  /** Etapa/status normalizado (`STATUS_ID` / `STAGE_ID` / `bitrixStageLabel`). */
  stage: string | null;
  /** Título ou nome principal do registro. */
  title?: string | null;
  /** Valor monetário normalizado (centavos ou número fixo). */
  value?: number | null;
  /** Campos de qualificação ou customFields relevantes para reconciliação. */
  fields?: Record<string, unknown> | null;
}

export type DriftReason = 'checksum-mismatch' | 'missing-local' | 'missing-remote';

export interface DriftItem {
  bitrixRecordId: string;
  localId: string | null;
  reason: DriftReason;
  remoteChecksum: string | null;
  localChecksum: string | null;
  diffFields: string[];
}

export interface DriftComparisonReport {
  organizationId: string;
  entityType: 'lead' | 'deal';
  checkedAt: string;
  totalRemote: number;
  totalLocal: number;
  inSyncCount: number;
  driftedCount: number;
  items: DriftItem[];
}

function stableNormalize(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
  if (Array.isArray(value)) return value.map(stableNormalize);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const out: Record<string, unknown> = {};
    for (const k of sortedKeys) {
      out[k] = stableNormalize(obj[k]);
    }
    return out;
  }
  return value;
}

/**
 * Calcula o checksum SHA-256 determinístico dos campos canônicos de um registro para comparar
 * estado do Bitrix24 vs banco local sem depender da ordem das chaves JSON.
 */
export function computeRecordChecksum(record: CanonicalSyncRecord): string {
  const payload = stableNormalize({
    bitrixRecordId: String(record.bitrixRecordId).trim(),
    stage: record.stage ?? null,
    title: record.title ?? null,
    value: record.value ?? null,
    fields: record.fields ?? {},
  });
  return createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');
}

function computeDiffFields(remote: CanonicalSyncRecord, local: CanonicalSyncRecord): string[] {
  const diffs: string[] = [];
  if (stableNormalize(remote.stage) !== stableNormalize(local.stage)) diffs.push('stage');
  if (stableNormalize(remote.title) !== stableNormalize(local.title)) diffs.push('title');
  if (stableNormalize(remote.value) !== stableNormalize(local.value)) diffs.push('value');
  if (
    JSON.stringify(stableNormalize(remote.fields ?? {})) !==
    JSON.stringify(stableNormalize(local.fields ?? {}))
  ) {
    diffs.push('fields');
  }
  return diffs;
}

/**
 * Compara um lote de registros do Bitrix24 contra os registros correspondentes no banco local
 * via checksum SHA-256 determinístico, registrando telemetria e log estruturado de reconciliação
 * (Agente 59 — Ruy).
 */
export function detectBitrixLocalDrift(params: {
  organizationId: string;
  entityType: 'lead' | 'deal';
  remoteRecords: CanonicalSyncRecord[];
  localRecords: CanonicalSyncRecord[];
}): DriftComparisonReport {
  const { organizationId, entityType, remoteRecords, localRecords } = params;
  const remoteById = new Map<string, CanonicalSyncRecord>();
  for (const r of remoteRecords) {
    remoteById.set(String(r.bitrixRecordId).trim(), r);
  }

  const localById = new Map<string, CanonicalSyncRecord>();
  for (const l of localRecords) {
    localById.set(String(l.bitrixRecordId).trim(), l);
  }

  const items: DriftItem[] = [];
  let inSyncCount = 0;

  for (const [bitrixRecordId, remote] of remoteById) {
    const remoteChecksum = computeRecordChecksum(remote);
    const local = localById.get(bitrixRecordId);
    if (!local) {
      items.push({
        bitrixRecordId,
        localId: null,
        reason: 'missing-local',
        remoteChecksum,
        localChecksum: null,
        diffFields: ['all'],
      });
      bitrixSyncDriftDetectedTotal.inc({
        tenant: organizationId,
        entity: entityType,
        reason: 'missing-local',
      });
      continue;
    }

    const localChecksum = computeRecordChecksum(local);
    if (remoteChecksum !== localChecksum) {
      items.push({
        bitrixRecordId,
        localId: local.localId ?? null,
        reason: 'checksum-mismatch',
        remoteChecksum,
        localChecksum,
        diffFields: computeDiffFields(remote, local),
      });
      bitrixSyncDriftDetectedTotal.inc({
        tenant: organizationId,
        entity: entityType,
        reason: 'checksum-mismatch',
      });
    } else {
      inSyncCount++;
    }
  }

  for (const [bitrixRecordId, local] of localById) {
    if (!remoteById.has(bitrixRecordId)) {
      const localChecksum = computeRecordChecksum(local);
      items.push({
        bitrixRecordId,
        localId: local.localId ?? null,
        reason: 'missing-remote',
        remoteChecksum: null,
        localChecksum,
        diffFields: ['all'],
      });
      bitrixSyncDriftDetectedTotal.inc({
        tenant: organizationId,
        entity: entityType,
        reason: 'missing-remote',
      });
    }
  }

  if (items.length > 0) {
    logger.warn(
      {
        organizationId,
        entityType,
        driftedCount: items.length,
        inSyncCount,
      },
      '[bitrix] Drift detectado entre registros do Bitrix24 e banco local',
    );
  }

  return {
    organizationId,
    entityType,
    checkedAt: new Date().toISOString(),
    totalRemote: remoteRecords.length,
    totalLocal: localRecords.length,
    inSyncCount,
    driftedCount: items.length,
    items,
  };
}

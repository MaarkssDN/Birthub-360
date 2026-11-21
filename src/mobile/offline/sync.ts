export interface VersionedEntitySnapshot<T extends Record<string, unknown>> {
  id: string;
  tenantId: string;
  fields: T;
  /** Timestamp (epoch ms) da última alteração de cada campo */
  fieldTimestamps: Partial<Record<keyof T, number>>;
}

export interface FieldLevelMergeResult<T extends Record<string, unknown>> {
  mergedFields: T;
  mergedFieldTimestamps: Partial<Record<keyof T, number>>;
  resolvedFromLocal: (keyof T)[];
  resolvedFromRemote: (keyof T)[];
  conflictingFieldsResolvedByTimestamp: (keyof T)[];
}

/**
 * Reconcilia edições offline concorrentes em nível de campo (field-level 3-way merge):
 * - Se apenas o dispositivo local alterou o campo em relação à base → preserva o valor local;
 * - Se apenas o servidor remoto alterou o campo em relação à base → preserva o valor remoto;
 * - Se ambos alteraram o MESMO campo com valores diferentes → vence a alteração com maior
 *   timestamp de campo (`fieldTimestamps[field]`), sem sobrescrever os demais campos do registro!
 */
export function reconcileOfflineFieldLevelMerge<T extends Record<string, unknown>>(params: {
  base: VersionedEntitySnapshot<T>;
  local: VersionedEntitySnapshot<T>;
  remote: VersionedEntitySnapshot<T>;
}): FieldLevelMergeResult<T> {
  const { base, local, remote } = params;
  if (local.tenantId !== remote.tenantId || local.id !== remote.id) {
    throw new Error('Não é permitido mesclar registros offline de tenants ou IDs distintos.');
  }

  const allKeys = new Set<keyof T>([
    ...(Object.keys(base.fields) as (keyof T)[]),
    ...(Object.keys(local.fields) as (keyof T)[]),
    ...(Object.keys(remote.fields) as (keyof T)[]),
  ]);

  const mergedFields = { ...base.fields } as T;
  const mergedFieldTimestamps: Partial<Record<keyof T, number>> = { ...base.fieldTimestamps };
  const resolvedFromLocal: (keyof T)[] = [];
  const resolvedFromRemote: (keyof T)[] = [];
  const conflictingFieldsResolvedByTimestamp: (keyof T)[] = [];

  for (const key of allKeys) {
    const baseVal = base.fields[key];
    const localVal = local.fields[key];
    const remoteVal = remote.fields[key];

    const localChanged = !Object.is(localVal, baseVal);
    const remoteChanged = !Object.is(remoteVal, baseVal);

    const localTs = local.fieldTimestamps[key] ?? 0;
    const remoteTs = remote.fieldTimestamps[key] ?? 0;

    if (localChanged && !remoteChanged) {
      mergedFields[key] = localVal;
      mergedFieldTimestamps[key] = localTs;
      resolvedFromLocal.push(key);
    } else if (!localChanged && remoteChanged) {
      mergedFields[key] = remoteVal;
      mergedFieldTimestamps[key] = remoteTs;
      resolvedFromRemote.push(key);
    } else if (localChanged && remoteChanged) {
      if (Object.is(localVal, remoteVal)) {
        mergedFields[key] = localVal;
        mergedFieldTimestamps[key] = Math.max(localTs, remoteTs);
      } else {
        conflictingFieldsResolvedByTimestamp.push(key);
        if (localTs >= remoteTs) {
          mergedFields[key] = localVal;
          mergedFieldTimestamps[key] = localTs;
          resolvedFromLocal.push(key);
        } else {
          mergedFields[key] = remoteVal;
          mergedFieldTimestamps[key] = remoteTs;
          resolvedFromRemote.push(key);
        }
      }
    }
  }

  return {
    mergedFields,
    mergedFieldTimestamps,
    resolvedFromLocal,
    resolvedFromRemote,
    conflictingFieldsResolvedByTimestamp,
  };
}

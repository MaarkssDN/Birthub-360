import { describe, expect, it } from 'vitest';
import { reconcileOfflineFieldLevelMerge, type VersionedEntitySnapshot } from '../sync.js';

/**
 * Onda 4 — Agente 85 (Bóris): cobertura do resolvedor de conflitos offline-first
 * em nível de campo. Dados 100% sintéticos; nenhum PII real.
 */

function snapshot<T extends Record<string, unknown>>(
  fields: T,
  fieldTimestamps: Partial<Record<keyof T, number>>,
  overrides: Partial<VersionedEntitySnapshot<T>> = {},
): VersionedEntitySnapshot<T> {
  return {
    id: 'entity-1',
    tenantId: 'tenant-a',
    fields,
    fieldTimestamps,
    ...overrides,
  };
}

describe('[85 · Bóris] reconcileOfflineFieldLevelMerge — conflitos e isolamento', () => {
  it('mescla edições em campos distintos preservando ambas as versões', () => {
    type Fields = { stage: string; note: string; owner: string };
    const base = snapshot<Fields>(
      { stage: 'new', note: 'n0', owner: 'ana' },
      { stage: 100, note: 100, owner: 100 },
    );
    const local = snapshot<Fields>(
      { stage: 'new', note: 'nota offline do vendedor', owner: 'ana' },
      { stage: 100, note: 300, owner: 100 },
    );
    const remote = snapshot<Fields>(
      { stage: 'proposal', note: 'n0', owner: 'ana' },
      { stage: 400, note: 100, owner: 100 },
    );

    const merged = reconcileOfflineFieldLevelMerge({ base, local, remote });

    expect(merged.mergedFields).toEqual({
      stage: 'proposal',
      note: 'nota offline do vendedor',
      owner: 'ana',
    });
    expect(merged.resolvedFromLocal).toEqual(['note']);
    expect(merged.resolvedFromRemote).toEqual(['stage']);
    expect(merged.conflictingFieldsResolvedByTimestamp).toEqual([]);
  });

  it('conflito no MESMO campo resolve pelo maior fieldTimestamp e marca como conflito', () => {
    type Fields = { status: string; score: number };
    const base = snapshot<Fields>({ status: 'open', score: 1 }, { status: 100, score: 100 });
    const local = snapshot<Fields>({ status: 'won-local', score: 1 }, { status: 500, score: 100 });
    const remote = snapshot<Fields>(
      { status: 'lost-remote', score: 1 },
      { status: 200, score: 100 },
    );

    const merged = reconcileOfflineFieldLevelMerge({ base, local, remote });

    expect(merged.mergedFields.status).toBe('won-local');
    expect(merged.conflictingFieldsResolvedByTimestamp).toEqual(['status']);
    // Campo não conflitado permanece intacto
    expect(merged.mergedFields.score).toBe(1);
  });

  it('empate de timestamp com valores divergentes resolve deterministicamente para o local', () => {
    type Fields = { flag: string };
    const base = snapshot<Fields>({ flag: 'a' }, { flag: 100 });
    const local = snapshot<Fields>({ flag: 'b' }, { flag: 100 });
    const remote = snapshot<Fields>({ flag: 'c' }, { flag: 100 });

    const merged = reconcileOfflineFieldLevelMerge({ base, local, remote });

    expect(merged.mergedFields.flag).toBe('b');
    expect(merged.conflictingFieldsResolvedByTimestamp).toEqual(['flag']);
  });

  it('replay idempotente: reaplicar o merge com o resultado como nova base é estável', () => {
    type Fields = { a: string; b: string };
    const base = snapshot<Fields>({ a: '0', b: '0' }, { a: 100, b: 100 });
    const local = snapshot<Fields>({ a: 'L', b: '0' }, { a: 300, b: 100 });
    const remote = snapshot<Fields>({ a: '0', b: 'R' }, { a: 100, b: 400 });

    const first = reconcileOfflineFieldLevelMerge({ base, local, remote });
    expect(first.mergedFields).toEqual({ a: 'L', b: 'R' });

    // Replay: mesmo trio de entradas produz resultado idêntico (função pura)
    const replay = reconcileOfflineFieldLevelMerge({ base, local, remote });
    expect(replay).toEqual(first);

    // Entradas não são mutadas pela reconciliação
    expect(base.fields).toEqual({ a: '0', b: '0' });
    expect(local.fields).toEqual({ a: 'L', b: '0' });
    expect(remote.fields).toEqual({ a: '0', b: 'R' });
  });

  it('campo removido localmente (undefined) vence quando remoto não alterou', () => {
    type Fields = { keep: string; drop?: string };
    const base = snapshot<Fields>({ keep: 'k', drop: 'x' }, { keep: 100, drop: 100 });
    const local = snapshot<Fields>({ keep: 'k' }, { keep: 100, drop: 500 });
    const remote = snapshot<Fields>({ keep: 'k', drop: 'x' }, { keep: 100, drop: 100 });

    const merged = reconcileOfflineFieldLevelMerge({ base, local, remote });

    expect(merged.mergedFields).toEqual({ keep: 'k' });
    expect('drop' in merged.mergedFields).toBe(false);
    expect(merged.resolvedFromLocal).toEqual(['drop']);
  });

  it('campo criado apenas no remoto é incorporado ao merge', () => {
    type Fields = { a: string; extra?: string };
    const base = snapshot<Fields>({ a: '0' }, { a: 100 });
    const local = snapshot<Fields>({ a: '0' }, { a: 100 });
    const remote = snapshot<Fields>({ a: '0', extra: 'novo' }, { a: 100, extra: 200 });

    const merged = reconcileOfflineFieldLevelMerge({ base, local, remote });

    expect(merged.mergedFields.extra).toBe('novo');
    expect(merged.resolvedFromRemote).toEqual(['extra']);
  });

  it('rejeita base de entidade/tenant divergente dos snapshots local e remoto', () => {
    type Fields = { v: string };
    const local = snapshot<Fields>({ v: 'L' }, { v: 300 });
    const remote = snapshot<Fields>({ v: 'R' }, { v: 400 });

    // Base de OUTRA entidade — antes da correção passava despercebida
    const wrongBase = snapshot<Fields>({ v: 'X' }, { v: 100 }, { id: 'entity-OUTRA' });
    expect(() => reconcileOfflineFieldLevelMerge({ base: wrongBase, local, remote })).toThrow(
      /tenants ou IDs distintos/,
    );

    // Base de OUTRO tenant
    const wrongTenantBase = snapshot<Fields>({ v: 'X' }, { v: 100 }, { tenantId: 'tenant-b' });
    expect(() => reconcileOfflineFieldLevelMerge({ base: wrongTenantBase, local, remote })).toThrow(
      /tenants ou IDs distintos/,
    );
  });

  it('rejeita merge entre tenants ou IDs distintos (isolamento multi-conta)', () => {
    type Fields = { v: string };
    const base = snapshot<Fields>({ v: '0' }, { v: 100 });
    const local = snapshot<Fields>({ v: 'L' }, { v: 300 });
    const remoteOtherTenant = snapshot<Fields>({ v: 'R' }, { v: 400 }, { tenantId: 'tenant-b' });
    const remoteOtherId = snapshot<Fields>({ v: 'R' }, { v: 400 }, { id: 'entity-2' });

    expect(() =>
      reconcileOfflineFieldLevelMerge({ base, local, remote: remoteOtherTenant }),
    ).toThrow(/tenants ou IDs distintos/);
    expect(() => reconcileOfflineFieldLevelMerge({ base, local, remote: remoteOtherId })).toThrow(
      /tenants ou IDs distintos/,
    );
  });

  it('valores idênticos alterados nos dois lados convergem sem conflito', () => {
    type Fields = { v: string };
    const base = snapshot<Fields>({ v: '0' }, { v: 100 });
    const local = snapshot<Fields>({ v: 'same' }, { v: 300 });
    const remote = snapshot<Fields>({ v: 'same' }, { v: 400 });

    const merged = reconcileOfflineFieldLevelMerge({ base, local, remote });

    expect(merged.mergedFields.v).toBe('same');
    expect(merged.mergedFieldTimestamps.v).toBe(400);
    expect(merged.conflictingFieldsResolvedByTimestamp).toEqual([]);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bitrixSyncDriftDetectedTotal,
  computeRecordChecksum,
  detectBitrixLocalDrift,
} from '../driftMonitor.js';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('[59 · Ruy] Monitor de drift por checksum Bitrix vs banco local', () => {
  beforeEach(() => {
    bitrixSyncDriftDetectedTotal.reset();
  });

  it('gera o mesmo checksum SHA-256 independentemente da ordem das chaves em fields ou espaços laterais', () => {
    const a = computeRecordChecksum({
      bitrixRecordId: '100',
      stage: 'IN_PROCESS',
      title: ' Clínica Alfa ',
      value: 1500,
      fields: { ufCrmPhone: '11999990000', ufCrmCity: 'São Paulo' },
    });

    const b = computeRecordChecksum({
      bitrixRecordId: '100',
      stage: 'IN_PROCESS',
      title: 'Clínica Alfa',
      value: 1500.0,
      fields: { ufCrmCity: 'São Paulo', ufCrmPhone: '11999990000' },
    });

    expect(a).toBe(b);
  });

  it('detecta checksum-mismatch, missing-local e missing-remote e incrementa bitrix_sync_drift_detected_total por tenant', async () => {
    const report = detectBitrixLocalDrift({
      organizationId: 'org-1',
      entityType: 'lead',
      remoteRecords: [
        {
          bitrixRecordId: '101',
          stage: 'NEW',
          title: 'Lead Sincronizado',
          value: 500,
        },
        {
          bitrixRecordId: '102',
          stage: 'CONVERTED',
          title: 'Lead Divergente',
          value: 1200,
        },
        {
          bitrixRecordId: '103',
          stage: 'NEW',
          title: 'Só no Bitrix',
          value: 300,
        },
      ],
      localRecords: [
        {
          bitrixRecordId: '101',
          localId: 'local-101',
          stage: 'NEW',
          title: 'Lead Sincronizado',
          value: 500,
        },
        {
          bitrixRecordId: '102',
          localId: 'local-102',
          stage: 'IN_PROCESS',
          title: 'Lead Divergente',
          value: 900,
        },
        {
          bitrixRecordId: '104',
          localId: 'local-104',
          stage: 'NEW',
          title: 'Órfão Local',
          value: 100,
        },
      ],
    });

    expect(report.inSyncCount).toBe(1);
    expect(report.driftedCount).toBe(3);

    expect(report.items).toEqual([
      expect.objectContaining({
        bitrixRecordId: '102',
        localId: 'local-102',
        reason: 'checksum-mismatch',
        diffFields: ['stage', 'value'],
      }),
      expect.objectContaining({
        bitrixRecordId: '103',
        localId: null,
        reason: 'missing-local',
      }),
      expect.objectContaining({
        bitrixRecordId: '104',
        localId: 'local-104',
        reason: 'missing-remote',
      }),
    ]);

    const metric = await bitrixSyncDriftDetectedTotal.get();
    expect(metric.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          labels: { tenant: 'org-1', entity: 'lead', reason: 'checksum-mismatch' },
          value: 1,
        }),
        expect.objectContaining({
          labels: { tenant: 'org-1', entity: 'lead', reason: 'missing-local' },
          value: 1,
        }),
        expect.objectContaining({
          labels: { tenant: 'org-1', entity: 'lead', reason: 'missing-remote' },
          value: 1,
        }),
      ]),
    );
  });
});

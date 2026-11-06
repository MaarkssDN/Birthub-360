import { describe, expect, it } from 'vitest';
import { evaluateRestoreDrillAcceptance } from '../../../scripts/sre/run-backup-restore-drill.js';

describe('SRE Backup & Restore Drill RTO/Integrity Assertions (DIV-AGENTE-10-001)', () => {
  const validInput = {
    migrateStatusExitOk: true,
    migrateStatusOutput: 'Database schema is up to date!',
    expectedTableCount: 3,
    tableCounts: [
      { table: 'Organization', original: 5, restored: 5, match: true },
      { table: 'Contact', original: 120, restored: 120, match: true },
      { table: 'Lead', original: 80, restored: 80, match: true },
    ],
    invalidIndexes: 0,
    orphanContacts: 0,
    orphanLeads: 0,
    corruptSqlDetected: true,
    missingFileDetected: true,
    rtoMeasuredSec: 18.4,
    rtoTargetSec: 900,
  };

  it('passes when migrations are up to date, table counts match 100%, no invalid indexes/orphans, and RTO <= 900s', () => {
    const res = evaluateRestoreDrillAcceptance(validInput);
    expect(res).toEqual({
      migrationsUpToDate: true,
      allTablesMatch: true,
      rtoWithinTarget: true,
      pass: true,
    });
  });

  it('fails when measured RTO exceeds the 15-minute (900s) SLA target', () => {
    const res = evaluateRestoreDrillAcceptance({
      ...validInput,
      rtoMeasuredSec: 905,
    });
    expect(res.rtoWithinTarget).toBe(false);
    expect(res.pass).toBe(false);
  });

  it('fails when restored table record counts diverge from canonical database', () => {
    const res = evaluateRestoreDrillAcceptance({
      ...validInput,
      tableCounts: [
        { table: 'Organization', original: 5, restored: 5, match: true },
        { table: 'Contact', original: 120, restored: 118, match: false },
        { table: 'Lead', original: 80, restored: 80, match: true },
      ],
    });
    expect(res.allTablesMatch).toBe(false);
    expect(res.pass).toBe(false);
  });

  it('fails when invalid indexes or orphan tenant records are detected', () => {
    expect(
      evaluateRestoreDrillAcceptance({ ...validInput, invalidIndexes: 1 }).pass,
    ).toBe(false);
    expect(
      evaluateRestoreDrillAcceptance({ ...validInput, orphanContacts: 2 }).pass,
    ).toBe(false);
    expect(
      evaluateRestoreDrillAcceptance({ ...validInput, orphanLeads: 1 }).pass,
    ).toBe(false);
  });

  it('fails when prisma migrate status reports pending/failed migrations', () => {
    const res = evaluateRestoreDrillAcceptance({
      ...validInput,
      migrateStatusExitOk: false,
      migrateStatusOutput: '1 migration has not yet been applied',
    });
    expect(res.migrationsUpToDate).toBe(false);
    expect(res.pass).toBe(false);
  });
});

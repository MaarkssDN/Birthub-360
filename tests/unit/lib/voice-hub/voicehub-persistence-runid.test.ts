import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('VoiceHub persistence RUN_ID isolation regression test', () => {
  it('guarantees tests/integration/voicehub-persistence.test.ts uses interpolated template literals instead of literal strings', () => {
    const filePath = resolve(__dirname, '../../../integration/voicehub-persistence.test.ts');
    const content = readFileSync(filePath, 'utf-8');

    // Regression check for literal "${Date.now()}" or "${RUN_ID}" due to double-quotes
    expect(content).not.toMatch(/const RUN_ID = "\$\{Date\.now\(\)/);
    expect(content).not.toMatch(/const ORG_A = "test-voicehub-org-a-\$\{RUN_ID\}"/);

    // Assert valid backtick interpolation
    expect(content).toMatch(/const RUN_ID = `\$\{Date\.now\(\)/);
    expect(content).toMatch(/const ORG_A = `test-voicehub-org-a-\$\{RUN_ID\}`/);
  });

  it('generates distinct runId and tenant org prefixes without collision', () => {
    const generateRunId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const id1 = generateRunId();
    const id2 = generateRunId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^\d+-[a-z0-9]+$/);

    const org1 = `test-voicehub-org-a-${id1}`;
    const org2 = `test-voicehub-org-a-${id2}`;
    expect(org1).not.toBe(org2);
    expect(org1).toContain('test-voicehub-org-a-');
  });

  it('keeps ORG_A derived from RUN_ID so tenant isolation tracks each run', () => {
    const filePath = resolve(__dirname, '../../../integration/voicehub-persistence.test.ts');
    const content = readFileSync(filePath, 'utf-8');

    // Se ORG_A deixar de interpolar ${RUN_ID}, duas execuções paralelas do teste
    // de integração passam a colidir no mesmo tenant — regressão real de isolamento.
    const orgALine = content.split('\n').find((l) => l.includes('const ORG_A'));
    expect(orgALine, 'const ORG_A não encontrada').toBeDefined();
    expect(orgALine).toContain('${RUN_ID}');
    expect(orgALine).toContain('`');
  });
});

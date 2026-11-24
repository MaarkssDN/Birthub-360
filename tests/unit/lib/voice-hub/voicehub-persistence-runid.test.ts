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

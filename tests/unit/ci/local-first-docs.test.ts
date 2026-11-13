// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// BT360-DT-0047 / TAREFA-SANEAMENTO-047: o onboarding local-first exige o overlay
// docker-compose.postgres-local.yml (serviço `postgres`, porta 5434, pgvector) —
// sem ele `npx prisma migrate deploy` falha e o doctor local-first não sobe.
// A correção do documento já existia (commit 63f59a064); este teste impede que
// uma edição futura do runbook volte a omitir o overlay silenciosamente.

const localFirstDoc = readFileSync('docs/development/LOCAL_FIRST.md', 'utf8');

describe('LOCAL_FIRST.md — overlay PostgreSQL obrigatório (BT360-DT-0047)', () => {
  it('o comando de subida da infraestrutura inclui docker-compose.postgres-local.yml', () => {
    const upCommands = localFirstDoc.match(/docker compose[^\n]*/g) ?? [];
    expect(upCommands.length).toBeGreaterThan(0);
    for (const command of upCommands) {
      if (/\bup\b/.test(command)) {
        expect(command).toContain('docker-compose.postgres-local.yml');
      }
    }
  });

  it('o documento referencia o serviço postgres na porta 5434', () => {
    expect(localFirstDoc).toContain('docker-compose.postgres-local.yml');
    expect(localFirstDoc).toContain('5434');
  });
});

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('OpenAPI Central Contracts — Modules and Telephony Reconciliation (B-09)', () => {
  it('confirma presenca documentada das rotas de modulos e telefonia 3CX em docs/openapi.yaml', () => {
    const openapiPath = path.resolve(process.cwd(), 'docs/openapi.yaml');
    const content = fs.readFileSync(openapiPath, 'utf8');

    expect(content).toContain('/api/organization/modules:');
    expect(content).toContain('/api/telephony/webhook/3cx:');
    expect(content).toContain('OrganizationModules');
    expect(content).toContain('Telephony');
  });
});

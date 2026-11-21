import { describe, expect, it } from 'vitest';
import { lintSqlInFile } from '../../../scripts/security/check-sql-tenant-predicates.js';

describe('Agente 10 (Mara) - Linter de Predicados Tenant em SQL Cru', () => {
  it('deve aprovar consultas SQL com predicado de tenant explícito', () => {
    const validCode = `
      const rows = await prisma.$queryRaw\`
        SELECT * FROM "Lead"
        WHERE "organizationId" = \${orgId}
      \`;
    `;
    const findings = lintSqlInFile('src/example.ts', validCode);
    expect(findings).toHaveLength(0);
  });

  it('deve reprovar consultas SQL cru sobre tabelas multi-tenant sem predicado de tenant', () => {
    const invalidCode = `
      const rows = await prisma.$queryRawUnsafe('SELECT * FROM "Lead" LIMIT 10');
    `;
    const findings = lintSqlInFile('src/example.ts', invalidCode);
    expect(findings).toHaveLength(1);
    expect(findings[0].reason).toContain('tabela multi-tenant "Lead"');
  });
});

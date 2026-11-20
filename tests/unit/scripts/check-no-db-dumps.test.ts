import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sem tipos
import { findDumpFiles } from '../../../scripts/ci/check-no-db-dumps.mjs';

describe('check-no-db-dumps (B-14)', () => {
  it('bloqueia extensões de dump', () => {
    expect(
      findDumpFiles(['a.sql', 'backups/x.sql.gz', 'db.dump', 'x.backup', 'y.BAK', 'src/ok.ts']),
    ).toEqual(['a.sql', 'backups/x.sql.gz', 'db.dump', 'x.backup', 'y.BAK']);
  });
  it('não isenta formatos de backup nem dentro dos diretórios aprovados', () => {
    expect(
      findDumpFiles(['scripts/db/customers.backup', 'prisma/migrations/x/clientes.sql.gz', 'scripts/db/a.dump']),
    ).toEqual(['scripts/db/customers.backup', 'prisma/migrations/x/clientes.sql.gz', 'scripts/db/a.dump']);
  });
  it('permite SQL de migração do Prisma', () => {
    expect(findDumpFiles(['prisma/migrations/2026_init/migration.sql'])).toEqual([]);
  });
});

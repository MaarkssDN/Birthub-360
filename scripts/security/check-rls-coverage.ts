// scripts/security/check-rls-coverage.ts
//
// Gate estático de cobertura RLS (DEM-20261113-002 / Onda 1, MEL-03).
//
// Falha (exit 1) se existir model no schema.prisma com campo `organizationId`
// cuja tabela não tenha, nas migrations, `ENABLE ROW LEVEL SECURITY` E ao menos
// uma `CREATE POLICY`. Não exige banco — análise estática de arquivos.
//
// Exceções legítimas ficam em ALLOWLIST abaixo (tabelas globais sem tenant,
// ex.: auth do better-auth). Qualquer model novo com organizationId entra no
// gate automaticamente — se esquecer RLS, o CI quebra.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCHEMA_PATH = join(ROOT, 'prisma', 'schema.prisma');
const MIGRATIONS_DIR = join(ROOT, 'prisma', 'migrations');

// Tabelas que NÃO são tenant-bearing por desenho (auth global, catálogos
// públicos, infra). Cada entrada precisa de justificativa.
const ALLOWLIST = new Set<string>([
  // better-auth: identidade global, sem organizationId — filtrada por userId
  // nas camadas de aplicação, não por RLS de tenant.
  'user',
  'session',
  'account',
  'verification',
]);

interface ModelInfo {
  name: string;
  table: string;
  hasOrgId: boolean;
}

function parseSchema(): ModelInfo[] {
  const src = readFileSync(SCHEMA_PATH, 'utf8');
  const models: ModelInfo[] = [];
  const re = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const [, name, body] = m;
    const mapMatch = body.match(/@@map\("([^"]+)"\)/);
    const table = mapMatch ? mapMatch[1] : name;
    const hasOrgId = /^\s*organizationId\s+\w+/m.test(body);
    models.push({ name, table, hasOrgId });
  }
  return models;
}

function collectMigrationSql(): string {
  const files = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(MIGRATIONS_DIR, d.name, 'migration.sql'));
  return files.map((f) => readFileSync(f, 'utf8')).join('\n');
}

function main(): void {
  const models = parseSchema();
  const sql = collectMigrationSql();

  const enabled = new Set<string>();
  const policies = new Set<string>();
  const renames = new Map<string, string>();
  for (const match of sql.matchAll(/ALTER TABLE "([^"]+)" ENABLE ROW LEVEL SECURITY/gi)) {
    enabled.add(match[1]);
  }
  // RLS/policies sobrevivem a RENAME TABLE no Postgres — resolver nomes antigos
  // para o nome atual antes de comparar (ex.: AtlasGRCallResult → Birthub360CallResult).
  for (const match of sql.matchAll(/ALTER TABLE "([^"]+)" RENAME TO "([^"]+)"/gi)) {
    renames.set(match[1], match[2]);
  }
  const resolve = (t: string) => renames.get(t) ?? t;
  for (const match of sql.matchAll(/CREATE POLICY (?:"[^"]+"|\w+) ON "([^"]+)"/gi)) {
    policies.add(resolve(match[1]));
  }
  for (const t of [...enabled]) enabled.delete(t), enabled.add(resolve(t));

  const failures: string[] = [];
  let checked = 0;
  for (const model of models) {
    if (!model.hasOrgId || ALLOWLIST.has(model.table)) continue;
    checked += 1;
    if (!enabled.has(model.table)) {
      failures.push(`${model.name} (tabela "${model.table}"): sem ENABLE ROW LEVEL SECURITY`);
    } else if (!policies.has(model.table)) {
      failures.push(`${model.name} (tabela "${model.table}"): RLS habilitado mas sem CREATE POLICY`);
    }
  }

  if (failures.length > 0) {
    console.error(`check-rls-coverage: ${failures.length} tabela(s) tenant-bearing sem cobertura RLS:`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error('Abra handoff para o Agente 01 (dono de prisma/migrations).');
    process.exit(1);
  }

  console.log(`check-rls-coverage: OK — ${checked} tabelas tenant-bearing com RLS + policy verificadas (${ALLOWLIST.size} allowlist).`);
}

main();

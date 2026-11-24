// Validação sintática/semântica da migration 20261124120000_add_deletedby_deletereason_4_models
// em PostgreSQL real via PGlite (WASM). NÃO é o banco do projeto — apenas prova de que o
// DDL é válido, idempotente e aditivo.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('fs');
const path = require('path');

const TABLES = ['Agent', 'AgentSession', 'CadenceSequence', 'Workflow'];
const MIGRATION = path.join(
  __dirname,
  '../../prisma/migrations/20261124120000_add_deletedby_deletereason_4_models/migration.sql'
);

async function main() {
  const db = new PGlite();
  // Estado "pré-migration": tabelas existem com deletedAt (como no schema atual do coord).
  for (const t of TABLES) {
    await db.query(`CREATE TABLE "${t}" (id TEXT PRIMARY KEY, "deletedAt" TIMESTAMP(3))`);
    await db.query(`INSERT INTO "${t}" (id) VALUES ('seed-1')`);
  }

  const sql = fs.readFileSync(MIGRATION, 'utf8');

  // Execução 1
  await db.exec(sql);
  // Execução 2 — prova de idempotência (IF NOT EXISTS)
  await db.exec(sql);

  // Verificação: colunas existem, são nullable, tipo TEXT
  for (const t of TABLES) {
    const { rows } = await db.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = $1 AND column_name IN ('deletedBy','deleteReason')
       ORDER BY column_name`,
      [t]
    );
    if (rows.length !== 2) throw new Error(`${t}: esperava 2 colunas, achou ${rows.length}`);
    for (const r of rows) {
      if (r.data_type !== 'text' || r.is_nullable !== 'YES') {
        throw new Error(`${t}.${r.column_name}: tipo=${r.data_type} nullable=${r.is_nullable}`);
      }
    }
  }

  // Backfill check: linha seed permanece com NULLs (sem backfill, sem rewrite de dados)
  const { rows: seed } = await db.query(
    `SELECT "deletedBy", "deleteReason" FROM "Agent" WHERE id = 'seed-1'`
  );
  if (seed[0].deletedBy !== null || seed[0].deleteReason !== null) {
    throw new Error('Backfill inesperado detectado');
  }

  // Rollback ensaiado (DROP COLUMN) — reversibilidade comprovada
  await db.exec(`
    ALTER TABLE "Agent"           DROP COLUMN IF EXISTS "deletedBy", DROP COLUMN IF EXISTS "deleteReason";
    ALTER TABLE "AgentSession"    DROP COLUMN IF EXISTS "deletedBy", DROP COLUMN IF EXISTS "deleteReason";
    ALTER TABLE "CadenceSequence" DROP COLUMN IF EXISTS "deletedBy", DROP COLUMN IF EXISTS "deleteReason";
    ALTER TABLE "Workflow"        DROP COLUMN IF EXISTS "deletedBy", DROP COLUMN IF EXISTS "deleteReason";
  `);
  const { rows: after } = await db.query(
    `SELECT count(*)::int AS n FROM information_schema.columns
     WHERE table_name = ANY($1) AND column_name IN ('deletedBy','deleteReason')`,
    [TABLES]
  );
  if (after[0].n !== 0) throw new Error('Rollback incompleto');

  console.log('VALIDACAO OK: DDL valido, idempotente, aditivo, nullable TEXT, sem backfill, rollback funcional (PGlite/Postgres WASM)');
  await db.close();
}

main().catch((e) => {
  console.error('FALHA:', e.message);
  process.exit(1);
});

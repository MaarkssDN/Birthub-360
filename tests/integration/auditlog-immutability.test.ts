import { Pool } from 'pg';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * DEM-20261114-003 (follow-up Onda 2, MEL-10): "AuditLog" é append-only por trigger de banco
 * (migration 20261114160000_auditlog_append_only_immutability) — UPDATE/DELETE/TRUNCATE são
 * bloqueados para QUALQUER papel, inclusive o dono/superusuário. Antes desta migration a
 * "imutabilidade" existia só no comentário do commit 113f52196: a tabela aceitava DML destrutivo
 * de qualquer sessão com privilégio.
 *
 * Roda como o migrator/dono (MIGRATOR_DATABASE_URL || DIRECT_URL) de propósito: é o papel mais
 * poderoso do esquema e mesmo ele não pode mutar a trilha — se o trigger vale para ele, vale
 * para todos. Tudo dentro de BEGIN/ROLLBACK: nenhuma linha de teste persiste (e, mesmo se o
 * ROLLBACK falhasse, o DELETE de limpeza também seria bloqueado pelo trigger — o teste só
 * insere uma linha descartável por execução).
 */
const ownerUrl = process.env.MIGRATOR_DATABASE_URL || process.env.DIRECT_URL || '';
const pool = ownerUrl ? new Pool({ connectionString: ownerUrl }) : null;

const TABLE = '"AuditLog"';

async function inTx(fn: (c: import('pg').PoolClient) => Promise<void>) {
  const client = await pool!.connect();
  try {
    await client.query('BEGIN');
    await fn(client);
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}

afterAll(async () => {
  await pool?.end();
});

describe.skipIf(!pool)('AuditLog append-only (trigger audit_log_immutable)', () => {
  it('INSERT continua permitido (controle positivo)', async () => {
    await inTx(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO ${TABLE} (id, action, entity, "tenantId")
         VALUES ('auditlog-immut-test', 'EXPORT', 'AuditLogImmutabilityTest', 'tenant-teste')
         RETURNING id`,
      );
      expect(rows[0].id).toBe('auditlog-immut-test');
    });
  });

  it('UPDATE é bloqueado com insufficient_privilege', async () => {
    await inTx(async (c) => {
      await c.query(
        `INSERT INTO ${TABLE} (id, action, entity, "tenantId")
         VALUES ('auditlog-immut-test', 'EXPORT', 'AuditLogImmutabilityTest', 'tenant-teste')`,
      );
      await expect(
        c.query(`UPDATE ${TABLE} SET action = 'DELETE' WHERE id = 'auditlog-immut-test'`),
      ).rejects.toThrow(/append-only|insufficient_privilege/i);
    });
  });

  it('DELETE é bloqueado com insufficient_privilege', async () => {
    await inTx(async (c) => {
      await c.query(
        `INSERT INTO ${TABLE} (id, action, entity, "tenantId")
         VALUES ('auditlog-immut-test', 'EXPORT', 'AuditLogImmutabilityTest', 'tenant-teste')`,
      );
      await expect(
        c.query(`DELETE FROM ${TABLE} WHERE id = 'auditlog-immut-test'`),
      ).rejects.toThrow(/append-only|insufficient_privilege/i);
    });
  });

  it('TRUNCATE é bloqueado com insufficient_privilege', async () => {
    await inTx(async (c) => {
      await expect(c.query(`TRUNCATE ${TABLE}`)).rejects.toThrow(
        /append-only|insufficient_privilege/i,
      );
    });
  });
});

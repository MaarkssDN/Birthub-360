import { Pool } from 'pg';
import { hashPassword } from 'better-auth/crypto';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  await client.query(`SELECT set_config('app.bypass_rls', 'on', FALSE);`);

  // Remove existing user
  const existing = await client.query(`SELECT id FROM "user" WHERE email = 'marcelinmark@gmail.com'`);
  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    await client.query(`DELETE FROM "account" WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM "session" WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
  }

  const orgId = randomUUID();
  await client.query(
    `INSERT INTO "Organization" (id, name, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())`,
    [orgId, 'Admin Org ' + Date.now()]
  );

  const hash = await hashPassword('00000000');
  const userId = randomUUID();

  await client.query(
    `INSERT INTO "user" (id, email, name, "emailVerified", role, "organizationId", "createdAt", "updatedAt")
     VALUES ($1, 'marcelinmark@gmail.com', 'Marcelin Mark', true, 'ADMIN', $2, NOW(), NOW())`,
    [userId, orgId]
  );

  const accId = randomUUID();
  await client.query(
    `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     VALUES ($1, 'marcelinmark@gmail.com', 'credential', $2, $3, NOW(), NOW())`,
    [accId, userId, hash]
  );

  console.log('✅ Usuário e conta criados com sucesso!');
  client.release();
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });

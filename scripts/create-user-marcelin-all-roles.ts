import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import pg from 'pg';
import 'dotenv/config';
import { JOB_ROLE_CATALOG, type JobRoleCode } from '../src/config/job-role-catalog.js';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5434/prospectordb';

async function main() {
  console.log('Connecting to database:', databaseUrl);
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

    const email = 'marcelinmark@gmail.com';
    const name = 'Marcelin Mark';
    const rawPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@360';
    const passwordHash = await hashPassword(rawPassword);

    // 1. Garantir Organizacao
    let orgId: string;
    const orgRes = await client.query('SELECT id FROM "Organization" WHERE name = $1 LIMIT 1', ['Birth Hub 360']);
    if (orgRes.rows.length > 0) {
      orgId = orgRes.rows[0].id;
    } else {
      orgId = randomUUID();
      await client.query(
        'INSERT INTO "Organization" (id, name, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
        [orgId, 'Birth Hub 360'],
      );
    }
    console.log(`[OK] Organização configurada: "Birth Hub 360" (${orgId})`);

    // 2. Garantir todos os 12 cargos canônicos no catálogo JobRole
    console.log('Semeando cargos canônicos...');
    const jobRoleMap = new Map<string, string>();
    for (const catalogRole of JOB_ROLE_CATALOG) {
      const existingJr = await client.query('SELECT id FROM "JobRole" WHERE code = $1', [catalogRole.code]);
      let jrId: string;
      if (existingJr.rows.length > 0) {
        jrId = existingJr.rows[0].id;
        await client.query(
          'UPDATE "JobRole" SET name = $1, description = $2, department = $3, level = $4, "isActive" = TRUE, "updatedAt" = NOW() WHERE id = $5',
          [catalogRole.name, catalogRole.description, catalogRole.department, catalogRole.level, jrId]
        );
      } else {
        jrId = randomUUID();
        await client.query(
          `INSERT INTO "JobRole" (id, code, name, description, department, level, "isSystem", "isActive", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, NOW(), NOW())`,
          [jrId, catalogRole.code, catalogRole.name, catalogRole.description, catalogRole.department, catalogRole.level]
        );
      }
      jobRoleMap.set(catalogRole.code, jrId);
    }
    console.log(`[OK] ${jobRoleMap.size} cargos canônicos sincronizados.`);

    // 3. Criar ou Atualizar Usuário
    let userId: string;
    const existingUser = await client.query('SELECT id FROM "user" WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      await client.query(
        `UPDATE "user"
         SET name = $1, role = 'ADMIN', "organizationId" = $2, "emailVerified" = TRUE, "mustChangePassword" = FALSE, "updatedAt" = NOW()
         WHERE id = $3`,
        [name, orgId, userId]
      );
      console.log(`[OK] Usuário atualizado: ${email} (ID: ${userId})`);
    } else {
      userId = randomUUID();
      await client.query(
        `INSERT INTO "user" (id, name, email, "emailVerified", role, "organizationId", "mustChangePassword", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, TRUE, 'ADMIN', $4, FALSE, NOW(), NOW())`,
        [userId, name, email, orgId]
      );
      console.log(`[OK] Usuário criado: ${email} (ID: ${userId})`);
    }

    // 4. Configurar conta de autenticação (Better Auth)
    const accountRes = await client.query(
      'SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = $2',
      [userId, 'credential']
    );

    if (accountRes.rows.length === 0) {
      await client.query(
        `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
        [randomUUID(), userId, userId, passwordHash]
      );
      console.log('[OK] Credencial de acesso (Better Auth) criada.');
    } else {
      await client.query(
        'UPDATE "account" SET password = $1, "updatedAt" = NOW() WHERE id = $2',
        [passwordHash, accountRes.rows[0].id]
      );
      console.log('[OK] Senha de acesso atualizada.');
    }

    // 5. Vincular usuário a TODOS os cargos disponíveis (UserJobRole)
    // DIRETOR_COMERCIAL (CEO/Executivo) é marcado como isPrimary = TRUE.
    // Os outros 11 cargos são marcados como isPrimary = FALSE, isActive = TRUE.
    console.log('Vinculando usuário a todos os cargos disponíveis...');
    for (const [code, jrId] of jobRoleMap.entries()) {
      const isPrimary = code === 'DIRETOR_COMERCIAL';
      const existingUjr = await client.query(
        'SELECT id FROM "UserJobRole" WHERE "userId" = $1 AND "jobRoleId" = $2',
        [userId, jrId]
      );

      if (existingUjr.rows.length > 0) {
        await client.query(
          'UPDATE "UserJobRole" SET "isPrimary" = $1, "isActive" = TRUE, "organizationId" = $2 WHERE id = $3',
          [isPrimary, orgId, existingUjr.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO "UserJobRole" (id, "organizationId", "userId", "jobRoleId", "isPrimary", "isActive", "assignedAt")
           VALUES ($1, $2, $3, $4, $5, TRUE, NOW())`,
          [randomUUID(), orgId, userId, jrId, isPrimary]
        );
      }
      console.log(`  - Cargo atribuído: ${code} ${isPrimary ? '(Cargo Principal - CEO / Diretor)' : ''}`);
    }

    // 6. Conceder permissão de módulos
    const moduleKey = 'social-selling';
    const existingGrant = await client.query(
      'SELECT id FROM "ModuleAccessGrant" WHERE "userId" = $1 AND "moduleKey" = $2',
      [userId, moduleKey]
    );
    if (existingGrant.rows.length === 0) {
      await client.query(
        `INSERT INTO "ModuleAccessGrant" (id, "organizationId", "userId", "moduleKey", "grantedByUserId", "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [randomUUID(), orgId, userId, moduleKey, userId]
      );
    }
    console.log(`[OK] Módulo concedido: ${moduleKey}`);

    // Limpar sessões antigas para forçar re-login limpo
    await client.query('DELETE FROM "session" WHERE "userId" = $1', [userId]);

    await client.query('COMMIT');
    console.log('\n======================================================');
    console.log('USUÁRIO MASTER CRIADO COM SUCESSO:');
    console.log(`E-mail:   ${email}`);
    console.log(`Senha:    ${rawPassword}`);
    console.log(`Papel:    ADMIN (Dono da Plataforma)`);
    console.log(`Cargo:    DIRETOR_COMERCIAL (CEO/Executivo - Principal)`);
    console.log(`Cargos:   Todos os 12 cargos da plataforma vinculados e ativos`);
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao configurar usuário:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

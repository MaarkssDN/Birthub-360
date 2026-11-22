import { Pool } from 'pg';
import { auth } from '../src/lib/auth.js';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  
  try {
    // 1. Bypass RLS para limpeza
    await client.query(`SELECT set_config('app.bypass_rls', 'on', FALSE);`);
    console.log('Removendo resquícios via pg...');
    
    const existing = await client.query(`SELECT id FROM "user" WHERE email = 'marcelinmark@gmail.com'`);
    if (existing.rows.length > 0) {
      const userId = existing.rows[0].id;
      await client.query(`DELETE FROM "account" WHERE "userId" = $1`, [userId]);
      await client.query(`DELETE FROM "session" WHERE "userId" = $1`, [userId]);
      await client.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
    }
    await client.query(`DELETE FROM "Organization" WHERE name LIKE '%Marcelin%'`);

    // 2. Usar a API do better-auth
    console.log('Criando via better-auth API...');
    const res = await auth.api.signUpEmail({
      body: {
        email: 'marcelinmark@gmail.com',
        password: '00000000',
        name: 'Marcelin Mark',
      }
    });
    
    console.log('Usuário criado com sucesso via Better-Auth:', res);
    
    // 3. Forçar emailVerified = true direto no banco via pg
    if (res?.user?.id) {
       await client.query(`UPDATE "user" SET "emailVerified" = true WHERE id = $1`, [res.user.id]);
       console.log('Email marcado como verificado!');
    }

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

main();

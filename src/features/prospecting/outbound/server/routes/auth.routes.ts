import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import { getDatabase } from '../db.js';
import {
  requireAuth,
  requireTenantScope,
  tenantCompany,
  createSessionToken,
  buildSessionCookie,
  buildLogoutCookie,
} from '../auth.js';

export const SCRYPT_PREFIX = 'scrypt$';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${SCRYPT_PREFIX}${salt}$${hash}`;
}

export function verifyHashedPassword(password: string, stored: string): boolean {
  const parts = stored.slice(SCRYPT_PREFIX.length).split('$');
  const [salt, hashHex] = parts;
  if (!salt || !hashHex) return false;
  const hashBuffer = Buffer.from(hashHex, 'hex');
  const candidate = crypto.scryptSync(password, salt, 64);
  return candidate.length === hashBuffer.length && crypto.timingSafeEqual(candidate, hashBuffer);
}

export function normalizeCompany(value: unknown): string | null {
  const v = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!v) return null;
  // Normaliza para birthhub360
  if (v.includes('birthhub') || v.includes('birth hub') || v.includes('360')) return 'birthhub360';
  return v;
}

export const authRouter = Router();

authRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, company } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const db = await getDatabase();
    const result = await db.exec(
      `SELECT id, email, name, role, company, password FROM users WHERE LOWER(TRIM(email)) = ?`,
      [normalizedEmail],
    );
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const row = result[0].values[0];
    const storedPassword = String(row[5] || '').trim();
    const isHashed = storedPassword.startsWith(SCRYPT_PREFIX);
    const passwordMatches = isHashed
      ? verifyHashedPassword(password, storedPassword)
      : storedPassword === password;

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = {
      id: row[0],
      email: row[1],
      name: row[2],
      role: row[3],
      company: normalizeCompany(row[4]) ?? row[4],
    };

    if (!isHashed) {
      try {
        await db.run(`UPDATE users SET password = ? WHERE id = ?`, [
          hashPassword(password),
          user.id,
        ]);
      } catch (err: any) {
        console.error('Falha ao migrar senha para hash:', err);
      }
    }

    if (user.role !== 'admin' && company) {
      const requestedCompany = normalizeCompany(company);
      const userCompany = normalizeCompany(row[4]);
      if (requestedCompany && userCompany && requestedCompany !== userCompany) {
        return res.status(403).json({
          error: 'Esta conta pertence a outra empresa. Selecione a marca correta para entrar.',
        });
      }
    }

    const token = createSessionToken({
      id: String(user.id),
      role: String(user.role),
      company: (user.company as string) ?? null,
    });
    res.setHeader('Set-Cookie', buildSessionCookie(token));
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/auth/logout', async (_req: Request, res: Response) => {
  res.setHeader('Set-Cookie', buildLogoutCookie());
  res.json({ success: true });
});

authRouter.get('/auth/me', async (req: Request, res: Response) => {
  res.json({ user: (req as any).outboundUser ?? null });
});

// Handoff 12→05 (F2): este router é montado ANTES do requireTenantScope do
// apiRouter (é a porta de entrada), então a rota precisa do guard explícito.
// Antes listava TODOS os usuários de TODAS as companies para qualquer sessão
// válida (diretório de usuários cross-tenant). Agora exige tenant e filtra
// pela company da sessão.
authRouter.get('/users', requireAuth, requireTenantScope, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const company = tenantCompany(req);
    const result = await db.exec(
      `SELECT id, email, name, role FROM users WHERE LOWER(TRIM(COALESCE(company, ''))) = ?`,
      [company],
    );
    if (result.length === 0) return res.json([]);
    const users = result[0].values.map((row) => ({
      id: row[0],
      email: row[1],
      name: row[2],
      role: row[3],
    }));
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import type { DbHandle } from '../db.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const heavyAiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: 'Muitas chamadas de IA/enriquecimento em 1 minuto. Aguarde um instante.',
});

// Escopo de tenant (mesma regra de campaigns.routes.ts/tasks.routes.ts):
// `leads.company` é string livre normalizada no login; a comparação ignora
// caixa/espaços para tolerar divergências do cadastro legado.
export const LEAD_COMPANY_CLAUSE = `LOWER(TRIM(COALESCE(leads.company, ''))) = ?`;

// Confirma que o lead existe E pertence à company da sessão. Rotas que
// recebem :id sem essa checagem permitiam ler/alterar leads de outra
// empresa só pelo id (cross-tenant/LGPD).
export async function leadBelongsToCompany(
  db: DbHandle,
  id: string,
  company: string,
): Promise<boolean> {
  const res = await db.exec(
    `SELECT leads.id FROM leads WHERE leads.id = ? AND ${LEAD_COMPANY_CLAUSE}`,
    [id, company],
  );
  return res.length > 0 && res[0].values.length > 0;
}

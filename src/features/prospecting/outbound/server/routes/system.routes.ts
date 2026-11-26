import { Router, type Request, type Response } from 'express';
import {
  getDatabase,
  executeQuery,
  getStats,
  saveDatabase,
  checkExplorerSqlSafety,
} from '../db.js';
import { fetchCnpjPublicData } from '../cnpj.js';
import { providerRegistry } from '../providerRegistry.js';
import { getSearchRun, getObservabilitySummary } from '../observability.js';
import {
  buildFeedbackSummary,
  type FeedbackMessageRecord,
  type FeedbackLeadRecord,
} from '../feedbackLoop.js';
import {
  requireAdmin,
  requireTenantScope,
  tenantCompany,
  normalizeTenantCompany,
} from '../auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const systemRouter = Router();

// Handoff 12→05 (F2): defesa em profundidade — sessão + company obrigatórias
// em TODAS as rotas deste router (antes várias eram efetivamente públicas:
// /db/stats, /error-reports, /feedback/summary, /search-runs etc.).
systemRouter.use(requireTenantScope);

const errorReportLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: 'Muitos reportes em 1 minuto. Aguarde um instante.',
});

// 1. Health check & DB Stats
// NOTA: GET /health foi movido para server/routes.ts (registrado ANTES do
// requireTenantScope) para continuar respondendo a sondas sem sessão — a
// cópia que existia aqui ficava inalcançável e foi removida.

// Wave 4 (CPI) - Provider Registry: expõe o catálogo real de providers, suas
// capacidades declaradas e status de configuração/saúde - nenhum provider
// "some" do catálogo, incluindo os ainda não migrados a adapter formal.
systemRouter.get('/providers/health', async (_req: Request, res: Response) => {
  try {
    const snapshot = await Promise.all(
      providerRegistry.map(async (p) => ({
        name: p.name,
        capabilities: p.capabilities,
        configured: p.configured(),
        health: await p.health(),
      })),
    );
    res.json({ providers: snapshot });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Wave 10 (CPI) - Observabilidade: "por que esta empresa apareceu (ou não
// apareceu) NESTA busca?" - devolve o SearchRun completo (pedido original,
// SearchIntent, SearchPlan, passos do pipeline, chamadas a provider e a
// decisão registrada para cada candidato). Armazenamento em memória por
// processo (ver server/observability.ts) - um Search-ID de uma busca antiga
// ou de outra instância do servidor pode não estar mais disponível.
systemRouter.get('/search-runs/:searchId', async (req: Request, res: Response) => {
  const { searchId } = req.params as { searchId: string };
  const run = getSearchRun(searchId);
  // Escopo de tenant (parecer 24 PR #323): o SearchRun contém query, candidatos
  // e dados de leads — PII de prospecção. Sem vínculo company↔searchId, um
  // autenticado de outro tenant lia a busca alheia pelo ID. A company da busca
  // fica registrada em run.request.company (gravada pelo /prospect); runs sem
  // company registrada ou de outra company respondem 404 — não revelar
  // existência cross-tenant.
  const runCompany = normalizeTenantCompany(run?.request?.company);
  if (!run || !runCompany || runCompany !== tenantCompany(req)) {
    return res.status(404).json({
      error:
        'Search-ID não encontrado. Buscas são retidas em memória por processo (últimas 200) - pode ter expirado, ter sido de outra instância do servidor, ou nunca ter existido.',
      searchId,
    });
  }
  res.json(run);
});

// Wave 10 (CPI) - Observabilidade: painel agregado - buscas executadas, taxa
// de sucesso, providers mais chamados, taxa de erro por provider e motivos
// de descarte mais comuns. Calculado só a partir do que foi de fato
// registrado nesta instância do processo desde que ela subiu - nunca uma
// métrica estimada (custo/cache ficam `null`: dependem da Wave 9).
systemRouter.get('/observability/summary', async (_req: Request, res: Response) => {
  res.json(getObservabilitySummary());
});

systemRouter.get('/db/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Botão "Reportar problema" (presente em toda tela, inclusive login): grava o
// relato para revisão posterior. Nunca deve travar o uso do app por causa de
// um erro ao registrar o próprio erro — por isso segue com sucesso genérico
// para o usuário mesmo que o log em si falhe, só reportando no servidor.
// NOTA (handoff 12→05, F2): desde o requireTenantScope deste router, o POST
// passou a exigir sessão + company — o botão da tela de login que usava este
// endpoint legado precisará do endpoint canônico /api/error-reports (ver
// Resolução do handoff).
systemRouter.post('/error-reports', errorReportLimiter, async (req: Request, res: Response) => {
  const { message, page, userId, userEmail, userAgent } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Descreva o problema antes de enviar.' });
  }
  console.error(
    `[REPORTE DE ERRO] página=${page || 'desconhecida'} usuário=${userEmail || userId || 'anônimo'}: ${message}`,
  );
  try {
    const db = await getDatabase();
    await db.run(
      `INSERT INTO error_reports (user_id, user_email, page, message, user_agent) VALUES (?, ?, ?, ?, ?)`,
      [userId || null, userEmail || null, page || null, message.trim(), userAgent || null],
    );
    saveDatabase();
  } catch (err: any) {
    console.error('Falha ao persistir error_report (log acima já registrou o relato):', err);
  }
  res.json({ success: true });
});

// Lista os reportes para revisão (mais recentes primeiro) — sem isso, a única forma
// de ver o que foi reportado seria consultar o Postgres diretamente.
// Escopo de tenant: reportes anônimos (user_id NULL, ex.: tela de login) seguem
// visíveis a todos os tenants; os vinculados a um usuário só aparecem para a
// company dele — user_email é PII e não pode vazar cross-tenant.
systemRouter.get('/error-reports', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const company = tenantCompany(req);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 200);
    const result = await db.exec(
      `SELECT * FROM error_reports
       WHERE user_id IS NULL OR user_id IN (
         SELECT id FROM users WHERE LOWER(TRIM(COALESCE(company, ''))) = ?
       )
       ORDER BY created_at DESC LIMIT ?`,
      [company, limit],
    );
    if (result.length === 0) return res.json([]);
    const cols = result[0].columns;
    const reports = result[0].values.map((row) => {
      const obj: any = {};
      cols.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Raw SQL Execution for Explorer
// DÉBITO CONHECIDO (parecer 24 PR #323): SQL arbitrário executado como `admin`
// NÃO tem escopo de tenant — um admin de company A pode ler/escrever dados de
// company B. Mantido porque o SQL Explorer é ferramenta operacional do painel
// legado e o módulo inteiro está atrás do gate 503; ANTES de reabrir o módulo,
// o Agente 01/05 precisa decidir: restringir a um papel global explícito,
// exigir confirmação, ou aposentar a rota. Ver handoff 05→01.
systemRouter.post('/db/query', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query é obrigatória.' });
    }
    const safety = checkExplorerSqlSafety(sql);
    if (!safety.allowed) {
      return res.status(403).json({ error: safety.reason });
    }
    const result = await executeQuery(sql);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated Public CNPJ Lookup (BrasilAPI / Minha Receita)
systemRouter.get('/cnpj/:cnpj', async (req: Request, res: Response) => {
  try {
    const { cnpj } = req.params as { cnpj: string };
    const data = await fetchCnpjPublicData(cnpj);
    if (!data) {
      return res.status(404).json({ error: 'CNPJ não localizado na base pública ou inválido.' });
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Wave 13 (CPI) - Feedback Loop: agregados honestos e determinísticos
systemRouter.get('/feedback/summary', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const company = tenantCompany(req);
    // Escopo de tenant: o resumo agregava leads/messages de TODAS as companies.
    // Messages não têm coluna company — o vínculo com o tenant é via lead_id.

    const messagesRes = await db.exec(
      `SELECT m.channel, m.feedback FROM messages m
       WHERE EXISTS (
         SELECT 1 FROM leads l
         WHERE l.id = m.lead_id AND LOWER(TRIM(COALESCE(l.company, ''))) = ?
       )`,
      [company],
    );
    const messages: FeedbackMessageRecord[] =
      messagesRes.length > 0
        ? messagesRes[0].values.map((row) => ({
            channel: row[0] as string | null,
            feedback: row[1] as string | null,
          }))
        : [];

    const leadsRes = await db.exec(
      `SELECT stage, loss_reason, win_reason, segment, company FROM leads WHERE LOWER(TRIM(COALESCE(company, ''))) = ?`,
      [company],
    );
    const leads: FeedbackLeadRecord[] =
      leadsRes.length > 0
        ? leadsRes[0].values.map((row) => ({
            stage: row[0] as string | null,
            loss_reason: row[1] as string | null,
            win_reason: row[2] as string | null,
            segment: row[3] as string | null,
            company: row[4] as string | null,
          }))
        : [];

    const summary = buildFeedbackSummary(messages, leads);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao calcular resumo de feedback.' });
  }
});

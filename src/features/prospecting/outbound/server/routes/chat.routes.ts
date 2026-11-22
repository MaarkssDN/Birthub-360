import { Router, type Request, type Response } from 'express';
import { getDatabase, saveDatabase } from '../db.js';
import { checkOllamaConnection, chatWithLLaMA3 } from '../ai.js';
import { requireAuth, requireTenantScope, tenantCompany, normalizeTenantCompany } from '../auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const heavyAiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: 'Muitas chamadas de IA/enriquecimento em 1 minuto. Aguarde um instante.',
});

export const chatRouter = Router();

// Handoff 12→05 (F2): defesa em profundidade — sessão + company obrigatórias.
// Escopo de tenant nas queries (handoffs 01→05 / 05→01): `chat_sessions` e
// `chat_messages` ganharam coluna `company` via migration
// `20261117230000_outbound_chat_tenant_company` (PR #381, Agente 01) — todas
// as queries abaixo filtram por ela. DEPENDÊNCIA DE MERGE: sem essa migration
// aplicada estas rotas falham (coluna inexistente); o módulo segue montado
// fechado (503) até a reabertura, então a ordem exigida é PR #381 → este PR.
chatRouter.use(requireTenantScope);

// 6. Ollama Status Check
chatRouter.post('/ollama/status', async (req: Request, res: Response) => {
  const { url = 'http://localhost:11434', model = 'llama3' } = req.body;
  const status = await checkOllamaConnection(url, model);
  res.json(status);
});

// 7. Chat with LLaMA3 / Interactive Assistant
chatRouter.post('/chat', heavyAiLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, message, aiConfig } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensagem não informada.' });
    }

    const db = await getDatabase();
    const effectiveSessionId = sessionId || `session-${Date.now()}`;
    const now = new Date().toISOString();
    const company = tenantCompany(req);

    // Ensure session exists — e pertence ao tenant da sessão. Um sessionId
    // adivinhado de OUTRA company devolve 404 (não revela existência), sem
    // escrita cross-tenant em chat_sessions/chat_messages (handoff 01→05).
    const sessCheck = await db.exec(`SELECT company FROM chat_sessions WHERE id = ?`, [
      effectiveSessionId,
    ]);
    if (sessCheck.length > 0 && sessCheck[0].values.length > 0) {
      const sessionCompany = normalizeTenantCompany(sessCheck[0].values[0][0]);
      if (sessionCompany !== company) {
        return res.status(404).json({ error: 'Sessão de chat não encontrada.' });
      }
    } else {
      const modelTitle =
        aiConfig?.provider === 'ollama'
          ? aiConfig.ollamaModel || 'llama3'
          : aiConfig?.groqModel || 'gemini-3.7';
      await db.run(
        `
        INSERT INTO chat_sessions (id, title, model, company, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          effectiveSessionId,
          `Conversa ${modelTitle} (${new Date().toLocaleDateString('pt-BR')})`,
          modelTitle,
          company,
          now,
        ],
      );
    }

    // Save user message to SQLite
    const userMsgId = `cmsg-u-${Date.now()}`;
    await db.run(
      `
      INSERT INTO chat_messages (id, session_id, role, content, model, company, created_at)
      VALUES (?, ?, 'user', ?, ?, ?, ?)
    `,
      [userMsgId, effectiveSessionId, message, aiConfig?.ollamaModel || 'llama3', company, now],
    );

    // Fetch conversation history — só mensagens do próprio tenant (a coluna
    // company em chat_messages é desnormalizada de propósito, ver migration).
    const histRes = await db.exec(
      `SELECT role, content FROM chat_messages WHERE session_id = ? AND LOWER(TRIM(COALESCE(company, ''))) = ? ORDER BY created_at ASC`,
      [effectiveSessionId, company],
    );
    const history: { role: string; content: string }[] = [];
    if (histRes.length > 0) {
      histRes[0].values.forEach((row) => {
        history.push({ role: row[0] as string, content: row[1] as string });
      });
    }

    // Call AI Engine (LLaMA3 Ollama / Groq / Gemini)
    const result = await chatWithLLaMA3(
      history.slice(-8, -1),
      message,
      aiConfig || {
        provider: 'ollama',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
      },
    );

    // Save assistant response to SQLite
    const botMsgId = `cmsg-a-${Date.now()}`;
    await db.run(
      `
      INSERT INTO chat_messages (id, session_id, role, content, model, tokens, company, created_at)
      VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?)
    `,
      [
        botMsgId,
        effectiveSessionId,
        result.text,
        result.modelUsed,
        result.tokensEstimated,
        company,
        new Date().toISOString(),
      ],
    );

    saveDatabase();

    res.json({
      sessionId: effectiveSessionId,
      reply: result.text,
      modelUsed: result.modelUsed,
      tokensEstimated: result.tokensEstimated,
      userMessageId: userMsgId,
      assistantMessageId: botMsgId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Chat Sessions & Messages List
chatRouter.get('/chat/sessions', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    // Linhas legadas com company NULL ficam invisíveis (fail-closed — dono
    // desconhecido), mesmo critério das demais rotas do módulo.
    const result = await db.exec(
      `
      SELECT s.*,
        (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.id AND LOWER(TRIM(COALESCE(m.company, ''))) = LOWER(TRIM(COALESCE(s.company, '')))) as messages_count,
        (SELECT content FROM chat_messages m WHERE m.session_id = s.id AND LOWER(TRIM(COALESCE(m.company, ''))) = LOWER(TRIM(COALESCE(s.company, ''))) ORDER BY m.created_at DESC LIMIT 1) as last_message
      FROM chat_sessions s
      WHERE LOWER(TRIM(COALESCE(s.company, ''))) = ?
      ORDER BY s.created_at DESC
    `,
      [tenantCompany(req)],
    );

    if (result.length === 0) return res.json([]);
    const cols = result[0].columns;
    const sessions = result[0].values.map((row) => {
      const obj: any = {};
      cols.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

chatRouter.get('/chat/sessions/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const company = tenantCompany(req);

    // Valida a sessão antes de listar mensagens: sessão de outra company (ou
    // inexistente) → 404, sem revelar existência cross-tenant.
    const sessCheck = await db.exec(`SELECT company FROM chat_sessions WHERE id = ?`, [id]);
    if (sessCheck.length === 0 || sessCheck[0].values.length === 0) {
      return res.status(404).json({ error: 'Sessão de chat não encontrada.' });
    }
    if (normalizeTenantCompany(sessCheck[0].values[0][0]) !== company) {
      return res.status(404).json({ error: 'Sessão de chat não encontrada.' });
    }

    const result = await db.exec(
      `SELECT * FROM chat_messages WHERE session_id = ? AND LOWER(TRIM(COALESCE(company, ''))) = ? ORDER BY created_at ASC`,
      [id, company],
    );

    if (result.length === 0) return res.json([]);
    const cols = result[0].columns;
    const messages = result[0].values.map((row) => {
      const obj: any = {};
      cols.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

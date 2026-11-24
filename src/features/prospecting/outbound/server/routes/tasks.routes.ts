import { Router, type Request, type Response } from 'express';
import { getDatabase, saveDatabase, logActivity } from '../db.js';
import {
  requireAuth,
  requireManager,
  requireTenantScope,
  tenantCompany,
} from '../auth.js';
import { isWithinMaxLength } from '../validators.js';

export const tasksRouter = Router();

// ONDA3-43 (handoff 45→05): autorização intra-tenant das tarefas.
// As rotas abaixo são self-service do vendedor: só o dono da tarefa (ou
// admin/gestor, que já veem o painel consolidado em GET /tasks) pode ler,
// atribuir ou alterar tarefas de outro usuário. Antes disto, qualquer
// autenticado do tenant lia/alterava tarefas alheias via :userId arbitrário
// (IDOR) e o audit log gravava o userId enviado no body (spoofing de autoria).
function isManagerRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'gestor';
}

// Self OU gestor/admin — mesmo critério de requireManager, mas permite o
// próprio usuário sem exigir role gerencial.
function canActOnUserTasks(req: Request, targetUserId: unknown): boolean {
  const session = req.outboundUser;
  if (!session) return false;
  if (isManagerRole(session.role)) return true;
  return typeof targetUserId === 'string' && targetUserId === session.id;
}

function forbidOtherUsersTasks(res: Response): Response {
  return res.status(403).json({
    error: 'Você só pode acessar tarefas de outros usuários com perfil de gestor/admin.',
  });
}

// due_date ordena o painel (ORDER BY due_date ASC) — aceitar qualquer string
// do body quebrava a ordenação e podia gravar lixo no banco. Vazio/null limpa
// a data; valor presente precisa ser uma data parseável e é normalizado para
// ISO 8601.
function normalizeDueDate(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: null };
  }
  if (typeof value !== 'string') return { ok: false };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { ok: false };
  return { ok: true, value: parsed.toISOString() };
}

// Handoff 12→05 (F2): defesa em profundidade — sessão + company obrigatórias
// mesmo que este router seja montado fora do apiRouter.
tasksRouter.use(requireTenantScope);

// tasks não tem coluna `company` própria: o tenant é resolvido via JOIN em
// `leads` (que tem `company`). Mesma comparação case-insensitive de
// campaigns.routes.ts.
function leadCompanyClause(): string {
  return `LOWER(TRIM(COALESCE(l.company, ''))) = ?`;
}

// --- Tarefas por lead --------------------------------------------------------
// Compromisso que o próprio vendedor cria (data + descrição livre), diferente de
// next_action (recomendação automática recalculada a cada leitura, nunca persistida).
const VALID_TASK_STATUS = ['pending', 'done', 'cancelled'] as const;

function mapRows(result: { columns: string[]; values: any[][] }[]): any[] {
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

// Criar tarefa para um lead
tasksRouter.post('/leads/:id/tasks', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, dueDate } = req.body;
    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Descrição da tarefa é obrigatória.' });
    }
    if (!isWithinMaxLength(description, 500)) {
      return res
        .status(400)
        .json({ error: 'Descrição da tarefa é longa demais (máx. 500 caracteres).' });
    }
    // ONDA3-43: responsável = quem criou. Gestor/admin pode delegar a outro
    // usuário do tenant via `userId`; vendedor comum só cria para si mesmo —
    // antes o body aceitava qualquer userId (criar tarefa "em nome" alheio).
    const sessionUser = req.outboundUser;
    const requestedUserId = req.body.userId;
    const hasRequestedUserId =
      requestedUserId !== undefined && requestedUserId !== null && requestedUserId !== '';
    if (hasRequestedUserId && typeof requestedUserId !== 'string') {
      return res.status(400).json({ error: 'userId deve ser uma string.' });
    }
    if (hasRequestedUserId && !canActOnUserTasks(req, requestedUserId)) {
      return forbidOtherUsersTasks(res);
    }
    const due = normalizeDueDate(dueDate);
    if (!due.ok) {
      return res.status(400).json({ error: 'dueDate inválida. Use uma data ISO 8601.' });
    }
    const assigneeId =
      typeof requestedUserId === 'string' && requestedUserId.trim()
        ? requestedUserId.trim()
        : (sessionUser?.id ?? null);
    const db = await getDatabase();
    const company = tenantCompany(req);
    const leadRes = await db.exec(
      `SELECT l.id FROM leads l WHERE l.id = ? AND LOWER(TRIM(COALESCE(l.company, ''))) = ?`,
      [id, company],
    );
    if (leadRes.length === 0 || leadRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }
    const insertRes = await db.exec(
      `INSERT INTO tasks (lead_id, user_id, description, due_date, status) VALUES (?, ?, ?, ?, 'pending') RETURNING *`,
      [id, assigneeId, description.trim(), due.value],
    );
    const task = mapRows(insertRes)[0];
    await logActivity(db, {
      leadId: id,
      userId: sessionUser?.id ?? null,
      action: 'task_created',
      toValue: description.trim(),
    });
    saveDatabase();
    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao criar tarefa.' });
  }
});

// Listar tarefas de um lead (mais recentes / pendentes primeiro)
tasksRouter.get('/leads/:id/tasks', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const company = tenantCompany(req);
    // JOIN em leads para impor o escopo de company (tasks não tem coluna própria).
    const result = await db.exec(
      `SELECT t.* FROM tasks t JOIN leads l ON l.id = t.lead_id
       WHERE t.lead_id = ? AND ${leadCompanyClause()}
       ORDER BY (t.status = 'pending') DESC, t.due_date ASC NULLS LAST, t.created_at DESC`,
      [id, company],
    );
    res.json(mapRows(result));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar tarefa (status, descrição ou data) — nunca DELETE: histórico de tarefas
// fica preservado mesmo quando canceladas, mesma filosofia usada para os leads.
tasksRouter.put('/tasks/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, description, dueDate } = req.body;

    const sets: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      if (!VALID_TASK_STATUS.includes(status)) {
        return res
          .status(400)
          .json({ error: `status deve ser um de: ${VALID_TASK_STATUS.join(', ')}` });
      }
      sets.push('status = ?');
      params.push(status);
      sets.push('completed_at = ?');
      params.push(status === 'done' ? new Date().toISOString() : null);
    }
    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ error: 'Descrição da tarefa não pode ficar vazia.' });
      }
      if (!isWithinMaxLength(description, 500)) {
        return res
          .status(400)
          .json({ error: 'Descrição da tarefa é longa demais (máx. 500 caracteres).' });
      }
      sets.push('description = ?');
      params.push(description.trim());
    }
    if (dueDate !== undefined) {
      const due = normalizeDueDate(dueDate);
      if (!due.ok) {
        return res.status(400).json({ error: 'dueDate inválida. Use uma data ISO 8601.' });
      }
      sets.push('due_date = ?');
      params.push(due.value);
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: 'Nada para atualizar.' });
    }

    const db = await getDatabase();
    const company = tenantCompany(req);
    const beforeRes = await db.exec(
      `SELECT t.lead_id, t.status, t.user_id FROM tasks t JOIN leads l ON l.id = t.lead_id WHERE t.id = ? AND ${leadCompanyClause()}`,
      [id, company],
    );
    if (beforeRes.length === 0 || beforeRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    const [leadId, previousStatus, taskUserId] = beforeRes[0].values[0];

    // ONDA3-43: ownership — vendedor só altera tarefa própria (ou sem
    // responsável); gestor/admin altera qualquer tarefa do tenant. Tarefa com
    // user_id NULL permanece editável por qualquer usuário do tenant
    // (legado: tarefas criadas antes do auto-assign).
    if (
      taskUserId !== null &&
      taskUserId !== undefined &&
      String(taskUserId) !== '' &&
      !canActOnUserTasks(req, String(taskUserId))
    ) {
      return forbidOtherUsersTasks(res);
    }

    params.push(id);
    await db.run(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, params);
    if (status !== undefined && status !== previousStatus) {
      await logActivity(db, {
        leadId,
        // Autoria real = sessão. Antes o body podia enviar `userId` arbitrário
        // e sujar o audit log com outro autor.
        userId: req.outboundUser?.id ?? null,
        action: 'task_status_changed',
        fromValue: previousStatus,
        toValue: status,
      });
    }
    saveDatabase();

    const afterRes = await db.exec(`SELECT * FROM tasks WHERE id = ?`, [id]);
    res.json(mapRows(afterRes)[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao atualizar tarefa.' });
  }
});

// Painel do vendedor: todas as suas tarefas, de todos os leads, consolidadas
// (para a tela de acompanhamento — atrasadas, de hoje, próximas, concluídas).
tasksRouter.get('/users/:userId/tasks', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    // ONDA3-43: self-service — vendedor só lista as próprias tarefas; ver
    // tarefas de outro usuário exige perfil gestor/admin (mesmo critério do
    // painel GET /tasks). Antes qualquer autenticado lia tarefas alheias.
    if (!canActOnUserTasks(req, userId)) {
      return forbidOtherUsersTasks(res);
    }
    const db = await getDatabase();
    const company = tenantCompany(req);
    // Escopo de tenant via JOIN em leads (tasks não tem coluna company própria):
    // sem o filtro, qualquer autenticado lia as tarefas de outro vendedor/tenant.
    const result = await db.exec(
      `SELECT t.*, l.name AS lead_name, l.company AS lead_company
       FROM tasks t
       JOIN leads l ON l.id = t.lead_id
       WHERE t.user_id = ? AND ${leadCompanyClause()}
       ORDER BY (t.status = 'pending') DESC, t.due_date ASC NULLS LAST, t.created_at DESC`,
      [userId, company],
    );
    res.json(mapRows(result));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Painel gerencial: tarefas de TODOS os vendedores, agrupáveis por vendedor no
// front — restrito a admin/gestor (um vendedor comum só vê as próprias em /users/:userId/tasks).
tasksRouter.get('/tasks', requireManager, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const company = tenantCompany(req);
    // Painel gerencial continua por tenant: gestor/admin só vê tarefas de
    // leads da própria company (antes listava o banco inteiro).
    const result = await db.exec(
      `SELECT t.*, l.name AS lead_name, l.company AS lead_company, u.name AS user_name
       FROM tasks t
       JOIN leads l ON l.id = t.lead_id
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.status != 'cancelled' AND ${leadCompanyClause()}
       ORDER BY (t.status = 'pending') DESC, t.due_date ASC NULLS LAST, t.created_at DESC`,
      [company],
    );
    res.json(mapRows(result));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

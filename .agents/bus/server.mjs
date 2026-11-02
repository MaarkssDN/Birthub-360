import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const PORT = process.env.AGENT_BUS_PORT ? parseInt(process.env.AGENT_BUS_PORT, 10) : 4100;
const DB_PATH = path.join(__dirname, 'agent_bus.db');
const ROSTER_PATH = path.join(__dirname, 'roster.json');

// Inicializa banco SQLite
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    slug TEXT,
    name TEXT,
    role TEXT,
    category TEXT,
    status TEXT DEFAULT 'offline',
    pid INTEGER DEFAULT 0,
    worktree TEXT DEFAULT '',
    last_seen_at INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER,
    from_id TEXT,
    to_id TEXT,
    type TEXT,
    subject TEXT,
    content TEXT,
    metadata_json TEXT DEFAULT '{}',
    read_at INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS handoffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wave INTEGER,
    from_id TEXT,
    to_id TEXT,
    title TEXT,
    file_path TEXT,
    status TEXT DEFAULT 'aberto',
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS wave_state (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Inicializa estado padrão da onda se não existir
const existingWave = db.prepare("SELECT value FROM wave_state WHERE key = 'current_wave'").get();
if (!existingWave) {
  db.prepare("INSERT INTO wave_state (key, value) VALUES ('current_wave', '1')").run();
  db.prepare("INSERT INTO wave_state (key, value) VALUES ('wave_title', 'Onda 1 — Fundação e Plataforma')").run();
  db.prepare("INSERT INTO wave_state (key, value) VALUES ('steps', ?)").run(JSON.stringify([
    { id: 'step-0', text: 'Baseline de typecheck/lint/test verificado', done: true, owner: '00' },
    { id: 'step-1', text: 'Worktrees isolados para especialistas da onda', done: true, owner: '00' },
    { id: 'step-2', text: 'Schema Prisma e migrações seguras de RLS', done: false, owner: '01' },
    { id: 'step-3', text: 'Rotas principais e navegação no App.tsx', done: false, owner: '02' },
    { id: 'step-4', text: 'Observabilidade das integrações Bitrix24', done: false, owner: '06' },
    { id: 'step-5', text: 'Auditoria independente de diff e escopo', done: false, owner: '24' },
    { id: 'step-6', text: 'Gate de integração verde e aprovação de release', done: false, owner: '00' }
  ]));
}

// Sincroniza roster oficial
if (fs.existsSync(ROSTER_PATH)) {
  try {
    const roster = JSON.parse(fs.readFileSync(ROSTER_PATH, 'utf-8'));
    const upsertStmt = db.prepare(`
      INSERT INTO agents (id, slug, name, role, category, last_seen_at)
      VALUES (?, ?, ?, ?, ?, 0)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        role = excluded.role,
        category = excluded.category;
    `);
    for (const item of roster) {
      upsertStmt.run(item.id, item.slug, item.name, item.role, item.category);
    }
  } catch (err) {
    console.error('Erro ao ler roster.json:', err.message);
  }
}

// Clientes SSE
const sseClients = new Set();

function broadcastEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

// Servidor HTTP
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    return res.end();
  }

  // SSE Stream
  if (pathname === '/api/events') {
    const agentId = url.searchParams.get('agentId') || null;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ agentId, timestamp: Date.now() })}\n\n`);

    const clientObj = { res, agentId };
    sseClients.add(clientObj);

    req.on('close', () => {
      sseClients.delete(clientObj);
    });
    return;
  }

  // API: Status geral com slots e concorrência
  if (req.method === 'GET' && pathname === '/api/status') {
    const now = Date.now();
    const agents = db.prepare('SELECT * FROM agents ORDER BY id ASC').all();
    const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
    const totalHandoffs = db.prepare('SELECT COUNT(*) as count FROM handoffs').get().count;
    const waveNum = db.prepare("SELECT value FROM wave_state WHERE key = 'current_wave'").get()?.value || '1';
    const waveTitle = db.prepare("SELECT value FROM wave_state WHERE key = 'wave_title'").get()?.value || 'Onda 1';
    const stepsJson = db.prepare("SELECT value FROM wave_state WHERE key = 'steps'").get()?.value || '[]';
    const steps = JSON.parse(stepsJson);

    const mappedAgents = agents.map(a => {
      const isOnline = a.status !== 'offline' && (now - a.last_seen_at < 60000);
      return {
        ...a,
        isOnline,
        computedStatus: isOnline ? a.status : 'offline'
      };
    });

    const onlineCount = mappedAgents.filter(a => a.isOnline).length;
    const completedSteps = steps.filter(s => s.done).length;
    const progressPercent = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

    return sendJson(res, 200, {
      ok: true,
      port: PORT,
      timestamp: now,
      onlineCount,
      maxAllowedSlots: 8,
      recommendedSlots: 3,
      totalAgents: agents.length,
      totalMessages,
      totalHandoffs,
      wave: {
        number: parseInt(waveNum, 10),
        title: waveTitle,
        progressPercent,
        completedSteps,
        totalSteps: steps.length,
        steps
      },
      agents: mappedAgents
    });
  }

  // API: Alternar status do step da onda
  if (req.method === 'POST' && pathname === '/api/wave/toggle-step') {
    try {
      const body = await getJsonBody(req);
      const { stepId } = body;
      const stepsJson = db.prepare("SELECT value FROM wave_state WHERE key = 'steps'").get()?.value || '[]';
      const steps = JSON.parse(stepsJson);

      const target = steps.find(s => s.id === stepId);
      if (target) {
        target.done = !target.done;
        db.prepare("UPDATE wave_state SET value = ? WHERE key = 'steps'").run(JSON.stringify(steps));
        broadcastEvent('wave_updated', { steps });
        return sendJson(res, 200, { ok: true, steps });
      }
      return sendJson(res, 404, { error: 'Step não encontrado' });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // API: Atualizar status do agente (online, busy, offline)
  if (req.method === 'POST' && pathname === '/api/agents/set-status') {
    try {
      const body = await getJsonBody(req);
      const { id, status } = body;
      if (!id || !status) return sendJson(res, 400, { error: 'id e status são obrigatórios' });

      const now = Date.now();
      const lastSeen = status === 'offline' ? 0 : now;
      db.prepare('UPDATE agents SET status = ?, last_seen_at = ? WHERE id = ?').run(status, lastSeen, id);

      broadcastEvent('agent_status_changed', { id, status, last_seen_at: lastSeen });
      return sendJson(res, 200, { ok: true, id, status });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // API: Lista de agentes
  if (req.method === 'GET' && pathname === '/api/agents') {
    const now = Date.now();
    const agents = db.prepare('SELECT * FROM agents ORDER BY id ASC').all().map(a => {
      const isOnline = a.status !== 'offline' && (now - a.last_seen_at < 60000);
      return { ...a, isOnline, computedStatus: isOnline ? a.status : 'offline' };
    });
    return sendJson(res, 200, { ok: true, agents });
  }

  // API: Registro de agente
  if (req.method === 'POST' && pathname === '/api/register') {
    try {
      const body = await getJsonBody(req);
      const { id, worktree, pid, status } = body;
      if (!id) return sendJson(res, 400, { error: 'ID do agente obrigatório' });

      const now = Date.now();
      const current = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);

      if (current) {
        db.prepare(`
          UPDATE agents
          SET status = ?, worktree = COALESCE(?, worktree), pid = COALESCE(?, pid), last_seen_at = ?
          WHERE id = ?
        `).run(status || 'online', worktree || null, pid || 0, now, id);
      } else {
        db.prepare(`
          INSERT INTO agents (id, slug, name, role, category, status, worktree, pid, last_seen_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, body.slug || id, body.name || `Agente ${id}`, body.role || 'Especialista', body.category || 'Geral', status || 'online', worktree || '', pid || 0, now);
      }

      broadcastEvent('agent_registered', { id, status: status || 'online', last_seen_at: now });
      return sendJson(res, 200, { ok: true, id, status: status || 'online' });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // API: Heartbeat
  if (req.method === 'POST' && pathname === '/api/heartbeat') {
    try {
      const body = await getJsonBody(req);
      const { id, status } = body;
      if (!id) return sendJson(res, 400, { error: 'ID obrigatório' });
      const now = Date.now();

      db.prepare(`UPDATE agents SET last_seen_at = ?, status = COALESCE(?, status) WHERE id = ?`).run(now, status || null, id);
      return sendJson(res, 200, { ok: true, id, timestamp: now });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // API: Enviar mensagem
  if (req.method === 'POST' && pathname === '/api/messages') {
    try {
      const body = await getJsonBody(req);
      const { from_id, to_id, type, subject, content, metadata } = body;
      if (!from_id || !to_id || !content) {
        return sendJson(res, 400, { error: 'from_id, to_id e content são obrigatórios' });
      }

      const now = Date.now();
      const metaStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : '{}';
      const insert = db.prepare(`
        INSERT INTO messages (created_at, from_id, to_id, type, subject, content, metadata_json, read_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `).run(now, from_id, to_id, type || 'CHAT', subject || '', content, metaStr);

      const msg = {
        id: insert.lastInsertRowid,
        created_at: now,
        from_id,
        to_id,
        type: type || 'CHAT',
        subject: subject || '',
        content,
        metadata: metadata || {},
        read_at: 0
      };

      // Atualiza status e last_seen do remetente
      db.prepare(`UPDATE agents SET last_seen_at = ?, status = 'online' WHERE id = ?`).run(now, from_id);

      // Dispara SSE para ouvintes
      broadcastEvent('message', msg);

      return sendJson(res, 201, { ok: true, message: msg });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // API: Buscar mensagens (com suporte a conversação direta entre dois agentes)
  if (req.method === 'GET' && pathname === '/api/messages') {
    const agentId = url.searchParams.get('agentId');
    const peerId = url.searchParams.get('peerId');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const since = parseInt(url.searchParams.get('since') || '0', 10);

    let rows;
    if (peerId && agentId) {
      // Conversa bidirecional específica entre A e B (ou broadcast)
      rows = db.prepare(`
        SELECT * FROM messages
        WHERE created_at > ? AND (
          (from_id = ? AND to_id = ?) OR
          (from_id = ? AND to_id = ?) OR
          (to_id = 'ALL' AND (from_id = ? OR from_id = ?))
        )
        ORDER BY created_at DESC LIMIT ?
      `).all(since, agentId, peerId, peerId, agentId, agentId, peerId, limit);
    } else if (agentId) {
      rows = db.prepare(`
        SELECT * FROM messages
        WHERE created_at > ? AND (to_id = ? OR to_id = 'ALL' OR from_id = ?)
        ORDER BY created_at DESC LIMIT ?
      `).all(since, agentId, agentId, limit);
    } else {
      rows = db.prepare(`
        SELECT * FROM messages
        WHERE created_at > ?
        ORDER BY created_at DESC LIMIT ?
      `).all(since, limit);
    }

    return sendJson(res, 200, { ok: true, count: rows.length, messages: rows.reverse() });
  }

  // API: Criar handoff formal
  if (req.method === 'POST' && pathname === '/api/handoff') {
    try {
      const body = await getJsonBody(req);
      const { wave = 1, from_id, to_id, slug, problem, involved_files, evidence, required_change, expected_test, priority = 'alto' } = body;
      if (!from_id || !to_id || !slug || !problem) {
        return sendJson(res, 400, { error: 'from_id, to_id, slug e problem são obrigatórios' });
      }

      const waveDir = path.join(REPO_ROOT, '.agents', 'handoffs', `onda-${wave}`);
      if (!fs.existsSync(waveDir)) {
        fs.mkdirSync(waveDir, { recursive: true });
      }

      const fileName = `${from_id}-para-${to_id}-${slug}.md`;
      const filePath = path.join(waveDir, fileName);
      const relPath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');

      const fileContent = `De: Agente ${from_id}
Para: Agente ${to_id}
Onda: ${wave}
Status: aberto
Prioridade: ${priority}
Data: ${new Date().toISOString()}

## Problema
${problem}

## Arquivo(s) envolvido(s)
${involved_files || 'Não informado'}

## Evidência
${evidence || 'Registrado via Agent Bus'}

## Alteração necessária
${required_change || 'Aguardando ação'}

## Teste esperado
${expected_test || 'Validação de gate'}
`;

      fs.writeFileSync(filePath, fileContent, 'utf-8');

      const now = Date.now();
      db.prepare(`
        INSERT INTO handoffs (wave, from_id, to_id, title, file_path, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'aberto', ?)
      `).run(wave, from_id, to_id, slug, relPath, now);

      // Notifica via mensagem no bus
      const msgContent = `Novo Handoff criado: ${relPath}\nPrioridade: ${priority}\nProblema: ${problem}`;
      db.prepare(`
        INSERT INTO messages (created_at, from_id, to_id, type, subject, content, metadata_json, read_at)
        VALUES (?, ?, ?, 'HANDOFF', ?, ?, ?, 0)
      `).run(now, from_id, to_id, `Handoff: ${slug}`, msgContent, JSON.stringify({ filePath: relPath, wave }));

      broadcastEvent('handoff_created', { wave, from_id, to_id, slug, filePath: relPath });
      broadcastEvent('message', {
        created_at: now,
        from_id,
        to_id,
        type: 'HANDOFF',
        subject: `Handoff: ${slug}`,
        content: msgContent
      });

      return sendJson(res, 201, { ok: true, filePath: relPath });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // Web Dashboard UI
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(renderDashboardHtml());
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BIRTH HUB 360 &mdash; Mission Control & Agent Mesh</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --surface: #0f172a;
      --card-bg: #141e33;
      --card-hover: #1a2742;
      --border: #1e293b;
      --border-accent: rgba(56, 189, 248, 0.35);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.18);
      --indigo: #6366f1;
      --green: #10b981;
      --green-glow: rgba(16, 185, 129, 0.2);
      --yellow: #f59e0b;
      --red: #ef4444;
      --purple: #a855f7;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* BARRA SUPERIOR PRINCIPAL */
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      z-index: 10;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #0284c7, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #fff;
      font-size: 0.95rem;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
    }

    .brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
    }

    .brand-sub {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* BARRA DE STATUS DOS AGENTES (SLOTS) */
    .status-bar-metrics {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .metric-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.76rem;
      font-weight: 600;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-green { background: var(--green); box-shadow: 0 0 8px var(--green); }
    .dot-yellow { background: var(--yellow); box-shadow: 0 0 8px var(--yellow); }
    .dot-blue { background: var(--primary); box-shadow: 0 0 8px var(--primary); }

    /* BARRA DE PROGRESSO DA ONDA */
    .wave-progress-bar-container {
      background: #0b1220;
      border-bottom: 1px solid var(--border);
      padding: 8px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-shrink: 0;
    }

    .wave-info {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 260px;
    }

    .wave-tag {
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #818cf8;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .wave-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: #fff;
    }

    .progress-track-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 600px;
    }

    .progress-bar-bg {
      flex: 1;
      height: 7px;
      background: var(--card-bg);
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border);
      position: relative;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #0284c7, #38bdf8, #10b981);
      border-radius: 10px;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-percent-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary);
      font-family: var(--font-mono);
      min-width: 42px;
    }

    .steps-checklist-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .steps-checklist-btn:hover {
      border-color: var(--primary);
      color: #fff;
    }

    /* LAYOUT PRINCIPAL DE 3 COLUNAS */
    .main-grid {
      display: grid;
      grid-template-columns: 340px 1fr 340px;
      flex: 1;
      overflow: hidden;
    }

    /* COLUNA ESQUERDA: ROSTER */
    .sidebar {
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.01);
    }

    .search-box {
      position: relative;
    }

    .search-box input {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 7px 12px 7px 32px;
      color: #fff;
      font-size: 0.8rem;
      font-family: var(--font-sans);
      outline: none;
      transition: border-color 0.15s;
    }

    .search-box input:focus {
      border-color: var(--primary);
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      color: var(--text-dim);
    }

    .filter-chips {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .chip {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .chip.active, .chip:hover {
      background: var(--primary-glow);
      border-color: var(--primary);
      color: var(--primary);
    }

    .roster-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .agent-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      gap: 12px;
      align-items: center;
      position: relative;
    }

    .agent-card:hover {
      border-color: var(--border-accent);
      background: var(--card-hover);
      transform: translateY(-1px);
    }

    .agent-card.selected {
      border-color: var(--primary);
      background: rgba(56, 189, 248, 0.08);
      box-shadow: inset 3px 0 0 var(--primary);
    }

    .agent-avatar {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: #38bdf8;
      border: 1px solid var(--border);
      flex-shrink: 0;
    }

    .agent-card.online .agent-avatar {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
      color: var(--green);
    }

    .agent-body {
      flex: 1;
      min-width: 0;
    }

    .agent-topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .agent-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .agent-role {
      font-size: 0.72rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      text-transform: uppercase;
      font-family: var(--font-mono);
    }

    .badge-online { background: rgba(16, 185, 129, 0.2); color: var(--green); border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-offline { background: rgba(100, 116, 139, 0.15); color: var(--text-dim); }
    .badge-busy { background: rgba(245, 158, 11, 0.2); color: var(--yellow); border: 1px solid rgba(245, 158, 11, 0.4); }

    /* COLUNA CENTRAL: CONVERSAÇÃO ENTRE AGENTES */
    .chat-panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #0b111e;
    }

    .chat-header {
      padding: 12px 20px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .chat-target-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat-target-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
    }

    .chat-target-subtitle {
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .chat-feed {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .msg-bubble {
      display: flex;
      flex-direction: column;
      max-width: 85%;
      border-radius: 10px;
      padding: 12px 14px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      position: relative;
    }

    .msg-bubble.from-me {
      align-self: flex-end;
      background: #1e293b;
      border-color: rgba(56, 189, 248, 0.3);
    }

    .msg-bubble.from-peer {
      align-self: flex-start;
      background: var(--card-bg);
    }

    .msg-bubble.broadcast {
      align-self: center;
      max-width: 92%;
      background: rgba(99, 102, 241, 0.1);
      border-color: rgba(99, 102, 241, 0.3);
    }

    .msg-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 6px;
      font-size: 0.74rem;
    }

    .msg-actors {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      color: #fff;
    }

    .tag-type {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-family: var(--font-mono);
    }
    .tag-TASK { background: rgba(56, 189, 248, 0.2); color: var(--primary); }
    .tag-HANDOFF { background: rgba(168, 85, 247, 0.2); color: var(--purple); }
    .tag-ALERT { background: rgba(239, 68, 68, 0.2); color: var(--red); }
    .tag-GATE { background: rgba(245, 158, 11, 0.2); color: var(--yellow); }
    .tag-CHAT { background: rgba(255, 255, 255, 0.1); color: #fff; }

    .msg-subject-line {
      font-weight: 700;
      color: #fff;
      font-size: 0.85rem;
      margin-bottom: 4px;
    }

    .msg-text {
      color: var(--text);
      font-size: 0.82rem;
      line-height: 1.45;
      white-space: pre-wrap;
      font-family: var(--font-mono);
      background: rgba(0,0,0,0.25);
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.04);
    }

    .msg-time {
      font-size: 0.68rem;
      color: var(--text-dim);
      margin-top: 4px;
      text-align: right;
    }

    /* BARRA DE ENVIO DE MENSAGENS */
    .chat-composer {
      padding: 14px 20px;
      background: var(--surface);
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
    }

    .composer-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .composer-actors {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      font-weight: 600;
    }

    select, input[type="text"] {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 10px;
      color: #fff;
      font-size: 0.78rem;
      font-family: var(--font-sans);
      outline: none;
    }

    select:focus, input:focus {
      border-color: var(--primary);
    }

    .input-row {
      display: flex;
      gap: 10px;
    }

    textarea.chat-input {
      flex: 1;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-size: 0.84rem;
      font-family: var(--font-mono);
      outline: none;
      resize: none;
      min-height: 58px;
      max-height: 120px;
    }

    textarea.chat-input:focus {
      border-color: var(--primary);
    }

    .btn-send {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #000;
      border: none;
      font-weight: 700;
      padding: 0 18px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-send:hover {
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
      transform: translateY(-1px);
    }

    /* COLUNA DIREITA: GATES, HANDOFFS & METRICAS */
    .ops-panel {
      background: var(--surface);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 16px;
      gap: 16px;
    }

    .section-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .checklist-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .check-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.78rem;
      cursor: pointer;
      padding: 4px 0;
      user-select: none;
    }

    .check-box {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.68rem;
      color: #fff;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .check-item.done .check-box {
      background: var(--green);
      border-color: var(--green);
    }

    .check-item.done span {
      color: var(--text-dim);
      text-decoration: line-through;
    }

    .handoff-quick-form {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .handoff-quick-form label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .btn-handoff {
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.3);
      color: #d8b4fe;
      font-weight: 700;
      padding: 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-handoff:hover {
      background: rgba(168, 85, 247, 0.25);
      border-color: var(--purple);
    }

    .cmd-badge {
      background: #000;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 10px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--primary);
      word-break: break-all;
      position: relative;
    }

    .cmd-copy-btn {
      position: absolute;
      right: 6px;
      top: 6px;
      background: rgba(255,255,255,0.1);
      border: none;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      cursor: pointer;
    }
  </style>
</head>
<body>

  <!-- 1. HEADER PRINCIPAL -->
  <header>
    <div class="brand-section">
      <div class="brand-logo">
        <div class="logo-badge">360</div>
        <div>
          <div class="brand-title">BIRTH HUB 360 &bull; Mission Control</div>
          <div class="brand-sub">Rede Autônoma de Agentes & Governança AGENTS.md</div>
        </div>
      </div>
    </div>

    <!-- METRICAS DE STATUS / SLOTS -->
    <div class="status-bar-metrics">
      <div class="metric-pill">
        <span class="dot dot-green"></span>
        <span>Mesh Porta <span id="portDisplay">${PORT}</span></span>
      </div>

      <div class="metric-pill" title="Regra AGENTS.md: máximo 8 especialistas simultâneos">
        <span class="dot" id="concurrencyDot"></span>
        <span>Slots Concorrentes: <strong id="slotsDisplay">0 / 8</strong></span>
      </div>

      <div class="metric-pill">
        <span class="dot dot-blue"></span>
        <span>Handoffs Ativos: <strong id="handoffCountDisplay">0</strong></span>
      </div>
    </div>
  </header>

  <!-- 2. BARRA DE PROGRESSO DA ONDA -->
  <div class="wave-progress-bar-container">
    <div class="wave-info">
      <span class="wave-tag" id="waveTag">Onda 1</span>
      <span class="wave-name" id="waveTitle">Fundação & Plataforma</span>
    </div>

    <div class="progress-track-wrapper">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progressBarFill" style="width: 28%;"></div>
      </div>
      <div class="progress-percent-label" id="progressPercentLabel">28%</div>
    </div>

    <div style="display: flex; gap: 8px;">
      <span style="font-size: 0.75rem; color: var(--text-muted); align-self: center;" id="progressStepsLabel">2 de 7 marcos</span>
    </div>
  </div>

  <!-- 3. MAIN WORKSPACE (3 COLUNAS) -->
  <div class="main-grid">

    <!-- COLUNA 1: ROSTER DE AGENTES & PESQUISA -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="search-box">
          <span class="search-icon">&#128269;</span>
          <input type="text" id="agentSearch" placeholder="Buscar por ID, nome ou função..." oninput="filterAgents()">
        </div>
        <div class="filter-chips">
          <div class="chip active" onclick="setCategoryFilter('ALL', this)">Todos (<span id="totalAgentsCount">26</span>)</div>
          <div class="chip" onclick="setCategoryFilter('ONLINE', this)">Online (<span id="onlineAgentsCount">0</span>)</div>
          <div class="chip" onclick="setCategoryFilter('Coordenação', this)">Coordenação</div>
          <div class="chip" onclick="setCategoryFilter('Engenharia', this)">Engenharia</div>
          <div class="chip" onclick="setCategoryFilter('Produto', this)">Produto</div>
          <div class="chip" onclick="setCategoryFilter('Governança', this)">Governança</div>
        </div>
      </div>

      <div class="roster-list" id="rosterList">
        <!-- Renderizado dinamicamente via JS -->
      </div>
    </div>

    <!-- COLUNA 2: CONVERSAÇÃO ENTRE AGENTES (CHAT VIEW) -->
    <div class="chat-panel">
      <div class="chat-header">
        <div class="chat-target-info">
          <div class="agent-avatar" id="activeChatAvatar">00</div>
          <div>
            <div class="chat-target-title" id="activeChatTitle">Canal Geral de Broadcast (Todos os Agentes)</div>
            <div class="chat-target-subtitle" id="activeChatSubtitle">Transmissão aberta para toda a rede de especialistas</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="chip" style="font-size: 0.72rem;" onclick="loadMessages()">&#x21bb; Atualizar</button>
        </div>
      </div>

      <div class="chat-feed" id="chatFeed">
        <!-- Mensagens renderizadas aqui -->
      </div>

      <!-- COMPOSER DE MENSAGENS -->
      <div class="chat-composer">
        <div class="composer-toolbar">
          <div class="composer-actors">
            <span style="color: var(--text-muted);">De:</span>
            <select id="chatSenderSelect">
              <option value="00">Agente 00 — Coordenador (Você)</option>
              <!-- Popula agentes disponíveis para simulação -->
            </select>

            <span style="color: var(--text-muted); margin-left: 8px;">Tipo:</span>
            <select id="chatTypeSelect">
              <option value="TASK">TASK (Ordem de Missão)</option>
              <option value="HANDOFF">HANDOFF (Transferência Formal)</option>
              <option value="CHAT">CHAT (Conversa Direta)</option>
              <option value="GATE">GATE (Validação de Gate)</option>
              <option value="ALERT">ALERT (Bloqueador)</option>
            </select>
          </div>

          <div style="font-size: 0.72rem; color: var(--text-dim);">
            Pressione <strong>Enter</strong> para enviar
          </div>
        </div>

        <div class="input-row">
          <input type="text" id="chatSubjectInput" placeholder="Assunto (opcional)..." style="width: 240px;">
          <textarea class="chat-input" id="chatContentInput" placeholder="Digite a mensagem ou diretriz para o agente..." onkeydown="handleChatKeyDown(event)"></textarea>
          <button class="btn-send" onclick="sendChatMessage()">
            <span>Enviar</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>

    <!-- COLUNA 3: MARCOS DA ONDA, HANDOFFS & COMANDOS -->
    <div class="ops-panel">

      <!-- MARCOS DA ONDA (CHECKLIST) -->
      <div>
        <div class="section-title">
          <span>Marcos da Onda Ativa</span>
          <span style="font-size: 0.7rem; color: var(--primary);" id="waveStepCount">2/7</span>
        </div>
        <div class="checklist-card" id="checklistCard">
          <!-- Gerado dinamicamente -->
        </div>
      </div>

      <!-- REGISTRAR HANDOFF FORMAL -->
      <div>
        <div class="section-title">
          <span>Novo Handoff Formal (AGENTS.md)</span>
        </div>
        <div class="handoff-quick-form">
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1;">
              <label>De (Origem)</label>
              <select id="handoffFromSelect" style="width: 100%;"></select>
            </div>
            <div style="flex: 1;">
              <label>Para (Destino)</label>
              <select id="handoffToSelect" style="width: 100%;"></select>
            </div>
          </div>
          <div>
            <label>Identificador / Slug</label>
            <input type="text" id="handoffSlugInput" placeholder="ex: contrato-rotas-leads" style="width: 100%;">
          </div>
          <div>
            <label>Problema / Necessidade</label>
            <input type="text" id="handoffProblemInput" placeholder="ex: Ajustar schema e contrato da API" style="width: 100%;">
          </div>
          <button class="btn-handoff" onclick="submitHandoff()">Criar Handoff Físico (.md)</button>
        </div>
      </div>

      <!-- COMANDO RÁPIDO DO TERMINAL -->
      <div>
        <div class="section-title">
          <span>Lançar Sessão no Terminal</span>
        </div>
        <div class="cmd-badge">
          <span id="terminalCmdText">node .agents/bus/agent-cli.mjs session --id 01</span>
          <button class="cmd-copy-btn" onclick="copyTerminalCmd()">Copiar</button>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 6px;">
          Ou no PowerShell: <code style="color:var(--text); font-family:var(--font-mono);">.\.agents\bus\launch-agent.ps1 -AgentId "01"</code>
        </div>
      </div>

    </div>

  </div>

  <script>
    let allAgents = [];
    let currentCategoryFilter = 'ALL';
    let activeChatTargetId = 'ALL'; // 'ALL' ou o ID do agente selecionado
    let currentWaveData = null;

    async function loadStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        allAgents = data.agents || [];
        currentWaveData = data.wave;

        // Atualiza contadores
        document.getElementById('totalAgentsCount').innerText = data.totalAgents;
        document.getElementById('onlineAgentsCount').innerText = data.onlineCount;
        document.getElementById('handoffCountDisplay').innerText = data.totalHandoffs;
        
        // Concorrência e slots
        const slotsEl = document.getElementById('slotsDisplay');
        const dotEl = document.getElementById('concurrencyDot');
        slotsEl.innerText = \`\${data.onlineCount} / \${data.maxAllowedSlots}\`;

        if (data.onlineCount <= 3) {
          dotEl.className = 'dot dot-green';
        } else if (data.onlineCount <= 8) {
          dotEl.className = 'dot dot-yellow';
        } else {
          dotEl.className = 'dot';
          dotEl.style.background = 'var(--red)';
          dotEl.style.boxShadow = '0 0 8px var(--red)';
        }

        // Progresso da onda
        if (data.wave) {
          document.getElementById('waveTag').innerText = \`Onda \${data.wave.number}\`;
          document.getElementById('waveTitle').innerText = data.wave.title;
          document.getElementById('progressBarFill').style.width = \`\${data.wave.progressPercent}%\`;
          document.getElementById('progressPercentLabel').innerText = \`\${data.wave.progressPercent}%\`;
          document.getElementById('progressStepsLabel').innerText = \`\${data.wave.completedSteps} de \${data.wave.totalSteps} marcos\`;
          document.getElementById('waveStepCount').innerText = \`\${data.wave.completedSteps}/\${data.wave.totalSteps}\`;
          renderChecklist(data.wave.steps);
        }

        renderRoster();
        populateSelects();
      } catch (err) {
        console.error('Erro ao buscar status:', err);
      }
    }

    function renderChecklist(steps) {
      const card = document.getElementById('checklistCard');
      card.innerHTML = '';
      (steps || []).forEach(s => {
        const item = document.createElement('div');
        item.className = 'check-item' + (s.done ? ' done' : '');
        item.onclick = () => toggleStep(s.id);
        item.innerHTML = \`
          <div class="check-box">\${s.done ? '&#10003;' : ''}</div>
          <div style="flex:1;">
            <span>\${escapeHtml(s.text)}</span>
            \${s.owner ? '<span style="font-size:0.65rem; color:var(--primary); font-family:var(--font-mono); margin-left:4px;">[' + s.owner + ']</span>' : ''}
          </div>
        \`;
        card.appendChild(item);
      });
    }

    async function toggleStep(stepId) {
      try {
        await fetch('/api/wave/toggle-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepId })
        });
        loadStatus();
      } catch (err) {
        console.error('Erro ao alternar step:', err);
      }
    }

    function renderRoster() {
      const container = document.getElementById('rosterList');
      const searchVal = document.getElementById('agentSearch').value.toLowerCase();
      container.innerHTML = '';

      // Adiciona card fixo do Broadcast
      const broadcastCard = document.createElement('div');
      broadcastCard.className = 'agent-card' + (activeChatTargetId === 'ALL' ? ' selected' : '');
      broadcastCard.onclick = () => selectChatTarget('ALL', 'Canal Geral de Broadcast', 'Transmissão aberta para toda a rede');
      broadcastCard.innerHTML = \`
        <div class="agent-avatar" style="color:#818cf8; background:rgba(99,102,241,0.15);">&#128226;</div>
        <div class="agent-body">
          <div class="agent-topline">
            <span class="agent-name">Broadcast Geral</span>
            <span class="status-badge badge-online">ATIVO</span>
          </div>
          <div class="agent-role">Todos os agentes ouvintes</div>
        </div>
      \`;
      container.appendChild(broadcastCard);

      allAgents.forEach(a => {
        // Filtro de categoria
        if (currentCategoryFilter === 'ONLINE' && !a.isOnline) return;
        if (currentCategoryFilter !== 'ALL' && currentCategoryFilter !== 'ONLINE' && a.category !== currentCategoryFilter) return;

        // Filtro de busca
        if (searchVal) {
          const matchId = a.id.toLowerCase().includes(searchVal);
          const matchName = a.name.toLowerCase().includes(searchVal);
          const matchRole = a.role.toLowerCase().includes(searchVal);
          if (!matchId && !matchName && !matchRole) return;
        }

        const card = document.createElement('div');
        card.className = 'agent-card' + (a.isOnline ? ' online' : '') + (activeChatTargetId === a.id ? ' selected' : '');
        card.onclick = () => selectChatTarget(a.id, \`Agente \${a.id} — \${a.name}\`, a.role);

        const badgeClass = a.isOnline ? (a.computedStatus === 'busy' ? 'badge-busy' : 'badge-online') : 'badge-offline';
        const badgeText = a.isOnline ? (a.computedStatus === 'busy' ? 'OCUPADO' : 'ONLINE') : 'OFFLINE';

        card.innerHTML = \`
          <div class="agent-avatar">\${a.id}</div>
          <div class="agent-body">
            <div class="agent-topline">
              <span class="agent-name">\${a.name}</span>
              <span class="status-badge \${badgeClass}">\${badgeText}</span>
            </div>
            <div class="agent-role">\${a.role}</div>
            \${a.worktree ? '<div style="font-size:0.65rem; color:var(--primary); font-family:var(--font-mono); margin-top:2px;">📁 ' + a.worktree + '</div>' : ''}
          </div>
        \`;
        container.appendChild(card);
      });
    }

    function selectChatTarget(id, title, subtitle) {
      activeChatTargetId = id;
      document.getElementById('activeChatAvatar').innerText = id === 'ALL' ? '📢' : id;
      document.getElementById('activeChatTitle').innerText = title;
      document.getElementById('activeChatSubtitle').innerText = subtitle;
      document.getElementById('terminalCmdText').innerText = id === 'ALL'
        ? 'node .agents/bus/agent-cli.mjs session --id 00'
        : \`node .agents/bus/agent-cli.mjs session --id \${id}\`;

      renderRoster();
      loadMessages();
    }

    async function loadMessages() {
      let url = '/api/messages?limit=80';
      if (activeChatTargetId !== 'ALL') {
        // Conversa bidirecional entre Agente 00 e o alvo
        const sender = document.getElementById('chatSenderSelect').value || '00';
        url = \`/api/messages?agentId=\${sender}&peerId=\${activeChatTargetId}&limit=80\`;
      }

      try {
        const res = await fetch(url);
        const data = await res.json();
        renderChatFeed(data.messages || []);
      } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
      }
    }

    function renderChatFeed(msgs) {
      const feed = document.getElementById('chatFeed');
      if (msgs.length === 0) {
        feed.innerHTML = \`
          <div style="color:var(--text-dim); text-align:center; margin-top:60px; font-size:0.85rem;">
            Nenhuma mensagem neste canal ainda.<br>
            Use o campo abaixo para iniciar a conversa com este agente.
          </div>
        \`;
        return;
      }

      const currentSender = document.getElementById('chatSenderSelect').value;
      feed.innerHTML = '';

      msgs.forEach(m => {
        const bubble = document.createElement('div');
        const isFromMe = m.from_id === currentSender;
        const isBroadcast = m.to_id === 'ALL';

        bubble.className = 'msg-bubble ' + (isBroadcast ? 'broadcast' : (isFromMe ? 'from-me' : 'from-peer'));

        const timeStr = new Date(m.created_at).toLocaleTimeString('pt-BR');

        bubble.innerHTML = \`
          <div class="msg-meta">
            <div class="msg-actors">
              <span>Agente \${m.from_id}</span>
              <span>&rarr;</span>
              <span>\${m.to_id === 'ALL' ? '📢 TODOS' : 'Agente ' + m.to_id}</span>
              <span class="tag-type tag-\${m.type}">\${m.type}</span>
            </div>
          </div>
          \${m.subject ? '<div class="msg-subject-line">' + escapeHtml(m.subject) + '</div>' : ''}
          <div class="msg-text">\${escapeHtml(m.content)}</div>
          <div class="msg-time">\${timeStr}</div>
        \`;
        feed.appendChild(bubble);
      });

      feed.scrollTop = feed.scrollHeight;
    }

    async function sendChatMessage() {
      const from_id = document.getElementById('chatSenderSelect').value;
      const to_id = activeChatTargetId;
      const type = document.getElementById('chatTypeSelect').value;
      const subject = document.getElementById('chatSubjectInput').value.trim();
      const content = document.getElementById('chatContentInput').value.trim();

      if (!content) return;

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from_id, to_id, type, subject, content })
        });
        if (res.ok) {
          document.getElementById('chatContentInput').value = '';
          document.getElementById('chatSubjectInput').value = '';
          loadMessages();
        }
      } catch (err) {
        alert('Erro ao enviar mensagem: ' + err.message);
      }
    }

    function handleChatKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    }

    function populateSelects() {
      const senderSelect = document.getElementById('chatSenderSelect');
      const handoffFrom = document.getElementById('handoffFromSelect');
      const handoffTo = document.getElementById('handoffToSelect');

      const currentSender = senderSelect.value;
      senderSelect.innerHTML = '<option value="00">Agente 00 — Coordenador (Você)</option>';
      handoffFrom.innerHTML = '';
      handoffTo.innerHTML = '';

      allAgents.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = \`Agente \${a.id} — \${a.name}\`;
        senderSelect.appendChild(opt);

        const optFrom = opt.cloneNode(true);
        const optTo = opt.cloneNode(true);
        handoffFrom.appendChild(optFrom);
        handoffTo.appendChild(optTo);
      });

      if (currentSender) senderSelect.value = currentSender;
      handoffFrom.value = '01';
      handoffTo.value = '02';
    }

    async function submitHandoff() {
      const from_id = document.getElementById('handoffFromSelect').value;
      const to_id = document.getElementById('handoffToSelect').value;
      const slug = document.getElementById('handoffSlugInput').value.trim();
      const problem = document.getElementById('handoffProblemInput').value.trim();

      if (!slug || !problem) {
        alert('Preencha o slug e a descrição do problema.');
        return;
      }

      try {
        const res = await fetch('/api/handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wave: 1, from_id, to_id, slug, problem })
        });
        const data = await res.json();
        if (res.ok) {
          alert('Handoff criado com sucesso: ' + data.filePath);
          document.getElementById('handoffSlugInput').value = '';
          document.getElementById('handoffProblemInput').value = '';
          loadStatus();
          loadMessages();
        }
      } catch (err) {
        alert('Erro ao criar handoff: ' + err.message);
      }
    }

    function copyTerminalCmd() {
      const text = document.getElementById('terminalCmdText').innerText;
      navigator.clipboard.writeText(text);
      alert('Comando copiado para a área de transferência!');
    }

    function setCategoryFilter(cat, el) {
      currentCategoryFilter = cat;
      document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      renderRoster();
    }

    function filterAgents() {
      renderRoster();
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // SSE em tempo real
    function initEvents() {
      const evt = new EventSource('/api/events');
      evt.addEventListener('message', () => {
        loadMessages();
        loadStatus();
      });
      evt.addEventListener('agent_registered', () => {
        loadStatus();
      });
      evt.addEventListener('agent_status_changed', () => {
        loadStatus();
      });
      evt.addEventListener('wave_updated', () => {
        loadStatus();
      });
    }

    loadStatus();
    loadMessages();
    initEvents();
    setInterval(loadStatus, 20000);
  </script>
</body>
</html>`;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[AGENT BUS] Servidor ativo em http://localhost:${PORT}`);
  console.log(`[AGENT BUS] Mission Control disponível em http://localhost:${PORT}`);
});

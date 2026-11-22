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
    const recentHandoffs = db.prepare('SELECT * FROM handoffs ORDER BY created_at DESC LIMIT 8').all();
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
      recentHandoffs,
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

  // API: Buscar mensagens (com filtro flexível entre quaisquer agentes)
  if (req.method === 'GET' && pathname === '/api/messages') {
    const agentId = url.searchParams.get('agentId');
    const peerId = url.searchParams.get('peerId');
    const mode = url.searchParams.get('mode') || 'pair'; // 'pair', 'agent_all', 'global'
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const since = parseInt(url.searchParams.get('since') || '0', 10);

    let rows;
    if (mode === 'global' || (!agentId && !peerId)) {
      rows = db.prepare(`
        SELECT * FROM messages
        WHERE created_at > ?
        ORDER BY created_at DESC LIMIT ?
      `).all(since, limit);
    } else if (mode === 'agent_all' && agentId) {
      rows = db.prepare(`
        SELECT * FROM messages
        WHERE created_at > ? AND (from_id = ? OR to_id = ? OR to_id = 'ALL')
        ORDER BY created_at DESC LIMIT ?
      `).all(since, agentId, agentId, limit);
    } else if (peerId && agentId) {
      if (peerId === 'ALL') {
        rows = db.prepare(`
          SELECT * FROM messages
          WHERE created_at > ? AND (to_id = 'ALL' OR from_id = ? OR to_id = ?)
          ORDER BY created_at DESC LIMIT ?
        `).all(since, agentId, agentId, limit);
      } else {
        rows = db.prepare(`
          SELECT * FROM messages
          WHERE created_at > ? AND (
            (from_id = ? AND to_id = ?) OR
            (from_id = ? AND to_id = ?) OR
            (to_id = 'ALL' AND (from_id = ? OR from_id = ?))
          )
          ORDER BY created_at DESC LIMIT ?
        `).all(since, agentId, peerId, peerId, agentId, agentId, peerId, limit);
      }
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
      --bg: #070b14;
      --surface: #0f1629;
      --card-bg: #131c31;
      --card-elevated: #192540;
      --border: rgba(148, 163, 184, 0.14);
      --border-focus: rgba(56, 189, 248, 0.55);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.18);
      --indigo: #6366f1;
      --green: #10b981;
      --yellow: #f59e0b;
      --red: #ef4444;
      --purple: #a855f7;
      --radius-xl: 24px;
      --radius-lg: 18px;
      --radius-md: 14px;
      --radius-pill: 9999px;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', Consolas, monospace;
      --shadow-card: 0 12px 32px -8px rgba(0, 0, 0, 0.45);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: radial-gradient(circle at 15% 0%, #111b36 0%, var(--bg) 55%);
      color: var(--text);
      font-family: var(--font-sans);
      height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 16px 20px;
      gap: 16px;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* TOP BAR + WAVE PROGRESS EM BENTO CARD ARREDONDADO */
    .top-bar-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      box-shadow: var(--shadow-card);
      flex-shrink: 0;
    }

    .brand-cluster {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-circle {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #fff;
      font-size: 0.95rem;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.35);
      flex-shrink: 0;
    }

    .brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #fff;
    }

    .brand-subtitle {
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    /* PROGRESSO CENTRAL NA TOP BAR */
    .wave-progress-cluster {
      flex: 1;
      max-width: 520px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      padding: 8px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .wave-pill-badge {
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.45);
      color: #a5b4fc;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      text-transform: uppercase;
      white-space: nowrap;
    }

    .progress-track {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-pill);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #6366f1, #10b981);
      border-radius: var(--radius-pill);
      transition: width 0.4s ease;
    }

    .progress-pct {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary);
      min-width: 38px;
      text-align: right;
    }

    /* PILLS DE STATUS */
    .metrics-cluster {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 7px 14px;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-green { background: var(--green); box-shadow: 0 0 8px var(--green); }
    .dot-yellow { background: var(--yellow); box-shadow: 0 0 8px var(--yellow); }
    .dot-blue { background: var(--primary); box-shadow: 0 0 8px var(--primary); }

    /* GRID BENTO PRINCIPAL (2 COLUNAS AMPLAS E EQUILIBRADAS) */
    .bento-workspace {
      display: grid;
      grid-template-columns: 1fr 410px;
      gap: 16px;
      flex: 1;
      overflow: hidden;
    }

    /* COLUNA ESQUERDA/CENTRAL: CONVERSAÇÃO MULTI-AGENTE */
    .conversation-bento-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }

    /* BARRA DE SELEÇÃO DE AGENTES EM LISTA SUSPENSA */
    .conversation-selector-bar {
      padding: 16px 22px;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .selector-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 280px;
    }

    .selector-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .selector-label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      padding-left: 6px;
    }

    select.round-select, input.round-input {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      padding: 9px 16px;
      color: #fff;
      font-size: 0.82rem;
      font-weight: 600;
      font-family: var(--font-sans);
      outline: none;
      cursor: pointer;
      transition: all 0.18s ease;
      width: 100%;
    }

    select.round-select:hover, select.round-select:focus,
    input.round-input:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
    }

    .swap-agents-btn {
      margin-top: 16px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--card-elevated);
      border: 1px solid var(--border);
      color: var(--primary);
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .swap-agents-btn:hover {
      background: var(--primary);
      color: #000;
      transform: rotate(180deg);
    }

    .view-mode-pills {
      display: flex;
      gap: 6px;
      background: var(--bg);
      padding: 4px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border);
    }

    .mode-pill {
      padding: 6px 12px;
      border-radius: var(--radius-pill);
      font-size: 0.73rem;
      font-weight: 700;
      color: var(--text-muted);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
    }

    .mode-pill.active {
      background: var(--primary);
      color: #000;
    }

    /* BARRA RÁPIDA DE AGENTES ATIVOS NA CONVERSA (PÍLULAS CLICÁVEIS) */
    .quick-agent-switcher {
      padding: 10px 22px;
      background: rgba(15, 22, 41, 0.75);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      flex-shrink: 0;
    }

    .quick-switcher-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
      margin-right: 4px;
      white-space: nowrap;
    }

    .agent-mini-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: var(--radius-pill);
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.73rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .agent-mini-pill:hover {
      border-color: var(--primary);
      color: #fff;
      transform: translateY(-1px);
    }

    .agent-mini-pill.active-peer {
      background: var(--primary-glow);
      border-color: var(--primary);
      color: var(--primary);
    }

    /* FEED DE MENSAGENS COM BALÕES ARREDONDADOS */
    .chat-stream {
      flex: 1;
      overflow-y: auto;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .msg-card-round {
      max-width: 82%;
      border-radius: 22px;
      padding: 14px 18px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
      transition: transform 0.15s;
    }

    .msg-card-round:hover {
      border-color: rgba(148, 163, 184, 0.28);
    }

    .msg-card-round.mine {
      align-self: flex-end;
      background: linear-gradient(145deg, #162440, #1a2c4e);
      border-color: rgba(56, 189, 248, 0.35);
      border-bottom-right-radius: 6px;
    }

    .msg-card-round.theirs {
      align-self: flex-start;
      background: var(--card-bg);
      border-bottom-left-radius: 6px;
    }

    .msg-card-round.broadcast {
      align-self: center;
      max-width: 92%;
      background: rgba(99, 102, 241, 0.11);
      border-color: rgba(99, 102, 241, 0.35);
    }

    .msg-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .actor-pills {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .actor-badge-btn {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid var(--border);
      color: #fff;
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }

    .actor-badge-btn:hover {
      background: var(--primary);
      color: #000;
      border-color: var(--primary);
    }

    .type-pill {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: var(--radius-pill);
      text-transform: uppercase;
      font-family: var(--font-mono);
    }
    .type-TASK { background: rgba(56, 189, 248, 0.2); color: var(--primary); }
    .type-HANDOFF { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }
    .type-ALERT { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
    .type-GATE { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
    .type-CHAT { background: rgba(16, 185, 129, 0.18); color: #6ee7b7; }

    .msg-subject-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #fff;
    }

    .msg-body-box {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      line-height: 1.5;
      color: var(--text);
      background: rgba(0, 0, 0, 0.25);
      padding: 10px 14px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      white-space: pre-wrap;
    }

    .msg-footer-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.68rem;
      color: var(--text-dim);
      padding-top: 2px;
    }

    .reply-to-agent-link {
      color: var(--primary);
      cursor: pointer;
      font-weight: 600;
      background: none;
      border: none;
      font-size: 0.7rem;
    }

    .reply-to-agent-link:hover {
      text-decoration: underline;
    }

    /* COMPOSER ARREDONDADO NO RODAPÉ DO CHAT */
    .composer-area {
      padding: 16px 22px;
      background: var(--card-bg);
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .composer-controls-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .composer-input-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 8px 10px 8px 16px;
      transition: border-color 0.18s;
    }

    .composer-input-bar:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
    }

    .composer-input-bar textarea {
      flex: 1;
      background: transparent;
      border: none;
      color: #fff;
      font-family: var(--font-sans);
      font-size: 0.85rem;
      outline: none;
      resize: none;
      height: 42px;
      padding-top: 10px;
    }

    .btn-send-round {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #000;
      border: none;
      border-radius: var(--radius-pill);
      padding: 10px 20px;
      font-weight: 800;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.18s;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .btn-send-round:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(56, 189, 248, 0.35);
    }

    /* COLUNA DIREITA: BENTO STACK DE CARDS ARREDONDADOS */
    .side-bento-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .bento-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow-card);
    }

    .card-header-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    /* CARD DE DETALHE DO AGENTE SELECIONADO */
    .agent-inspector-box {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .inspector-top {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .inspector-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary-glow);
      border: 1px solid var(--primary);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-family: var(--font-mono);
      font-size: 0.95rem;
      flex-shrink: 0;
    }

    .status-toggle-group {
      display: flex;
      gap: 6px;
    }

    .status-btn-pill {
      flex: 1;
      padding: 6px 10px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text-muted);
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }

    .status-btn-pill.active-online {
      background: rgba(16, 185, 129, 0.2);
      border-color: var(--green);
      color: var(--green);
    }
    .status-btn-pill.active-busy {
      background: rgba(245, 158, 11, 0.2);
      border-color: var(--yellow);
      color: var(--yellow);
    }
    .status-btn-pill.active-offline {
      background: rgba(148, 163, 184, 0.18);
      border-color: var(--text-muted);
      color: #fff;
    }

    .cmd-pill-box {
      background: #050811;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 9px 12px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .copy-pill-btn {
      background: var(--card-elevated);
      border: 1px solid var(--border);
      color: #fff;
      border-radius: var(--radius-pill);
      padding: 4px 10px;
      font-size: 0.68rem;
      font-weight: 700;
      cursor: pointer;
      flex-shrink: 0;
    }

    /* CHECKLIST DA ONDA ARREDONDADO */
    .step-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .step-pill-item {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 9px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.77rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .step-pill-item:hover {
      border-color: var(--primary);
    }

    .step-pill-item.done {
      opacity: 0.65;
    }

    .step-check-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.68rem;
      flex-shrink: 0;
    }

    .step-pill-item.done .step-check-circle {
      background: var(--green);
      border-color: var(--green);
      color: #000;
      font-weight: 900;
    }

    /* FORMULÁRIO HANDOFF ARREDONDADO */
    .handoff-form-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-purple-pill {
      background: linear-gradient(135deg, #7e22ce, #a855f7);
      color: #fff;
      border: none;
      border-radius: var(--radius-pill);
      padding: 10px 16px;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.18s;
    }

    .btn-purple-pill:hover {
      box-shadow: 0 4px 16px rgba(168, 85, 247, 0.4);
      transform: translateY(-1px);
    }
  </style>
</head>
<body>

  <!-- 1. TOP BAR CARD ARREDONDADO COM PROGRESSO E STATUS -->
  <div class="top-bar-card">
    <div class="brand-cluster">
      <div class="logo-circle">360</div>
      <div>
        <div class="brand-title">BIRTH HUB 360 &bull; Agent Mesh</div>
        <div class="brand-subtitle">Orquestração Multi-Sessão & Comunicação entre Agentes</div>
      </div>
    </div>

    <!-- BARRA DE PROGRESSO DA ONDA -->
    <div class="wave-progress-cluster">
      <span class="wave-pill-badge" id="waveBadge">Onda 1</span>
      <div class="progress-track">
        <div class="progress-fill" id="waveProgressFill" style="width: 29%;"></div>
      </div>
      <span class="progress-pct" id="waveProgressPct">29%</span>
    </div>

    <!-- INDICADORES GLOBAIS -->
    <div class="metrics-cluster">
      <div class="status-pill">
        <span class="dot dot-green"></span>
        <span>Online: <strong id="onlineCountLabel">0</strong>/26</span>
      </div>
      <div class="status-pill" title="Limite de concorrência do AGENTS.md">
        <span class="dot" id="slotDot"></span>
        <span>Slots: <strong id="slotRatioLabel">0 / 8</strong></span>
      </div>
      <div class="status-pill">
        <span class="dot dot-blue"></span>
        <span>Handoffs: <strong id="handoffTotalLabel">0</strong></span>
      </div>
    </div>
  </div>

  <!-- 2. WORKSPACE PRINCIPAL EM BENTO GRID -->
  <div class="bento-workspace">

    <!-- PAINEL CENTRAL: CONVERSAÇÃO COM LISTAS SUSPENSAS DE AGENTES -->
    <div class="conversation-bento-card">

      <!-- SELETORES SUSPENSOS DE AGENTES -->
      <div class="conversation-selector-bar">
        <div class="selector-group">
          <div class="selector-box">
            <span class="selector-label">Agente Ativo (Remetente / Ponto de Vista)</span>
            <select class="round-select" id="agentA_Select" onchange="onAgentPairChange()"></select>
          </div>

          <button class="swap-agents-btn" title="Inverter Agentes (A ↔ B)" onclick="swapAgents()">&#8644;</button>

          <div class="selector-box">
            <span class="selector-label">Conversando com (Destinatário / Canal)</span>
            <select class="round-select" id="agentB_Select" onchange="onAgentPairChange()"></select>
          </div>
        </div>

        <!-- FILTRO DE VISUALIZAÇÃO DA CONVERSA -->
        <div class="view-mode-pills">
          <button class="mode-pill active" id="modePairBtn" onclick="setChatMode('pair')">Direto (A &harr; B)</button>
          <button class="mode-pill" id="modeAgentAllBtn" onclick="setChatMode('agent_all')">Tudo do Agente</button>
          <button class="mode-pill" id="modeGlobalBtn" onclick="setChatMode('global')">Feed Global</button>
        </div>
      </div>

      <!-- BARRA RÁPIDA PARA PULAR PARA QUALQUER AGENTE DENTRO DA CONVERSA -->
      <div class="quick-agent-switcher" id="quickSwitcherBar">
        <span class="quick-switcher-label">Pular para agente:</span>
        <!-- Pílulas geradas dinamicamente -->
      </div>

      <!-- STREAM DE CONVERSA -->
      <div class="chat-stream" id="chatStream">
        <!-- Balões de mensagem arredondados -->
      </div>

      <!-- COMPOSER DE MENSAGEM -->
      <div class="composer-area">
        <div class="composer-controls-row">
          <select class="round-select" id="msgTypeSelect" style="width: 210px; padding: 6px 14px; font-size: 0.76rem;">
            <option value="CHAT">💬 CHAT (Conversa Direta)</option>
            <option value="TASK">⚡ TASK (Ordem de Missão)</option>
            <option value="HANDOFF">📦 HANDOFF (Transferência)</option>
            <option value="GATE">🛡️ GATE (Validação)</option>
            <option value="ALERT">🚨 ALERT (Bloqueador)</option>
          </select>

          <input type="text" class="round-input" id="msgSubjectInput" placeholder="Assunto ou contexto rápido (opcional)..." style="flex: 1; padding: 6px 14px; font-size: 0.78rem;">

          <!-- SELETOR RÁPIDO PARA MENCIONAR OUTRO AGENTE NA MENSAGEM -->
          <select class="round-select" id="mentionAgentSelect" onchange="insertAgentMention(this)" style="width: 210px; padding: 6px 14px; font-size: 0.75rem;">
            <option value="">+ Mencionar outro Agente (@)</option>
          </select>
        </div>

        <div class="composer-input-bar">
          <textarea id="msgContentInput" placeholder="Escreva a mensagem e pressione Enter para enviar..." onkeydown="handleEnterKey(event)"></textarea>
          <button class="btn-send-round" onclick="sendMessageNow()">
            <span>Enviar</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

    </div>

    <!-- COLUNA LATERAL DIREITA: BENTO CARDS ARREDONDADOS -->
    <div class="side-bento-stack">

      <!-- CARD 1: INSPETOR DO AGENTE SELECIONADO -->
      <div class="bento-card">
        <div class="card-header-line">
          <span class="card-title">Ficha & Controle do Agente</span>
          <select class="round-select" id="inspectorAgentSelect" onchange="selectInspectorAgent(this.value)" style="width: 175px; padding: 4px 10px; font-size: 0.73rem;"></select>
        </div>

        <div class="agent-inspector-box">
          <div class="inspector-top">
            <div class="inspector-avatar" id="inspAvatar">00</div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 800; font-size: 0.9rem; color: #fff;" id="inspName">Coordenador</div>
              <div style="font-size: 0.73rem; color: var(--text-muted);" id="inspRole">Orquestrador Geral</div>
            </div>
          </div>

          <div class="status-toggle-group">
            <button class="status-btn-pill" id="btnStatOnline" onclick="changeAgentStatus('online')">🟢 Online</button>
            <button class="status-btn-pill" id="btnStatBusy" onclick="changeAgentStatus('busy')">🟡 Ocupado</button>
            <button class="status-btn-pill" id="btnStatOffline" onclick="changeAgentStatus('offline')">⚪ Offline</button>
          </div>

          <div class="cmd-pill-box">
            <span id="inspCliCmd" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">node .agents/bus/agent-cli.mjs session --id 00</span>
            <button class="copy-pill-btn" onclick="copyInspCmd()">Copiar CLI</button>
          </div>
        </div>
      </div>

      <!-- CARD 2: PROGRESSO & MARCOS DA ONDA -->
      <div class="bento-card">
        <div class="card-header-line">
          <span class="card-title">Marcos da Onda (Checklist)</span>
          <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary);" id="stepsFractionLabel">2/7</span>
        </div>
        <div class="step-list" id="waveStepList">
          <!-- Renderizado via JS -->
        </div>
      </div>

      <!-- CARD 3: NOVO HANDOFF FORMAL -->
      <div class="bento-card">
        <div class="card-header-line">
          <span class="card-title">Gerar Handoff Formal (.md)</span>
        </div>
        <div class="handoff-form-grid">
          <div style="display: flex; gap: 8px;">
            <select class="round-select" id="hoFrom" style="padding: 7px 12px; font-size: 0.76rem;"></select>
            <select class="round-select" id="hoTo" style="padding: 7px 12px; font-size: 0.76rem;"></select>
          </div>
          <input type="text" class="round-input" id="hoSlug" placeholder="Slug (ex: ajuste-contrato-api)" style="padding: 8px 14px; font-size: 0.78rem;">
          <input type="text" class="round-input" id="hoProblem" placeholder="Descrição objetiva da dependência..." style="padding: 8px 14px; font-size: 0.78rem;">
          <button class="btn-purple-pill" onclick="createNewHandoff()">Registrar Handoff na Onda</button>
        </div>
      </div>

    </div>

  </div>

  <script>
    let agentsList = [];
    let chatMode = 'pair'; // 'pair', 'agent_all', 'global'
    let currentInspectorId = '01';

    async function fetchSystemState() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        agentsList = data.agents || [];

        // Indicadores da barra superior
        document.getElementById('onlineCountLabel').innerText = data.onlineCount;
        document.getElementById('slotRatioLabel').innerText = \`\${data.onlineCount} / \${data.maxAllowedSlots}\`;
        document.getElementById('handoffTotalLabel').innerText = data.totalHandoffs;

        const slotDot = document.getElementById('slotDot');
        if (data.onlineCount <= 3) {
          slotDot.className = 'dot dot-green';
        } else if (data.onlineCount <= 8) {
          slotDot.className = 'dot dot-yellow';
        } else {
          slotDot.className = 'dot';
          slotDot.style.background = 'var(--red)';
        }

        if (data.wave) {
          document.getElementById('waveBadge').innerText = \`Onda \${data.wave.number}\`;
          document.getElementById('waveProgressFill').style.width = \`\${data.wave.progressPercent}%\`;
          document.getElementById('waveProgressPct').innerText = \`\${data.wave.progressPercent}%\`;
          document.getElementById('stepsFractionLabel').innerText = \`\${data.wave.completedSteps}/\${data.wave.totalSteps}\`;
          renderSteps(data.wave.steps);
        }

        populateDropdowns();
        renderQuickSwitcherPills();
        updateInspectorCard();
      } catch (err) {
        console.error('Erro ao carregar estado:', err);
      }
    }

    function populateDropdowns() {
      const selA = document.getElementById('agentA_Select');
      const selB = document.getElementById('agentB_Select');
      const selInsp = document.getElementById('inspectorAgentSelect');
      const selMention = document.getElementById('mentionAgentSelect');
      const hoFrom = document.getElementById('hoFrom');
      const hoTo = document.getElementById('hoTo');

      const valA = selA.value || '00';
      const valB = selB.value || '01';
      const valInsp = selInsp.value || currentInspectorId;
      const valHoFrom = hoFrom.value || '01';
      const valHoTo = hoTo.value || '02';

      selA.innerHTML = '';
      selB.innerHTML = '<option value="ALL">📢 Broadcast (Todos os Agentes)</option>';
      selInsp.innerHTML = '';
      selMention.innerHTML = '<option value="">+ Mencionar outro Agente (@)</option>';
      hoFrom.innerHTML = '';
      hoTo.innerHTML = '';

      agentsList.forEach(a => {
        const stIcon = a.isOnline ? '🟢' : '⚪';
        const label = \`\${stIcon} Agente \${a.id} — \${a.name} (\${a.category})\`;

        const optA = new Option(label, a.id);
        const optB = new Option(label, a.id);
        const optI = new Option(\`\${stIcon} Agente \${a.id} — \${a.name}\`, a.id);
        const optM = new Option(\`@Agente-\${a.id} (\${a.name})\`, \`@Agente-\${a.id} \`);
        const optHF = new Option(\`De: Agente \${a.id}\`, a.id);
        const optHT = new Option(\`Para: Agente \${a.id}\`, a.id);

        selA.add(optA);
        selB.add(optB);
        selInsp.add(optI);
        selMention.add(optM);
        hoFrom.add(optHF);
        hoTo.add(optHT);
      });

      selA.value = valA;
      selB.value = valB;
      selInsp.value = valInsp;
      hoFrom.value = valHoFrom;
      hoTo.value = valHoTo;
    }

    function renderQuickSwitcherPills() {
      const bar = document.getElementById('quickSwitcherBar');
      const activeB = document.getElementById('agentB_Select').value;

      let html = '<span class="quick-switcher-label">Troca Rápida:</span>';
      html += \`<div class="agent-mini-pill \${activeB === 'ALL' ? 'active-peer' : ''}" onclick="quickSelectPeer('ALL')">📢 Todos</div>\`;

      agentsList.forEach(a => {
        const dot = a.isOnline ? '🟢' : '⚪';
        const isCurrent = activeB === a.id ? 'active-peer' : '';
        html += \`<div class="agent-mini-pill \${isCurrent}" onclick="quickSelectPeer('\${a.id}')" title="\${a.name} - \${a.role}">\${dot} \${a.id}</div>\`;
      });

      bar.innerHTML = html;
    }

    function quickSelectPeer(peerId) {
      document.getElementById('agentB_Select').value = peerId;
      if (peerId !== 'ALL') {
        currentInspectorId = peerId;
        document.getElementById('inspectorAgentSelect').value = peerId;
        updateInspectorCard();
      }
      renderQuickSwitcherPills();
      fetchConversation();
    }

    function onAgentPairChange() {
      const valB = document.getElementById('agentB_Select').value;
      if (valB && valB !== 'ALL') {
        currentInspectorId = valB;
        document.getElementById('inspectorAgentSelect').value = valB;
        updateInspectorCard();
      }
      renderQuickSwitcherPills();
      fetchConversation();
    }

    function swapAgents() {
      const selA = document.getElementById('agentA_Select');
      const selB = document.getElementById('agentB_Select');
      if (selB.value === 'ALL') return;
      const temp = selA.value;
      selA.value = selB.value;
      selB.value = temp;
      onAgentPairChange();
    }

    function setChatMode(mode) {
      chatMode = mode;
      document.getElementById('modePairBtn').classList.toggle('active', mode === 'pair');
      document.getElementById('modeAgentAllBtn').classList.toggle('active', mode === 'agent_all');
      document.getElementById('modeGlobalBtn').classList.toggle('active', mode === 'global');
      fetchConversation();
    }

    async function fetchConversation() {
      const agentA = document.getElementById('agentA_Select').value || '00';
      const agentB = document.getElementById('agentB_Select').value || '01';

      const url = \`/api/messages?mode=\${chatMode}&agentId=\${agentA}&peerId=\${agentB}&limit=100\`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        renderMessages(data.messages || [], agentA);
      } catch (err) {
        console.error('Erro ao buscar conversa:', err);
      }
    }

    function renderMessages(msgs, perspectiveAgentId) {
      const stream = document.getElementById('chatStream');
      if (!msgs.length) {
        stream.innerHTML = \`
          <div style="text-align:center; color:var(--text-dim); margin: auto; padding: 40px;">
            <div style="font-size: 1.6rem; margin-bottom: 8px;">💬</div>
            <div style="font-weight: 700; color: var(--text-muted);">Nenhuma mensagem neste filtro ainda</div>
            <div style="font-size: 0.78rem; margin-top: 4px;">Selecione qualquer par de agentes nas listas suspensas acima ou envie uma mensagem abaixo.</div>
          </div>
        \`;
        return;
      }

      stream.innerHTML = '';
      msgs.forEach(m => {
        const isMine = m.from_id === perspectiveAgentId;
        const isBroadcast = m.to_id === 'ALL';
        const card = document.createElement('div');
        card.className = 'msg-card-round ' + (isBroadcast ? 'broadcast' : (isMine ? 'mine' : 'theirs'));

        const timeStr = new Date(m.created_at).toLocaleTimeString('pt-BR');
        const fromAgent = agentsList.find(x => x.id === m.from_id);
        const toAgent = agentsList.find(x => x.id === m.to_id);

        const fromTitle = fromAgent ? \`Agente \${m.from_id} (\${fromAgent.name})\` : \`Agente \${m.from_id}\`;
        const toTitle = m.to_id === 'ALL' ? '📢 Todos' : (toAgent ? \`Agente \${m.to_id} (\${toAgent.name})\` : \`Agente \${m.to_id}\`);

        card.innerHTML = \`
          <div class="msg-header-row">
            <div class="actor-pills">
              <button class="actor-badge-btn" onclick="jumpToAgent('\${m.from_id}')" title="Clique para selecionar este agente">\${escapeHtml(fromTitle)}</button>
              <span style="color:var(--text-dim); font-size:0.75rem;">&rarr;</span>
              <button class="actor-badge-btn" onclick="jumpToAgent('\${m.to_id}')" title="Clique para selecionar este destinatário">\${escapeHtml(toTitle)}</button>
            </div>
            <span class="type-pill type-\${m.type}">\${m.type}</span>
          </div>
          \${m.subject ? '<div class="msg-subject-title">' + escapeHtml(m.subject) + '</div>' : ''}
          <div class="msg-body-box">\${escapeHtml(m.content)}</div>
          <div class="msg-footer-actions">
            <button class="reply-to-agent-link" onclick="focusConversationPair('\${m.to_id === 'ALL' ? perspectiveAgentId : m.to_id}', '\${m.from_id}')">
              &#8617; Responder como Agente \${m.to_id === 'ALL' ? perspectiveAgentId : m.to_id} para Agente \${m.from_id}
            </button>
            <span>\${timeStr}</span>
          </div>
        \`;
        stream.appendChild(card);
      });

      stream.scrollTop = stream.scrollHeight;
    }

    // Permite clicar em qualquer agente dentro de uma mensagem e abrir a conversa dele
    function jumpToAgent(agentId) {
      if (!agentId || agentId === 'ALL') {
        quickSelectPeer('ALL');
        return;
      }
      quickSelectPeer(agentId);
    }

    // Permite inverter/focar diretamente o par para resposta imediata
    function focusConversationPair(fromId, toId) {
      document.getElementById('agentA_Select').value = fromId;
      document.getElementById('agentB_Select').value = toId;
      onAgentPairChange();
      document.getElementById('msgContentInput').focus();
    }

    function insertAgentMention(selectEl) {
      const val = selectEl.value;
      if (!val) return;
      const input = document.getElementById('msgContentInput');
      input.value = input.value + val;
      selectEl.value = '';
      input.focus();
    }

    async function sendMessageNow() {
      const from_id = document.getElementById('agentA_Select').value;
      const to_id = document.getElementById('agentB_Select').value;
      const type = document.getElementById('msgTypeSelect').value;
      const subject = document.getElementById('msgSubjectInput').value.trim();
      const content = document.getElementById('msgContentInput').value.trim();

      if (!content) return;

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from_id, to_id, type, subject, content })
        });
        if (res.ok) {
          document.getElementById('msgContentInput').value = '';
          document.getElementById('msgSubjectInput').value = '';
          fetchConversation();
          fetchSystemState();
        }
      } catch (err) {
        alert('Falha ao enviar mensagem: ' + err.message);
      }
    }

    function handleEnterKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageNow();
      }
    }

    function selectInspectorAgent(id) {
      currentInspectorId = id;
      updateInspectorCard();
    }

    function updateInspectorCard() {
      const ag = agentsList.find(a => a.id === currentInspectorId) || agentsList[0];
      if (!ag) return;

      document.getElementById('inspAvatar').innerText = ag.id;
      document.getElementById('inspName').innerText = \`Agente \${ag.id} — \${ag.name}\`;
      document.getElementById('inspRole').innerText = ag.role;
      document.getElementById('inspCliCmd').innerText = \`node .agents/bus/agent-cli.mjs session --id \${ag.id}\`;

      document.getElementById('btnStatOnline').className = 'status-btn-pill' + (ag.computedStatus === 'online' ? ' active-online' : '');
      document.getElementById('btnStatBusy').className = 'status-btn-pill' + (ag.computedStatus === 'busy' ? ' active-busy' : '');
      document.getElementById('btnStatOffline').className = 'status-btn-pill' + (ag.computedStatus === 'offline' ? ' active-offline' : '');
    }

    async function changeAgentStatus(status) {
      try {
        await fetch('/api/agents/set-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentInspectorId, status })
        });
        fetchSystemState();
      } catch (err) {
        console.error('Erro ao mudar status:', err);
      }
    }

    function copyInspCmd() {
      const cmd = document.getElementById('inspCliCmd').innerText;
      navigator.clipboard.writeText(cmd);
    }

    function renderSteps(steps) {
      const list = document.getElementById('waveStepList');
      list.innerHTML = '';
      (steps || []).forEach(s => {
        const div = document.createElement('div');
        div.className = 'step-pill-item' + (s.done ? ' done' : '');
        div.onclick = () => toggleWaveStep(s.id);
        div.innerHTML = \`
          <div class="step-check-circle">\${s.done ? '&#10003;' : ''}</div>
          <div style="flex:1;">\${escapeHtml(s.text)}</div>
          <span style="font-family:var(--font-mono); font-size:0.68rem; color:var(--primary);">[\${s.owner}]</span>
        \`;
        list.appendChild(div);
      });
    }

    async function toggleWaveStep(stepId) {
      await fetch('/api/wave/toggle-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId })
      });
      fetchSystemState();
    }

    async function createNewHandoff() {
      const from_id = document.getElementById('hoFrom').value;
      const to_id = document.getElementById('hoTo').value;
      const slug = document.getElementById('hoSlug').value.trim();
      const problem = document.getElementById('hoProblem').value.trim();

      if (!slug || !problem) {
        alert('Informe o slug e a descrição para criar o handoff.');
        return;
      }

      const res = await fetch('/api/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wave: 1, from_id, to_id, slug, problem })
      });
      if (res.ok) {
        document.getElementById('hoSlug').value = '';
        document.getElementById('hoProblem').value = '';
        fetchSystemState();
        fetchConversation();
      }
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function initSSE() {
      const evt = new EventSource('/api/events');
      evt.addEventListener('message', () => {
        fetchConversation();
        fetchSystemState();
      });
      evt.addEventListener('agent_registered', () => fetchSystemState());
      evt.addEventListener('agent_status_changed', () => fetchSystemState());
      evt.addEventListener('wave_updated', () => fetchSystemState());
    }

    fetchSystemState().then(() => fetchConversation());
    initSSE();
    setInterval(fetchSystemState, 15000);
  </script>
</body>
</html>`;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[AGENT BUS] Servidor ativo em http://localhost:${PORT}`);
  console.log(`[AGENT BUS] Mission Control disponível em http://localhost:${PORT}`);
});

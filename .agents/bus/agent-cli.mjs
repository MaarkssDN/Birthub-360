import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const PORT = process.env.AGENT_BUS_PORT || 4100;
const BASE_URL = `http://localhost:${PORT}`;

async function isServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/api/status`);
    return res.ok;
  } catch {
    return false;
  }
}

async function startServer() {
  const running = await isServerRunning();
  if (running) {
    console.log(`[AGENT BUS] Servidor já está em execução em ${BASE_URL}`);
    return;
  }

  console.log(`[AGENT BUS] Iniciando servidor do Barramento de Agentes...`);
  const logFile = path.join(__dirname, 'server.log');
  const out = fs.openSync(logFile, 'a');
  const err = fs.openSync(logFile, 'a');

  const child = spawn(process.execPath, [path.join(__dirname, 'server.mjs')], {
    detached: true,
    stdio: ['ignore', out, err],
    windowsHide: true
  });

  child.unref();

  // Espera até 5 segundos para subir
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isServerRunning()) {
      console.log(`[AGENT BUS] Servidor iniciado com sucesso! PID: ${child.pid}`);
      console.log(`[AGENT BUS] Dashboard Web: ${BASE_URL}`);
      return;
    }
  }
  console.error('[AGENT BUS] Falha ao iniciar servidor. Verifique .agents/bus/server.log');
}

async function showStatus() {
  try {
    const res = await fetch(`${BASE_URL}/api/status`);
    if (!res.ok) throw new Error('Servidor respondeu com erro');
    const data = await res.json();

    console.log('\n========================================================================');
    console.log(`  BIRTH HUB 360 — STATUS DA REDE DE AGENTES (Porta ${data.port})`);
    console.log(`  Agentes Online: ${data.onlineCount} de ${data.totalAgents} | Mensagens: ${data.totalMessages} | Handoffs: ${data.totalHandoffs}`);
    console.log('========================================================================\n');

    console.log('ID   | STATUS  | NOME                            | WORKTREE');
    console.log('-----+---------+---------------------------------+----------------------');

    for (const a of data.agents) {
      const statusStr = a.isOnline ? '\x1b[32mONLINE \x1b[0m' : '\x1b[90mOFFLINE\x1b[0m';
      const idStr = a.id.padEnd(4);
      const nameStr = (a.name || '').substring(0, 31).padEnd(31);
      const wtStr = (a.worktree || '-').substring(0, 22);
      console.log(`${idStr} | ${statusStr} | ${nameStr} | ${wtStr}`);
    }
    console.log('\nPara abrir o Dashboard no navegador: ' + BASE_URL + '\n');
  } catch (err) {
    console.error(`\x1b[31m[ERRO] O servidor do Agent Bus não está rodando em ${BASE_URL}.\x1b[0m`);
    console.log(`Execute primeiro: node .agents/bus/agent-cli.mjs start`);
  }
}

async function sendMessage(from, to, type, content, subject = '') {
  try {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_id: from,
        to_id: to,
        type: type || 'CHAT',
        subject,
        content
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\x1b[32m[ENVIADO]\x1b[0m Mensagem de Agente ${from} para ${to === 'ALL' ? 'TODOS' : 'Agente ' + to} (${type})`);
    } else {
      console.error('\x1b[31m[FALHA]\x1b[0m', data.error);
    }
  } catch (err) {
    console.error('\x1b[31m[ERRO]\x1b[0m Não foi possível conectar ao bus:', err.message);
  }
}

async function createHandoff(from, to, wave, slug, problem, files, required, test) {
  try {
    const res = await fetch(`${BASE_URL}/api/handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wave: parseInt(wave || '1', 10),
        from_id: from,
        to_id: to,
        slug,
        problem,
        involved_files: files,
        required_change: required,
        expected_test: test,
        priority: 'alto'
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\x1b[32m[HANDOFF REGISTRADO]\x1b[0m Arquivo criado: ${data.filePath}`);
    } else {
      console.error('\x1b[31m[FALHA]\x1b[0m', data.error);
    }
  } catch (err) {
    console.error('\x1b[31m[ERRO]\x1b[0m Falha ao criar handoff:', err.message);
  }
}

async function startSession(agentId) {
  if (!agentId) {
    console.error('Especifique o ID do agente: --id <00|01|02|...>');
    process.exit(1);
  }

  if (!(await isServerRunning())) {
    await startServer();
  }

  // Identifica worktree atual
  const cwd = process.cwd();
  const relWorktree = path.relative(REPO_ROOT, cwd) || '.';

  // Registra agente
  try {
    await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: agentId,
        status: 'online',
        worktree: relWorktree,
        pid: process.pid
      })
    });
  } catch (err) {
    console.error('[ERRO] Falha ao registrar sessão:', err.message);
  }

  console.clear();
  console.log('\x1b[36m========================================================================\x1b[0m');
  console.log(`  \x1b[1mSESSÃO ATIVA — AGENTE ${agentId}\x1b[0m`);
  console.log(`  Worktree: ${relWorktree}`);
  console.log(`  Conectado ao Bus: ${BASE_URL}`);
  console.log(`  Digite \x1b[33msend <para> <mensagem>\x1b[0m ou \x1b[33mstatus\x1b[0m ou \x1b[33mhelp\x1b[0m`);
  console.log('\x1b[36m========================================================================\x1b[0m\n');

  // Heartbeat a cada 20s
  const hbInterval = setInterval(async () => {
    try {
      await fetch(`${BASE_URL}/api/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId, status: 'online' })
      });
    } catch {}
  }, 20000);

  // Listener SSE
  let lastSeenTime = Date.now();
  async function connectEvents() {
    try {
      const res = await fetch(`${BASE_URL}/api/events?agentId=${agentId}`);
      if (!res.ok) throw new Error('Falha SSE');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const block of lines) {
          if (!block.trim()) continue;
          const matchEvent = block.match(/event:\s*([^\n]+)/);
          const matchData = block.match(/data:\s*([^\n]+)/);
          const eventType = matchEvent ? matchEvent[1].trim() : 'message';

          if (eventType === 'message' && matchData) {
            try {
              const msg = JSON.parse(matchData[1]);
              // Se foi enviada por mim mesmo no terminal, já sabemos
              if (msg.from_id === agentId && msg.created_at <= lastSeenTime) continue;

              const timeStr = new Date(msg.created_at).toLocaleTimeString('pt-BR');
              console.log(`\n\x1b[35m[MENSAGEM RECEBIDA às ${timeStr}]\x1b[0m`);
              console.log(`\x1b[1mDe: Agente ${msg.from_id} -> ${msg.to_id === 'ALL' ? 'TODOS' : 'Agente ' + msg.to_id} [${msg.type}]\x1b[0m`);
              if (msg.subject) console.log(`\x1b[33mAssunto: ${msg.subject}\x1b[0m`);
              console.log(`${msg.content}\n`);
              process.stdout.write(`(Agente ${agentId}) > `);
            } catch {}
          }
        }
      }
    } catch (err) {
      setTimeout(connectEvents, 3000);
    }
  }
  connectEvents();

  // Prompt interativo
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `(Agente ${agentId}) > `
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();

    if (cmd === 'exit' || cmd === 'quit') {
      clearInterval(hbInterval);
      try {
        await fetch(`${BASE_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: agentId, status: 'offline' })
        });
      } catch {}
      console.log(`[SESSÃO] Agente ${agentId} desconectado.`);
      process.exit(0);
    }

    if (cmd === 'status') {
      await showStatus();
      rl.prompt();
      return;
    }

    if (cmd === 'help') {
      console.log('\nComandos disponíveis:');
      console.log('  send <destinatário> <mensagem>     - Envia mensagem (ex: send 00 Concluí a migration)');
      console.log('  broadcast <mensagem>               - Envia para todos os agentes');
      console.log('  task <destinatário> <mensagem>     - Envia ordem de tarefa');
      console.log('  handoff <destinatário> <slug> | <problema> - Registra handoff formal');
      console.log('  status                             - Mostra agentes online');
      console.log('  exit                               - Encerra sessão\n');
      rl.prompt();
      return;
    }

    if (cmd === 'broadcast') {
      const msg = parts.slice(1).join(' ');
      if (!msg) {
        console.log('Uso: broadcast <mensagem>');
      } else {
        lastSeenTime = Date.now();
        await sendMessage(agentId, 'ALL', 'CHAT', msg);
      }
      rl.prompt();
      return;
    }

    if (cmd === 'send' || cmd === 'task') {
      const target = parts[1];
      const msg = parts.slice(2).join(' ');
      if (!target || !msg) {
        console.log(`Uso: ${cmd} <destinatário> <mensagem>`);
      } else {
        lastSeenTime = Date.now();
        await sendMessage(agentId, target, cmd === 'task' ? 'TASK' : 'CHAT', msg);
      }
      rl.prompt();
      return;
    }

    if (cmd === 'handoff') {
      const rest = parts.slice(1).join(' ');
      const [header, problem] = rest.split('|');
      const target = (header || '').trim().split(' ')[0];
      const slug = (header || '').trim().split(' ')[1] || 'handoff';

      if (!target || !problem) {
        console.log('Uso: handoff <destinatário> <slug> | <descrição do problema>');
      } else {
        await createHandoff(agentId, target, 1, slug, problem.trim(), '', '', '');
      }
      rl.prompt();
      return;
    }

    console.log(`Comando não reconhecido: "${cmd}". Digite "help" para ver opções.`);
    rl.prompt();
  });
}

// Parser de argumentos
const args = process.argv.slice(2);
const command = args[0] || 'status';

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

switch (command) {
  case 'start':
    startServer();
    break;
  case 'status':
    showStatus();
    break;
  case 'session':
    startSession(getArg('--id') || args[1]);
    break;
  case 'send':
    sendMessage(
      getArg('--from') || '00',
      getArg('--to') || 'ALL',
      getArg('--type') || 'CHAT',
      getArg('--message') || args.slice(1).join(' '),
      getArg('--subject') || ''
    );
    break;
  case 'broadcast':
    sendMessage(getArg('--from') || '00', 'ALL', 'CHAT', args.slice(1).join(' '));
    break;
  case 'handoff':
    createHandoff(
      getArg('--from') || '01',
      getArg('--to') || '00',
      getArg('--wave') || '1',
      getArg('--slug') || 'mudanca',
      getArg('--problem') || 'Problema informado',
      getArg('--files') || '',
      getArg('--required') || '',
      getArg('--test') || ''
    );
    break;
  default:
    console.log('Uso do Agent CLI:');
    console.log('  node .agents/bus/agent-cli.mjs start');
    console.log('  node .agents/bus/agent-cli.mjs status');
    console.log('  node .agents/bus/agent-cli.mjs session --id <ID>');
    console.log('  node .agents/bus/agent-cli.mjs send --from <ID> --to <ID> --message "<MSG>"');
    console.log('  node .agents/bus/agent-cli.mjs broadcast --from <ID> --message "<MSG>"');
    break;
}

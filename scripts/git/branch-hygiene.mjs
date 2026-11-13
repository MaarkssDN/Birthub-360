#!/usr/bin/env node
/**
 * Auditoria e limpeza governada de branches remotas (TAREFA-SANEAMENTO-025 / BT360-DT-0048).
 *
 * Regras de segurança (nunca entram em limpeza automática):
 *  - branches protegidas: main, master, develop, HEAD;
 *  - qualquer branch com PR aberto;
 *  - `agente/*` com menos de AGENT_GRACE_DAYS dias (trabalho em andamento do enxame);
 *  - branches NÃO mergeadas em main — vão para revisão humana, nunca para delete.
 *
 * Deletáveis automaticamente (modo `clean`, somente com confirmação explícita):
 *  - `merged-stale`: mergeada em main e com último commit mais antigo que MIN_AGE_DAYS;
 *  - `archive/*` com mais de ARCHIVE_GRACE_DAYS dias: somente com --include-archives
 *    (experimentos arquivados — opt-in adicional porque o ref pode ser o único
 *    ponteiro para commits não mergeados).
 *
 * Uso:
 *   node scripts/git/branch-hygiene.mjs audit [--json-out arq.json] [--summary-out arq.md]
 *   node scripts/git/branch-hygiene.mjs clean --confirm DELETE-MERGED-BRANCHES [--include-archives]
 *
 * Requer `git` e, para o modo clean, `gh` autenticado (GH_TOKEN) — sem a lista de
 * PRs abertos a limpeza aborta em vez de arriscar deletar branch de PR aberto.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const DEFAULT_PROTECTED_BRANCHES = Object.freeze(['main', 'master', 'develop', 'HEAD']);
const DAY_MS = 24 * 60 * 60 * 1000;
const CLEAN_CONFIRM_PHRASE = 'DELETE-MERGED-BRANCHES';

/**
 * Classifica branches remotas. Função pura — toda a lógica de decisão testável.
 *
 * @param {object} input
 * @param {Array<{name:string, sha?:string, lastCommitDate:Date|string, isMerged:boolean}>} input.branches
 * @param {Set<string>|string[]} [input.openPrHeads]
 * @param {string[]} [input.protectedBranches]
 * @param {Date} [input.now]
 * @param {number} [input.minAgeDays]      idade mínima p/ branch mergeada virar candidata (default 30)
 * @param {number} [input.agentGraceDays]  graça p/ agente/* (default 90)
 * @param {number} [input.archiveGraceDays] graça p/ archive/* (default 180)
 * @returns {Array<object>} entradas {name, sha, lastCommitDate, ageDays, isMerged, decision, reason, autoDeletable, requiresOptIn}
 */
export function classifyBranches({
  branches,
  openPrHeads,
  protectedBranches = DEFAULT_PROTECTED_BRANCHES,
  now = new Date(),
  minAgeDays = 30,
  agentGraceDays = 90,
  archiveGraceDays = 180,
}) {
  const protectedSet = new Set(protectedBranches);
  const openPr = openPrHeads instanceof Set ? openPrHeads : new Set(openPrHeads ?? []);
  if (!Array.isArray(branches)) throw new Error('classifyBranches: `branches` deve ser um array');

  const report = [];
  for (const branch of branches) {
    if (!branch || typeof branch.name !== 'string' || !branch.name) {
      throw new Error('classifyBranches: branch sem `name` válido');
    }
    const lastCommit =
      branch.lastCommitDate instanceof Date
        ? branch.lastCommitDate
        : new Date(branch.lastCommitDate);
    if (Number.isNaN(lastCommit.getTime())) {
      throw new Error(`classifyBranches: lastCommitDate inválida para branch ${branch.name}`);
    }
    const ageDays = Math.floor((now.getTime() - lastCommit.getTime()) / DAY_MS);
    const isMerged = Boolean(branch.isMerged);

    const entry = {
      name: branch.name,
      sha: branch.sha ?? null,
      lastCommitDate: lastCommit.toISOString(),
      ageDays,
      isMerged,
      decision: 'keep',
      reason: '',
      autoDeletable: false,
      requiresOptIn: false,
    };

    if (protectedSet.has(branch.name)) {
      entry.reason = 'branch protegida (main/master/develop/HEAD)';
    } else if (openPr.has(branch.name)) {
      entry.reason = 'possui PR aberto — nunca entra em limpeza automática';
    } else if (branch.name.startsWith('agente/')) {
      if (ageDays < agentGraceDays) {
        entry.reason = `agente/* recente (< ${agentGraceDays}d de graça)`;
      } else if (isMerged) {
        entry.decision = 'candidate';
        entry.reason = `agente/* mergeada em main e com ${ageDays}d (> ${agentGraceDays}d de graça)`;
        entry.autoDeletable = true;
      } else {
        entry.decision = 'review';
        entry.reason = 'agente/* não mergeada — revisão humana obrigatória, nunca auto-delete';
      }
    } else if (branch.name.startsWith('archive/')) {
      if (ageDays >= archiveGraceDays) {
        entry.decision = 'candidate';
        entry.reason = `archive/* com ${ageDays}d (> ${archiveGraceDays}d)`;
        entry.requiresOptIn = true; // só deleta com --include-archives
      } else {
        entry.reason = `archive/* recente (< ${archiveGraceDays}d)`;
      }
    } else if (isMerged) {
      if (ageDays >= minAgeDays) {
        entry.decision = 'candidate';
        entry.reason = `mergeada em main e inativa há ${ageDays}d (> ${minAgeDays}d)`;
        entry.autoDeletable = true;
      } else {
        entry.reason = `mergeada recentemente (< ${minAgeDays}d)`;
      }
    } else {
      entry.decision = 'review';
      entry.reason =
        ageDays >= archiveGraceDays
          ? `não mergeada e inativa há ${ageDays}d — revisão humana obrigatória`
          : 'não mergeada em main — revisão humana obrigatória';
    }

    report.push(entry);
  }
  return report;
}

/**
 * Seleciona os nomes deletáveis a partir do relatório de classifyBranches.
 * `includeArchives` libera apenas a categoria archive-expirada (requiresOptIn).
 */
export function selectBranchesForDeletion(report, { includeArchives = false } = {}) {
  return report
    .filter(
      (entry) =>
        entry.decision === 'candidate' &&
        (entry.autoDeletable || (includeArchives && entry.requiresOptIn)),
    )
    .map((entry) => entry.name);
}

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', ...options });
}

function resolveBaseRef() {
  for (const candidate of ['refs/remotes/origin/main', 'refs/remotes/origin/master']) {
    try {
      git(['rev-parse', '--verify', '--quiet', candidate]);
      return candidate;
    } catch {
      // tenta o próximo candidato
    }
  }
  throw new Error('Nenhuma base de integração remota encontrada (origin/main ou origin/master).');
}

/** Baixa todas as heads remotas e retorna [{name, sha, lastCommitDate, isMerged}]. */
export function collectRemoteBranches({ baseRef } = {}) {
  // fetch explícito do refspec completo — em clone raso/local garante refs/remotes/origin/* atualizados
  git(['fetch', 'origin', '--prune', '+refs/heads/*:refs/remotes/origin/*']);
  const base = baseRef ?? resolveBaseRef();

  const raw = git([
    'for-each-ref',
    '--format=%(refname)%00%(objectname)%00%(committerdate:unix)',
    'refs/remotes/origin',
  ]);

  const branches = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const [refname, sha, unix] = line.split('\0');
    const name = refname.replace(/^refs\/remotes\/origin\//, '');
    if (!name || name === 'HEAD') continue;

    let isMerged = false;
    try {
      git(['merge-base', '--is-ancestor', sha, base], { stdio: ['ignore', 'ignore', 'ignore'] });
      isMerged = true;
    } catch (error) {
      // exit 1 = não é ancestral (não mergeada); qualquer outro código é erro real do git
      if (error.status !== 1) {
        throw new Error(
          `merge-base falhou para ${name} (${sha}) contra ${base}: ${error.stderr || error.message}`,
        );
      }
      isMerged = false;
    }
    branches.push({
      name,
      sha,
      lastCommitDate: new Date(Number(unix) * 1000),
      isMerged,
    });
  }
  return { branches, baseRef: base };
}

/**
 * Lista heads de PRs abertos via `gh`. Retorna { heads: Set, available: boolean }.
 * `available=false` significa que a proteção contra deletar branch de PR aberto
 * NÃO pôde ser verificada — o modo clean deve abortar nesse caso.
 */
export function fetchOpenPrHeads() {
  try {
    const out = execFileSync(
      'gh',
      ['pr', 'list', '--state', 'open', '--limit', '1000', '--json', 'headRefName', '--jq', '.[].headRefName'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const heads = new Set(
      out
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    );
    return { heads, available: true };
  } catch {
    return { heads: new Set(), available: false };
  }
}

function parseArgs(argv) {
  const args = { command: argv[0], jsonOut: null, summaryOut: null, confirm: null, includeArchives: false };
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json-out') args.jsonOut = argv[++i];
    else if (arg === '--summary-out') args.summaryOut = argv[++i];
    else if (arg === '--confirm') args.confirm = argv[++i];
    else if (arg === '--include-archives') args.includeArchives = true;
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }
  return args;
}

function buildReport(report, extras = {}) {
  const candidates = report.filter((e) => e.decision === 'candidate');
  const review = report.filter((e) => e.decision === 'review');
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      remoteBranches: report.length,
      keep: report.filter((e) => e.decision === 'keep').length,
      candidates: candidates.length,
      autoDeletable: candidates.filter((e) => e.autoDeletable).length,
      requiresOptIn: candidates.filter((e) => e.requiresOptIn).length,
      review: review.length,
    },
    ...extras,
    branches: report,
  };
}

function renderMarkdown(data) {
  const lines = [
    '## Auditoria de higiene de branches remotas',
    '',
    `- Gerado em: ${data.generatedAt}`,
    `- Branches remotas: ${data.totals.remoteBranches}`,
    `- Mantidas (protegidas/recentes/não mergeadas recentes): ${data.totals.keep}`,
    `- Candidatas a limpeza: ${data.totals.candidates} (${data.totals.autoDeletable} auto-deletáveis, ${data.totals.requiresOptIn} archive\/* com opt-in)`,
    `- Revisão humana obrigatória (não mergeadas): ${data.totals.review}`,
    '',
  ];
  if (data.baseRef) lines.push(`- Base de integração usada: \`${data.baseRef}\``, '');
  const candidates = data.branches.filter((b) => b.decision === 'candidate');
  if (candidates.length) {
    lines.push('### Candidatas', '', '| Branch | Idade (dias) | Motivo |', '|---|---|---|');
    for (const c of candidates) {
      lines.push(`| \`${c.name}\` | ${c.ageDays} | ${c.reason} |`);
    }
    lines.push('');
  }
  const review = data.branches.filter((b) => b.decision === 'review');
  if (review.length) {
    lines.push('### Não mergeadas — revisão humana (nunca auto-delete)', '');
    for (const r of review.slice(0, 50)) {
      lines.push(`- \`${r.name}\` — ${r.ageDays}d — ${r.reason}`);
    }
    if (review.length > 50) lines.push(`- … e mais ${review.length - 50} branches`);
    lines.push('');
  }
  return lines.join('\n');
}

function writeOutputs(data, args) {
  if (args.jsonOut) writeFileSync(args.jsonOut, `${JSON.stringify(data, null, 2)}\n`);
  const md = renderMarkdown(data);
  if (args.summaryOut) writeFileSync(args.summaryOut, `${md}\n`);
  process.stdout.write(`${md}\n`);
}

function runAudit(args) {
  const { branches, baseRef } = collectRemoteBranches();
  const { heads: openPrHeads, available } = fetchOpenPrHeads();
  if (!available) {
    process.stderr.write(
      'AVISO: `gh` indisponível/sem auth — lista de PRs abertos NÃO verificada. Candidatas podem incluir branches de PRs abertos; não use este relatório para deletar.\n',
    );
  }
  const report = classifyBranches({ branches, openPrHeads });
  const data = buildReport(report, { mode: 'audit', baseRef, openPrDataAvailable: available });
  writeOutputs(data, args);
  return 0;
}

function runClean(args) {
  if (args.confirm !== CLEAN_CONFIRM_PHRASE) {
    process.stderr.write(
      `Limpeza abortada: exige --confirm ${CLEAN_CONFIRM_PHRASE}. Nenhuma branch foi tocada.\n`,
    );
    return 2;
  }
  const { branches, baseRef } = collectRemoteBranches();
  const { heads: openPrHeads, available } = fetchOpenPrHeads();
  if (!available) {
    process.stderr.write(
      'Limpeza ABORTADA: não foi possível listar PRs abertos via `gh`. Sem essa proteção, deletar branches é inseguro. Autentique `gh` (GH_TOKEN) e repita.\n',
    );
    return 2;
  }
  const report = classifyBranches({ branches, openPrHeads });
  const toDelete = selectBranchesForDeletion(report, { includeArchives: args.includeArchives });

  const results = { deleted: [], failed: [] };
  for (const name of toDelete) {
    try {
      git(['push', 'origin', '--delete', name], { stdio: ['ignore', 'pipe', 'pipe'] });
      results.deleted.push(name);
      process.stdout.write(`DELETED ${name}\n`);
    } catch (error) {
      results.failed.push({ name, error: String(error.stderr || error.message).trim() });
      process.stderr.write(`FALHA ao deletar ${name}: ${results.failed.at(-1).error}\n`);
    }
  }

  const data = buildReport(report, {
    mode: 'clean',
    baseRef,
    openPrDataAvailable: true,
    includeArchives: args.includeArchives,
    deletion: results,
  });
  writeOutputs(data, args);
  if (results.failed.length > 0) {
    process.stderr.write(`${results.failed.length} deleção(ões) falharam — ver relatório.\n`);
    return 1;
  }
  return 0;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'audit') return runAudit(args);
  if (args.command === 'clean') return runClean(args);
  process.stderr.write('Uso: branch-hygiene.mjs <audit|clean> [opções]\n');
  return 2;
}

const invokedAsScript =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) {
  process.exitCode = main();
}

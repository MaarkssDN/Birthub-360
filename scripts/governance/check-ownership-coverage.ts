// scripts/governance/check-ownership-coverage.ts
//
// Gate de "sincronização entre a matriz de propriedade (AGENTS.md §15) e o dependency-cruiser"
// (TAREFA-SANEAMENTO-011 / dívida BT360-DT-0004, handoff
// .agents/handoffs/onda-saneamento-20261110/00-para-00-ausencia-de-sincronizacao-automatizada-entre-a-matriz-de-propriedade-d.md).
//
// O dependency-cruiser (.dependency-cruiser.cjs, via `npm run lint:architecture`) só enxerga o
// grafo de imports de `src/`, `server.ts` e `worker.ts` — e mesmo dentro dele só protege
// fronteiras de camadas/pastas, nunca "quem é dono de qual arquivo". Os caminhos de propriedade
// exclusiva do AGENTS.md §15 (`prisma/schema.prisma`, `.github/workflows/**`, `charts/**` etc.) estão
// majoritariamente FORA desse grafo: para eles o depcruise não tem como oferecer proteção
// automática, e a proteção real é revisão de diff + handoff. O risco documentado na dívida é que
// essa classificação fique implícita e derive em silêncio — um path novo entra no §15 sem ninguém
// decidir como ele é protegido, ou uma regra do depcruise passa a mirar um path sem que a matriz
// saiba.
//
// Este script torna a decisão explícita e verificável:
//   1. Faz o parse do bloco de código da seção "## 15. Propriedade exclusiva de arquivos" do
//      AGENTS.md e extrai cada escopo (path/glob ou descritor em prosa) com seu dono.
//   2. Exige que TODO escopo da matriz tenha uma entrada correspondente em
//      scripts/governance/ownership-coverage.manifest.json, com o MESMO dono — qualquer divergência
//      (path novo no AGENTS.md, path removido, dono trocado) falha o gate. É a sincronização em si.
//   3. Para cada entrada do manifesto, valida a proteção declarada:
//        - coverage "depcruise": só é aceito para escopos dentro do grafo do depcruise
//          (src/**, server.ts, worker.ts) e exige que uma regra `forbidden` nomeada exista em
//          .dependency-cruiser.cjs E que o regex `to.path` dela realmente case com um path
//          sintético derivado do escopo (e que `to.pathNot`, se houver, não o exclua). Sem isso,
//          uma entrada poderia alegar proteção automática que não existe.
//        - coverage "review": exige justificativa não-vazia (por que a proteção é revisão e não
//          regra automática) e, se `alternateCheck` for declarado, exige que exista um script npm
//          correspondente em package.json.
//   4. Verifica que escopos path-like existem de fato no repositório (path exato ou diretório-base
//      de um glob), impedindo entradas fantasmas na matriz.
//
// Qualquer inconsistência é reportada de uma vez (lista completa de violações) e o processo sai
// com código 1. Falhas de leitura/parse (AGENTS.md sem §15, JSON inválido, config do depcruise
// ilegível) abortam com erro explícito — nunca um fallback silencioso (AGENTS.md §30 e §32).
//
// Uso: `npm run verify:ownership-coverage` (ou `tsx scripts/governance/check-ownership-coverage.ts`).

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGENTS_PATH = path.join(ROOT, 'AGENTS.md');
const DEPCRUISE_CONFIG_PATH = path.join(ROOT, '.dependency-cruiser.cjs');
const MANIFEST_PATH = path.join(ROOT, 'scripts/governance/ownership-coverage.manifest.json');
const PACKAGE_PATH = path.join(ROOT, 'package.json');

// Raízes que o `lint:architecture` efetivamente cruza (ver script npm). Um escopo fora delas
// não pode ter proteção "depcruise" — a ferramenta nunca vai vê-lo.
const DEPCRUISE_SCAN_ROOTS = ['src/', 'server.ts', 'worker.ts'];

const MIN_JUSTIFICATION_LENGTH = 20;

export type OwnershipEntry = {
  /** Escopo literal do AGENTS.md §15: path, glob (`**`/`*`) ou descritor em prosa. */
  scope: string;
  /** Dono literal declarado no AGENTS.md (ex.: "Agente 01", "decisão humana"). */
  owner: string;
};

export type DepcruiseForbiddenRule = {
  name?: string;
  to?: {
    path?: string | string[];
    pathNot?: string | string[];
    circular?: boolean;
  };
};

export type OwnershipManifestEntry = {
  scope: string;
  owner: string;
  coverage: 'depcruise' | 'review';
  /** Obrigatória para coverage "review"; recomendada sempre que a escolha não for óbvia. */
  justification?: string;
  /** coverage "depcruise": nome da regra em forbidden[] de .dependency-cruiser.cjs. */
  rule?: string;
  /** coverage "review": script npm alternativo que cobre a verificação (opcional). */
  alternateCheck?: string;
  /**
   * Exceção estreita e auditável ao passo 4 (existência do path): o AGENTS.md §15 reserva o path
   * para um dono, mas o diretório ainda não foi criado (ex.: src/lib/db/rls/**). Exige
   * "justification" explicando a ausência; sem este campo, path inexistente continua violação.
   */
  allowMissingPath?: boolean;
};

export type OwnershipManifest = {
  entries: OwnershipManifestEntry[];
};

/**
 * Extrai as entradas da matriz de propriedade do AGENTS.md §15.
 * O bloco oficial é um fence de código onde cada grupo é:
 *   <uma ou mais linhas de escopo>
 *   → <dono>
 * Linhas que não são escopo nem dono (branco) são ignoradas; prosa fora do fence não entra.
 */
export function parseOwnershipMatrix(markdown: string): OwnershipEntry[] {
  const headingIndex = markdown.indexOf('## 15.');
  if (headingIndex === -1) {
    throw new Error(
      'AGENTS.md não contém a seção "## 15." — impossível verificar a matriz de propriedade.',
    );
  }
  const afterHeading = markdown.slice(headingIndex);
  const fenceOpen = afterHeading.indexOf('```');
  if (fenceOpen === -1) {
    throw new Error('Seção "## 15." do AGENTS.md não contém bloco de código com a matriz.');
  }
  const blockStart = fenceOpen + 3;
  const fenceClose = afterHeading.indexOf('```', blockStart);
  if (fenceClose === -1) {
    throw new Error('Bloco de código da seção "## 15." do AGENTS.md não está fechado.');
  }
  const block = afterHeading.slice(blockStart, fenceClose);

  const entries: OwnershipEntry[] = [];
  let pendingScopes: string[] = [];

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const ownerMatch = line.match(/^→\s*(.+)$/);
    if (ownerMatch) {
      const owner = ownerMatch[1].trim();
      if (pendingScopes.length === 0) {
        throw new Error(
          `AGENTS.md §15: linha "→ ${owner}" sem escopo(s) anterior(es) — matriz malformada.`,
        );
      }
      for (const scope of pendingScopes) {
        entries.push({ scope, owner });
      }
      pendingScopes = [];
      continue;
    }
    pendingScopes.push(line);
  }

  if (pendingScopes.length > 0) {
    throw new Error(
      `AGENTS.md §15: escopo(s) sem dono no fim do bloco: ${pendingScopes.join(', ')} — ` +
        'matriz malformada.',
    );
  }
  if (entries.length === 0) {
    throw new Error('AGENTS.md §15: nenhum par escopo→dono encontrado no bloco de código.');
  }
  return entries;
}

/**
 * O escopo é "path-like" quando tem cara de caminho do repositório (contém `/`, `*` ou `.`).
 * Descritores em prosa da matriz ("navegação principal", "Sidebar") não são path-like e só
 * podem ter coverage "review" — não existe path para um regex do depcruise casar.
 */
export function isPathLikeScope(scope: string): boolean {
  return /[/.]|\*/.test(scope) && !/\s/.test(scope);
}

/**
 * Converte um escopo da matriz (path exato ou glob) em um path concreto sintético para testar
 * os regexes `to.path`/`to.pathNot` do depcruise. `**`/`*` viram segmentos de probe; se o
 * resultado não tiver extensão de arquivo, assume-se diretório e adiciona `probe.ts` — assim
 * `src/features/**` casa com `^src/features/([^/]+)/` em vez de falhar por falta de segmento.
 */
export function synthesizeProbePath(scope: string): string {
  let probe = scope.replace(/\*\*/g, '__probe__').replace(/\*/g, 'x');
  if (scope.includes('*') && !/\.[a-z0-9]+$/i.test(probe)) {
    probe = `${probe}/probe.ts`;
  }
  return probe;
}

/** Um escopo está dentro do grafo do depcruise se o probe (ou o literal) cai nas raízes varridas. */
export function isInsideDepcruiseGraph(scope: string): boolean {
  const probe = synthesizeProbePath(scope);
  return DEPCRUISE_SCAN_ROOTS.some(
    (root) => probe === root.replace(/\/$/, '') || probe.startsWith(root),
  );
}

function toRegexList(value: string | string[] | undefined): RegExp[] {
  if (value === undefined) return [];
  const patterns = Array.isArray(value) ? value : [value];
  return patterns.map((pattern) => new RegExp(pattern));
}

/**
 * Uma regra `forbidden` do depcruise "protege" um escopo quando seu `to.path` casa com o path
 * sintético do escopo E nenhum `to.pathNot` o exclui. Regras sem `to.path` (ex.: `no-circular`,
 * `to.circular: true`) protegem o grafo inteiro contra um tipo específico de violação, mas não
 * podem ser citadas como proteção de propriedade de um path — por isso não contam aqui.
 */
export function ruleCoversScope(rule: DepcruiseForbiddenRule, scope: string): boolean {
  const to = rule.to;
  if (!to || to.path === undefined) return false;
  const probe = synthesizeProbePath(scope);
  const toPathRegexes = toRegexList(to.path);
  const toPathNotRegexes = toRegexList(to.pathNot);
  const matchesTo = toPathRegexes.some((regex) => regex.test(probe));
  if (!matchesTo) return false;
  return !toPathNotRegexes.some((regex) => regex.test(probe));
}

/** Verifica existência real do escopo (arquivo exato ou base de glob) no repositório. */
export function scopeExistsInRepo(scope: string, root: string = ROOT): boolean {
  if (!isPathLikeScope(scope)) return true; // prosa não é verificável por fs — justificativa cobre.
  if (!scope.includes('*')) {
    return existsSync(path.join(root, scope));
  }
  const base = scope.slice(0, scope.indexOf('*')).replace(/\/+$/, '');
  const dirToCheck = base || '.';
  return existsSync(path.join(root, dirToCheck));
}

function loadJsonFile<T>(filePath: string, label: string): T {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Não foi possível ler ${label} em ${filePath}: ${(err as Error).message}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`${label} não é JSON válido (${filePath}): ${(err as Error).message}`);
  }
}

function loadDepcruiseForbiddenRules(): DepcruiseForbiddenRule[] {
  const require = createRequire(import.meta.url);
  let config: { forbidden?: DepcruiseForbiddenRule[] };
  try {
    config = require(DEPCRUISE_CONFIG_PATH) as { forbidden?: DepcruiseForbiddenRule[] };
  } catch (err) {
    throw new Error(
      `Não foi possível carregar .dependency-cruiser.cjs: ${(err as Error).message}`,
    );
  }
  if (!Array.isArray(config.forbidden)) {
    throw new Error('.dependency-cruiser.cjs não expõe um array `forbidden` — formato inesperado.');
  }
  return config.forbidden;
}

function loadNpmScriptNames(): Set<string> {
  const pkg = loadJsonFile<{ scripts?: Record<string, string> }>(PACKAGE_PATH, 'package.json');
  if (!pkg.scripts || typeof pkg.scripts !== 'object') {
    throw new Error('package.json não contém a seção `scripts` — formato inesperado.');
  }
  return new Set(Object.keys(pkg.scripts));
}

export type CoverageCheckInput = {
  matrixEntries: OwnershipEntry[];
  manifest: OwnershipManifest;
  depcruiseRules: DepcruiseForbiddenRule[];
  npmScriptNames: Set<string>;
  root?: string;
};

/**
 * Cruza matriz ↔ manifesto ↔ regras do depcruise e retorna a lista completa de violações
 * (vazia = gate verde). Função pura — toda a leitura de disco acontece em main().
 */
export function evaluateOwnershipCoverage(input: CoverageCheckInput): string[] {
  const { matrixEntries, manifest, depcruiseRules, npmScriptNames } = input;
  const root = input.root ?? ROOT;
  const violations: string[] = [];

  const matrixByScope = new Map<string, OwnershipEntry>();
  for (const entry of matrixEntries) {
    if (matrixByScope.has(entry.scope)) {
      violations.push(`AGENTS.md §15: escopo "${entry.scope}" aparece mais de uma vez na matriz.`);
      continue;
    }
    matrixByScope.set(entry.scope, entry);
  }

  const manifestByScope = new Map<string, OwnershipManifestEntry>();
  for (const entry of manifest.entries) {
    if (manifestByScope.has(entry.scope)) {
      violations.push(`Manifesto de ownership: escopo "${entry.scope}" declarado mais de uma vez.`);
      continue;
    }
    manifestByScope.set(entry.scope, entry);
  }

  // Sincronização bidirecional matriz ↔ manifesto.
  for (const entry of matrixEntries) {
    const manifestEntry = manifestByScope.get(entry.scope);
    if (!manifestEntry) {
      violations.push(
        `Escopo "${entry.scope}" (dono: ${entry.owner}) existe no AGENTS.md §15 mas não tem ` +
          'entrada em scripts/governance/ownership-coverage.manifest.json — declare como ele é ' +
          'protegido (coverage "depcruise" ou "review" com justificativa).',
      );
      continue;
    }
    if (manifestEntry.owner !== entry.owner) {
      violations.push(
        `Escopo "${entry.scope}": dono diverge — AGENTS.md diz "${entry.owner}", manifesto diz ` +
          `"${manifestEntry.owner}". Atualize o manifesto (ou o AGENTS.md, se a mudança de dono ` +
          'for intencional e já aprovada).',
      );
    }
  }
  for (const scope of manifestByScope.keys()) {
    if (!matrixByScope.has(scope)) {
      violations.push(
        `Manifesto de ownership: escopo "${scope}" não existe mais no AGENTS.md §15 — remova a ` +
          'entrada do manifesto para não deixar proteção fantasma.',
      );
    }
  }

  // Validação da proteção declarada para cada entrada do manifesto que existe na matriz.
  for (const [scope, manifestEntry] of manifestByScope) {
    if (!matrixByScope.has(scope)) continue; // já reportado acima como entrada fantasma.

    if (manifestEntry.coverage === 'depcruise') {
      if (!isPathLikeScope(scope)) {
        violations.push(
          `Escopo "${scope}": coverage "depcruise" exige um path/glob verificável, mas o escopo ` +
            'é um descritor/nome simples — use coverage "review" com justificativa.',
        );
        continue;
      }
      if (!isInsideDepcruiseGraph(scope)) {
        violations.push(
          `Escopo "${scope}": coverage "depcruise" é impossível — o path está fora do grafo ` +
            'varrido por `npm run lint:architecture` (src/, server.ts, worker.ts). Use coverage ' +
            '"review" documentando a proteção real (revisão de diff / outro gate).',
        );
        continue;
      }
      if (!manifestEntry.rule) {
        violations.push(
          `Escopo "${scope}": coverage "depcruise" exige o campo "rule" com o nome da regra em ` +
            'forbidden[] de .dependency-cruiser.cjs.',
        );
        continue;
      }
      const rule = depcruiseRules.find((r) => r.name === manifestEntry.rule);
      if (!rule) {
        violations.push(
          `Escopo "${scope}": regra "${manifestEntry.rule}" não existe em forbidden[] de ` +
            '.dependency-cruiser.cjs — o depcruise não protege este path hoje.',
        );
        continue;
      }
      if (!ruleCoversScope(rule, scope)) {
        violations.push(
          `Escopo "${scope}": a regra "${manifestEntry.rule}" existe mas seu to.path/to.pathNot ` +
            `não casa com "${synthesizeProbePath(scope)}" — a proteção alegada é ilusória.`,
        );
        continue;
      }
    } else if (manifestEntry.coverage === 'review') {
      const justification = manifestEntry.justification?.trim() ?? '';
      if (justification.length < MIN_JUSTIFICATION_LENGTH) {
        violations.push(
          `Escopo "${scope}": coverage "review" exige "justification" com pelo menos ` +
            `${MIN_JUSTIFICATION_LENGTH} caracteres explicando por que a proteção é revisão ` +
            '(e não regra automática do depcruise ou outro gate).',
        );
      }
      if (manifestEntry.alternateCheck && !npmScriptNames.has(manifestEntry.alternateCheck)) {
        violations.push(
          `Escopo "${scope}": alternateCheck "${manifestEntry.alternateCheck}" não existe em ` +
            'scripts do package.json — corrija o nome ou remova o campo.',
        );
      }
    } else {
      violations.push(
        `Escopo "${scope}": coverage "${String(manifestEntry.coverage)}" é inválido — use ` +
          '"depcruise" ou "review".',
      );
    }

    if (
      isPathLikeScope(scope) &&
      !scopeExistsInRepo(scope, root) &&
      !(manifestEntry.allowMissingPath === true && (manifestEntry.justification?.trim().length ?? 0) >= MIN_JUSTIFICATION_LENGTH)
    ) {
      violations.push(
        `Escopo "${scope}": path não existe no repositório — a matriz do AGENTS.md §15 (ou o ` +
          'manifesto) está desatualizada em relação ao código real.',
      );
    }
  }

  return violations;
}

function main(): void {
  const agentsMarkdown = readFileSync(AGENTS_PATH, 'utf-8');
  const matrixEntries = parseOwnershipMatrix(agentsMarkdown);
  const manifest = loadJsonFile<OwnershipManifest>(MANIFEST_PATH, 'manifesto de ownership');
  if (!Array.isArray(manifest.entries)) {
    throw new Error(
      `${MANIFEST_PATH}: formato inesperado — esperado objeto com array "entries".`,
    );
  }
  const depcruiseRules = loadDepcruiseForbiddenRules();
  const npmScriptNames = loadNpmScriptNames();

  const violations = evaluateOwnershipCoverage({
    matrixEntries,
    manifest,
    depcruiseRules,
    npmScriptNames,
  });

  if (violations.length > 0) {
    console.error(
      `❌ verify:ownership-coverage — ${violations.length} violação(ões) de sincronização ` +
        'entre AGENTS.md §15 e a proteção declarada:\n',
    );
    for (const violation of violations) {
      console.error(`  - ${violation}`);
    }
    process.exit(1);
  }

  console.log(
    `✅ verify:ownership-coverage — ${matrixEntries.length} escopo(s) de propriedade do ` +
      `AGENTS.md §15 cobertos pelo manifesto (${manifest.entries.length} entrada(s)), ` +
      'matriz e proteção declarada sincronizadas.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

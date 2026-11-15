// scripts/architecture/verify-file-ownership.ts
//
// TAREFA-SANEAMENTO-011 / BT360-DT-0004 (Onda 5, Agente 14) — verificador de propriedade de
// arquivos do AGENTS.md §15.
//
// O dependency-cruiser (.dependency-cruiser.cjs) modela o grafo de IMPORTS entre módulos — ele
// não consegue expressar "um diff/PR tocou prisma/schema.prisma sem handoff para o Agente 01",
// porque não existe aresta de import entre um commit e um handoff. Por isso a verificação da
// matriz de propriedade é um gate separado, sobre `git diff`, e não uma regra `forbidden` do
// depcruise (abordagem documentada no handoff
// .agents/handoffs/onda-saneamento-20261110/00-para-00-ausencia-de-sincronizacao-automatizada-
// entre-a-matriz-de-propriedade-d.md e em docs/architecture/FILE-OWNERSHIP.md).
//
// O que o script faz:
//   1. Coleta os arquivos alterados (git diff --name-only contra uma base, mais staged e
//      worktree — ou uma lista explícita via --files).
//   2. Cruza cada caminho com OWNERSHIP_RULES (espelho executável do AGENTS.md §15).
//   3. Para cada arquivo de dono exclusivo tocado, procura evidência de handoff — e a evidência
//      precisa fazer parte do MESMO diff/PR: só contam handoffs sob .agents/handoffs/** que
//      também aparecem na lista de arquivos alterados. Um handoff histórico que cite o caminho
//      não autoriza uma alteração nova (seria o mesmo que "já existiu PR parecido uma vez").
//      Isso torna o gate determinístico em CI (mtime de checkout não serve como sinal) e dá um
//      critério objetivo: "o PR carrega o artefato de handoff do dono".
//   4. Emite warnings. NÃO bloqueia por padrão: package.json/lockfiles/server.ts têm fluxo de
//      aprovação explícita do 00 — por isso o default é exit 0 e `--strict` é opt-in para quem
//      quiser transformar em gate.
//
// Uso:
//   npx tsx scripts/architecture/verify-file-ownership.ts                 # diff vs origin/main + staged + worktree
//   npx tsx scripts/architecture/verify-file-ownership.ts --base main      # outra base
//   npx tsx scripts/architecture/verify-file-ownership.ts --files a.ts,b.ts
//   npx tsx scripts/architecture/verify-file-ownership.ts --strict         # exit 1 se houver warnings
//   npx tsx scripts/architecture/verify-file-ownership.ts --json           # saída máquina-legível
//
// Exit codes: 0 = ok (ou warnings em modo não-estrito), 1 = findings com --strict,
//             2 = erro de uso/git.

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HANDOFFS_DIR = path.join(ROOT, '.agents', 'handoffs');

// Acima disto um handoff é ignorado na busca de evidência — handoffs são documentos curtos;
// um .md gigante ali dentro é anomalia, não fonte de verdade para este gate.
const MAX_HANDOFF_BYTES = 512 * 1024;

export type OwnershipRule = {
  /** Identificador estável da regra (usado em testes e no relatório). */
  id: string;
  /** Descrição legível do dono, para o relatório. */
  label: string;
  /** Regexes aplicadas ao caminho normalizado (posix, minúsculo). */
  match: RegExp[];
  /**
   * Para donos de agente: regex que identifica menção ao agente dono em handoffs
   * (ex.: "Agente 01", "para-01", "01-para-06" NÃO casa porque exige prefixo de agente/destino).
   */
  ownerRe?: RegExp;
  /** Palavra-chave de área que precisa coexistir com ownerRe no mesmo handoff. */
  areaRe?: RegExp;
  /**
   * Para paths que exigem aprovação explícita do Agente 00 (AGENTS.md §15): o handoff precisa
   * mencionar o basename do arquivo alterado E este regex (aprovação/coordenador).
   */
  approvalRe?: RegExp;
};

// ---------------------------------------------------------------------------
// Matriz executável — espelho do AGENTS.md §15. Se o §15 mudar, este array muda
// junto (não há como importar o markdown; a paridade é mantida por revisão, e os
// testes em tests/unit/architecture/verify-file-ownership.test.ts fixam os casos
// canônicos da matriz).
// ---------------------------------------------------------------------------
export const OWNERSHIP_RULES: OwnershipRule[] = [
  {
    id: 'agente-01-schema',
    label: 'Agente 01/01A — prisma/schema.prisma e prisma/migrations/**',
    match: [/^prisma\/schema\.prisma$/, /^prisma\/migrations\//],
    ownerRe: /\b(?:agente|para|de)\s*-?\s*0?1a?\b/i,
    areaRe: /\bprisma\b|schema\.prisma|migra(ç|c)(ã|a)o/i,
  },
  {
    id: 'agente-02-app',
    label: 'Agente 02 — src/App.tsx, navegação principal e Sidebar',
    // "Navegação principal/Sidebar" do §15 é mapeado por heurística para
    // src/components/layout/** (Sidebar.tsx, ModuleRail, MainLayout etc. — ver
    // src/components/layout/AGENTS.md, dono Agente 02) e src/bootstrap/routes.ts.
    match: [/^src\/app\.tsx$/, /^src\/components\/layout\//, /^src\/bootstrap\/routes\.ts$/],
    ownerRe: /\b(?:agente|para|de)\s*-?\s*0?2\b/i,
    areaRe: /app\.tsx|layout|sidebar|navega(ç|c)|rota|routes|shell|\bux\b|produto/i,
  },
  {
    id: 'agente-08-ci',
    label: 'Agente 08 — .github/workflows/**, Dockerfile, docker-compose.yml',
    // §15 reserva "docker-compose.yml" literal — os arquivos auxiliares
    // docker-compose.services/postgres-local/qdrant/opensource.yml NÃO são slot
    // do 08 (correção pós-revisão 24: regex anterior era over-inclusive).
    match: [/^\.github\/workflows\//, /^dockerfile$/, /^docker-compose\.yml$/],
    ownerRe: /\b(?:agente|para|de)\s*-?\s*0?8\b/i,
    areaRe: /github|workflow|docker|dockerfile|docker-compose|\bci\b|\bcd\b/i,
  },
  {
    id: 'agente-10-infra',
    label: 'Agente 10 — k8s/**, argocd/**, charts/**, infrastructure/** e docker/**',
    // §15 lista k8s/argocd/charts/infrastructure. docker/** entra como refino
    // local autorizado por docker/AGENTS.md (dono Agente 10, infra auxiliar);
    // isso também cobre docker/postgres/Dockerfile, que o §15 não menciona.
    match: [/^k8s\//, /^argocd\//, /^charts\//, /^infrastructure\//, /^docker\//],
    ownerRe: /\b(?:agente|para|de)\s*-?\s*0?10\b/i,
    areaRe: /k8s|argocd|charts?|infrastructure|infraestrutura|observabilidade|kubernetes|docker/i,
  },
  {
    id: 'agente-09-mobile',
    label: 'Agente 09 — android/** e capacitor.config.ts',
    match: [/^android\//, /^capacitor\.config\.ts$/],
    ownerRe: /\b(?:agente|para|de)\s*-?\s*0?9\b/i,
    areaRe: /android|capacitor|mobile|\bios\b/i,
  },
  {
    id: 'agente-11-marca',
    label: 'Agente 11 — identidade-visual/** e documentacao-aplicacao/**',
    match: [/^identidade-visual\//, /^documentacao-aplicacao\//],
    ownerRe: /\b(?:agente|para|de)\s*-?\s*0?11\b/i,
    areaRe: /identidade|marca|documenta(ç|c)(ã|a)o-aplica(ç|c)(ã|a)o|visual/i,
  },
  {
    id: 'prompts-decisao-humana',
    label: '.agents/prompts/** — decisão humana (sem agente dono)',
    match: [/^\.agents\/prompts\//],
    ownerRe: /humano|decis(a|ã)o humana|aprovad/i,
    areaRe: /\.agents\/prompts|prompt/i,
  },
  {
    id: 'agente-00-runs',
    label: 'Agente 00 — .agents/runs/**',
    match: [/^\.agents\/runs\//],
    ownerRe: /\b(?:agente|para|de)\s*-?\s*00\b/i,
    areaRe: /\.agents\/runs|\bruns?\//i,
  },
  {
    id: 'agente-24-reviews',
    label: 'Agente 24/00 — .agents/reviews/**',
    match: [/^\.agents\/reviews\//],
    ownerRe: /\b(?:agente|para|de)\s*-?\s*(?:24|00)\b/i,
    areaRe: /\.agents\/reviews|revis(ã|a)o/i,
  },
  {
    id: 'aprovacao-00',
    label: 'Aprovação explícita do Agente 00 — package.json/lockfiles e server.ts',
    match: [
      /^package\.json$/,
      /^package-lock\.json$/,
      /^pnpm-lock\.yaml$/,
      /^pnpm-workspace\.yaml$/,
      /^yarn\.lock$/,
      /^server\.ts$/,
    ],
    approvalRe: /aprova|coordenador|\bagente\s*00\b|para-00\b/i,
  },
];

// .agents/handoffs/** NÃO é dono exclusivo: cada agente cria os próprios handoffs
// (AGENTS.md §15) — um diff ali é a própria evidência que este gate procura, não uma
// violação.

export type OwnershipFinding = {
  file: string;
  ruleId: string;
  ownerLabel: string;
};

export type HandoffDoc = {
  /** Caminho relativo ao repo, para diagnóstico. */
  file: string;
  text: string;
};

/** Normaliza para posix + minúsculo — git diff emite `/`, editores no Windows emitem `\`. */
export function normalizeRepoPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
}

/** Regras de propriedade que casam com o caminho (pode ser mais de uma). */
export function rulesForPath(filePath: string): OwnershipRule[] {
  const norm = normalizeRepoPath(filePath);
  return OWNERSHIP_RULES.filter((r) => r.match.some((re) => re.test(norm)));
}

/**
 * Um handoff "cobre" a alteração quando:
 *  - (regra com approvalRe) menciona o basename do arquivo alterado E um termo de aprovação
 *    do Agente 00 — caminho solto não basta porque package.json/server.ts aparecem em
 *    handoffs que não são sobre aprovação dele;
 *  - (regra de agente) menciona o caminho exato alterado, OU menciona o dono (ownerRe) e a
 *    área (areaRe) no mesmo documento.
 */
export function handoffCovers(handoff: HandoffDoc, filePath: string, rule: OwnershipRule): boolean {
  const norm = normalizeRepoPath(filePath);
  if (rule.approvalRe) {
    const base = path.posix.basename(norm);
    return handoff.text.includes(base) && rule.approvalRe.test(handoff.text);
  }
  // Caminho exato em qualquer uma das duas formas de separador.
  if (
    handoff.text.includes(norm) ||
    handoff.text.includes(norm.replace(/\//g, '\\')) ||
    handoff.text.includes(filePath)
  ) {
    return true;
  }
  return Boolean(rule.ownerRe?.test(handoff.text) && rule.areaRe?.test(handoff.text));
}

/**
 * Cruza a lista de arquivos alterados com a matriz e os handoffs disponíveis.
 * Função pura — toda a lógica testável sem git nem filesystem.
 */
export function verifyOwnership(opts: {
  changedFiles: string[];
  handoffs: HandoffDoc[];
}): OwnershipFinding[] {
  const findings: OwnershipFinding[] = [];
  const seen = new Set<string>();
  for (const raw of opts.changedFiles) {
    const file = normalizeRepoPath(raw);
    if (!file || seen.has(file)) continue;
    seen.add(file);
    for (const rule of rulesForPath(file)) {
      const covered = opts.handoffs.some((h) => handoffCovers(h, file, rule));
      if (!covered) {
        findings.push({ file, ruleId: rule.id, ownerLabel: rule.label });
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Coleta de entradas (git + filesystem) — fina, não testada unitariamente.
// ---------------------------------------------------------------------------

function git(args: string): string {
  // core.quotepath=false: sem isso o git emite paths não-ASCII entre aspas
  // ("\303\251..."), o que impediria o casamento com OWNERSHIP_RULES.
  return execSync(`git -c core.quotepath=false ${args}`, { cwd: ROOT, encoding: 'utf8' });
}

/**
 * Arquivos alterados = diff contra a base (se informada) + staged + worktree.
 * Sem --base e sem --files, assume origin/main como base de PR; se a ref não
 * existir localmente, segue só com staged+worktree (não é erro — worktree novo
 * de agente pode não ter origin/main buscado).
 */
export function collectChangedFiles(opts: { base?: string; files?: string[] }): string[] {
  if (opts.files && opts.files.length > 0) {
    return opts.files.map((f) => f.trim()).filter(Boolean);
  }
  const out = new Set<string>();
  const base = opts.base ?? 'origin/main';
  try {
    // ACMRD inclui deleções: apagar arquivo de dono exclusivo também é alteração (§15).
    for (const f of git(`diff --name-only --diff-filter=ACMRD ${base}...HEAD`).split('\n')) {
      if (f.trim()) out.add(f.trim());
    }
  } catch {
    // base indisponível (ex.: clone raso sem origin/main) — segue com o resto.
  }
  for (const args of ['diff --name-only --cached', 'diff --name-only']) {
    try {
      for (const f of git(args).split('\n')) {
        if (f.trim()) out.add(f.trim());
      }
    } catch {
      // idem
    }
  }
  return [...out];
}

/**
 * Varre .agents/handoffs/** recursivamente por .md dentro do limite de tamanho e devolve
 * APENAS os handoffs que fazem parte do diff analisado (caminho normalizado presente em
 * `changedFiles`). Handoffs históricos não autorizam alterações novas — ver comentário do
 * cabeçalho. Diretório ausente não é erro: significa "diff sem handoff".
 */
export function loadHandoffs(
  changedFiles: string[],
  dir: string = HANDOFFS_DIR,
): HandoffDoc[] {
  const changedSet = new Set(changedFiles.map(normalizeRepoPath));
  const docs: HandoffDoc[] = [];
  const walk = (current: string) => {
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      return; // diretório ausente não é erro — significa "sem evidência"
    }
    for (const entry of entries) {
      const full = path.join(current, entry);
      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(full);
      } else if (entry.toLowerCase().endsWith('.md') && st.size <= MAX_HANDOFF_BYTES) {
        const rel = path.relative(ROOT, full).replace(/\\/g, '/');
        // Só handoffs que o próprio diff toca contam como evidência.
        if (!changedSet.has(normalizeRepoPath(rel))) continue;
        try {
          docs.push({ file: rel, text: readFileSync(full, 'utf8') });
        } catch {
          // arquivo ilegível não derruba o gate — apenas não conta como evidência
        }
      }
    }
  };
  walk(dir);
  return docs;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { base?: string; files?: string[]; strict: boolean; json: boolean } {
  const opts: { base?: string; files?: string[]; strict: boolean; json: boolean } = {
    strict: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') opts.strict = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--base') opts.base = argv[++i];
    else if (a === '--files') {
      const rest = argv.slice(i + 1);
      const sep = rest.indexOf('--');
      const list = sep === -1 ? rest : rest.slice(0, sep);
      opts.files = list.join(' ').split(',').map((s) => s.trim()).filter(Boolean);
      break;
    } else if (a === '--help' || a === '-h') {
      console.log(
        'Uso: npx tsx scripts/architecture/verify-file-ownership.ts [--base <ref>] [--files a,b] [--strict] [--json]',
      );
      process.exit(0);
    } else {
      console.error(`Argumento desconhecido: ${a}`);
      process.exit(2);
    }
  }
  return opts;
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  const changedFiles = collectChangedFiles(opts);
  const handoffs = loadHandoffs(changedFiles);
  const findings = verifyOwnership({ changedFiles, handoffs });

  if (opts.json) {
    console.log(JSON.stringify({ changedFiles, handoffDocs: handoffs.length, findings }, null, 2));
  } else {
    console.log(
      `[ownership] ${changedFiles.length} arquivo(s) alterado(s) · ${handoffs.length} handoff(s) em .agents/handoffs/`,
    );
    if (findings.length === 0) {
      console.log('[ownership] OK — nenhum arquivo de dono exclusivo tocado sem handoff correspondente.');
    } else {
      console.log(`[ownership] ${findings.length} aviso(s) — arquivo(s) sob propriedade exclusiva (AGENTS.md §15):`);
      for (const f of findings) {
        console.log(`  WARN  ${f.file}  →  ${f.ownerLabel}  (sem handoff correspondente)`);
      }
      console.log(
        '[ownership] Modo não-bloqueante: abra/atualize o handoff do dono em .agents/handoffs/ ou justifique no PR. Use --strict para falhar.',
      );
    }
  }

  if (opts.strict && findings.length > 0) process.exit(1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();

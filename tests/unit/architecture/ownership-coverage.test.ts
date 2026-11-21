import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  evaluateApprovalGate,
  evaluateOwnershipCoverage,
  isApprovalProtectedPath,
  isApprovalRecordPath,
  isInsideDepcruiseGraph,
  isPathLikeScope,
  parseOwnershipMatrix,
  ruleCoversScope,
  scopeExistsInRepo,
  synthesizeProbePath,
  type DepcruiseForbiddenRule,
  type OwnershipEntry,
  type OwnershipManifest,
} from '../../../scripts/governance/check-ownership-coverage';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const AGENTS_PATH = path.join(ROOT, 'AGENTS.md');
const DEPCRUISE_CONFIG_PATH = path.join(ROOT, '.dependency-cruiser.cjs');
const MANIFEST_PATH = path.join(ROOT, 'scripts/governance/ownership-coverage.manifest.json');

const require = createRequire(import.meta.url);
const depcruiseConfig = require(DEPCRUISE_CONFIG_PATH) as {
  forbidden: DepcruiseForbiddenRule[];
};
const depcruiseRules = depcruiseConfig.forbidden;
const realManifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as OwnershipManifest;
const realNpmScripts = new Set(
  Object.keys(
    (JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    }).scripts,
  ),
);

const JUSTIFICATION =
  'Fora do grafo do depcruise; proteção real via revisão de diff conforme AGENTS.md §15.';

function manifestWith(entries: OwnershipManifest['entries']): OwnershipManifest {
  return { entries };
}

describe('parseOwnershipMatrix', () => {
  it('extrai todos os pares escopo→dono do AGENTS.md real', () => {
    const entries = parseOwnershipMatrix(readFileSync(AGENTS_PATH, 'utf-8'));
    expect(entries.length).toBeGreaterThanOrEqual(15);
    expect(entries).toContainEqual({ scope: 'prisma/schema.prisma', owner: 'Agente 11 (Pietro)' });
    expect(entries).toContainEqual({ scope: 'prisma/migrations/**', owner: 'Agente 12 (Vera)' });
    expect(entries).toContainEqual({
      scope: 'src/App.tsx, src/components/layout/**',
      owner: 'Agente 31 (Noa)',
    });
    expect(entries).toContainEqual({
      scope: '.github/workflows/**, scripts/deploy/**',
      owner: 'Agente 94 (Tess)',
    });
    expect(entries).toContainEqual({
      scope: 'infrastructure/**, charts/**, Dockerfile, docker-compose.yml',
      owner: 'Squad 90 (91 a 93)',
    });
    expect(entries).toContainEqual({ scope: '.agents/prompts/**', owner: 'Decisão humana' });
  });

  it('suporta múltiplos escopos por dono', () => {
    const md = [
      '## 15. Propriedade exclusiva de arquivos',
      '',
      '```',
      'a/**',
      'b.txt',
      '→ Agente 99',
      '',
      'c/**',
      '→ Agente 01',
      '```',
    ].join('\n');
    expect(parseOwnershipMatrix(md)).toEqual([
      { scope: 'a/**', owner: 'Agente 99' },
      { scope: 'b.txt', owner: 'Agente 99' },
      { scope: 'c/**', owner: 'Agente 01' },
    ]);
  });

  it('falha explicitamente quando a seção ## 15 não existe', () => {
    expect(() => parseOwnershipMatrix('# AGENTS\n\n## 1. Nada\n')).toThrow(/## 15/);
  });

  it('falha quando um dono não tem escopo anterior', () => {
    const md = '## 15. x\n```\n→ Agente 01\n```\n';
    expect(() => parseOwnershipMatrix(md)).toThrow(/sem escopo/);
  });

  it('falha quando escopo fica sem dono no fim do bloco', () => {
    const md = '## 15. x\n```\na/**\n→ Agente 01\nb/**\n```\n';
    expect(() => parseOwnershipMatrix(md)).toThrow(/sem dono/);
  });
});

describe('helpers de escopo', () => {
  it('synthesizeProbePath converte globs em paths concretos', () => {
    expect(synthesizeProbePath('src/App.tsx')).toBe('src/App.tsx');
    expect(synthesizeProbePath('src/features/**')).toBe('src/features/__probe__/probe.ts');
    expect(synthesizeProbePath('prisma/migrations/**')).toBe(
      'prisma/migrations/__probe__/probe.ts',
    );
    expect(synthesizeProbePath('Dockerfile')).toBe('Dockerfile');
  });

  it('isInsideDepcruiseGraph só aceita as raízes varridas pelo lint:architecture', () => {
    expect(isInsideDepcruiseGraph('src/App.tsx')).toBe(true);
    expect(isInsideDepcruiseGraph('src/features/**')).toBe(true);
    expect(isInsideDepcruiseGraph('server.ts')).toBe(true);
    expect(isInsideDepcruiseGraph('prisma/**')).toBe(false);
    expect(isInsideDepcruiseGraph('.github/workflows/**')).toBe(false);
  });

  it('isPathLikeScope distingue path de prosa', () => {
    expect(isPathLikeScope('src/App.tsx')).toBe(true);
    // Nomes simples sem /, . ou * ("Dockerfile", "Sidebar") caem no bucket de descritor —
    // não são path verificável nem elegíveis a coverage depcruise; a justificativa cobre.
    expect(isPathLikeScope('Dockerfile')).toBe(false);
    expect(isPathLikeScope('docker-compose.yml')).toBe(true);
    expect(isPathLikeScope('navegação principal')).toBe(false);
    expect(isPathLikeScope('Sidebar')).toBe(false);
  });

  it('scopeExistsInRepo valida arquivos e diretórios-base de glob', () => {
    expect(scopeExistsInRepo('src/App.tsx', ROOT)).toBe(true);
    expect(scopeExistsInRepo('Dockerfile', ROOT)).toBe(true);
    expect(scopeExistsInRepo('charts/**', ROOT)).toBe(true);
    expect(scopeExistsInRepo('navegação principal', ROOT)).toBe(true); // prosa: não verificável
    expect(scopeExistsInRepo('path/que/nao/existe/**', ROOT)).toBe(false);
  });
});

describe('ruleCoversScope', () => {
  const rule: DepcruiseForbiddenRule = {
    name: 'no-cross-feature-imports',
    to: {
      path: '^src/features/([^/]+)/',
      pathNot: ['^src/features/notifications/', '^src/features/$1/'],
    },
  };

  it('casa quando to.path atinge o probe e pathNot não exclui', () => {
    expect(ruleCoversScope(rule, 'src/features/crm/**')).toBe(true);
  });

  it('rejeita quando to.pathNot exclui o escopo', () => {
    expect(ruleCoversScope(rule, 'src/features/notifications/**')).toBe(false);
  });

  it('rejeita path fora do alvo da regra', () => {
    expect(ruleCoversScope(rule, 'src/lib/queue/**')).toBe(false);
  });

  it('rejeita regras sem to.path (ex.: no-circular)', () => {
    const circularRule: DepcruiseForbiddenRule = {
      name: 'no-circular',
      to: { circular: true },
    };
    expect(ruleCoversScope(circularRule, 'src/features/crm/**')).toBe(false);
  });
});

describe('evaluateOwnershipCoverage', () => {
  const matrix: OwnershipEntry[] = [
    { scope: 'src/App.tsx', owner: 'Agente 02' },
    { scope: 'Dockerfile', owner: 'Agente 08' },
    { scope: 'navegação principal', owner: 'Agente 02' },
  ];
  const baseManifest = manifestWith([
    {
      scope: 'src/App.tsx',
      owner: 'Agente 02',
      coverage: 'review',
      justification: JUSTIFICATION,
    },
    {
      scope: 'Dockerfile',
      owner: 'Agente 08',
      coverage: 'review',
      justification: JUSTIFICATION,
      alternateCheck: 'lint:architecture',
    },
    {
      scope: 'navegação principal',
      owner: 'Agente 02',
      coverage: 'review',
      justification: JUSTIFICATION,
    },
  ]);
  const baseInput = {
    matrixEntries: matrix,
    manifest: baseManifest,
    depcruiseRules: [],
    npmScriptNames: new Set(['lint:architecture']),
    root: ROOT,
  };

  it('caminho de sucesso: matriz e manifesto sincronizados sem violações', () => {
    expect(evaluateOwnershipCoverage(baseInput)).toEqual([]);
  });

  it('falha quando escopo do AGENTS.md não tem entrada no manifesto', () => {
    const manifest = manifestWith(baseManifest.entries.slice(0, 2));
    const violations = evaluateOwnershipCoverage({ ...baseInput, manifest });
    expect(violations.some((v) => v.includes('navegação principal'))).toBe(true);
  });

  it('falha quando manifesto tem escopo que saiu do AGENTS.md', () => {
    const manifest = manifestWith([
      ...baseManifest.entries,
      {
        scope: 'pasta/removida/**',
        owner: 'Agente 01',
        coverage: 'review' as const,
        justification: JUSTIFICATION,
      },
    ]);
    const violations = evaluateOwnershipCoverage({ ...baseInput, manifest });
    expect(violations.some((v) => v.includes('pasta/removida/**'))).toBe(true);
  });

  it('falha quando o dono diverge entre AGENTS.md e manifesto', () => {
    const manifest = manifestWith([
      { ...baseManifest.entries[0], owner: 'Agente 99' },
      ...baseManifest.entries.slice(1),
    ]);
    const violations = evaluateOwnershipCoverage({ ...baseInput, manifest });
    expect(violations.some((v) => v.includes('dono diverge'))).toBe(true);
  });

  it('falha quando coverage depcruise é alegada para path fora do grafo', () => {
    const matrixOut: OwnershipEntry[] = [{ scope: 'prisma/**', owner: 'Agente 01' }];
    const manifest = manifestWith([
      {
        scope: 'prisma/**',
        owner: 'Agente 01',
        coverage: 'depcruise' as const,
        rule: 'no-circular',
      },
    ]);
    const violations = evaluateOwnershipCoverage({
      ...baseInput,
      matrixEntries: matrixOut,
      manifest,
      depcruiseRules: [{ name: 'no-circular', to: { circular: true } }],
    });
    expect(violations.some((v) => v.includes('fora do grafo'))).toBe(true);
  });

  it('falha quando coverage depcruise cita regra inexistente', () => {
    const matrixInGraph: OwnershipEntry[] = [{ scope: 'src/features/crm/**', owner: 'Agente 04' }];
    const manifest = manifestWith([
      {
        scope: 'src/features/crm/**',
        owner: 'Agente 04',
        coverage: 'depcruise' as const,
        rule: 'regra-que-nao-existe',
      },
    ]);
    const violations = evaluateOwnershipCoverage({
      ...baseInput,
      matrixEntries: matrixInGraph,
      manifest,
      depcruiseRules: [
        { name: 'no-cross-feature-imports', to: { path: '^src/features/([^/]+)/' } },
      ],
    });
    expect(violations.some((v) => v.includes('não existe em forbidden[]'))).toBe(true);
  });

  it('caminho de sucesso depcruise: regra real e regex que casa com o escopo', () => {
    const matrixInGraph: OwnershipEntry[] = [{ scope: 'src/features/crm/**', owner: 'Agente 04' }];
    const manifest = manifestWith([
      {
        scope: 'src/features/crm/**',
        owner: 'Agente 04',
        coverage: 'depcruise' as const,
        rule: 'no-cross-feature-imports',
      },
    ]);
    const violations = evaluateOwnershipCoverage({
      ...baseInput,
      matrixEntries: matrixInGraph,
      manifest,
      depcruiseRules: [
        { name: 'no-cross-feature-imports', to: { path: '^src/features/([^/]+)/' } },
      ],
    });
    expect(violations).toEqual([]);
  });

  it('falha quando a regra existe mas o to.path não casa com o escopo', () => {
    const matrixInGraph: OwnershipEntry[] = [{ scope: 'src/lib/queue/**', owner: 'Agente 16' }];
    const manifest = manifestWith([
      {
        scope: 'src/lib/queue/**',
        owner: 'Agente 16',
        coverage: 'depcruise' as const,
        rule: 'no-cross-feature-imports',
      },
    ]);
    const violations = evaluateOwnershipCoverage({
      ...baseInput,
      matrixEntries: matrixInGraph,
      manifest,
      depcruiseRules: [
        { name: 'no-cross-feature-imports', to: { path: '^src/features/([^/]+)/' } },
      ],
    });
    expect(violations.some((v) => v.includes('proteção alegada é ilusória'))).toBe(true);
  });

  it('falha quando coverage review tem justificativa curta demais', () => {
    const manifest = manifestWith([
      { ...baseManifest.entries[0], justification: 'curta' },
      ...baseManifest.entries.slice(1),
    ]);
    const violations = evaluateOwnershipCoverage({ ...baseInput, manifest });
    expect(violations.some((v) => v.includes('justification'))).toBe(true);
  });

  it('falha quando alternateCheck não existe no package.json', () => {
    const manifest = manifestWith([
      {
        ...baseManifest.entries[0],
        alternateCheck: 'script:inexistente',
      },
      ...baseManifest.entries.slice(1),
    ]);
    const violations = evaluateOwnershipCoverage({ ...baseInput, manifest });
    expect(violations.some((v) => v.includes('script:inexistente'))).toBe(true);
  });

  it('falha quando escopo path-like não existe no repositório', () => {
    const matrixGhost: OwnershipEntry[] = [
      { scope: 'src/App.tsx', owner: 'Agente 02' },
      { scope: 'pasta-fantasma-xyz/**', owner: 'Agente 01' },
      { scope: 'navegação principal', owner: 'Agente 02' },
    ];
    const manifest = manifestWith([
      baseManifest.entries[0],
      {
        scope: 'pasta-fantasma-xyz/**',
        owner: 'Agente 01',
        coverage: 'review' as const,
        justification: JUSTIFICATION,
      },
      baseManifest.entries[2],
    ]);
    const violations = evaluateOwnershipCoverage({
      ...baseInput,
      matrixEntries: matrixGhost,
      manifest,
    });
    expect(violations.some((v) => v.includes('não existe no repositório'))).toBe(true);
  });
});

describe('evaluateApprovalGate (regras de aprovação em prosa do §15)', () => {
  const approvalDoc = (path: string, content: string) => ({ path, content });

  it('isApprovalProtectedPath cobre server.ts, package.json e lockfiles', () => {
    expect(isApprovalProtectedPath('server.ts')).toBe(true);
    expect(isApprovalProtectedPath('package.json')).toBe(true);
    expect(isApprovalProtectedPath('package-lock.json')).toBe(true);
    expect(isApprovalProtectedPath('pnpm-lock.yaml')).toBe(true);
    expect(isApprovalProtectedPath('nested/yarn.lock')).toBe(true);
    expect(isApprovalProtectedPath('src/server.ts')).toBe(false);
    expect(isApprovalProtectedPath('src/App.tsx')).toBe(false);
  });

  it('isApprovalRecordPath só aceita .agents/runs/ e .agents/approvals/', () => {
    expect(isApprovalRecordPath('.agents/runs/00-aprovacao.md')).toBe(true);
    expect(isApprovalRecordPath('.agents/approvals/pkg.md')).toBe(true);
    expect(isApprovalRecordPath('.agents/handoffs/x.md')).toBe(false);
    expect(isApprovalRecordPath('docs/aprovacao.md')).toBe(false);
  });

  it('passa quando nenhum path protegido foi alterado', () => {
    expect(
      evaluateApprovalGate({
        changedFiles: ['src/App.tsx', '.agents/handoffs/x.md'],
        approvalDocs: [],
      }),
    ).toEqual([]);
  });

  it('falha quando package.json muda sem registro de aprovação', () => {
    const violations = evaluateApprovalGate({
      changedFiles: ['package.json', 'src/App.tsx'],
      approvalDocs: [],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('package.json');
  });

  it('falha quando server.ts muda e o registro não cita o orquestrador humano', () => {
    const violations = evaluateApprovalGate({
      changedFiles: ['server.ts'],
      approvalDocs: [
        approvalDoc(
          '.agents/runs/00-aprovacao.md',
          'Registro: alteração em server.ts aprovada pelo Agente 00.',
        ),
      ],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('server.ts');
  });

  it('passa quando o registro cita path, Agente 00, aprovação e orquestrador humano', () => {
    expect(
      evaluateApprovalGate({
        changedFiles: ['server.ts', 'package.json'],
        approvalDocs: [
          approvalDoc(
            '.agents/runs/00-aprovacao-server-package.md',
            'Aprovação explícita do Agente 00 e do orquestrador humano para server.ts e package.json.',
          ),
        ],
      }),
    ).toEqual([]);
  });

  it('ignora registros fora de .agents/runs/ e .agents/approvals/', () => {
    const violations = evaluateApprovalGate({
      changedFiles: ['package.json'],
      approvalDocs: [
        approvalDoc('docs/nota.md', 'package.json aprovado pelo Agente 00'),
      ],
    });
    expect(violations).toHaveLength(1);
  });
});

describe('allowMissingPath', () => {
  const matrix: OwnershipEntry[] = [{ scope: 'pasta-reservada-xyz/**', owner: 'Agente 13' }];
  const baseInput = { depcruiseRules, npmScriptNames: realNpmScripts, root: ROOT };
  const entry = {
    scope: 'pasta-reservada-xyz/**',
    owner: 'Agente 13',
    coverage: 'review' as const,
    justification: JUSTIFICATION,
  };

  it('sem allowMissingPath, path inexistente continua violação', () => {
    const violations = evaluateOwnershipCoverage({
      ...baseInput,
      matrixEntries: matrix,
      manifest: manifestWith([entry]),
    });
    expect(violations.some((v) => v.includes('não existe no repositório'))).toBe(true);
  });

  it('com allowMissingPath e justificativa, path reservado inexistente é aceito', () => {
    const violations = evaluateOwnershipCoverage({
      ...baseInput,
      matrixEntries: matrix,
      manifest: manifestWith([{ ...entry, allowMissingPath: true }]),
    });
    expect(violations).toEqual([]);
  });

  it('allowMissingPath sem justificativa suficiente não isenta', () => {
    const violations = evaluateOwnershipCoverage({
      ...baseInput,
      matrixEntries: matrix,
      manifest: manifestWith([{ ...entry, justification: 'curta', allowMissingPath: true }]),
    });
    expect(violations.some((v) => v.includes('não existe no repositório'))).toBe(true);
  });
});

describe('repositório real (gate de não-regressão)', () => {
  it('AGENTS.md §15 real + manifesto real + .dependency-cruiser.cjs real = zero violações', () => {
    const matrixEntries = parseOwnershipMatrix(readFileSync(AGENTS_PATH, 'utf-8'));
    const violations = evaluateOwnershipCoverage({
      matrixEntries,
      manifest: realManifest,
      depcruiseRules,
      npmScriptNames: realNpmScripts,
      root: ROOT,
    });
    expect(violations).toEqual([]);
  });
});

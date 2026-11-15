De: Agente 09 — Mobile
Para: Agente 00 — Coordenador
Onda: 4
Status: resolvido
Prioridade: alto
Bloqueador-ref: DEM-20261114-003 / MEL-27
Sprint destino: Onda 4

## Problema

O override global `"brace-expansion": "^2.1.7"` em `package.json` (e o espelho em
`pnpm-workspace.yaml`) força **todas** as instências de `brace-expansion` para a linha 2.x.
Isso quebra `minimatch@11` (exigido por `glob@14`, que por sua vez é exigido por
`workbox-build` via override `"workbox-build": { "glob": "^14.0.4" }`):

- `minimatch@11` declara `"brace-expansion": "^5.0.12"` e seu build CommonJS faz
  `const brace_expansion_1 = require("brace-expansion")` + `brace_expansion_1.expand(...)`.
- `brace-expansion@2.1.7` exporta `module.exports = expandTop` (função), **sem** a
  propriedade `.expand` → qualquer chamada a `Minimatch`/`braceExpand` com padrão contendo
  chaves `{...}` lança exatamente `(0 , brace_expansion_1.expand) is not a function`
  (o erro reportado no build do PWA).

Cadeia de resolução real neste worktree (node_modules → `C:\Github\Birthub-360\node_modules`):

- `workbox-build@7.4.1` → `glob@14.0.4` (override) → `glob/node_modules/minimatch@11.0.5`
  → `brace-expansion` resolve para a raiz `2.1.7` (override global) — versão incompatível.
- Mesmo problema para `@ts-morph/common>minimatch@11.0.5` e
  `@typescript-eslint/typescript-estree>minimatch` (ambos com override para `^11.0.5`).

## Arquivo(s) envolvido(s)

- `package.json` → `overrides` (aprovação explícita do 00 obrigatória — AGENTS.md §15)
- `package-lock.json` → regenerar via `npm install` (mesma aprovação)
- `pnpm-workspace.yaml` → seção `overrides` (espelho declarado no próprio arquivo:
  "Ao mudar `overrides` no package.json, atualize aqui")

## Evidência

Reproduzido neste worktree (branch `agente/09-onda4-pwa`, base `integracao/onda-4`):

```
node -e "const mm=require(require.resolve('minimatch',{paths:['./node_modules/glob']}));
  new mm.Minimatch('a{b,c}d')"
→ THREW: (0 , brace_expansion_1.expand) is not a function
```

```
node -e "const b=require('brace-expansion'); console.log(Object.keys(b), b.expand)"
→ [] NO expand        # brace-expansion@2.1.7 é module.exports = função, sem .expand
```

```
node --input-type=module -e "import { expand } from 'brace-expansion'"
→ SyntaxError: Named export 'expand' not found (CJS sem named exports detectáveis)
```

`node_modules/glob/node_modules/minimatch/package.json` → `"brace-expansion": "^5.0.12"`.
Lockfile (`package-lock.json`, mapa `packages`) contém **somente**
`node_modules/brace-expansion@2.1.7` — coerente com o override global, ou seja,
`npm ci`/`npm install` limpo reproduz a mesma árvore quebrada em qualquer ambiente.

Contexto histórico: o erro original foi registrado em `.agents/GA_RELEASE_READINESS_REPORT.md`
(15/09/2026, Node v24) como "erro de glob do PWA: `brace_expansion_1.expand is not a
function`; precache reportado com 1 entrada (0 KiB)". À época o `workbox-build` ainda
usava `glob@11`; o override `workbox-build>glob@^14.0.4` entrou em 522df4ee4 (08/11/2026)
e passou a exigir `minimatch@11`→`brace-expansion@^5`, tornando a bomba-relógio latente.

**Por que o gate está verde hoje (e pode quebrar de novo):** os `globPatterns` atuais em
`vite.config.ts` (`**/*.js`, `**/*.css`, etc.) não contêm chaves `{...}`, e o `glob@14`
expande braces antes de chegar ao `Minimatch` quebrado — verificado empiricamente:
`globSync('assets/*.{js,css}')` e `globSync('**/{index.html,sw.js}')` funcionam.
Porém QUALQUER padrão com `{}` que chegue ao `minimatch@11` (novo `globPattern`,
`globIgnores`, `additionalManifestEntries`, ou outro consumidor como typescript-eslint /
ts-morph) volta a lançar o erro. Se o `generateSW` do workbox-build falhar no meio do
`vite build`, o `vite-plugin-pwa` deixa o `dist/sw.js` anterior → precache de 1 entrada →
`verify:pwa-precache` falha (exatamente o sintoma reportado).

## Alteração necessária

Em `package.json` → `overrides`, substituir a linha global:

```json
"brace-expansion": "^2.1.7",
```

por um escopo que preserve o patch de segurança (2.1.7 corrige GHSA-Q2HR-2G5M-VWHR,
GHSA-QHR7-859C-M2P7, GHSA-6J4F-FJ2G-MC7P — ver commit d9ea7a3a4) APENAS para os
consumidores legados, liberando `^5` para `minimatch@11`. Candidato (validar com
`npm install` + `npm ls brace-expansion`):

```json
"brace-expansion": "^2.1.7",
"minimatch@^11.0.0": {
  "brace-expansion": "^5.0.12"
}
```

Se a forma `parent@range` não for aceita pelo npm arborist nesta versão, alternativa
equivalente via aninhamento nos pais já overrideados:

```json
"@ts-morph/common": { "minimatch": { "brace-expansion": "^5.0.12" } },
"@typescript-eslint/typescript-estree": { "minimatch": { "brace-expansion": "^5.0.12" } },
"glob": { "minimatch": { "brace-expansion": "^5.0.12" } }
```

(manter o `"brace-expansion": "^2.1.7"` global para `minimatch@3/5` do eslint etc.)

Depois: `npm install` para regenerar `package-lock.json`, conferir
`npm ls brace-expansion` (esperado: `2.1.7` na raiz e `5.x` sob `minimatch@11`),
e aplicar o MESMO ajuste no espelho `overrides:` de `pnpm-workspace.yaml` +
`pnpm install` para regenerar `pnpm-lock.yaml` se aplicável.

Nota: verificar também se `brace-expansion@5.x` já contém os fixes das GHSA citadas
(o `^5.0.12` exigido pelo `minimatch@11` é a linha mantida/upstream — confirmar no
`npm audit` após o bump).

## Teste esperado

1. `npm run build` → `precache N entries` com N ≥ 20 e
   `verify:pwa-precache` ✅ (hoje: 252 entradas / ~10 MiB — já verde, mas o fix elimina
   a causa raiz do erro intermitente).
2. `node -e "const mm=require(require.resolve('minimatch',{paths:['./node_modules/glob']})); new mm.Minimatch('a{b,c}d')"` → não lança erro.
3. `npm ls brace-expansion` → `2.1.7` para consumidores legados, `5.x` sob `minimatch@11`.
4. Repetir `npm run build` em ambiente limpo (`npm ci`) para garantir.

## Contexto adicional

- Relatório da missão: `.agents/runs/onda-4/09-relatorio.md`.
- `vite.config.ts` (bloco `VitePWA`, linhas 16–71) está correto e não requer alteração;
  os `globPatterns` atuais não usam `{}` — mas isso é proteção acidental, não correção.
- `scripts/pwa/verify-precache.ts` (gate, mínimo 20 entradas) está íntegro e não foi
  enfraquecido.
- Não editei `package.json`/lockfiles por exigirem aprovação explícita do 00 (AGENTS.md §15).

## Resolução (Agente 00, 2026-11-14)

APROVADO e aplicado conforme candidato principal:
- `package.json` overrides: adicionado `"minimatch@^11.0.0": { "brace-expansion": "^5.0.12" }`
  mantendo o global `^2.1.7` para consumidores legados.
- `pnpm-workspace.yaml`: espelho `'minimatch@^11.0.0>brace-expansion': ^5.0.12`.
- `package-lock.json` regenerado via `npm install --package-lock-only` (não tocou
  node_modules — junction compartilhada preservada). Lockfile agora contém
  `node_modules/glob/node_modules/brace-expansion@5.0.13` aninhado — scoped override
  confirmado. `npm audit`: 2 moderate (inalterado vs. baseline).
- Pendente: `pnpm-lock.yaml` não regenerado (pnpm não executado neste ambiente) —
  recomendo regen em CI ou próxima sessão com pnpm. node_modules local dos worktrees
  só reflete a correção após `npm install`/`npm ci` no ambiente canônico.

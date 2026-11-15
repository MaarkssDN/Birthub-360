# Relatório — Agente 09 (Mobile) — Onda 4 — MEL-27 / DEM-20261114-003

Data: 2026-11-14
Branch: `agente/09-onda4-pwa` (worktree `agente-09-onda4-pwa`, base `integracao/onda-4`)
Escopo: corrigir PWA precache — erro `brace_expansion_1.expand is not a function` e
precache de 1 entrada reportados em `.agents/GA_RELEASE_READINESS_REPORT.md`.

## Resumo executivo

- `npm run build` completo executado neste worktree: **VERDE**.
  `vite build` → PWA `generateSW` → `precache 252 entries (10091.33 KiB)` →
  `esbuild server.ts` → `verify:pwa-precache` ✅ **252 entradas / 10279.94 KiB**.
- O erro `brace_expansion_1.expand is not a function` **não se manifestou** neste
  build porque os `globPatterns` atuais não contêm chaves `{...}`.
- A **causa raiz foi identificada e reproduzida de forma determinística**: o override
  global `"brace-expansion": "^2.1.7"` (package.json + espelho em pnpm-workspace.yaml)
  é incompatível com `minimatch@11` (exige `^5.0.12` e usa o export nomeado `.expand`,
  inexistente na linha 2.x). É uma bomba-relógio: qualquer padrão com `{}` que chegue
  ao `minimatch@11` (workbox-build via `glob@14`, typescript-eslint, ts-morph) lança
  exatamente o erro reportado; se ocorrer dentro do `generateSW`, o `sw.js` anterior
  permanece → precache de 1 entrada → gate falha.
- A correção definitiva exige alterar `package.json`/lockfile (aprovação do 00) →
  **handoff aberto**: `.agents/handoffs/onda-4/09-para-00-brace-expansion-override-quebra-minimatch-11.md`.

## Investigação

Arquivos lidos: `vite.config.ts` (bloco `VitePWA`, linhas 16–71),
`scripts/pwa/verify-precache.ts`, `package.json` (`overrides`, linhas ~218–280),
`pnpm-workspace.yaml` (`overrides`), `package-lock.json` (mapa `packages`).

Cadeia de dependências:

```
vite-plugin-pwa@1.3.0 → workbox-build@7.4.1
  → override "workbox-build>glob": "^14.0.4"
  → glob@14.0.4 → node_modules/glob/node_modules/minimatch@11.0.5
      → "brace-expansion": "^5.0.12"   (exigido)
  → override global "brace-expansion": "^2.1.7"   (aplicado — CONFLITO)
```

`brace-expansion@2.1.7/index.js`: `module.exports = expandTop;` — função sem
propriedade `.expand`. `minimatch@11/dist/commonjs/index.js:101` chama
`(0 , brace_expansion_1.expand)(pattern, ...)`.

## Evidência — reprodução do erro (antes)

```
$ node -e "const mm=require(require.resolve('minimatch',{paths:['./node_modules/glob']}));
    new mm.Minimatch('a{b,c}d'); console.log(mm.minimatch('abd','a{b,c}d'))"
THREW: (0 , brace_expansion_1.expand) is not a function

$ node -e "const b=require('brace-expansion'); console.log(Object.keys(b), b.expand)"
[] NO expand

$ node --input-type=module -e "import { expand } from 'brace-expansion'; console.log(typeof expand)"
SyntaxError: Named export 'expand' not found.
```

Versões instaladas: `glob@14.0.4`, `minimatch@11.0.5` (aninhado em glob) e
`minimatch@11.0.6`/`@ts-morph`/`typescript-estree` também em 11.x,
`brace-expansion@2.1.7` (única versão no lockfile e em node_modules).

## Evidência — build e gate (depois / estado atual)

```
$ npm run build
...
PWA v1.3.0
mode      generateSW
precache  252 entries (10091.33 KiB)
files generated
  dist/sw.js
  dist/workbox-dcde9eb3.js
  dist\server.cjs      3.7mb

> react-example@0.0.1 verify:pwa-precache
> tsx scripts/pwa/verify-precache.ts

✅ verify:pwa-precache — dist/sw.js precacheia 252 entrada(s),
   10279.94 KiB reais em dist/. Precache não está vazio nem desalinhado do build.
```

| Métrica | Reportado (GA readiness, 15/09) | Atual (este worktree) |
|---|---|---|
| Erro no build PWA | `brace_expansion_1.expand is not a function` | não ocorre (sem `{}` nos padrões) |
| Entradas no precache | 1 entrada (0 KiB) | **252 entradas (~10 MiB)** |
| `verify:pwa-precache` | falharia (mínimo 20) | ✅ PASS |

Nota ambiental: `node_modules` deste worktree é symlink para
`C:\Github\Birthub-360\node_modules` (instalação compartilhada). Node local v22.23.5;
o relatório original foi em Node v24 com árvore de dependências anterior aos
overrides de `glob@14` (commit 522df4ee4, 08/11/2026).

## Por que passou sem correção de código

Os `globPatterns` de `vite.config.ts` (`**/*.js`, `**/*.css`, `**/*.html`, `**/*.ico`,
`**/*.png`, `**/*.svg`, `**/*.woff2`) e `includeAssets` não contêm `{}`; o `glob@14`
expande braces por conta própria antes do `Minimatch`. Verificado:

```
globSync('assets/*.{js,css}', {cwd:'dist'})        → OK (resultados)
globSync('**/{index.html,sw.js}', {cwd:'dist'})    → OK (resultados)
new Minimatch('a{b,c}d') via build CJS do minimatch → THROWS (bug latente)
```

Ou seja: o gate está verde, mas o defeito de dependência permanece e derruba
qualquer consumidor de `minimatch@11` que receba padrão com chaves — incluindo o
próprio workbox-build se um `globPattern`/`globIgnores` futuro usar `{}`.

## Correção aplicada / pendente

- **Arquivos de código alterados:** nenhum — não há correção possível dentro da
  propriedade do Agente 09; a causa raiz está em `package.json`/`pnpm-workspace.yaml`
  (aprovação explícita do 00 — AGENTS.md §15).
- **Handoff:** `.agents/handoffs/onda-4/09-para-00-brace-expansion-override-quebra-minimatch-11.md`
  com a alteração exata recomendada (escopo do override para preservar `2.1.7` nos
  consumidores legados e liberar `^5.0.12` sob `minimatch@^11`), nos dois arquivos de
  override, com regeneração de lockfile e validação via `npm ls brace-expansion`.

## Gates

- `npm run build` (vite + esbuild + verify:pwa-precache): ✅ exit 0, 252 entradas.
- `npx tsc --noEmit` e `npm run lint`: **não aplicável** — nenhum arquivo `.ts`/`.tsx`
  ou código-fonte foi alterado nesta missão (somente `.md` de handoff/relatório).
  `npm run lint` cobre `biome lint src` (apenas `src/**`), fora do escopo dos arquivos
  tocados.

## Riscos / encaminhamentos

1. **Bloqueador latente (alto):** o override `brace-expansion@^2.1.7` quebrará
   `minimatch@11` na primeira ocorrência de padrão `{}` — recomendo ao 00 tratar o
   handoff como prioridade alta antes de qualquer novo `globPattern` com braces ou
   bump que toque `typescript-eslint`/`ts-morph`.
2. O mesmo conflito existe no espelho `pnpm-workspace.yaml` → `pnpm-lock.yaml`;
   ambos devem ser atualizados juntos (o próprio arquivo exige o espelho).
3. Após o bump para `brace-expansion@5.x`, rodar `npm audit` para confirmar que a
   linha 5 cobre as GHSA que motivaram o override 2.1.7.

# Relatório — Agente 08 (QA e Release) — Onda 4

- Demanda: DEM-20261114-003 / Item MEL-29 — Visual regression como gate bloqueante no CI
- Branch: `agente/08-onda4-visual` (base `integracao/onda-4`)
- Worktree: `C:\Github\Birthub-360-worktrees\agente-08-onda4-visual`
- Data: 2026-11-14

## Decisão

**Gate bloqueante via workflow dedicado `visual-regression.yml`, com escopo por caminhos e
agregador fail-closed `Visual Regression Gate`.** Não integrei a suíte ao `ci.yml`/`build`
porque isso acoplaria ~30 min de stack (Postgres+Redis+Meilisearch+Playwright) ao required
check `build` em todo PR; o workflow dedicado já existia, já rodava `npm run test:visual`
sem `continue-on-error` (removido no commit `e9578780b`, "publish reviewed reliable gates")
e já tinha as 88 baselines Linux commitadas (`visual-regression/baselines/**`, geradas no
CI pelo job manual `visual-baselines` do `ci.yml` — handoff onda-6 do Agente 14 já
resolvido, status `resolvido` em `.agents/handoffs/onda-6/14-para-08-baselines-visuais-linux.md`).

O gap real não era `continue-on-error` (a premissa da missão estava desatualizada): era que
(a) a suíte pesada rodava em TODO PR, mesmo os que não tocam nada visual, e (b) nenhum job
agregador garantiu um contexto de check estável e fail-closed para virar required check.

## O que mudou

Arquivo único: `.github/workflows/visual-regression.yml`

1. **Job `changes` (novo)** — detecta se o PR toca caminhos que podem alterar pixels:
   `src/`, `public/`, `server/`, `visual-regression/`, `tests/e2e/`, `scripts/db/`,
   `index.html`, `vite.config.ts`, `playwright*.config.ts`, `tailwind/postcss.config.*`,
   `package.json`/lockfiles, `Dockerfile`, o próprio workflow. Diff via
   `git diff --name-only ${BASE_SHA}...HEAD` com `fetch-depth: 0`.
   `workflow_dispatch` ⇒ sempre relevante (serve para validar baselines manualmente).
2. **Job `visual-regression`** — agora `needs: changes` e só executa quando
   `relevant == 'true'`. Conteúdo inalterado (stack de services, `npm run test:visual`,
   upload do relatório). Nenhum timeout aumentado, nenhum assert afrouxado.
3. **Job `visual-gate` (novo, `name: Visual Regression Gate`)** — `if: always()`,
   `needs: [changes, visual-regression]`. Fail-closed:
   - `changes` falhou ⇒ reprova;
   - PR relevante e suíte ≠ `success` ⇒ reprova;
   - PR não relevante ⇒ aceita `skipped`/`success`, reprova `failure`/`cancelled`.
     É este contexto que deve entrar na branch protection (ver handoff ao 00).

## Evidências / gates executados

- `npx dotenv-cli -e .env.test -- npx playwright test -c playwright.visual.config.ts --list`
  → **88 testes listados** em `visual-regression/visual.spec.ts` (11 telas × 2 temas ×
  4 viewports), exatamente o número de baselines `*-chromium-linux.png` commitadas.
  (Requer `.env.test`; criado via `scripts/test/prepare-integration-env.js`. O `--list`
  regenerou `visual-regression-report/` — artefato rastreado — e o efeito foi revertido
  com `git checkout`; working tree contém apenas o workflow modificado.)
- `npx prettier --check .github/workflows/visual-regression.yml` → OK (após `--write`;
  o arquivo original já estava fora do padrão — a indentação dos steps foi normalizada).
- Parse YAML via `require('yaml').parse` → OK.
- `playwright.visual.config.ts` já está correto para gate: `updateSnapshots: 'none'`
  (verificação nunca abençoa baseline ausente), `retries: 1` só em CI, timeout 60s —
  nenhum timeout aumentado para mascarar o flake conhecido de Chromium local.
- Não executei a suíte visual completa localmente: exige Postgres/Redis/Meilisearch
  (Docker indisponível neste ambiente — `prepare-integration-env.js` abortou) e o
  Chromium local (`chromium-1194`) não é o build do CI (`chromium_headless_shell-1228`),
  conforme documentado em `tests/AGENTS.md` §6 — gerar/validar baseline fora do CI
  produziria falso positivo/negativo.

## Limitações / pendências

- **Branch protection (fora do repo):** para o gate ser de fato bloqueante, o contexto
  `Visual Regression Gate` precisa ser adicionado como required check em `main`/`master`.
  Handoff aberto: `.agents/handoffs/onda-4/08-para-00-visual-gate-branch-protection.md`
  (aguarda decisão do Agente 00 — eu não altero branch protection).
- O workflow dispara só em PRs para `main`/`master` (comportamento pré-existente,
  mantido). PRs com base `integracao/onda-N` não rodam este workflow — mesmo comportamento
  do `ci.yml`.
- Primeira execução real do job `changes`/`visual-gate` só será observável no CI; a lógica
  do agregador é shell simples testada por inspeção, não por run real.
- Suíte e2e `tests/e2e/visual.spec.ts` (5 telas, baselines `*-chromium-linux.png` já
  commitadas) continua coberta pelo `build-and-test` do `ci.yml` via `test:e2e` — fora do
  escopo desta mudança, já bloqueante.

## Como rodar

```bash
# Local (precisa de Docker + .env.test):
npm run test:visual                 # compara contra baselines *-chromium-<platform>.png
npm run test:visual:update          # regenera baselines LOCAIS (não commitar PNG linux de workstation)

# CI:
# PR que toca caminhos visuais → job Visual Regression roda; Visual Regression Gate consolida.
# PR fora do escopo → Visual Regression skipped; Gate passa.
# Regenerar baselines Linux (raro, ex.: mudança visual intencional):
#   Actions → CI → Run workflow (workflow_dispatch) → job visual-baselines →
#   baixar artifact visual-snapshots-linux e commitar os PNGs.
```

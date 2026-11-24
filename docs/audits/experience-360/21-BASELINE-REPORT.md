# 21 — Relatório Consolidado da Baseline (Experience 360)

**Data:** 2026-11-22/23 · **Branch:** `chore/handoff-00-despacho-wave-a-b-20261120`
**HEAD homologado:** `80b1a335b` (+ commits documentais posteriores — sem alteração de código)
**Working tree:** modificações não relacionadas em `docs/orchestration/**` + handoffs
históricos não rastreados — **preservados, não tocados**
**Autorização:** Despacho complementar + deliberação sobre baseline/ownership —
testes, investigação e preparação documental autorizados; implementação NO-GO.

---

## 1. Ambiente executado

| Item | Valor |
|---|---|
| OS local | Windows 11 (Git Bash), Node via npm scripts do repo |
| OS de referência dos snapshots | **Linux** (baselines `*-linux.png` commitados) |
| Servidor dev :3000 | Vite já em execução (do usuário); `reuseExistingServer` reutilizou |
| `.env.test` | Criado de `.env.test.example` por `scripts/test/prepare-integration-env.js` (local, não commitado) |
| Playwright | 1.63.0; `chromium-1243` instalado nesta sessão |
| Postgres :5434 / Redis :6379 / Meilisearch :7701 | **FECHADAS localmente** — Docker daemon indisponível |
| CI (GitHub Actions) | ubuntu-latest + services Postgres(pgvector pg16):5434, Redis:6379, Meilisearch v1.12:7700 |

## 2. Comandos executados e resultados

| Comando | Resultado | Evidência |
|---|---|---|
| `npm run test:visual` (local, win32) | **88/88 failed** — bloqueio ambiental (§3.1) | overflow `shell-5b5e76`; `test-results/` |
| `npx playwright install chromium` | sucesso | — |
| `gh workflow run visual-regression.yml --ref chore/handoff-...` | run **45084163511** → **74 passed / 14 failed** | Actions run log |
| `gh workflow run visual-regression.yml --ref main` | run **45086319222** → **74 passed / 14 failed — idênticos** | Actions run log |
| `npm run typecheck` (`tsc --noEmit`) | ✅ **PASS** (exit 0) | shell `8bebd9` |
| `npm run lint` | ✅ exit 0 — **1.517 warnings + 2 infos** (preexistentes) | execução anterior nesta branch |
| `npm run build` | ✅ **PASS** — 5.976 módulos, `verify:pwa-precache` ok (295 entradas, ~15,8 MiB); warnings de chunks >500 kB | execução anterior nesta branch |
| `npm run test:unit` | ❌ **6 arquivos / 33 testes failed** de 983 arquivos / 7.920 testes — duração 5.161s (~86 min). Falhas detalhadas em §3.6 | shell `a61c47`; log overflow |
| `curl localhost:3000/login` / `/api/health` | 200 / 200 | — |

## 3. Baseline visual — execução Linux/CI (autorizada pela deliberação)

### 3.1 Execução local (win32) — inválida como baseline

88/88 falharam **antes** da comparação de snapshot:

- **~80 testes**: `signUp` (`tests/e2e/helpers.ts:36`) expirou em 60s aguardando
  `getByRole('button', { name: /^Criar conta$/ })` — backend indisponível
  (Postgres/Redis/Meilisearch com portas fechadas; logs com `ECONNREFUSED :6379`).
- **4 testes Login**: snapshot `*-win32.png` inexistente — todos os baselines
  commitados são `*-linux.png`.
- **Classificação das 88 (local):** 84 = bloqueio ambiental comprovado;
  4 = snapshot ausente/incompatível por plataforma. **0 falhas de comportamento,
  0 falhas de acessibilidade, 0 regressões confirmadas.**

### 3.2 Execução CI Linux — resultado real

Dois runs `workflow_dispatch` do `visual-regression.yml`:

| Run | Ref | Resultado |
|---|---|---|
| `45084163511` | `chore/handoff-00-despacho-wave-a-b-20261120` @ `80b1a335b`+docs | **74 passed / 14 failed** |
| `45086319222` | `main` | **74 passed / 14 failed — mesmas 14** |

**Conclusão comparativa:** as 14 falhas são **idênticas em `main` e na branch** →
**drift de baseline preexistente em `main`**, não introduzido por este trabalho.
A branch sob auditoria não adiciona nenhuma divergência visual nova.

### 3.3 As 14 falhas (ambas as refs)

| Teste | Projetos | Classificação |
|---|---|---|
| `Login` — light | desktop, laptop, tablet, mobile | Diff de snapshot — drift preexistente em `main` |
| `Login` — dark | desktop, laptop, tablet, mobile | Diff de snapshot — drift preexistente em `main` |
| `Automações` — light | desktop, laptop, tablet | Diff de snapshot — drift preexistente em `main` |
| `Automações` — dark | desktop, laptop, tablet | Diff de snapshot — drift preexistente em `main` |
| `Automações` — light/dark | mobile | ✅ passou |

Os artefatos (expected/actual/diff PNG + traces) estão no artifact
`visual-regression-report` dos runs acima. **Nenhum snapshot foi atualizado**
(`updateSnapshots: 'none'`; proibido sem apresentação de diferenças + aprovação).

### 3.4 Reclassificação individual das 88 execuções

Contagem por categoria (resultado autoritativo = CI Linux):

| Categoria | Qtde | Detalhe |
|---|---|---|
| PASS | 74 | Todas as rotas exceto Login/Automações-não-mobile |
| Falha de snapshot (drift preexistente em `main`) | 14 | §3.3 — requer decisão humana sobre atualização de baseline |
| Bloqueio ambiental | 0 no CI; 88 no win32 local | Docker/serviços indisponíveis + baselines só-linux |
| Falha de comportamento | 0 | — |
| Falha de acessibilidade | 0 detectada pela suíte visual | axe/a11y segue evidência estática (`07-ACCESSIBILITY-AUDIT.md`) |
| Inconclusivo / não executado | funcional-browser, temas interativos, a11y por rota | dependem de backend+auth; ver §4 |

### 3.5 Violações de arquitetura

As **70 violações** de `test:architecture` permanecem rastreáveis à evidência
anterior (auditoria estática + gates de CI documentados nos handoffs de
governança). Não foram reclassificadas como preexistentes por inferência —
permanecem na dívida técnica mapeada até reexecução formal do gate.

### 3.6 Testes unitários — resultado real no HEAD homologado

`npm run test:unit` executado por completo (5.161s):
**Test Files 6 failed | 977 passed (983) · Tests 33 failed | 7.886 passed | 1 skipped (7.920)**

| Arquivo | Falhas | Causa observada |
|---|---|---|
| `tests/unit/shared/middlewares/errorHandler.test.ts` | 19 | `TypeError: req.header is not a function` em `errorHandler.ts:207` — mock dos testes não implementa `req.header()`; drift teste×código |
| `tests/unit/shared/middlewares/errorHandler.production.test.ts` | 8 | mesma causa (`req.header`) |
| `tests/unit/bootstrap/frontend.test.ts` | 3 | aliases de rota esperavam 404 e responderam 200 (`frontend.test.ts:142`) |
| `tests/unit/features/lgpd/dsrRequest.service.test.ts` | 1 | divergência de expectativa no service DSR |
| `src/shared/services/__tests__/dataSubjectErasure.unit.test.ts` | 1 | resultado ganhou campo `priorAuditLogsPurged` não previsto no `toEqual` — drift de contrato do teste |
| `tests/unit/features/market-intelligence/server/accountIntelligence.routes.contract.test.ts` | 1 | asserção anti-vazamento de tenant: body contém `org-b` via `instance` com id `company-from-org-b` — possível falso positivo de naming ou vazamento real a confirmar |

**Prova de preexistência:** `git diff origin/main...HEAD -- src/ tests/` é
**vazio** — a branch não contém nenhuma alteração de código; portanto as 33
falhas existem em `origin/main` no mesmo estado. São **falhas reais de teste
preexistentes** (não ambientais — Redis/DB ausentes geram ruído de log mas os
testes unitários são mockados), introduzidas por merges recentes à main
(ex.: `7ee2a67da` RFC 7807/LGPD na Onda 2). **Achado novo desta baseline:** a
suíte unitária de `main` está vermelha — precisa de handoff de correção ou de
confirmação de que CI já conhecido falha nesses arquivos.

## 4. Matriz de testes — status final

| Suíte | Status | Detalhe |
|---|---|---|
| `test:visual` Linux/CI | ⚠️ EXECUTADO — 74/88 | 14 diffs = drift preexistente em `main` (§3.3) |
| `test:visual` local win32 | ❌ BLOCKED | ambiental; não é baseline válida |
| Funcional/browser `/app/*` | ❌ BLOCKED | requer Docker+auth; pendente de sessão com infra |
| A11y axe por rota | ⚠️ CODE-ONLY | inventário Agente 14 (51 limpas / 19 findings); sem reexecução browser |
| Temas claro/escuro | ⚠️ PARCIAL | coberto indiretamente pelos 74 passes visuais; sem teste interativo |
| Componentes/VirtualTable/modais/Command Palette | ⚠️ CODE-ONLY | `06-COMPONENT-AUDIT.md` |
| `/app/characters`, `voice-hub/*` | ⚠️ CODE-ONLY | evidência estática; sem revalidação visual autenticada |
| `typecheck` | ✅ PASS | reexecutado neste HEAD |
| `lint` | ✅ exit 0 | 1.517 warnings preexistentes |
| `build` | ✅ PASS | reexecutado neste HEAD |
| `test:unit` | ❌ 33 failed / 7.886 passed | 6 arquivos — falhas reais preexistentes em `main` (§3.6) |

## 5. Falhas preexistentes × achados novos

### Preexistentes (com evidência comparativa)
- **14 diffs visuais em `main`** (Login ×8, Automações ×6) — provado por run
  idêntico na ref `main` (`45086319222`). Drift de baseline: produto mudou sem
  atualização de snapshots, ou snapshots foram gerados em ambiente divergente.
- 88 baselines só-linux (portabilidade Windows).
- Dependência de Docker para E2E/visual locais.
- 1.517 warnings de lint; 70 violações de arquitetura mapeadas.

### Achados novos desta baseline
- **33 testes unitários falhando em `main`** (§3.6) — falhas reais
  pré-existentes, não ambientais; nenhum código alterado pela branch.
- **Nenhuma regressão visual introduzida pela branch** — CI idêntico a `main`.
- Confirmação operacional: o harness visual **só é confiável no CI Linux**;
  execução local Windows não produz baseline válida.
- Decisão pendente do Orquestrador: os 14 diffs de `main` exigem (a) revisão
  humana das imagens diff para classificar como melhoria/não-intencional, e
  (b) sessão autorizada de atualização de baseline — **não autorizada**.

## 6. Impacto na prontidão da Onda 1

| Condição do Despacho | Status |
|---|---|
| Baseline visual executada com evidências | ✅ SIM — CI Linux, 74/88, diffs isolados e comparados com `main` |
| Baseline funcional/browser | ❌ NÃO — bloqueada por infra local; pode ser executada no CI/devcontainer |
| Baseline a11y | ⚠️ PARCIAL — estática + axe inventariado; sem reexecução autenticada |
| Gates técnicos no HEAD homologado | ⚠️ typecheck/lint/build verdes; **unit 33 falhas preexistentes em `main`** |
| Ownership reconciliado | ⚠️ PROPOSTA em `22-OWNERSHIP-MATRIX.md` — aguarda ratificação |
| Handoffs atualizados | ✅ 8 P1 + OPP-01 atualizados documentalmente |
| Parecer Silas (§40) | ❌ PENDENTE — handoff pronto, aguardando instância independente |
| Decisão sobre 14 diffs de baseline | ❌ PENDENTE — humano deve revisar diffs antes de qualquer update |

**Status Onda 1: NO-GO** — restam: parecer Silas, ratificação de ownership,
decisão sobre drift de baseline e baseline funcional/a11y autenticada.

## 7. Artefatos

- CI: runs `45084163511` (branch) e `45086319222` (main); artifact
  `visual-regression-report` (~38 MB) com expected/actual/diff/traces.
- Local (não commitado): `.env.test`, `test-results/`, `visual-regression-report/`,
  browsers em `%LOCALAPPDATA%/ms-playwright/`.
- Download local dos artefatos: `/tmp/vr-artifacts/` (efêmero).

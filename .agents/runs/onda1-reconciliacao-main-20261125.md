# RECONCILIAÇÃO ONDA 1 × MAIN ATUAL — DEM-20261123-001

**Agente:** 00 (Astra) — modo executor de auditoria
**Data:** 2026-11-25
**Diretriz:** Orquestrador Humano 25/11/2026 16:56 (registrada em ONDA 1.md) — reconciliar PRs, handoffs, reversões e preservações da Onda 1 com a linha principal ATUAL, sem reproduzir merges antigos.
**Método:** somente evidência de `git log/show/merge-base/ls-remote` + pareceres em `.agents/reviews/` e run docs em `.agents/runs/`. Read-only; nenhum merge/rebase executado.
**Referência da Onda 1:** worktrees `dem-20261123-onda1/wt-*` (9 worktrees), branch de integração `integracao/onda-1-dem20261123` @ `815a09305f532153ad8dc07adb9363f1ea694100`.
**`origin/main` no momento da auditoria:** `45b8e16e52` (Merge PR #541 `integracao/onda-7`, 2026-11-25). Fetch executado antes da verificação.

---

## 1. Tabela por item

Legenda de colunas: `ancestral` = `git merge-base --is-ancestor <branch> origin/main` = true; `remoto` = SHA idêntico confirmado via `git ls-remote origin`; `parecer` = arquivo em `.agents/reviews/`; `presença main` = entregas verificadas presentes no conteúdo de `origin/main` via `git show origin/main:<path>`.

| # | Item / Agente | SHA | Branch | Ancestral de origin/main | Remoto (ls-remote) | Parecer Silas | Teste (evidência) | Presença na main |
|---|---|---|---|---|---|---|---|---|
| 1 | P0-01 — format:check/lint:architecture (Ag. 94) | `03c38acb6b` | `agente/94-p0-01-format-depcruise` | SIM | `03c38acb6b` idêntico | consolidado apenas (§3) | gates transversais EXIT 0 no parecer consolidado | SIM (commits no histórico; arquivos de prod tocados existem) |
| 2 | P0-02 — semgrep/credential guards TLS (Ag. 99) | `eb8e945fce` | `agente/99-p0-02-semgrep-sync` | SIM | idêntico | `09-dem-20261123-p0-02-eb8e945fc.md` | suíte unitária 988/988 arq., 8.110/8.110 testes em `c286185c1` | SIM |
| 3 | P0-06 — errorHandler Accept/mascaramento 5xx (Ag. 03) | `79c9721890` | `agente/03-p0-06-falhas-unitarias` | SIM | idêntico | `09-dem-20261123-p0-06-79c972189.md` | idem + testes dedicados no commit | SIM |
| 4 | P0-07 Express — bypass traversal `/tools` `/design-lab` (Ag. 00/99) | `2963a0d909` | `agente/99-p0-07-bypass-estaticos` | SIM | idêntico | consolidado apenas (§3) | `frontend.staticBypass.test.ts` (220 linhas) | SIM (`src/bootstrap/frontend.ts` guarda presente, último commit no arquivo é o próprio `2963a0d909`/`c286185c13`) |
| 5 | P0-07 edge — SW/cache em ativos protegidos + Slot 4 Ag. 03 (no-code-change) | `c286185c13` | `agente/03-unitarios-dem20261123` | SIM | idêntico | `09-dem-20261123-p0-07-edge-c286185c1.md` + `09-dem-20261123-slot4-03-c286185c1.md` | suíte unitária completa 8.110/8.110 | SIM (`vite.config.ts`, `frontend.ts`) |
| 6 | Ag. 14 — seed B-06/RLS tenant context | `090de3949e` | `agente/14-fixtures-dem20261123` | SIM | idêntico | `09-dem-20261123-slot2-14-090de3949.md` | seed 17/17 Vitest + runtime B-06/RLS PASS | SIM (`prisma/seed.ts`: guard `NODE_ENV=production` + `requestContext.run({bypassRls:true})` presentes; último commit no arquivo é o próprio `090de3949e`) |
| 7 | Ag. 13 — RLS `getTenantPrisma`/`createManyAndReturn` | `283e7ec1ec` | `agente/13-rls-dem20261123` | SIM | idêntico | `09-dem-20261123-slot3-13-283e7ec1e.md` | 22/22 unit/segurança + 10/10 integração RLS Postgres real | SIM (`src/lib/tenant-prisma.ts`: `requestContext`, `createManyAndReturn`, `bypassRls:false` presentes; último commit no arquivo é o próprio `283e7ec1ec`) |
| 8 | Ag. 04 — timeouts beforeAll suítes integração | `48e9ac1699` | `agente/04-integracao-dem20261123` | SIM | idêntico | `09-dem-20261123-slot1-04-48e9ac169.md` | 5/5 suítes, 123/123 testes em PG+Redis reais | SIM (5 arquivos `tests/integration/*.test.ts` no histórico) |
| 9 | Ag. 93 — gate P0-07 no build Docker | `2596287dd5` | `agente/93-docker-p007-dem20261123` | SIM | idêntico | `09-dem-20261123-slot6-93-2596287dd.md` | 27/27 YAML parse, 25/25 invariantes, smoke 3/3 | SIM (`Dockerfile` RUN gate P0-07 + COPY `/app/public/tools`,`/app/public/design-lab`; depois endurecido por `c14faef15c` squad-90 — evolução, não reversão) |
| 10 | Ag. 94 — estabilização workflows CI + smoke | `0372d169ba` | `agente/94-ci-dem20261123` | SIM | idêntico | `09-dem-20261123-slot7-94-0372d169b.md` | gates transversais EXIT 0 | SIM (9 workflows + `production-smoke-tests.sh` no histórico) |
| 11 | Ag. 05 — e2e Axe Agenda + drag teclado Kanban | `8151d8cdac` | `agente/05-e2e-visual-dem20261123` | SIM | idêntico | `09-dem-20261123-slot5-05-8151d8cda.md` | 12/12 Playwright `--repeat-each=3` PASS | SIM (`tests/e2e/accessibility.spec.ts`, `crm-kanban.spec.ts`) |
| 12 | Ag. 09 — pareceres finais da Onda 1 | `58943b83e9` | `agente/09-review-dem20261123` | SIM | idêntico | (é o próprio auditor) | n/a (docs) | SIM (10 pareceres `09-dem-20261123-*.md` na main) |
| 13 | Docs — ficha da demanda | `867533ffb5` | `agente/00-integracao-p0-local` | SIM | idêntico | n/a (docs) | n/a | SIM (`docs/orchestration/demands/DEM-20261123-001.md`) |
| 14 | **Integração combinada Onda 1** | `815a09305f` | `integracao/onda-1-dem20261123` | SIM — **ancestral direto em first-parent de `origin/main`** (filho imediato `be14797b65`) | idêntico (`815a09305f`) | `09-dem-20261123-integracao-onda1-815a09305.md` → **APROVADO** | 5 gates transversais EXIT 0 sobre `git archive` limpo de `815a09305`: test:architecture, check-rls-coverage, tsc --noEmit, build, build:worker | SIM — toda a cadeia `0d790443d..815a09305` está na main |

**Total: 14/14 itens integrados. 0 revertidos. 0 preservados apenas fora da main (todo trabalho está contido em `origin/main`; as branches remotas permanecem como cópias redundantes, não como trabalho não integrado).**

---

## 2. Separação expressa por categoria

### 2.1 Entrega integrada (14 itens)
Todos os itens acima. A integração ocorreu **sem merge commit dedicado na main**: `integracao/onda-1-dem20261123` @ `815a09305f` é ancestral direto do primeiro-pai de `origin/main` (o commit seguinte na linha é `be14797b65`, da Onda 2). As 10 merge commits internas da onda (`8bf280742`, `9fd46ed58`, `db57da5b4`, `87adb6d24`, `f3bcfcfca`, `26fd3db8b`, `f6fa70791`, `31b0b0c59`, `6216c5396`, `815a09305`) estão todas contidas em `origin/main`.

### 2.2 Entrega revertida
**Nenhuma.** Busca `git log origin/main --grep="Revert" -i` retorna apenas reversões de PRs antigos (pré-demanda: #117/#131, #153, #155, #578, PWA icons, etc.) — nenhuma toca commits da Onda 1 (`0d790443d..815a09305`). Não há `git revert` dos SHAs auditados.

### 2.3 Trabalho preservado fora da main
**Nenhum trabalho não integrado.** As branches `agente/*-dem20261123`, `agente/94-p0-01-format-depcruise`, `agente/99-p0-0{2,7}-*`, `agente/00-integracao-p0-local` e `integracao/onda-1-dem20261123` existem no remoto com SHAs idênticos aos locais, porém **100% são ancestrais de `origin/main`** — são preservação redundante, não entrega pendente. Worktrees `dem-20261123-onda1/wt-*` permanecem no disco (confirmado em `git worktree list`).

### 2.4 Teste não executado
**Nenhum item sem evidência de teste**, com uma ressalva formal:
- O parecer consolidado `09-dem-20261123-integracao-onda1-815a09305.md` registra como **"EM EXECUÇÃO"** no corte: suíte unitária completa (`test:unit`) e Semgrep **diretamente sobre o archive `815a09305`**. Evidência posterior de fechamento específico desses dois gates sobre esse SHA exato: **não verificável** nos documentos localizados (`.agents/runs/` e `.agents/reviews/`). Os gates foram efetivamente reexecutados sobre candidatos posteriores (`integracao/consolidacao-dem20261123-candidato` @ `8f3e92e6a`, ver `.agents/runs/consolidacao-dem20261123-ondas234.md` §4) que **contêm** `815a09305`, mas isso não é prova sobre o SHA isolado.
- `docker build` em daemon, workflows remotos GitHub Actions e `npm audit` constavam como NÃO EXECUTADOS/PENDENTES para gate de release no parecer — pendência de release, não de integração.

### 2.5 Achados ainda abertos
1. **Pareceres individuais ausentes para P0-01 (`03c38acb6b`) e P0-07 Express (`2963a0d909`)**: cobertos apenas pelo parecer consolidado `815a09305` (APROVADO). Itens 1 e 4 da tabela. Não é bloqueador — o consolidado os auditou explicitamente na cadeia — mas não há parecer com hash travado por item.
2. **Reexecução unitária/Semgrep sobre `815a09305` exato**: pendência herdada do parecer (ver §2.4). Mitigada por gates posteriores sobre candidatos descendentes.
3. **Gate de release**: `RELEASE_APPROVED` permaneceu bloqueado por pendências da Onda 2+ (handoffs `.agents/handoffs/consolidacao-20261124/`, plataforma NO-GO registrada em `consolidacao-dem20261123-ondas234.md`). Fora do escopo da Onda 1, mas decorre dela.
4. **Branch `integracao/onda-1` (`74aad056c`)**: existe no remoto mas pertence a ciclo anterior (roadmap-v2, nov/2026, prefixo MEL) — fora do escopo DEM-20261123-001; não reconciliada aqui.
5. **Regressão de conteúdo**: nenhuma detectada. `git log origin/main -- <file>` mostra que os arquivos centrais da Onda 1 (`tenant-prisma.ts`, `seed.ts`, `frontend.ts`, `vite.config.ts`) tiveram como último commit os próprios SHAs da onda; `Dockerfile` recebeu apenas endurecimento posterior (`c14faef15c`, Squad 90). Spot-checks de conteúdo em `origin/main` confirmam: guard B-06 em `prisma/seed.ts`, `requestContext`/`createManyAndReturn` em `tenant-prisma.ts`, gate P0-07 no `Dockerfile`, guarda anti-traversal em `frontend.ts`.

---

## 3. Fontes

- Parecer consolidado: `.agents/reviews/09-dem-20261123-integracao-onda1-815a09305.md` (APROVADO, hash travado `815a09305f532153ad8dc07adb9363f1ea694100`).
- Pareceres por item: `.agents/reviews/09-dem-20261123-{p0-02-eb8e945fc,p0-06-79c972189,p0-07-edge-c286185c1,slot1-04-48e9ac169,slot2-14-090de3949,slot3-13-283e7ec1e,slot4-03-c286185c1,slot5-05-8151d8cda,slot6-93-2596287dd,slot7-94-0372d169b}.md`.
- Run docs: `.agents/runs/consolidacao-dem20261123-ondas234.md`, `.agents/runs/onda2-dem20261123-relatorio-final.md` (ambos atestam Onda 1 intacta/ancestral).
- Ficha da demanda: `docs/orchestration/demands/DEM-20261123-001.md` (SHA `867533ffb5`).
- Verificações git executadas nesta sessão: `merge-base --is-ancestor` (14 branches), `ls-remote` (confirmação de SHAs remotos), `log --merges --grep`, `log --grep=Revert`, `log -- <path>` por arquivo, `show origin/main:<path>` spot-checks.

**Conclusão:** a Onda 1 está 100% integrada em `origin/main`, sem reversões e sem regressão de conteúdo verificável. Nenhum item precisa de reabertura de onda ou novo merge.

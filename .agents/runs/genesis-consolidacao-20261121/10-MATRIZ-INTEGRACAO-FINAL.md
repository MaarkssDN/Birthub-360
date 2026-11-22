# 10 — Matriz Final de Integração

**Status:** ONDAS I e II EXECUTADAS em 21/11/2026. Onda III (Agente 08) em diagnóstico — merges NÃO executados.

**Resultado Onda I:** merge 1 `c1b78331e` (limpo); merge 2 `bd77a9593` (1 conflito documental resolvido + fix encoding).

**Resultado Onda II:** 7 merges limpos (`61aaf9a4d`…`a7809ab40`), 7 handoffs adicionados; 1 patch parcial já equivalente (despacho-paralelo via PR #520). HEAD: `a7809ab40`.

**Base de integração:** `integracao/consolidacao-20261121` @ `0d790443` (= main)
**Worktree:** `C:\Github\Birthub-360-worktrees\integracao-consolidacao-20261121`
**Data:** 2026-11-21 · Revalidação: branches e SHAs confirmados nesta data; `main` inalterada.

## Ordem de integração proposta

### Onda I — Governança estratégica (docs puras, risco mínimo)

| Ordem | Branch | HEAD | Patch | Arquivos | Conflito potencial | Reversão |
|---:|---|---|---|---|---|---|
| 1 | `agente/00-plano-mestre-operacional-100-agentes` | `5b1bc5d45` | 4 | 3 docs (+246): `00-INDICE`, `12-PLANO-MESTRE`, review Silas PR#528 | sobreposição parcial com item 2 em `.agents/runs/consolidacao-20261120/` — verificar versão | `git revert` do merge ou reset da branch de integração |
| 2 | `consolidacao_backlog_birthub360` | `125037537` | 1 | 9 docs (+826): runs/consolidacao-20261120/00–17 | idem — arquivos vizinhos aos do item 1 | idem |

### Onda II — Handoffs documentais (7 branches, 1 patch cada)

Todas merge-tree limpas isoladamente. Executar merges sequenciais verificando diff acumulado.

| Ordem | Branch | HEAD | Arquivo |
|---:|---|---|---|
| 3 | `chore/handoff-00-despacho-wave-a-b-20261120` | `e62fdd238` | 2 handoffs (despacho wave A/B + docker local) |
| 4 | `chore/handoff-00-reconciliacao-etapa-0-20261121` | `ae37cac88` | 1 handoff (+93) |
| 5 | `chore/handoff-devin-encerramento-20261121` | `0a0ec2e71` | 1 handoff (+97) |
| 6 | `devin/handoff-continuidade-merge-20261120` | `fdb806d71` | 1 handoff (+74) |
| 7 | `chore/handoff-antigravity-restauracao-governanca-20261121` | `27d0a5b2d` | 1 handoff (+78) — **idêntico ao untracked da raiz (dedup confirmado)** |
| 8 | `chore/handoff-devin-central-operacao-20261121` | `82eb67477` | 1 handoff (+80) |
| 9 | `chore/handoff-antigravity-encerramento-100-agentes-20261121` | `7f6c85930` | 1 handoff (+104) — **idêntico ao untracked da raiz** |

**Deduplicação raiz × branches (verificada):** os 2 untracked da raiz com nomes iguais aos handoffs antigravity são **byte-idênticos** às versões das branches → a versão commitada prevalece; as cópias untracked da raiz são redundantes. Os 2 handoffs `03-para-00-*` untracked da raiz **já existem na main** → descartar como duplicatas. Restam ~19 untracked únicos na raiz para avaliação individual na Onda II.

### Onda III — CI/Testes (única com código)

| Ordem | Branch | HEAD | Patches | Conteúdo | Estratégia |
|---:|---|---|---:|---|---|
| 10 | `agente/08-handoffs-20261117` | `aafad8eb7` | 10 | `.github/workflows/schemathesis-fuzzing.yml` (novo), `tests/unit/lib/voice-hub/voicehub-persistence-runid.test.ts`, fixes CI/bump, 4 handoffs | **Não mergear direto** (211 atrás). Opções: (a) merge `main→branch` na worktree dela, resolver, CI, merge de volta; (b) cherry-pick dos 10 patches para a integração. Recomendo (b) para os patches de teste/docs e análise manual do workflow. Antes: verificar URL `/api` do OpenAPI, permissões, gatilhos, pacote `schemathesis` no CI. |

### Fora de escopo (não integrar)

- `agente/00-onda1-bloqueadores-p0`, `chore/handoff-03-genesis-brand-system-20261120`, `chore/handoff-03-design-tokens-v2-20261120` — patch-equivalentes.
- `chore/handoff-devin-consolidacao-global-20261120` — AHEAD=0; docs legítimos extraídos separadamente (ver abaixo).
- 21 branches AHEAD=0 — referência histórica.

## Extração da quarentena (branch nova a partir da main)

Conteúdo legítimo preservado em `C:\Github\_backups\genesis-20261121\handoff-devin-consolidacao\`:
- `07-agents-legit-final.patch` — diff staged final de `.agents/` (7 arquivos, +102/−70) **após** restauração dos pareceres.
- `agents-files/` — cópias dos arquivos.
- Novo handoff `devin-para-00-continuidade-consolidacao-global-20261120.md` (+60) — candidato a integração na Onda II como patch adicional.

## Estado pós-itens 1 e 2 (executados)

- `handoff-devin-consolidacao`: index/worktree restaurados de `src tests docs prisma` ao HEAD `86288f30b`; 2 pareceres do Agente 09 restaurados; restam apenas os 7 arquivos `.agents/` staged (legítimos). **PR#485 preservado** — verificado: `rbac/enforcer.ts`, `session.service.ts`, `optout.service.ts`, `mobile/security/storage.ts`, `docs/lgpd/inventario-dados.md`, checklist Prisma todos presentes.
- `wt-handoff-00-consolidacao`: branch realinhada a `b0deaf09` (tracking origin), worktree limpa; commit órfão `5cddf447e` preservado na tag `backup/genesis-20261121-wt-handoff-00-snapshot`.

## Critérios de aceite por merge

Após cada merge: `git diff` acumulado revisado → sem deleções fora de `.agents/handoffs|runs|reviews` → `biome format:check` → commit com mensagem `docs(handoff): integra <branch> (Genesis Consolidation)`.

## Diagnóstico Onda III — `agente/08-handoffs-20261117` @ `aafad8eb7` (planejamento, NÃO executado)

10 patches pendentes (`git cherry`, todos `+`):

| SHA | Conteúdo | Tipo | Risco |
|---|---|---|---|
| `ca6a71dd6` | Teste regressão RUN_ID voice-hub + handoff | test+doc | baixo |
| `766c8b42b` | Cobertura CommandPalette contextual (MEL-35) | test+doc | baixo |
| `e61cc2789` | Workflow Schemathesis fuzzing (MEL-39) | **CI** | **médio-alto** |
| `fef7cba2c` | Handoff aprovação Schemathesis + saneia status QA | doc | baixo |
| `fcc5afbcb` | Handoff cobertura-testes-modulos | doc | baixo |
| `e83997afd` | Evidência CI no handoff unit-failures | doc | baixo |
| `39314fa2e` | Alinha CommandPalette test ao main pós-#390 | test | baixo |
| `8d271d6fc` | Biome format NextBestActionCard | **src/** | baixo (formatação) |
| `7c50152c9` | Fix `--base-url`→`--url` no workflow | CI | depende de e61cc2789 |
| `d358fabbd` | Fix `--max-examples` no workflow | CI | depende de e61cc2789 |

**Problemas encontrados no workflow Schemathesis:**
1. `--url http://127.0.0.1:3000` **não inclui o prefixo `/api`**. O `docs/openapi.yaml` declara `servers: [{url: /api}]` e todas as rotas são montadas sob `/api` (`src/bootstrap/routes.ts`). Schemathesis montaria `http://127.0.0.1:3000/<path>` → 404 em massa → o check `not_a_server_error` passa **vacuamente** (verde sem valor). Correção necessária: `--url http://127.0.0.1:3000/api` (ou validar se Schemathesis resolve o `servers` relativo).
2. Autenticação: header `Authorization: Bearer ci-test-token` — o projeto usa sessão Better Auth via cookie (`better-auth.session_token`), não Bearer. Endpoints autenticados responderão 401/403. Aceitável para fuzzing de borda (não é 5xx), mas limita a cobertura real — documentar como limitação ou provisionar token de teste.
3. Triggers: `pull_request` filtrado por paths (`docs/openapi.yaml`, `src/server/**`, `src/routes/**`) — `src/routes/**` provavelmente não existe (rotas em `src/bootstrap/routes.ts` e `src/routes/**`?); cron diário 04:00 UTC + `workflow_dispatch`. Custo CI: job de até 30min com Postgres+Redis+Meilisearch — pesado para PR; considerar `workflow_dispatch`/schedule apenas, ou smoke reduzido em PR.
4. Dependências novas: `pip install schemathesis` (sem pin de versão — risco de supply chain; pinar), imagem `pgvector/pgvector:pg16` (consistente com CI?), `actions/setup-python@v5`, checkout/setup-node pinados por SHA (bom).
5. Ordem de cherry-pick: `e61cc2789` → `7c50152c9` → `d358fabbd` (fixes do workflow dependem do workflow); docs independentes; testes independentes; `8d271d6fc` pode conflitar se NextBestActionCard mudou na main.

**Proposta:** cherry-pick seletivo na ordem: docs (4) → testes (3) → workflow (3, com correção do `/api` antes do merge) → format (1). Validar `npm run build` + `vitest` nos arquivos de teste + dry-run do workflow em branch descartável antes de promover.

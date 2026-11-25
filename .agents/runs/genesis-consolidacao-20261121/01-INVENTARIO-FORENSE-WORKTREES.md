# 01 — Inventário Forense das Worktrees

**Data da coleta:** 2026-11-21 · **Método:** `git worktree list --porcelain` + `git rev-list --count main..branch` + `git cherry main branch` (patch-id) + `git merge-tree --write-tree` (teste real de conflito) + `git status --porcelain` por worktree.

**Baseline:** `main = origin/main = 0d790443d10fed5c9da20394b29e43188a07b467`

## Classificação

| Classe | Qtde | Significado |
|---|---:|---|
| Trabalho real pendente | 10 | patches não presentes na main |
| Patch-equivalente (já integrado) | 3 | commits à frente, conteúdo já na main |
| Sem commits à frente | 21 | merge seria no-op; referência histórica |
| HEAD anômalo | 1 | resolvido via preservação de emergência (ver 02) |
| Com alterações não commitadas | 3 | raiz (24 docs), handoff-devin-consolidacao (55 staged — quarentena), wt-handoff-00 (resolvido) |

## Matriz completa

A matriz detalhada está em `matriz-worktrees.csv` e `matriz-worktrees.json` nesta pasta. Resumo por categoria:

### A. Branches com patches genuinamente ausentes (10)

| # | Branch | Ahead | Patches únicos | Merge-tree | Conteúdo |
|---|---|---:|---:|---|---|
| 1 | `agente/00-plano-mestre-operacional-100-agentes` | 5 | 4 | limpo | Plano mestre 100 agentes + parecer Silas PR#528 (só docs, +246) |
| 2 | `consolidacao_backlog_birthub360` | 1 | 1 | limpo | Docs consolidação 00–17 (+826, só `.agents/runs/`) |
| 3 | `agente/08-handoffs-20261117` | 17 | 10 | limpo* | CI Schemathesis + testes voice-hub/CommandPalette + handoffs (única com código) |
| 4 | `chore/handoff-00-despacho-wave-a-b-20261120` (raiz) | 2 | 1 | limpo | 2 handoffs docs; +24 arquivos não commitados na raiz |
| 5 | `chore/handoff-00-reconciliacao-etapa-0-20261121` | 1 | 1 | limpo | Matriz reconciliação etapa 0 (+93) |
| 6 | `chore/handoff-devin-encerramento-20261121` | 1 | 1 | limpo | Handoff orquestrador UX→00 (+97) |
| 7 | `devin/handoff-continuidade-merge-20261120` | 1 | 1 | limpo | Handoff merges waves D/E/F→00 (+74) |
| 8 | `chore/handoff-antigravity-restauracao-governanca-20261121` | 1 | 1 | limpo | Restauração governança handoffs→00 (+78) |
| 9 | `chore/handoff-devin-central-operacao-20261121` | 1 | 1 | limpo | Continuidade central operação→00 (+80) |
| 10 | `chore/handoff-antigravity-encerramento-100-agentes-20261121` | 1 | 1 | limpo | Encerramento sessão→00 (+104) |

\* Branch 211 commits atrás — merge-tree limpo no merge direto, mas recomendo atualizar base antes da integração (ver 06).

### B. Patch-equivalente — não integrar (3)

| Branch | Ahead | Patches únicos | Observação |
|---|---:|---:|---|
| `chore/handoff-03-genesis-brand-system-20261120` | 1 | 0 | conteúdo já na main |
| `chore/handoff-03-design-tokens-v2-20261120` | 1 | 0 | conteúdo já na main |
| `agente/00-onda1-bloqueadores-p0` | 1 | 0 | merge-tree CONFLITA em 7 arquivos de segurança; conteúdo B-01..B-14 já na main — **não mergear** |

### C. Sem commits à frente (21)

`agente/01-waveF-ux05a-auth-morta`, `agente/02-waveF-ux09-perfil`, `agente/07-waveF-pii-detection`, `agente/08-waveF-ownership-gate`, `agente/08-waveF-orchestration-e2e`, `agente/10-waveF-scanner-real`, `chore/handoff-08a-destravamento-prs-20261120`, `chore/handoff-devin-consolidacao-global-20261120` (quarentena), `chore/handoff-devin-v2-consolidacao-20261120`, `pr471-resolve`, `pr486-resolve`, `wE-02/07/09/10-waveE-outbox-idem`, `chore/handoff-devin-central-auditoria-20261120`, `chore/handoff-devin-suite-swarm-20261120`, `agente/07-waveE-outbox-idem`, `agente/03-fix-ownership-coverage`, `execute_setup_script`, `handle_all_hands_subagents`.

### D. Anomalia resolvida

`wt-handoff-00-consolidacao` — HEAD `0000…` na coleta inicial; preservação de emergência paralela criou `5cddf447e` (órfão, árvore ≡ remoto `b0deaf09`). Worktree agora limpa. Ver 02.

# RELATÓRIO 2 — MATRIZ DE RISCO DE PERDA
**Data:** 2026-11-24 · Classificação A–H conforme missão §4.

Legenda de risco residual: 🔴 sem backup independente verificado · 🟡 backup local criado nesta sessão, restauração não testada ponta-a-ponta · 🟢 publicado/remoto verificado.

## 2.1 Commits Git (o maior risco)

| Item | Classe | SHAs | Risco | Evidência |
|---|---|---|---|---|
| 164 commits exclusivos do clone C: | B | 164 | 🟡 | `unpushed_origin__c_Github_Birthub-360.tsv`; bundle `birthub360-cloneC-unpushed-20261124.bundle` (711 MB, 152 refs, verify OK) |
| 4 commits exclusivos do clone D: | B | 4 | 🟡 | bundle `birthub360-cloneD-unpushed-20261124.bundle` (125 refs, verify OK) |
| 85 commits nos dois clones, ausentes de `origin/*` | B | 85 | 🟡 | mesma cobertura dos bundles |
| `refs/remotes/local/audit` (67 commits) | F→A* | 67 | 🟢→🟡 | ref órfão sem remote `local`; os commits estão contidos em branches locais já cobertas pelos bundles |
| Branches com upstream mas `ahead` | B | 3 branches | 🟡 | `agente/00-onda1-bloqueadores-p0` (+1/−230), `chore/handoff-00-conflito434-deliberacao487-20261121` (+1), `chore/handoff-03-design-tokens-v2-20261120` (+1/−11) — contidos nos bundles |

\* commits existem como objetos e refs locais; publicação remota ainda não comprovada → risco residual até push autorizado.

## 2.2 Trabalho não commitado (arquivos)

| Item | Classe | Risco | Preservação |
|---|---|---|---|
| Checkout principal C: e D: (~74 untracked + 2 modificados, mesmo conteúdo) | C | 🟡 | `uncommitted/` patches + cópia integral (110 arquivos) |
| `Central de Handoff de IA` (22 modificados, +2.990/−1.363; 9 untracked c/ `AiAvatar`, `ConsensusVoteModal`, `debate.ts`, `models.ts`) | C | 🟡 | `repos-dirty/` — patch + cópia |
| `DEFININDO OS AGENTES` (4 untracked de auditoria) | C | 🟡 | `repos-dirty/` |
| `RETOMADA GLOBAL…` (`deploy/` untracked) | C | 🟡 | `repos-dirty/` |
| Worktrees sujos (deleções em massa C: `wt-handoff-devin-central` 1218, `agente-01` 753, `agente-02` 497 + ~10 com 1–6 itens) | C/F | 🟡 | `worktrees-dirty/` (94 arquivos de evidência); deleções = reversíveis via `git checkout` pois conteúdo está no Git |
| `.env`, `.env.test` (gitignored, checkouts principais) | H | 🟡 | NÃO copiados para backup de código — tratar como segredo (§10) |
| gemini `parallel_task_force_worktrees` (6 itens) | C | 🟡 | evidência em wtstatus |

## 2.3 Worktrees órfãos (sem metadados Git — não bundleáveis)

| Item | Arquivos | Risco | Preservação |
|---|---|---|---|
| `agente-05-cold-email`, `agente-07-waveE-outbox`, `agente-08-handoffs`, `agente-14-repro-500`, `agente-16-worker-outbound`, `agente-17-waveE`, `agente-99-prisma`, `consolidacao-20261120`, `genesis-brand` | ~10–13,6 mil cada | 🔴→🟡 | tar.gz em `_backups/saneamento-20261124/orphans/` (em execução) + cópia física redundante em `D:\Github\Birthub-360-worktrees\` |
| `agente-17-cadence-debts` (51 arq., sem .git), `agente-04-waveE` (24 arq. soltos), `dem-20261123-consolidacao/wt-00-candidato` | parcial | 🟡 | tar em andamento |
| `C:\Github\wt-08-dsr`, `wt-15-cve-tools`, `wt-310-extract`, `wt-368-rebase`, `wt-399-fix`, `wt-402-fix`, `wt-cadence-fix` | checkouts completos | 🟡 | avaliar contra manifests C: vs D: — provável duplicata do conteúdo já tarado |
| `wt-395-fix` (só node_modules+nul), `wt-466-fix` (vazio), `Birthub-360-audit-main` (detached, prunable) | detritos | 🟢 G | candidatos a limpeza (Relatório 7) |

## 2.4 Itens sem risco / já cobertos

| Item | Classe | Nota |
|---|---|---|
| Todos os outros ~18 repos de `D:\Github` | A | 0 commits não publicados, branches em paridade com origin |
| `Central-de-Auditoria-e-Handoffs` | A | pendência histórica dos "18 itens" resolvida (commitados, PRs #9–#12 mergeados) |
| `D:\Github\birthub-360-repo` | A | clone limpo, 0 não publicados |
| Bundles `pres005-20261122`, `fase-zero-20261123/exclusivos-locais.bundle`, `wt-handoff-00-consolidacao-preserved.bundle` | D | todos `git bundle verify` OK; wt-handoff bundle contém snapshot `5cddf447e` (SHA-256 registrado) |
| 5 worktrees `.claude/worktrees/*`, gemini ×6, squads/dem-ondas registrados | A/B | commits contidos nos bundles de branches |

## 2.5 Síntese do risco

- **Antes desta sessão:** ~253 commits + ~150 mil arquivos de worktrees órfãos + ~3 mil linhas não commitadas existiam apenas em disco local.
- **Agora:** tudo tem ao menos uma cópia em `D:\Github\_backups\saneamento-20261124\` (disco distinto do clone C:) — porém **nenhum item B/C foi publicado no remote** e **nenhum backup novo teve restauração testada de ponta a ponta** (apenas `bundle verify`/`list-heads`).
- **Risco residual dominante:** perda simultânea de C: e D:, ou ausência de push → os bundles em D: são a única cópia fora dos clones.

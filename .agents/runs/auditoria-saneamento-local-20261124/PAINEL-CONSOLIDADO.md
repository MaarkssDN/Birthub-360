# PAINEL CONSOLIDADO — SANEAMENTO LOCAL BIRTHUB-360
**Data:** 2026-11-24 · **Agente:** 00 (Astra) · **Natureza:** auditoria forense P0, fase não destrutiva

## Totais verificáveis

| Métrica | Valor | Fonte |
|---|---|---|
| Clones Birthub-360 | 2 (`C:\`, `D:\`) + 1 auxiliar (`birthub-360-repo`) | `git worktree list`, `git remote -v` |
| Branches locais (C: / D:) | 148 / 124 | `branches__*.txt` |
| Worktrees registrados (C: / D:) | 110 / ~94 | `wtlist_*.tsv` |
| Worktrees físicos órfãos reais | ~11–14 dirs (~130 mil arquivos) | `orphans.tsv`, manifests |
| SHAs não publicados (união) | **253** (C:164 + D:4 + compartilhados85) | `unpushed_origin_*.tsv` |
| SHAs mascarados por ref órfão `local/audit` | 67 | `refs/remotes/local/audit` |
| Repos não-Birthub com commits não publicados | 0 | varredura completa |
| Repos não-Birthub com trabalho não commitado | 3 (`Central de Handoff de IA`, `DEFININDO OS AGENTES`, `RETOMADA GLOBAL`) | `repos-dirty/` |
| Stashes | 0 (ambos clones) | `stash_*` |
| Bundles novos criados | 2 × ~711 MB (152/125 refs, verify OK) | `_backups/saneamento-20261124/` |
| Cópias de redundância | bundles em **C: e D:** | `Birthub-360-backups/saneamento-20261124/` |
| Worktrees órfãos arquivados | 7+ tar.gz (~1,7 GB) em curso | `orphans/` |
| SHA-256 bundle cloneC / cloneD | `177db0e1…` / `5fbf1796…` | ver Relatório 3 |
| Órfão `agente-99-prisma` | ⚠️ cópia D: **vazia** — só C: (13.265 arq.) tem conteúdo | `manifests/` |
| PRs abertos de preservação | #530–#539 | `gh pr list` |

## Matriz de risco (resumo do Relatório 2)

- 🔴→🟡 253 commits: preservados em bundle verificado, **não publicados**
- 🟡 ~150 mil arquivos de worktrees órfãos: tar em execução + cópia física D:
- 🟡 Não commitados: patches + cópias em `uncommitted/`, `repos-dirty/`, `worktrees-dirty/`
- 🟡 `.env`/segredos: classe H, fora do Git — pendente cofre
- 🟢 Backups históricos (pres005, fase-zero, wt-handoff): verify OK

## Divergências críticas que exigem decisão humana

1. Clone C: (trabalho real das ondas) vs clone D: (congelado em `32d07c375`) — 10 branches homônimas com SHAs diferentes; 4 commits exclusivos do D:.
2. `integracao/consolidacao-dem20261123-candidato` está **+210 commits** — prioridade máxima.
3. Worktrees órfãos sem `.git`: virar commit ou arquivo morto?
4. Remote `local` descontinuado? Ref órfão `local/audit` ainda é evidência.
5. Autorização para push das branches `preserve/*`.

## Estado da preservação

| Camada | Status |
|---|---|
| Commits → bundle | ✅ verify OK, redundância C:+D: |
| Restore ponta-a-ponta | ⏳ pendente (clone de teste do bundle) |
| Não commitados → patch/cópia | ✅ checkouts principais + 3 repos |
| Órfãos → tar | 🔄 em execução |
| Publicação remota | ⏳ aguardando autorização |
| Segredos → cofre | ⏳ pendente |

## Parecer

# ⛔ AMBIENTE LOCAL AINDA NÃO LIBERADO

**Fundamentação:** nenhum commit exclusivo foi publicado no remote; backups novos ainda não passaram por teste de restauração ponta-a-ponta; worktrees órfãos dependem de tar não verificado; divergência C:×D: sem reconciliação; serviços locais (DB/Redis) não inventariados; parecer do Agente 09 (Silas) não emitido.

**O que mudou nesta sessão:** o risco de perda foi drasticamente reduzido — todo trabalho exclusivo agora possui ao menos uma cópia em disco distinto e verificada. A transição para "LIBERADO" depende agora de: (1) autorização de push, (2) restore-test dos bundles, (3) reconciliação das divergências, (4) commits dos não commitados, (5) parecer Silas.

**Relatórios:** `RELATORIO-1` a `RELATORIO-7` neste diretório + evidências brutas (`*.tsv`, `manifests/`, `status_*`).
